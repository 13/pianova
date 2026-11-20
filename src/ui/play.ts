import type { Chart, Hand } from '../core/types'
import type { Summary } from '../judge/judge'
import type { StatEvent } from '../progress/store'
import { Highway } from '../render/highway'
import { Session, type Mode } from '../session/session'
import type { App } from './app'
import { h, icon, percent, type View } from './dom'

export interface PlayConfig {
  chart: Chart
  mode: Mode
  /** Hands the player plays; defaults to every hand in the chart. */
  hands?: Hand[]
  tempoScale?: number
  /** Show the practice tools (tempo, wait, hands, loop). */
  tools: boolean
  /** Click the beat during a demo (for music that will be played in time). */
  metronome?: boolean
  /** Show streak and accuracy. */
  scored: boolean
  /** Short tag shown before the title, e.g. "Watch" or "Practise". */
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
}

const FINISH_DELAY_MS = 700

/** The play screen: highway, heads-up display, optional practice tools, pause. */
export class PlayView implements View {
  readonly el: HTMLElement
  private highway: Highway
  private session!: Session
  private raf = 0
  private cleanups: (() => void)[] = []
  private autoHeld = new Set<number>()
  private events: StatEvent[] = []
  private hudDirty = true
  private finishTimer = 0
  private pausedByDisconnect = false
  private hadDevice: boolean
  private hintShift = 0

  // Current practice settings (start from the config, changed by the tools).
  private mode: Mode
  private hands: Hand[]
  private tempo: number
  private loop: { fromBar: number; toBar: number } | null = null

  private readonly chartHands: Hand[]
  private readonly bars: number
  private streakEl = h('span', { class: 'hud-value' }, '0')
  private accuracyEl = h('span', { class: 'hud-value' }, '–')
  private progressEl = h('div', { class: 'progress-fill' })
  private countEl = h('div', { class: 'count-in', hidden: true })
  private overlay = h('div', { class: 'overlay', hidden: true })
  private pauseReason = h('p', { class: 'muted' })

  constructor(
    private app: App,
    private cfg: PlayConfig,
  ) {
    const { chart } = cfg
    this.chartHands = (['L', 'R'] as Hand[]).filter((hand) => chart.notes.some((n) => n.hand === hand))
    this.bars = Math.max(1, Math.ceil(chart.lengthBeats / chart.beatsPerBar))
    this.mode = cfg.mode
    this.hands = cfg.hands ?? this.chartHands
    this.tempo = cfg.tempoScale ?? 1
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
        { class: 'hud' },
        h('div', { class: 'hud-title' }, h('span', { class: 'eyebrow' }, cfg.label), h('strong', null, chart.title)),
        h('span', { class: 'spacer' }),
        cfg.scored && h('div', { class: 'hud-stat' }, h('span', { class: 'eyebrow' }, 'Streak'), this.streakEl),
        cfg.scored && h('div', { class: 'hud-stat' }, h('span', { class: 'eyebrow' }, 'Accuracy'), this.accuracyEl),
        cfg.onSkip && h('button', { class: 'btn ghost', onclick: cfg.onSkip }, 'Skip'),
        cfg.mode !== 'demo' &&
          h('button', { class: 'btn ghost square', title: 'Pause (Esc)', 'aria-label': 'Pause', onclick: () => this.setPaused(true) }, icon('pause')),
      ),
      h('div', { class: 'progress' }, this.progressEl),
      h('div', { class: 'stage' }, canvas, this.countEl, this.overlay),
      cfg.tools && this.toolbar(),
    )

    this.highway = new Highway(canvas)
    this.highway.setRange(chart)
    this.syncHints()

    this.cleanups.push(
      app.input.onNote((pitch, on, perfTime) => {
        if (on) this.session.press(pitch, app.synth.fromPerf(perfTime))
        else this.session.release(pitch)
      }),
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
      if (e.code === 'Escape' && cfg.mode !== 'demo') this.setPaused(this.session.state === 'running')
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
    for (const off of this.cleanups) off()
    this.highway.destroy()
    this.silenceAuto()
  }

  /** (Re)starts the chart with the current practice settings. */
  restart(): void {
    clearTimeout(this.finishTimer)
    this.silenceAuto()
    this.events = []
    this.overlay.hidden = true
    this.pausedByDisconnect = false
    const { chart } = this.cfg
    const { synth } = this.app
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
        autoNote: (pitch, on) => {
          if (on) {
            synth.noteOn(pitch, 0.6)
            this.autoHeld.add(pitch)
          } else {
            synth.noteOff(pitch)
            this.autoHeld.delete(pitch)
          }
        },
        click: (accent) => synth.click(accent),
        judged: (index, grade, offsetMs) => {
          const note = chart.notes[index]
          if (grade !== 'miss') this.highway.flash(note.pitch, grade)
          this.events.push({ id: chart.id, pitch: note.pitch, hand: note.hand, grade, offsetMs, at: Date.now() })
          this.hudDirty = true
        },
        wrong: (pitch) => {
          this.highway.flash(pitch, 'wrong')
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
    this.hudDirty = true
  }

  private finish(): void {
    const full =
      this.mode === 'timed' && this.tempo === 1 && !this.loop && this.chartHands.every((hand) => this.hands.includes(hand))
    this.cfg.onFinish({ summary: this.session.summary(), events: this.events, full, timed: this.mode === 'timed' })
  }

  private setPaused(paused: boolean, reason = ''): void {
    const now = this.app.synth.now()
    if (paused && this.session.state === 'running') {
      this.session.pause(now)
      this.autoHeld.clear()
      this.pauseReason.textContent = reason
      this.pauseReason.hidden = !reason
      this.overlay.hidden = false
    } else if (!paused && this.session.state === 'paused') {
      this.session.resume(now)
      this.pausedByDisconnect = false
      this.overlay.hidden = true
    }
  }

  private silenceAuto(): void {
    for (const pitch of this.autoHeld) this.app.synth.noteOff(pitch)
    this.autoHeld.clear()
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
    session.update(this.app.synth.now())

    // Light the keys to press: what a waiting session is holding for, or what is about to land.
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
    this.highway.setHeld(this.autoHeld.size ? new Set([...this.app.input.held, ...this.autoHeld]) : this.app.input.held)
    // In a demo nothing is the player's, so draw every note at full strength.
    const active = session.mode === 'demo' ? undefined : session.active
    this.highway.draw({ beat: session.beat, chart, noteState: session.noteState, active, highlight })

    const counting = session.beat < 0 && session.state === 'running' && session.mode === 'timed'
    this.countEl.hidden = !counting
    if (counting) this.countEl.textContent = String(Math.max(1, Math.ceil(-session.beat)))

    const { from, to } = session.barRange
    const start = (from - 1) * chart.beatsPerBar
    const span = Math.max(1, to * chart.beatsPerBar - start)
    this.progressEl.style.width = `${Math.max(0, Math.min(1, (session.beat - start) / span)) * 100}%`

    if (this.hudDirty && this.cfg.scored) {
      this.hudDirty = false
      const s = session.summary()
      const judged = s.perfect + s.good + s.miss + s.wrong
      this.streakEl.textContent = String(s.streak)
      // Accuracy so far: only what has been played, so it does not start at 0%.
      const soFar = judged ? (s.perfect + s.good * 0.7) / judged : 1
      this.accuracyEl.textContent = judged ? percent(soFar) : '–'
    }
  }

  // ---- practice tools -------------------------------------------------------

  private toolbar(): HTMLElement {
    const apply = () => this.restart()

    const tempoValue = h('output', null, percent(this.tempo))
    const tempo = h('input', {
      type: 'range',
      min: '50',
      max: '100',
      step: '5',
      value: String(Math.round(this.tempo * 100)),
      'aria-label': 'Tempo',
      oninput: () => (tempoValue.textContent = `${tempo.value}%`),
      onchange: () => {
        this.tempo = Number(tempo.value) / 100
        apply()
      },
    })

    const wait = h('input', {
      type: 'checkbox',
      checked: this.mode === 'wait',
      onchange: () => {
        this.mode = wait.checked ? 'wait' : 'timed'
        apply()
      },
    })

    const handChoices: [string, Hand[]][] = [
      ['Both', this.chartHands],
      ['Left', ['L']],
      ['Right', ['R']],
    ]
    const handButtons = handChoices.map(([label, hands]) =>
      h(
        'button',
        {
          class: 'seg',
          'aria-pressed': String(hands.join() === this.hands.join()),
          onclick: () => {
            this.hands = hands
            handButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(handChoices[i][1].join() === hands.join())))
            apply()
          },
        },
        label,
      ),
    )

    const barInput = (value: number) =>
      h('input', { type: 'number', min: '1', max: String(this.bars), value: String(value), class: 'bar-input', disabled: true, onchange: () => setLoop() })
    const from = barInput(1)
    const to = barInput(Math.min(this.bars, 2))
    const loop = h('input', { type: 'checkbox', onchange: () => setLoop() })
    const setLoop = () => {
      from.disabled = to.disabled = !loop.checked
      const clamp = (input: HTMLInputElement) => Math.max(1, Math.min(this.bars, Math.round(Number(input.value)) || 1))
      this.loop = loop.checked ? { fromBar: clamp(from), toBar: clamp(to) } : null
      apply()
    }

    return h(
      'div',
      { class: 'tools' },
      h('label', { class: 'tool' }, h('span', { class: 'eyebrow' }, 'Tempo'), tempo, tempoValue),
      h('label', { class: 'tool check', title: 'The music waits until you press the right key' }, wait, 'Wait for me'),
      this.chartHands.length > 1 && h('div', { class: 'tool' }, h('span', { class: 'eyebrow' }, 'Hands'), h('div', { class: 'segs' }, handButtons)),
      h('div', { class: 'tool' }, h('label', { class: 'check' }, loop, 'Loop bars'), from, h('span', { class: 'muted' }, 'to'), to, h('span', { class: 'muted' }, `of ${this.bars}`)),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn', onclick: apply }, 'Restart'),
    )
  }
}
