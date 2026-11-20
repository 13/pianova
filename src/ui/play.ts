import type { Chart, Hand } from '../core/types'
import type { Grade, Summary } from '../judge/judge'
import type { StatEvent } from '../progress/store'
import { Highway } from '../render/highway'
import { Session, type Mode } from '../session/session'
import type { App } from './app'
import { h, icon, percent, type View } from './dom'

/** What the practice tools are set to; carried from one run to the next. */
export interface Practice {
  mode: Mode
  hands: Hand[]
  tempo: number
  loop: { fromBar: number; toBar: number } | null
}

export interface PlayConfig {
  chart: Chart
  mode: Mode
  /** Hands the player plays; defaults to every hand in the chart. */
  hands?: Hand[]
  tempoScale?: number
  /** Tool settings from an earlier run of the same chart, to pick up where it left off. */
  practice?: Practice
  /** Show the practice tools (tempo, wait, hands, loop). */
  tools: boolean
  /** Click the beat during a demo (for music that will be played in time). */
  metronome?: boolean
  /** Show the practice panel (accuracy, streak) and timing feedback. */
  scored: boolean
  /** Line under the title, e.g. "Lesson 04 · Practise". */
  label: string
  onFinish(result: PlayResult): void
  onSkip?: () => void
  onExit?: () => void
}

export interface PlayResult {
  summary: Summary
  events: StatEvent[]
  /** True for an unmodified run: timed, full tempo, every hand, no loop. */
  full: boolean
  /** Whether timing was judged (false when the music waited for the player). */
  timed: boolean
  /** The tool settings the run was played with. */
  practice: Practice
}

const FINISH_DELAY_MS = 700
const FEEDBACK_MS = 1100
const TEMPOS = [50, 60, 70, 75, 80, 90, 100]
/** Auto-played notes: demos at a normal touch, the other hand quieter so yours stands out. */
const DEMO_VELOCITY = 0.6
const ACCOMPANY_VELOCITY = 0.4

/** The play screen: title and progress, highway, practice panel, transport bar. */
export class PlayView implements View {
  readonly el: HTMLElement
  private highway: Highway
  private session!: Session
  private raf = 0
  private cleanups: (() => void)[] = []
  /** Which hand's colour each sounding key should light up in. */
  private keyHands = new Map<number, Hand>()
  private events: StatEvent[] = []
  private hudDirty = true
  private finishTimer = 0
  private feedbackTimer = 0
  private pausedByDisconnect = false
  private hadDevice: boolean
  private hintShift = 0
  private lastClock = ''

  // Current practice settings (start from the config, changed by the tools).
  private mode: Mode
  private hands: Hand[]
  private tempo: number
  private loop: { fromBar: number; toBar: number } | null = null

  private readonly chartHands: Hand[]
  private readonly bars: number
  private streakEl = h('span', { class: 'panel-value' }, '0')
  private accuracyEl = h('span', { class: 'panel-value good' }, '–')
  private trackFill = h('div', { class: 'track-fill' })
  private trackLoop = h('div', { class: 'track-loop', hidden: true }, h('span', { class: 'loop-end a' }, 'A'), h('span', { class: 'loop-end b' }, 'B'))
  private clockEl = h('span', { class: 'clock' }, '0:00 / 0:00')
  private feedbackEl = h('div', { class: 'feedback', hidden: true, role: 'status' })
  private countEl = h('div', { class: 'count-in', hidden: true })
  private overlay = h('div', { class: 'overlay', hidden: true })
  private pauseReason = h('p', { class: 'muted' })
  private pauseButton = h('button', { class: 'tbtn primary', title: 'Pause (Esc)', 'aria-label': 'Pause', onclick: () => this.togglePause() }, icon('pause'))
  private sustainEl = h('span', { class: 'chip', title: 'Sustain pedal' }, icon('pedal'), 'Sustain')

  constructor(
    private app: App,
    private cfg: PlayConfig,
  ) {
    const { chart } = cfg
    this.chartHands = (['L', 'R'] as Hand[]).filter((hand) => chart.notes.some((n) => n.hand === hand))
    this.bars = Math.max(1, Math.ceil(chart.lengthBeats / chart.beatsPerBar))
    this.mode = cfg.practice?.mode ?? cfg.mode
    this.hands = cfg.practice?.hands ?? cfg.hands ?? this.chartHands
    this.tempo = cfg.practice?.tempo ?? cfg.tempoScale ?? 1
    this.loop = cfg.practice?.loop ?? null
    this.hadDevice = app.input.status.inputs.length > 0

    const canvas = h('canvas', { class: 'stage-canvas' })
    this.overlay.append(
      h(
        'div',
        { class: 'card' },
        h('h2', null, 'Paused'),
        this.pauseReason,
        h(
          'div',
          { class: 'row' },
          h('button', { class: 'btn primary', onclick: () => this.setPaused(false) }, 'Resume'),
          h('button', { class: 'btn', onclick: () => this.restart() }, 'Restart'),
          cfg.onExit && h('button', { class: 'btn ghost', onclick: cfg.onExit }, 'Leave'),
        ),
      ),
    )
    this.el = h(
      'div',
      { class: 'play' },
      h(
        'div',
        { class: 'play-head' },
        h('h1', { class: 'play-title' }, chart.title),
        h('p', { class: 'play-sub' }, cfg.label),
        h('div', { class: 'track' }, this.trackFill, this.trackLoop),
      ),
      h(
        'div',
        { class: 'stage' },
        canvas,
        cfg.scored &&
          h(
            'div',
            { class: 'panel' },
            h('span', { class: 'panel-title' }, 'Practice'),
            h('div', { class: 'panel-row' }, icon('target'), h('span', null, 'Accuracy'), this.accuracyEl),
            h('div', { class: 'panel-row' }, icon('flame'), h('span', null, 'Streak'), this.streakEl),
          ),
        this.feedbackEl,
        this.countEl,
        this.overlay,
      ),
      this.transport(),
    )

    this.highway = new Highway(canvas)
    this.highway.setRange(chart)
    this.syncHints()

    this.cleanups.push(
      app.input.onNote((pitch, on, perfTime) => {
        if (on) this.session.press(pitch, app.synth.fromPerf(perfTime))
        else this.session.release(pitch, app.synth.fromPerf(perfTime))
      }),
      app.input.onSustain((down) => this.sustainEl.classList.toggle('on', down)),
      app.input.onStatus((status) => {
        this.syncHints()
        if (status.inputs.length === 0 && this.session.state === 'running' && this.hadDevice) {
          this.pausedByDisconnect = true
          this.setPaused(true, 'Your keyboard was disconnected. Plug it back in to carry on.')
        } else if (status.inputs.length > 0 && this.pausedByDisconnect) {
          this.setPaused(false)
        }
        this.hadDevice = status.inputs.length > 0
      }),
    )
    const onKey = (e: KeyboardEvent) => {
      // Space pauses too, unless a button or field has focus and wants it.
      const focused = e.target instanceof HTMLElement && e.target.closest('button, input, select, textarea')
      if (e.code === 'Escape' || (e.code === 'Space' && !focused && !e.repeat)) {
        e.preventDefault()
        this.togglePause()
      }
    }
    const onHide = () => {
      if (document.hidden) this.setPaused(true)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onHide)
    this.cleanups.push(
      () => window.removeEventListener('keydown', onKey),
      () => document.removeEventListener('visibilitychange', onHide),
    )

    this.restart()
    this.frame()
  }

  destroy(): void {
    cancelAnimationFrame(this.raf)
    clearTimeout(this.finishTimer)
    clearTimeout(this.feedbackTimer)
    for (const off of this.cleanups) off()
    this.highway.destroy()
    this.session.stop(this.app.synth.now())
  }

  /** The current tool settings. */
  get practice(): Practice {
    return { mode: this.mode, hands: [...this.hands], tempo: this.tempo, loop: this.loop && { ...this.loop } }
  }

  /** (Re)starts the chart with the current practice settings. */
  restart(): void {
    clearTimeout(this.finishTimer)
    const { synth } = this.app
    this.session?.stop(synth.now())
    this.events = []
    this.keyHands.clear()
    this.overlay.hidden = true
    this.feedbackEl.hidden = true
    this.pausedByDisconnect = false
    this.setPauseIcon(false)
    const { chart } = this.cfg
    this.session = new Session(
      {
        chart,
        mode: this.mode,
        hands: this.hands,
        tempoScale: this.tempo,
        loop: this.loop ?? undefined,
        countIn: this.mode === 'timed',
        metronome: this.cfg.metronome,
        latencyMs: this.app.progress.settings.latencyMs,
      },
      {
        autoNote: (pitch, on, _hand, at) => {
          if (on) synth.noteOn(pitch, this.mode === 'demo' ? DEMO_VELOCITY : ACCOMPANY_VELOCITY, at)
          else synth.noteOff(pitch, at)
        },
        click: (accent, at) => synth.click(accent, at),
        cancel: (at) => synth.cancelAfter(at),
        short: () => {
          this.showFeedback('short', 0)
          this.hudDirty = true
        },
        judged: (index, grade, offsetMs) => {
          const note = chart.notes[index]
          if (grade !== 'miss') {
            this.highway.flash(note.pitch, grade, note.hand)
            this.keyHands.set(note.pitch, note.hand)
          }
          this.showFeedback(grade, offsetMs)
          this.events.push({ id: chart.id, pitch: note.pitch, hand: note.hand, grade, offsetMs, at: Date.now() })
          this.hudDirty = true
        },
        wrong: (pitch) => {
          this.highway.flash(pitch, 'wrong')
          this.keyHands.delete(pitch)
          this.showFeedback('wrong', 0)
          this.hudDirty = true
        },
        looped: () => {
          this.events = []
          this.hudDirty = true
        },
        finished: () => {
          this.finishTimer = window.setTimeout(() => this.finish(), FINISH_DELAY_MS)
        },
      },
    )
    this.session.start(synth.now())
    this.session.update(synth.now(), synth.lead)
    this.hudDirty = true

    const { from, to } = this.session.barRange
    this.trackLoop.hidden = !this.loop
    this.trackLoop.style.left = `${((from - 1) / this.bars) * 100}%`
    this.trackLoop.style.width = `${((to - from + 1) / this.bars) * 100}%`
  }

  private finish(): void {
    const full =
      this.mode === 'timed' && this.tempo === 1 && !this.loop && this.chartHands.every((hand) => this.hands.includes(hand))
    this.cfg.onFinish({ summary: this.session.summary(), events: this.events, full, timed: this.mode === 'timed', practice: this.practice })
  }

  /** The pill that tells you how the last note went. */
  private showFeedback(grade: Grade | 'wrong' | 'short', offsetMs: number): void {
    if (!this.cfg.scored) return
    const [text, tone] =
      grade === 'short'
        ? ['Hold it longer', 'warn']
        : grade === 'wrong'
        ? ['Wrong key', 'bad']
        : grade === 'miss'
          ? ['Missed', 'bad']
          : this.mode !== 'timed'
            ? ['Correct', 'ok']
            : grade === 'perfect'
              ? ['Right on time', 'ok']
              : offsetMs < 0
                ? ['A little early', 'warn']
                : ['A little late', 'warn']
    this.feedbackEl.replaceChildren(icon(tone === 'ok' ? 'checkCircle' : tone === 'warn' ? 'clock' : 'cross'), text)
    this.feedbackEl.className = `feedback ${tone}`
    this.feedbackEl.hidden = false
    clearTimeout(this.feedbackTimer)
    this.feedbackTimer = window.setTimeout(() => (this.feedbackEl.hidden = true), FEEDBACK_MS)
  }

  private togglePause(): void {
    if (this.cfg.mode === 'demo') return
    this.setPaused(this.session.state === 'running')
  }

  private setPaused(paused: boolean, reason = ''): void {
    const now = this.app.synth.now()
    if (paused && this.session.state === 'running') {
      this.session.pause(now)
      this.pauseReason.textContent = reason
      this.pauseReason.hidden = !reason
      this.overlay.hidden = false
      this.setPauseIcon(true)
    } else if (!paused && this.session.state === 'paused') {
      this.session.resume(now)
      this.pausedByDisconnect = false
      this.overlay.hidden = true
      this.setPauseIcon(false)
    }
  }

  private setPauseIcon(paused: boolean): void {
    this.pauseButton.replaceChildren(icon(paused ? 'play' : 'pause'))
    this.pauseButton.setAttribute('aria-label', paused ? 'Resume' : 'Pause')
  }

  /** Key hints show which computer key plays each note, when there is no MIDI keyboard. */
  private syncHints(): void {
    this.hintShift = this.app.input.octaveShift
    this.highway.setOptions({ labels: this.app.progress.settings.labels, keyHints: this.app.usingComputerKeys, hintShift: this.hintShift })
  }

  private frame = (): void => {
    this.raf = requestAnimationFrame(this.frame)
    if (this.app.input.octaveShift !== this.hintShift) this.syncHints()
    const { session } = this
    const { chart } = this.cfg
    const { synth } = this.app
    const now = synth.now()
    session.update(now, synth.lead)

    // Mark the keys to press: what a waiting session is holding for, or what is about to land.
    const highlight = new Map<number, Hand>()
    if (session.mode === 'wait') {
      for (const i of session.pendingNotes()) {
        if (chart.notes[i].startBeat - session.beat < 0.5) highlight.set(chart.notes[i].pitch, chart.notes[i].hand)
      }
    } else if (session.mode === 'timed') {
      chart.notes.forEach((n, i) => {
        const ahead = n.startBeat - session.beat
        if (session.active[i] && session.noteState[i] === 'pending' && ahead > -0.2 && ahead < 0.5) highlight.set(n.pitch, n.hand)
      })
    }
    // Keys the app is playing light up while their notes sound (worked out from the music,
    // since the sounds themselves are scheduled ahead of time).
    const held = new Set(this.app.input.held)
    const autoHands = new Map<number, Hand>()
    if (session.state === 'running') {
      chart.notes.forEach((n, i) => {
        if (!session.active[i] && n.startBeat <= session.beat && session.beat < n.startBeat + n.durationBeats * 0.95) {
          held.add(n.pitch)
          autoHands.set(n.pitch, n.hand)
        }
      })
    }
    for (const pitch of this.keyHands.keys()) if (!this.app.input.held.has(pitch)) this.keyHands.delete(pitch)
    const keyHands = autoHands.size ? new Map([...autoHands, ...this.keyHands]) : this.keyHands
    this.highway.setHeld(held)
    // In a demo nothing is the player's, so draw every note at full strength.
    const active = session.mode === 'demo' ? undefined : session.active
    this.highway.draw({ beat: session.beat, chart, noteState: session.noteState, cut: session.cut, active, highlight, keyHands })

    const resumeCount = session.resumeCount(now)
    const counting = (session.beat < 0 && session.state === 'running' && session.mode === 'timed') || resumeCount > 0
    this.countEl.hidden = !counting
    if (counting) this.countEl.textContent = String(Math.max(1, Math.ceil(resumeCount || -session.beat)))

    const totalBeats = this.bars * chart.beatsPerBar
    const at = Math.max(0, Math.min(totalBeats, session.beat))
    this.trackFill.style.width = `${(at / totalBeats) * 100}%`
    const clock = `${mmss(at * session.secondsPerBeat)} / ${mmss(totalBeats * session.secondsPerBeat)}`
    if (clock !== this.lastClock) this.clockEl.textContent = this.lastClock = clock

    if (this.hudDirty && this.cfg.scored) {
      this.hudDirty = false
      const s = session.summary()
      const judged = s.perfect + s.good + s.miss + s.wrong
      this.streakEl.textContent = String(s.streak)
      // Accuracy so far: only what has been played, so it does not start at 0%.
      this.accuracyEl.textContent = judged ? percent(s.soFar) : '–'
    }
  }

  // ---- transport bar --------------------------------------------------------

  private transport(): HTMLElement {
    const { cfg } = this
    const apply = () => this.restart()
    const controls: (HTMLElement | false | undefined)[] = [
      cfg.mode !== 'demo' && this.pauseButton,
      h('button', { class: 'tbtn', title: 'Restart', 'aria-label': 'Restart', onclick: apply }, icon('restart')),
      h('span', { class: 'divider' }),
      this.clockEl,
    ]

    if (cfg.tools) {
      const tempo = h(
        'select',
        {
          class: 'chip',
          'aria-label': 'Tempo',
          onchange: () => {
            this.tempo = Number(tempo.value) / 100
            apply()
          },
        },
        TEMPOS.map((t) => h('option', { value: String(t), selected: t === Math.round(this.tempo * 100) }, `Tempo ${t}%`)),
      )

      const barInput = (value: number, label: string) =>
        h('input', { type: 'number', min: '1', max: String(this.bars), value: String(value), class: 'bar-input', 'aria-label': label, onchange: () => setLoop() })
      const from = barInput(this.loop?.fromBar ?? 1, 'Loop from bar')
      const to = barInput(this.loop?.toBar ?? Math.min(this.bars, 2), 'Loop to bar')
      const range = h('span', { class: 'loop-range', hidden: !this.loop }, 'bars', from, '–', to, h('span', { class: 'muted' }, `of ${this.bars}`))
      const loop = h(
        'button',
        {
          class: 'chip toggle',
          'aria-pressed': String(!!this.loop),
          onclick: () => {
            loop.setAttribute('aria-pressed', String(loop.getAttribute('aria-pressed') !== 'true'))
            setLoop()
          },
        },
        icon('loop'),
        'Loop A–B',
      )
      const setLoop = () => {
        const on = loop.getAttribute('aria-pressed') === 'true'
        range.hidden = !on
        const clamp = (input: HTMLInputElement) => Math.max(1, Math.min(this.bars, Math.round(Number(input.value)) || 1))
        this.loop = on ? { fromBar: clamp(from), toBar: clamp(to) } : null
        apply()
      }

      const handChoices: [string, Hand[]][] = [
        ['Both hands', this.chartHands],
        ['Left hand', ['L']],
        ['Right hand', ['R']],
      ]
      const hands = h(
        'select',
        {
          class: 'chip',
          'aria-label': 'Hands',
          onchange: () => {
            this.hands = handChoices[Number(hands.value)][1]
            apply()
          },
        },
        handChoices.map(([label, value], i) => h('option', { value: String(i), selected: value.join() === this.hands.join() }, label)),
      )

      const wait = h(
        'button',
        {
          class: 'chip toggle',
          'aria-pressed': String(this.mode === 'wait'),
          title: 'The music waits until you press the right key',
          onclick: () => {
            this.mode = this.mode === 'wait' ? 'timed' : 'wait'
            wait.setAttribute('aria-pressed', String(this.mode === 'wait'))
            apply()
          },
        },
        icon('hourglass'),
        'Wait for me',
      )

      controls.push(h('span', { class: 'divider' }), tempo, loop, range, this.chartHands.length > 1 && hands, wait)
    }

    controls.push(
      h('span', { class: 'spacer' }),
      cfg.onSkip && h('button', { class: 'chip', onclick: cfg.onSkip }, 'Skip'),
      h('span', { class: 'divider' }),
      this.sustainEl,
    )
    return h('div', { class: 'transport' }, controls)
  }
}

function mmss(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
