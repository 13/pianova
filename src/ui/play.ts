import { chordMarks } from '../chart/harmony'
import { ChordStrip } from './chordStrip'
import { placeNotes, sectionAt, songSections, type Section } from '../chart/sections'
import { noteIndex, noteSpan } from '../chart/window'
import type { Chart, Hand } from '../core/types'
import type { Grade, Summary } from '../judge/judge'
import type { StatEvent } from '../progress/store'
import { bandFor, type BandEvent } from '../audio/band'
import { MAX_LEVEL } from '../chart/difficulty'
import { Highway } from '../render/highway'
import { SheetView } from '../render/staff'
import { Session, type Mode } from '../session/session'
import type { App } from './app'
import { h, icon, percent, type View } from './dom'
import { HandGuide } from './handGuide'
import { HandOverlay } from './handOverlay'
import { t } from '../i18n'

/** What the practice tools are set to; carried from one run to the next. */
export interface Practice {
  mode: Mode
  hands: Hand[]
  tempo: number
  loop: { fromBar: number; toBar: number } | null
  /** Difficulty level, when the screen offers one (1 = simplest, MAX_LEVEL = every note). */
  level?: number
}

export interface PlayConfig {
  chart: Chart
  mode: Mode
  /** Hands the player plays; defaults to every hand in the chart. */
  hands?: Hand[]
  tempoScale?: number
  /** Tool settings from an earlier run of the same chart, to pick up where it left off. */
  practice?: Practice
  /** Show the practice tools (wait, hands, loop). Speed can always be changed. */
  tools: boolean
  /** Called when the player picks another speed during play. */
  onTempo?: (tempo: number) => void
  /**
   * Offer a difficulty picker during play. `level` null means each part has its own level.
   * The caller swaps in the matching chart with `reconfigure`.
   */
  difficulty?: { level: number | null; onChange(level: number): void }
  /** Click the beat during a demo (for music that will be played in time). */
  metronome?: boolean
  /** Show the practice panel (accuracy, streak) and timing feedback. */
  scored: boolean
  /** Line under the title, e.g. "Lesson 04 · Practise". */
  label: string
  /** Heading; defaults to the chart's title (pass a translated one for built-in content). */
  title?: string
  /**
   * A generated backing band (drums, bass, pad) plays along, except while the music waits.
   * The chart's own backing (an imported file's other instruments, notes a level leaves out)
   * plays either way.
   */
  band?: boolean
  /** Difficulty level of each part, shown as dots under the timeline (song lessons). */
  sectionLevels?: number[]
  /** The song's parts, when the chart is a simplified version of a song split up elsewhere. */
  sections?: Section[]
  /** Called each time round a loop, with how that pass went. */
  onPass?: (pass: Summary) => void
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
  /** How each note of the chart went, and which ones were the player's. */
  noteState: ('pending' | Grade)[]
  active: boolean[]
}

const FINISH_DELAY_MS = 700
const FEEDBACK_MS = 1100
const TEMPOS = [50, 60, 70, 75, 80, 90, 100, 110, 125]
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
  /** Notes hit in a row, refreshed with the HUD. */
  private streak = 0
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
  private level: number | null
  private tempoEl: HTMLSelectElement | null = null
  private levelEl: HTMLSelectElement | null = null

  private readonly chartHands: Hand[]
  private readonly bars: number
  private streakEl = h('span', { class: 'panel-value' }, '0')
  private accuracyEl = h('span', { class: 'panel-value good' }, '–')
  private sections: Section[]
  private segs: { el: HTMLElement; panel: HTMLElement; canvas: HTMLCanvasElement; score: HTMLElement; dots: HTMLElement }[] = []
  private panelsEl = h('div', { class: 'tl-panels' })
  private playheadEl = h('div', { class: 'tl-head', 'aria-hidden': 'true' })
  /** Lowest and highest pitch in the chart, so every part's note map shares one scale. */
  private pitchSpan = { lo: 60, hi: 72 }
  private notesDirty = true
  /** Each timeline segment's left edge and width, measured on resize (never in the frame loop). */
  private segBox: { left: number; width: number }[] = []
  // Reused every frame, so the loop does not allocate.
  private span = { lo: 0, hi: 0 }
  private highlight = new Map<number, Hand>()
  private heldNow = new Set<number>()
  private autoHands = new Map<number, Hand>()
  private allHands = new Map<number, Hand>()
  private currentSection = -1
  private handGuide: HandGuide
  private handOverlay = new HandOverlay()
  /** The player's keys, for placing the hands. */
  private keyRange: { lo: number; hi: number }
  private anchor = (pitch: number) => this.highway.keyAnchor(pitch)
  /** Shows a loop set from the section timeline on the transport bar's loop controls. */
  private showLoop: (() => void) | null = null
  private trackLoop = h('div', { class: 'tl-loop', hidden: true }, h('span', { class: 'loop-end a' }, 'A'), h('span', { class: 'loop-end b' }, 'B'))
  private clockEl = h('span', { class: 'clock' }, '0:00 / 0:00')
  private feedbackEl = h('div', { class: 'feedback', hidden: true, role: 'status' })
  private countEl = h('div', { class: 'count-in', hidden: true })
  private overlay = h('div', { class: 'overlay', hidden: true })
  private pauseReason = h('p', { class: 'muted' })
  private pauseButton = h(
    'button',
    { class: 'tbtn primary', title: t('Pause (Esc)', 'Pause (Esc)'), 'aria-label': t('Pause', 'Pause'), onclick: () => this.togglePause() },
    icon('pause'),
  )
  private sustainEl = h('span', { class: 'chip', title: t('Sustain pedal', 'Haltepedal') }, icon('pedal'), t('Sustain', 'Pedal'))
  private statusEl = h('p', { class: 'play-status', hidden: true })
  private bannerEl = h('div', { class: 'banner-pop', hidden: true, role: 'status' })
  private bannerTimer = 0
  /** Seconds of playing not yet added to today's practice time. */
  private practiced = 0
  private bandEvents: BandEvent[] = []
  /** The song's chords, named; only for songs (where the band plays). */
  private chords: { name: string; startBeat: number }[] | undefined
  private chordStrip = new ChordStrip()
  private lastTick = 0
  private stageEl!: HTMLElement
  private sheetCanvas = h('canvas', { class: 'sheet-canvas' })
  private sheet: SheetView | null = null
  /** The chart with no notes, for the highway when only sheet music is shown. */
  private bare!: Chart

  constructor(
    private app: App,
    private cfg: PlayConfig,
  ) {
    // Fitted to the player's keyboard, and every note given a finger.
    this.cfg = cfg = { ...cfg, chart: app.prepare(cfg.chart) }
    const { chart } = cfg
    this.sections = cfg.sections ? placeNotes(cfg.sections, chart) : songSections(chart)
    this.bandEvents = bandFor(chart, !!cfg.band)
    if (cfg.band) this.chords = chordMarks(chart)
    this.chordStrip.set(this.chords)
    this.chartHands = (['L', 'R'] as Hand[]).filter((hand) => chart.notes.some((n) => n.hand === hand))
    this.bars = Math.max(1, Math.ceil(chart.lengthBeats / chart.beatsPerBar))
    this.mode = cfg.practice?.mode ?? cfg.mode
    this.hands = cfg.practice?.hands ?? cfg.hands ?? this.chartHands
    this.tempo = cfg.practice?.tempo ?? cfg.tempoScale ?? 1
    this.loop = cfg.practice?.loop ?? null
    this.level = cfg.difficulty ? (cfg.practice?.level ?? cfg.difficulty.level) : null
    this.hadDevice = app.input.status.inputs.length > 0
    this.handGuide = new HandGuide(this.chartHands)
    const { lo, hi } = app.keyboard
    this.keyRange = { lo, hi }

    const canvas = h('canvas', { class: 'stage-canvas' })
    this.overlay.append(
      h(
        'div',
        { class: 'card' },
        h('h2', null, t('Paused', 'Pausiert')),
        this.pauseReason,
        h(
          'div',
          { class: 'row' },
          h('button', { class: 'btn primary', onclick: () => this.setPaused(false) }, t('Resume', 'Weiter')),
          h('button', { class: 'btn', onclick: () => this.restart() }, t('Restart', 'Neu starten')),
          cfg.onExit && h('button', { class: 'btn ghost', onclick: cfg.onExit }, t('Leave', 'Verlassen')),
        ),
      ),
    )
    this.el = h(
      'div',
      { class: 'play' },
      h(
        'div',
        { class: 'play-head' },
        h('h1', { class: 'play-title' }, cfg.title ?? chart.title),
        h('p', { class: 'play-sub' }, cfg.label),
        this.statusEl,
        this.timeline(),
      ),
      (this.stageEl = h(
        'div',
        { class: 'stage' },
        canvas,
        this.handOverlay.el,
        h('div', { class: 'sheet' }, this.sheetCanvas),
        cfg.scored &&
          h(
            'div',
            { class: 'panel' },
            h('span', { class: 'panel-title' }, t('Practice', 'Übung')),
            h('div', { class: 'panel-row' }, icon('target'), h('span', null, t('Accuracy', 'Genauigkeit')), this.accuracyEl),
            h('div', { class: 'panel-row' }, icon('flame'), h('span', null, t('Streak', 'Serie')), this.streakEl),
          ),
        this.chordStrip.el,
        this.feedbackEl,
        this.handGuide.el,
        this.bannerEl,
        this.countEl,
        this.overlay,
      )),
      this.transport(),
    )

    this.highway = new Highway(canvas)
    this.highway.setRange(chart)
    this.bare = { ...chart, notes: [] }
    this.applyView()
    this.syncHints()

    this.cleanups.push(
      app.input.attachPointer(this.stageEl, (x, y) => this.highway.keyAt(x, y)),
      app.input.onNote((pitch, on, perfTime) => {
        if (on) this.session.press(pitch, app.synth.fromPerf(perfTime))
        else this.session.release(pitch, app.synth.fromPerf(perfTime))
      }),
      app.input.onSustain((down) => this.sustainEl.classList.toggle('on', down)),
      app.input.onStatus((status) => {
        this.syncHints()
        if (status.inputs.length === 0 && this.session.state === 'running' && this.hadDevice) {
          this.pausedByDisconnect = true
          this.setPaused(true, t('Your keyboard was disconnected. Plug it back in to carry on.', 'Dein Keyboard wurde getrennt. Steck es wieder ein, um weiterzumachen.'))
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
    // The timeline is sized by CSS: measure it when that changes, not in every frame.
    const resize = new ResizeObserver(() => this.measureTimeline())
    resize.observe(this.panelsEl)
    this.cleanups.push(
      () => window.removeEventListener('keydown', onKey),
      () => document.removeEventListener('visibilitychange', onHide),
      () => resize.disconnect(),
    )

    this.restart()
    this.frame()
  }

  destroy(): void {
    cancelAnimationFrame(this.raf)
    clearTimeout(this.finishTimer)
    clearTimeout(this.feedbackTimer)
    clearTimeout(this.bannerTimer)
    for (const off of this.cleanups) off()
    this.flushPractice()
    this.highway.destroy()
    this.sheet?.destroy()
    this.session.stop(this.app.synth.now())
  }

  /** The current tool settings. */
  get practice(): Practice {
    return { mode: this.mode, hands: [...this.hands], tempo: this.tempo, loop: this.loop && { ...this.loop }, ...(this.level !== null ? { level: this.level } : {}) }
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
    // The band keeps time, so it sits out while the music waits for each note; piano
    // notes played for you wait along with the rest of the music.
    const band = this.mode === 'wait' ? this.bandEvents.filter((e) => e.sound === 'keys') : this.bandEvents
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
        extras: band,
      },
      {
        autoNote: (pitch, on, _hand, at) => {
          if (on) synth.noteOn(pitch, this.mode === 'demo' ? DEMO_VELOCITY : ACCOMPANY_VELOCITY, at, this.mode === 'demo' ? 'keys' : 'accomp')
          else synth.noteOff(pitch, at)
        },
        extra: (i, at) => {
          const e = band[i]
          synth.band(e.sound, at, e.velocity, e.pitches, e.durationBeats * this.session.secondsPerBeat)
        },
        click: (accent, at) => synth.click(accent, at),
        cancel: (at) => synth.cancelAfter(at),
        short: () => {
          this.showFeedback('short', 0)
          this.hudDirty = true
        },
        judged: (index, grade, offsetMs) => {
          const note = chart.notes[index]
          this.highway.flash(note.pitch, grade, note.hand, { offsetMs, timed: this.mode === 'timed' })
          if (grade !== 'miss') this.keyHands.set(note.pitch, note.hand)
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
        looped: (pass) => {
          this.events = []
          this.hudDirty = true
          this.cfg.onPass?.(pass)
        },
        finished: () => {
          this.finishTimer = window.setTimeout(() => this.finish(), FINISH_DELAY_MS)
        },
      },
    )
    this.session.start(synth.now())
    this.session.update(synth.now(), synth.lead)
    this.hudDirty = true

    this.trackLoop.hidden = !this.loop
    this.handGuide.setPlaying(this.mode === 'demo' ? [] : this.hands)
    this.currentSection = -1
    for (const seg of this.segs) {
      seg.el.classList.remove('great', 'ok', 'weak', 'current', 'past')
      seg.el.classList.toggle('looped', !!this.loop && seg.el.dataset.from === String(this.loop.fromBar) && seg.el.dataset.to === String(this.loop.toBar))
      seg.score.textContent = ''
    }
    this.notesDirty = true
  }

  /**
   * The song's parts along the top, each a panel with a small map of its notes. The part
   * being played lights up, a playhead marks the spot, and a line under each part takes the
   * colour of its score. Click a part to loop it.
   */
  private timeline(): HTMLElement {
    const pitches = this.cfg.chart.notes.map((n) => n.pitch)
    if (pitches.length) this.pitchSpan = { lo: Math.min(...pitches), hi: Math.max(...pitches) }
    for (const s of this.sections) {
      const canvas = h('canvas', { class: 'tl-notes' })
      const score = h('span', { class: 'tl-score' })
      const dots = h('span', { class: 'tl-dots' })
      const bars = s.fromBar === s.toBar ? t(`bar ${s.fromBar}`, `Takt ${s.fromBar}`) : t(`bars ${s.fromBar}–${s.toBar}`, `Takte ${s.fromBar}–${s.toBar}`)
      const label = `${t('Part', 'Teil')} ${s.name}, ${bars}`
      const panel = h(
        this.cfg.tools ? 'button' : 'div',
        {
          class: 'tl-panel',
          title: this.cfg.tools ? `${label} – ${t('click to loop it', 'klicken für Schleife')}` : label,
          'aria-label': label,
          onclick: this.cfg.tools ? () => this.loopSection(s) : undefined,
        },
        canvas,
        h('span', { class: 'tl-name' }, s.name),
        score,
      )
      const el = h('div', { class: 'tl-seg', style: `flex-grow: ${s.toBar - s.fromBar + 1}` }, panel, h('div', { class: 'tl-base' }), dots)
      el.dataset.from = String(s.fromBar)
      el.dataset.to = String(s.toBar)
      this.segs.push({ el, panel, canvas, score, dots })
      this.panelsEl.append(el)
    }
    this.showLevels(this.cfg.sectionLevels)
    this.panelsEl.append(this.trackLoop, this.playheadEl)
    this.panelsEl.classList.toggle('single', this.sections.length === 1)
    return h('div', { class: 'timeline' }, this.panelsEl)
  }

  /** Dots under each part for its difficulty level (song lessons). */
  private showLevels(levels: number[] | undefined): void {
    this.segs.forEach((seg, i) => {
      const level = levels?.[i] ?? 0
      seg.dots.replaceChildren(...Array.from({ length: level }, () => h('i')))
      seg.dots.title = level ? t(`Level ${level}`, `Stufe ${level}`) : ''
    })
  }

  /** Horizontal position of a beat on the timeline, in pixels from its left edge. */
  private xAt(beat: number): number {
    const i = sectionAt(this.sections, beat)
    const s = this.sections[i]
    const box = this.segBox[i]
    if (!box) return 0
    const frac = Math.max(0, Math.min(1, (beat - s.startBeat) / (s.endBeat - s.startBeat)))
    return box.left + frac * box.width
  }

  /** Measures the timeline once its size changes, so the frame loop only writes to the page. */
  private measureTimeline(): void {
    this.segBox = this.segs.map(({ el }) => ({ left: el.offsetLeft, width: el.offsetWidth }))
    this.notesDirty = true
  }

  /** Redraws each part's note map: dots by pitch and time, coloured once they are played. */
  private drawNoteMaps(): void {
    const { chart } = this.cfg
    const { noteState, active } = this.session
    const demo = this.session.mode === 'demo'
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const span = Math.max(12, this.pitchSpan.hi - this.pitchSpan.lo)
    const mid = (this.pitchSpan.hi + this.pitchSpan.lo) / 2
    this.sections.forEach((s, i) => {
      const { canvas } = this.segs[i]
      const w = canvas.clientWidth
      const hgt = canvas.clientHeight
      if (!w || !hgt) return
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hgt * dpr)) {
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(hgt * dpr)
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, hgt)
      const current = i === this.currentSection
      const len = s.endBeat - s.startBeat
      const r = Math.max(1.6, Math.min(2.6, hgt / 14))
      for (const n of s.notes) {
        const note = chart.notes[n]
        const x = 4 + ((note.startBeat - s.startBeat) / len) * (w - 8)
        const y = hgt / 2 - ((note.pitch - mid) / span) * (hgt - 2 * r - 6)
        const state = noteState[n]
        const mine = demo || active[n]
        ctx.fillStyle =
          mine && state !== 'pending' && !demo
            ? state === 'miss'
              ? 'rgba(255, 77, 109, 0.9)'
              : current
                ? 'rgba(10, 120, 90, 0.95)'
                : 'rgba(74, 222, 128, 0.95)'
            : current
              ? mine
                ? 'rgba(12, 14, 34, 0.85)'
                : 'rgba(12, 14, 34, 0.35)'
              : mine
                ? 'rgba(238, 240, 255, 0.85)'
                : 'rgba(238, 240, 255, 0.3)'
        const long = (note.durationBeats / len) * (w - 8)
        if (long > r * 4) {
          ctx.globalAlpha = 0.45
          ctx.fillRect(x, y - r * 0.35, long - r, r * 0.7)
          ctx.globalAlpha = 1
        }
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }

  /** Loops one part of the song, or stops looping if it already is. */
  private loopSection(s: Section): void {
    const same = this.loop && this.loop.fromBar === s.fromBar && this.loop.toBar === s.toBar
    this.loop = same ? null : { fromBar: s.fromBar, toBar: s.toBar }
    this.showLoop?.()
    this.restart()
  }

  /** How well each part went: hits out of the notes judged in it so far. */
  private scoreSections(): void {
    const { session } = this
    const played = session.mode !== 'demo' && this.cfg.scored
    this.sections.forEach((s, i) => {
      const seg = this.segs[i]
      let judged = 0
      let hits = 0
      for (const n of s.notes) {
        if (!session.active[n]) continue
        const state = session.noteState[n]
        if (state === 'pending') continue
        judged++
        if (state !== 'miss') hits++
      }
      const done = played && judged > 0 && session.beat >= s.endBeat - 1e-6
      const rate = judged ? hits / judged : 0
      const tone = !done ? '' : rate >= 0.9 ? 'great' : rate >= 0.7 ? 'ok' : 'weak'
      for (const cls of ['great', 'ok', 'weak']) seg.el.classList.toggle(cls, cls === tone)
      seg.score.textContent = done ? percent(rate) : ''
    })
  }

  private finish(): void {
    const full =
      this.mode === 'timed' &&
      this.tempo >= 1 &&
      !this.loop &&
      (this.level === null || this.level >= MAX_LEVEL) &&
      this.chartHands.every((hand) => this.hands.includes(hand))
    this.cfg.onFinish({
      summary: this.session.summary(),
      events: this.events,
      full,
      timed: this.mode === 'timed',
      practice: this.practice,
      noteState: [...this.session.noteState],
      active: [...this.session.active],
    })
  }

  /**
   * Swaps in another version of the chart (more or fewer notes) or a new tempo, and starts
   * again from the top of the loop. The 3D scene stays, so it is quick enough between passes.
   */
  reconfigure(patch: { chart?: Chart; tempo?: number; level?: number; sectionLevels?: number[] }): void {
    if (patch.sectionLevels) this.showLevels(patch.sectionLevels)
    if (patch.chart) {
      this.cfg = { ...this.cfg, chart: this.app.prepare(patch.chart) }
      this.sections = placeNotes(this.sections, this.cfg.chart)
      this.highway.setRange(this.cfg.chart)
      this.bare = { ...this.cfg.chart, notes: [] }
      this.bandEvents = bandFor(this.cfg.chart, !!this.cfg.band)
      if (this.cfg.band) this.chords = chordMarks(this.cfg.chart)
      this.chordStrip.set(this.chords)
    }
    if (patch.tempo !== undefined) {
      this.tempo = patch.tempo
      if (this.tempoEl) this.fillTempos(this.tempoEl)
    }
    if (patch.level !== undefined) {
      this.level = patch.level
      if (this.levelEl) this.levelEl.value = String(patch.level)
    }
    this.restart()
  }

  /** A line under the title, e.g. "Part B · Level 3 of 5 · 80% speed". */
  setStatus(text: string | null): void {
    this.statusEl.hidden = !text
    this.statusEl.textContent = text ?? ''
  }

  /** A big message over the highway for a moment: "Level up!", "Part learned". */
  banner(title: string, detail: string, tone: 'gold' | 'ok' | 'warn' = 'ok'): void {
    this.bannerEl.replaceChildren(h('strong', null, title), h('span', null, detail))
    this.bannerEl.className = `banner-pop ${tone}`
    this.bannerEl.hidden = false
    clearTimeout(this.bannerTimer)
    this.bannerTimer = window.setTimeout(() => (this.bannerEl.hidden = true), 2200)
  }

  /** A button that opens sliders for the band, the notes played for you, and the click. */
  private mixer(): HTMLElement {
    const { progress, synth } = this.app
    const channels: ['accomp' | 'band' | 'click', string][] = [
      ...(this.bandEvents.some((e) => e.sound !== 'keys') ? ([['band', t('Band', 'Band')]] as ['band', string][]) : []),
      ['accomp', t('Other notes', 'Mitspielende Noten')],
      ['click', t('Click', 'Klick')],
    ]
    const panel = h(
      'div',
      { class: 'mixer', hidden: true, role: 'group', 'aria-label': t('Mixer', 'Mischpult') },
      channels.map(([key, label]) => {
        const slider = h('input', {
          type: 'range',
          min: '0',
          max: '100',
          value: String(Math.round(progress.settings.mix[key] * 100)),
          'aria-label': label,
          oninput: () => {
            const mix = { ...progress.settings.mix, [key]: Number(slider.value) / 100 }
            progress.setSettings({ mix })
            synth.setMix(mix)
          },
        })
        return h('label', { class: 'mixer-row' }, h('span', null, label), slider)
      }),
    )
    const button = h(
      'button',
      {
        class: 'chip toggle',
        'aria-pressed': 'false',
        'aria-expanded': 'false',
        onclick: () => {
          panel.hidden = !panel.hidden
          button.setAttribute('aria-pressed', String(!panel.hidden))
          button.setAttribute('aria-expanded', String(!panel.hidden))
        },
      },
      icon('music'),
      t('Mixer', 'Mischpult'),
    )
    return h('span', { class: 'mixer-wrap' }, button, panel)
  }

  /** Adds the time played so far to today's total. */
  private flushPractice(): void {
    this.app.progress.addPractice(this.practiced)
    this.practiced = 0
  }

  /** Shows the highway, sheet music, or both, as chosen in the transport bar. */
  private applyView(): void {
    const view = this.app.progress.settings.view
    if (view !== 'highway' && !this.sheet) this.sheet = new SheetView(this.sheetCanvas)
    this.stageEl.classList.toggle('view-sheet', view === 'sheet')
    this.stageEl.classList.toggle('view-both', view === 'both')
  }

  /** The pill that tells you how the last note went. */
  private showFeedback(grade: Grade | 'wrong' | 'short', offsetMs: number): void {
    if (!this.cfg.scored) return
    const [text, tone] =
      grade === 'short'
        ? [t('Hold it longer', 'Länger halten'), 'warn']
        : grade === 'wrong'
        ? [t('Wrong key', 'Falsche Taste'), 'bad']
        : grade === 'miss'
          ? [t('Missed', 'Verpasst'), 'bad']
          : this.mode !== 'timed'
            ? [t('Correct', 'Richtig'), 'ok']
            : grade === 'perfect'
              ? [t('Right on time', 'Genau im Takt'), 'ok']
              : offsetMs < 0
                ? [t('A little early', 'Etwas zu früh'), 'warn']
                : [t('A little late', 'Etwas zu spät'), 'warn']
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
    this.pauseButton.setAttribute('aria-label', paused ? t('Resume', 'Weiter') : t('Pause', 'Pause'))
  }

  /** Key hints show which computer key plays each note, when there is no MIDI keyboard. */
  private syncHints(): void {
    this.hintShift = this.app.input.octaveShift
    this.highway.setOptions({
      labels: this.app.progress.settings.labels,
      keyHints: this.app.usingComputerKeys,
      hintShift: this.hintShift,
      keys: this.app.keyboard,
    })
  }

  private frame = (): void => {
    this.raf = requestAnimationFrame(this.frame)
    if (this.app.input.octaveShift !== this.hintShift) this.syncHints()
    const { session } = this
    const { chart } = this.cfg
    const { synth } = this.app
    const now = synth.now()
    session.update(now, synth.lead)

    // Time spent playing (not listening, not paused) counts towards the daily goal.
    const tick = performance.now()
    if (this.lastTick && session.state === 'running' && session.mode !== 'demo') this.practiced += Math.min(0.25, (tick - this.lastTick) / 1000)
    this.lastTick = tick
    if (this.practiced >= 10) this.flushPractice()

    // Mark the keys to press: what a waiting session is holding for, or what is about to land.
    // Only notes near the playhead can matter, so only those are looked at.
    const highlight = this.highlight
    highlight.clear()
    const { order } = noteIndex(chart)
    const { lo, hi } = noteSpan(chart, session.beat - 0.5, session.beat + 0.5, this.span)
    if (session.mode === 'wait') {
      for (const i of session.pendingNotes()) {
        if (chart.notes[i].startBeat - session.beat < 0.5) highlight.set(chart.notes[i].pitch, chart.notes[i].hand)
      }
    } else if (session.mode === 'timed') {
      for (let k = lo; k < hi; k++) {
        const i = order[k]
        const n = chart.notes[i]
        const ahead = n.startBeat - session.beat
        if (session.active[i] && session.noteState[i] === 'pending' && ahead > -0.2 && ahead < 0.5) highlight.set(n.pitch, n.hand)
      }
    }
    // Keys the app is playing light up while their notes sound (worked out from the music,
    // since the sounds themselves are scheduled ahead of time).
    const held = this.heldNow
    held.clear()
    for (const pitch of this.app.input.held) held.add(pitch)
    const autoHands = this.autoHands
    autoHands.clear()
    if (session.state === 'running') {
      for (let k = lo; k < hi; k++) {
        const i = order[k]
        const n = chart.notes[i]
        if (!session.active[i] && n.startBeat <= session.beat && session.beat < n.startBeat + n.durationBeats * 0.95) {
          held.add(n.pitch)
          autoHands.set(n.pitch, n.hand)
        }
      }
    }
    for (const pitch of this.keyHands.keys()) if (!this.app.input.held.has(pitch)) this.keyHands.delete(pitch)
    let keyHands = this.keyHands
    if (autoHands.size) {
      keyHands = this.allHands
      keyHands.clear()
      for (const [pitch, hand] of autoHands) keyHands.set(pitch, hand)
      for (const [pitch, hand] of this.keyHands) keyHands.set(pitch, hand)
    }
    this.highway.setHeld(held)
    // In a demo nothing is the player's, so draw every note at full strength.
    const active = session.mode === 'demo' ? undefined : session.active
    if (this.hudDirty) this.streak = session.summary().streak
    const view = this.app.progress.settings.view
    const sheetOnly = view === 'sheet'
    const chords = this.app.progress.settings.chordNames ? this.chords : undefined
    this.chordStrip.update(session.beat, !!chords)
    if (view !== 'highway')
      this.sheet?.draw({
        beat: session.beat,
        chart,
        noteState: session.noteState,
        active,
        sections: this.sections.length > 1 ? this.sections : undefined,
        chords,
        labels: this.app.progress.settings.labels,
      })
    this.highway.draw({
      beat: session.beat,
      chart: sheetOnly ? this.bare : chart,
      noteState: sheetOnly ? [] : session.noteState,
      cut: sheetOnly ? [] : session.cut,
      active: sheetOnly ? [] : active,
      highlight,
      keyHands,
      streak: this.streak,
      sections: this.sections.length > 1 ? this.sections : undefined,
    })
    this.handGuide.update(chart, session.beat, session.noteState, active)
    this.handOverlay.update({
      chart,
      beat: session.beat,
      noteState: session.noteState,
      active,
      keys: this.keyRange,
      anchor: this.anchor,
      visible: this.app.progress.settings.handOverlay && !sheetOnly,
    })

    const resumeCount = session.resumeCount(now)
    const counting = (session.beat < 0 && session.state === 'running' && session.mode === 'timed') || resumeCount > 0
    this.countEl.hidden = !counting
    if (counting) this.countEl.textContent = String(Math.max(1, Math.ceil(resumeCount || -session.beat)))

    const totalBeats = this.bars * chart.beatsPerBar
    const at = Math.max(0, Math.min(totalBeats, session.beat))
    const cur = sectionAt(this.sections, session.beat)
    if (cur !== this.currentSection) {
      this.currentSection = cur
      this.segs.forEach((seg, i) => {
        seg.el.classList.toggle('current', i === cur)
        seg.el.classList.toggle('past', i < cur)
      })
      // A part just finished: show its score even if no note was judged on the way out.
      if (this.cfg.scored) this.scoreSections()
      this.notesDirty = true
    }
    if (this.notesDirty) {
      this.notesDirty = false
      this.drawNoteMaps()
    }
    this.playheadEl.style.transform = `translateX(${this.xAt(at).toFixed(1)}px)`
    if (this.loop) {
      const { from, to } = session.barRange
      const left = this.xAt((from - 1) * chart.beatsPerBar)
      const right = this.xAt(to * chart.beatsPerBar - 1e-3)
      this.trackLoop.style.left = `${left}px`
      this.trackLoop.style.width = `${Math.max(8, right - left)}px`
    }
    const clock = `${mmss(at * session.secondsPerBeat)} / ${mmss(totalBeats * session.secondsPerBeat)}`
    if (clock !== this.lastClock) this.clockEl.textContent = this.lastClock = clock

    if (this.hudDirty && this.cfg.scored) {
      this.hudDirty = false
      this.scoreSections()
      this.notesDirty = true
      const s = session.summary()
      const judged = s.perfect + s.good + s.miss + s.wrong
      this.streakEl.textContent = String(s.streak)
      // Accuracy so far: only what has been played, so it does not start at 0%.
      this.accuracyEl.textContent = judged ? percent(s.soFar) : '–'
    }
  }

  /** The speed choices, always including the current speed, with it selected. */
  private fillTempos(select: HTMLSelectElement): void {
    const now = Math.round(this.tempo * 100)
    const all = [...new Set([...TEMPOS, now])].sort((a, b) => a - b)
    select.replaceChildren(...all.map((n) => h('option', { value: String(n), selected: n === now }, `${t('Speed', 'Tempo')} ${percent(n / 100)}`)))
  }

  // ---- transport bar --------------------------------------------------------

  private transport(): HTMLElement {
    const { cfg } = this
    const apply = () => this.restart()
    const controls: (HTMLElement | false | undefined)[] = [
      cfg.mode !== 'demo' && this.pauseButton,
      h('button', { class: 'tbtn', title: t('Restart', 'Neu starten'), 'aria-label': t('Restart', 'Neu starten'), onclick: apply }, icon('restart')),
      h('span', { class: 'divider' }),
      this.clockEl,
    ]

    // Speed, and the difficulty where there is one, can be changed at any time.
    const tempo = (this.tempoEl = h('select', {
      class: 'chip',
      'aria-label': t('Speed', 'Tempo'),
      title: t('How fast the music plays', 'Wie schnell die Musik spielt'),
      onchange: () => {
        this.tempo = Number(tempo.value) / 100
        cfg.onTempo?.(this.tempo)
        apply()
      },
    }))
    this.fillTempos(tempo)
    controls.push(h('span', { class: 'divider' }), tempo)

    if (cfg.difficulty) {
      const { onChange } = cfg.difficulty
      const level = (this.levelEl = h(
        'select',
        {
          class: 'chip',
          'aria-label': t('Difficulty', 'Schwierigkeit'),
          title: t('Fewer notes to play at lower levels; the rest are played for you', 'Weniger Noten auf niedrigeren Stufen; den Rest spielt die Musik für dich'),
          onchange: () => {
            if (!level.value) return
            this.level = Number(level.value)
            onChange(this.level)
          },
        },
        this.level === null && h('option', { value: '', selected: true, disabled: true }, t('Level: each part', 'Stufe: je Teil')),
        Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((n) =>
          h('option', { value: String(n), selected: n === this.level }, n === MAX_LEVEL ? t(`Level ${n} · every note`, `Stufe ${n} · alle Noten`) : t(`Level ${n}`, `Stufe ${n}`)),
        ),
      ))
      controls.push(level)
    }

    if (cfg.tools) {

      const barInput = (value: number, label: string) =>
        h('input', { type: 'number', min: '1', max: String(this.bars), value: String(value), class: 'bar-input', 'aria-label': label, onchange: () => setLoop() })
      const from = barInput(this.loop?.fromBar ?? 1, t('Loop from bar', 'Schleife ab Takt'))
      const to = barInput(this.loop?.toBar ?? Math.min(this.bars, 2), t('Loop to bar', 'Schleife bis Takt'))
      const range = h('span', { class: 'loop-range', hidden: !this.loop }, t('bars', 'Takte'), from, '–', to, h('span', { class: 'muted' }, t(`of ${this.bars}`, `von ${this.bars}`)))
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
        t('Loop A–B', 'Schleife A–B'),
      )
      this.showLoop = () => {
        loop.setAttribute('aria-pressed', String(!!this.loop))
        range.hidden = !this.loop
        if (this.loop) {
          from.value = String(this.loop.fromBar)
          to.value = String(this.loop.toBar)
        }
      }
      const setLoop = () => {
        const on = loop.getAttribute('aria-pressed') === 'true'
        range.hidden = !on
        const clamp = (input: HTMLInputElement) => Math.max(1, Math.min(this.bars, Math.round(Number(input.value)) || 1))
        this.loop = on ? { fromBar: clamp(from), toBar: clamp(to) } : null
        apply()
      }

      const handChoices: [string, Hand[]][] = [
        [t('Both hands', 'Beide Hände'), this.chartHands],
        [t('Left hand', 'Linke Hand'), ['L']],
        [t('Right hand', 'Rechte Hand'), ['R']],
      ]
      const hands = h(
        'select',
        {
          class: 'chip',
          'aria-label': t('Hands', 'Hände'),
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
          title: t('The music waits until you press the right key', 'Die Musik wartet, bis du die richtige Taste drückst'),
          onclick: () => {
            this.mode = this.mode === 'wait' ? 'timed' : 'wait'
            wait.setAttribute('aria-pressed', String(this.mode === 'wait'))
            apply()
          },
        },
        icon('hourglass'),
        t('Wait for me', 'Warte auf mich'),
      )

      controls.push(loop, range, this.chartHands.length > 1 && hands, wait)
    }

    const view = h(
      'select',
      {
        class: 'chip',
        'aria-label': t('View', 'Ansicht'),
        onchange: () => {
          this.app.progress.setSettings({ view: view.value as 'highway' | 'sheet' | 'both' })
          this.applyView()
        },
      },
      (
        [
          ['highway', t('Highway', 'Notenbahn')],
          ['both', t('Highway + sheet music', 'Notenbahn + Noten')],
          ['sheet', t('Sheet music', 'Noten')],
        ] as const
      ).map(([value, label]) => h('option', { value, selected: this.app.progress.settings.view === value }, label)),
    )
    const chordToggle =
      !!this.chords?.length &&
      h(
        'button',
        {
          class: 'chip toggle',
          'aria-pressed': String(this.app.progress.settings.chordNames),
          title: t("Show the song's chords", 'Die Akkorde des Liedes zeigen'),
          onclick: () => {
            const on = !this.app.progress.settings.chordNames
            this.app.progress.setSettings({ chordNames: on })
            chordToggle && chordToggle.setAttribute('aria-pressed', String(on))
          },
        },
        t('Chords', 'Akkorde'),
      )
    controls.push(
      h('span', { class: 'spacer' }),
      this.mixer(),
      chordToggle,
      view,
      cfg.onSkip && h('button', { class: 'chip', onclick: cfg.onSkip }, t('Skip', 'Überspringen')),
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
