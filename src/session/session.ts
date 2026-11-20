import type { Chart, Hand } from '../core/types'
import { GOOD_MS, Judge, type Grade, type Summary } from '../judge/judge'

/** demo: plays itself · wait: stops at each note until it is pressed · timed: runs to the clock. */
export type Mode = 'demo' | 'wait' | 'timed'

export interface SessionOptions {
  chart: Chart
  mode: Mode
  /** Hands the player plays. The other hand is played automatically. */
  hands: Hand[]
  /** 1 = written tempo, 0.5 = half speed. */
  tempoScale?: number
  /** 1-based inclusive bar range to repeat forever. */
  loop?: { fromBar: number; toBar: number }
  /** One bar of metronome clicks before the first note (timed mode). */
  countIn?: boolean
  /** How late the player's presses arrive, in ms; subtracted before judging. */
  latencyMs?: number
}

export interface SessionEvents {
  autoNote(pitch: number, on: boolean, hand: Hand): void
  click(accent: boolean): void
  judged(noteIndex: number, grade: Grade, offsetMs: number): void
  wrong(pitch: number): void
  finished(): void
  looped(): void
}

/** A frame gap longer than this (hidden tab, debugger) is treated as a pause. */
const MAX_FRAME_S = 0.25
/** Auto-played notes release slightly early so repeated notes re-strike. */
const AUTO_LENGTH = 0.95
const EPS = 1e-9

interface AutoEvent {
  beat: number
  pitch: number
  on: boolean
  hand: Hand
}

/**
 * Drives one chart: owns the beat position, auto-plays what the player doesn't,
 * and feeds presses to a Judge. Pure — the caller passes the clock in.
 */
export class Session {
  readonly chart: Chart
  readonly secondsPerBeat: number
  /** Current position in beats; negative during a count-in. */
  beat = 0
  state: 'idle' | 'running' | 'paused' | 'finished' = 'idle'
  /** Per chart note, for drawing. */
  noteState: ('pending' | Grade)[]
  /** Per chart note: true if the player is expected to play it in this run. */
  readonly active: boolean[]
  readonly mode: Mode

  private readonly rangeStart: number
  private readonly rangeEnd: number
  private readonly looping: boolean
  private readonly countIn: boolean
  private readonly latency: number
  private readonly events: Partial<SessionEvents>
  /** Judge index → chart note index. */
  private readonly judged: number[] = []
  private readonly autos: AutoEvent[] = []
  private judge: Judge | null = null
  private autoPos = 0
  private sounding = new Map<number, Hand>()
  private nextClick = 0
  private lastNow = 0

  constructor(opts: SessionOptions, events: Partial<SessionEvents> = {}) {
    const { chart } = opts
    this.chart = chart
    this.mode = opts.mode
    this.events = events
    this.secondsPerBeat = 60 / (chart.bpm * (opts.tempoScale ?? 1))
    this.countIn = !!opts.countIn && opts.mode === 'timed'
    this.latency = (opts.latencyMs ?? 0) / 1000

    const lastEnd = chart.notes.reduce((m, n) => Math.max(m, n.startBeat + n.durationBeats), 0)
    if (opts.loop) {
      const bars = Math.max(1, Math.ceil(chart.lengthBeats / chart.beatsPerBar))
      const clamp = (b: number) => Math.min(bars, Math.max(1, Math.round(b)))
      const a = clamp(opts.loop.fromBar)
      const b = clamp(opts.loop.toBar)
      this.rangeStart = (Math.min(a, b) - 1) * chart.beatsPerBar
      this.rangeEnd = Math.max(a, b) * chart.beatsPerBar
      this.looping = true
    } else {
      this.rangeStart = 0
      this.rangeEnd = lastEnd + 1
      this.looping = false
    }

    this.active = chart.notes.map(
      (n) =>
        opts.mode !== 'demo' &&
        opts.hands.includes(n.hand) &&
        n.startBeat >= this.rangeStart - EPS &&
        n.startBeat < this.rangeEnd - EPS,
    )
    this.noteState = chart.notes.map(() => 'pending')
    chart.notes.forEach((n, i) => {
      if (this.active[i]) {
        this.judged.push(i)
      } else if (n.startBeat >= this.rangeStart - EPS && n.startBeat < this.rangeEnd - EPS) {
        this.autos.push({ beat: n.startBeat, pitch: n.pitch, on: true, hand: n.hand })
        this.autos.push({ beat: n.startBeat + n.durationBeats * AUTO_LENGTH, pitch: n.pitch, on: false, hand: n.hand })
      }
    })
    // Releases before strikes on the same beat, so a repeated note re-strikes.
    this.autos.sort((a, b) => a.beat - b.beat || Number(a.on) - Number(b.on))
    this.reset(0)
  }

  /** Bars covered by this run, 1-based inclusive. */
  get barRange(): { from: number; to: number } {
    const bpb = this.chart.beatsPerBar
    return { from: Math.floor(this.rangeStart / bpb) + 1, to: Math.max(1, Math.ceil((this.rangeEnd - 1) / bpb)) }
  }

  start(now: number): void {
    this.reset(0)
    this.lastNow = now
    this.state = 'running'
  }

  pause(now: number): void {
    if (this.state !== 'running') return
    this.update(now)
    if (this.state !== 'running') return
    this.state = 'paused'
    this.silence()
  }

  resume(now: number): void {
    if (this.state !== 'paused') return
    this.lastNow = now
    this.state = 'running'
  }

  /** Call once per frame with the current clock time in seconds. */
  update(now: number): void {
    if (this.state !== 'running') return
    let dt = now - this.lastNow
    this.lastNow = now
    if (dt < 0 || dt > MAX_FRAME_S) dt = 0

    let target = this.beat + dt / this.secondsPerBeat
    if (this.mode === 'wait' && this.judge) {
      const pending = this.judge.pendingGroup()
      if (pending.length) target = Math.min(target, this.chart.notes[this.judged[pending[0]]].startBeat)
    }
    this.beat = target

    if (this.mode === 'timed') {
      while (this.nextClick <= this.beat + EPS && this.nextClick < this.rangeEnd - EPS) {
        const bpb = this.chart.beatsPerBar
        this.events.click?.((((this.nextClick % bpb) + bpb) % bpb) === 0)
        this.nextClick++
      }
    }
    while (this.autoPos < this.autos.length && this.autos[this.autoPos].beat <= this.beat + EPS) {
      const e = this.autos[this.autoPos++]
      if (e.on) this.sounding.set(e.pitch, e.hand)
      else this.sounding.delete(e.pitch)
      this.events.autoNote?.(e.pitch, e.on, e.hand)
    }
    if (this.judge) {
      for (const j of this.judge.advance(this.judgeTime(this.beat))) {
        this.noteState[this.judged[j]] = 'miss'
        this.events.judged?.(this.judged[j], 'miss', 0)
      }
    }

    if (this.beat >= this.rangeEnd - EPS) {
      if (this.looping) {
        this.reset(this.beat - this.rangeEnd)
        this.events.looped?.()
      } else {
        this.state = 'finished'
        this.silence()
        this.events.finished?.()
      }
    }
  }

  press(pitch: number, now: number): void {
    if (this.state !== 'running' || !this.judge) return
    // Judge at the moment the key went down, which is usually a little before this frame.
    let delta = now - this.lastNow
    if (this.mode !== 'timed' || Math.abs(delta) > MAX_FRAME_S) delta = 0
    const time = this.judgeTime(this.beat + delta / this.secondsPerBeat)
    // Noodling during the count-in is not a mistake.
    if (this.mode === 'timed' && time < this.rangeStart * this.secondsPerBeat - GOOD_MS / 1000) return
    const result = this.judge.press(pitch, time)
    if (result.kind === 'hit') {
      const index = this.judged[result.index]
      this.noteState[index] = result.grade
      this.events.judged?.(index, result.grade, result.offsetMs)
    } else {
      this.events.wrong?.(pitch)
    }
  }

  /** Chart indexes of the notes a waiting session is holding for (empty when not waiting). */
  pendingNotes(): number[] {
    if (this.mode !== 'wait' || !this.judge) return []
    return this.judge.pendingGroup().map((j) => this.judged[j])
  }

  /** Releases are not scored in v1; kept so callers need not care. */
  release(_pitch: number): void {}

  summary(): Summary {
    return (this.judge ?? new Judge([], 'timed')).summary()
  }

  private judgeTime(beat: number): number {
    return beat * this.secondsPerBeat - (this.mode === 'timed' ? this.latency : 0)
  }

  /** Back to the start of the range; `overshoot` beats carry over when looping. */
  private reset(overshoot: number): void {
    this.silence()
    this.beat = this.countIn ? this.rangeStart - this.chart.beatsPerBar : this.rangeStart + Math.max(0, overshoot)
    this.nextClick = Math.ceil(this.beat - EPS)
    this.autoPos = 0
    for (const i of this.judged) this.noteState[i] = 'pending'
    this.judge =
      this.mode === 'demo'
        ? null
        : new Judge(
            this.judged.map((i) => {
              const n = this.chart.notes[i]
              return { pitch: n.pitch, time: n.startBeat * this.secondsPerBeat, hand: n.hand }
            }),
            this.mode === 'wait' ? 'pitch' : 'timed',
          )
  }

  private silence(): void {
    for (const [pitch, hand] of this.sounding) this.events.autoNote?.(pitch, false, hand)
    this.sounding.clear()
  }
}
