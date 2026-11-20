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
  /** Click on every beat. Always on in timed mode; opt-in for demos of timed music. */
  metronome?: boolean
}

export interface SessionEvents {
  /** `at` is the clock time the note should sound, which may be ahead of now. */
  autoNote(pitch: number, on: boolean, hand: Hand, at: number): void
  click(accent: boolean, at: number): void
  /** Sounds scheduled for after `at` are no longer wanted (pause, restart, a jump). */
  cancel(at: number): void
  judged(noteIndex: number, grade: Grade, offsetMs: number): void
  wrong(pitch: number): void
  /** A long note was let go of too soon. */
  short(noteIndex: number): void
  finished(): void
  looped(): void
}

/** A frame gap longer than this (hidden tab, debugger) is treated as a pause. */
const MAX_FRAME_S = 0.25
/** Auto-played notes release slightly early so repeated notes re-strike. */
const AUTO_LENGTH = 0.95
/** Notes at least this long (in beats) must be held, not just struck. */
export const LONG_NOTE_BEATS = 1.5
/** The share of a long note's length the key must stay down for. */
export const HOLD_FRACTION = 0.7
const EPS = 1e-9

interface AutoEvent {
  beat: number
  pitch: number
  hand: Hand
}

/**
 * Drives one chart: owns the beat position, auto-plays what the player doesn't,
 * and feeds presses to a Judge. Pure — the caller passes the clock in.
 *
 * Sounds (auto-played notes, clicks) are emitted up to `lead` seconds early with
 * the exact time they should be heard, so they keep perfect time however uneven
 * the frames are. Releases are emitted when due.
 */
export class Session {
  readonly chart: Chart
  readonly secondsPerBeat: number
  /** Current position in beats; negative during a count-in. */
  beat = 0
  state: 'idle' | 'running' | 'paused' | 'finished' = 'idle'
  /** Per chart note, for drawing. */
  noteState: ('pending' | Grade)[]
  /** Per chart note: let go of too soon. */
  cut: boolean[]
  /** Per chart note: true if the player is expected to play it in this run. */
  readonly active: boolean[]
  readonly mode: Mode

  private readonly rangeStart: number
  private readonly rangeEnd: number
  private readonly looping: boolean
  private readonly countIn: boolean
  private readonly metronome: boolean
  private readonly latency: number
  private readonly events: Partial<SessionEvents>
  /** Judge index → chart note index. */
  private readonly judged: number[] = []
  private readonly ons: AutoEvent[] = []
  private readonly offs: AutoEvent[] = []
  private judge: Judge | null = null
  private onPos = 0
  private offPos = 0
  /** Clock time each emitted note-on / click was scheduled for, to undo ones still ahead. */
  private onAt: number[] = []
  private clickAt: { beat: number; at: number }[] = []
  private sounding = new Map<number, Hand>()
  private nextClick = 0
  /** Clock time that `beat` corresponds to. */
  private lastNow = 0
  /** After a resume in timed mode the music waits for a bar of clicks until this time. */
  private resumeAt = -Infinity

  constructor(opts: SessionOptions, events: Partial<SessionEvents> = {}) {
    const { chart } = opts
    this.chart = chart
    this.mode = opts.mode
    this.events = events
    this.secondsPerBeat = 60 / (chart.bpm * (opts.tempoScale ?? 1))
    this.countIn = !!opts.countIn && opts.mode === 'timed'
    this.metronome = opts.mode === 'timed' || (!!opts.metronome && opts.mode === 'demo')
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

    const inRange = (beat: number) => beat >= this.rangeStart - EPS && beat < this.rangeEnd - EPS
    this.active = chart.notes.map((n) => opts.mode !== 'demo' && opts.hands.includes(n.hand) && inRange(n.startBeat))
    this.noteState = chart.notes.map(() => 'pending')
    this.cut = chart.notes.map(() => false)
    chart.notes.forEach((n, i) => {
      if (this.active[i]) {
        this.judged.push(i)
      } else if (inRange(n.startBeat)) {
        this.ons.push({ beat: n.startBeat, pitch: n.pitch, hand: n.hand })
        this.offs.push({ beat: n.startBeat + n.durationBeats * AUTO_LENGTH, pitch: n.pitch, hand: n.hand })
      }
    })
    this.ons.sort((a, b) => a.beat - b.beat)
    this.offs.sort((a, b) => a.beat - b.beat)
    this.reset(0)
  }

  /** Bars covered by this run, 1-based inclusive. */
  get barRange(): { from: number; to: number } {
    const bpb = this.chart.beatsPerBar
    return { from: Math.floor(this.rangeStart / bpb) + 1, to: Math.max(1, Math.ceil((this.rangeEnd - 1) / bpb)) }
  }

  start(now: number): void {
    this.lastNow = now
    this.reset(0)
    this.lastNow = now
    this.state = 'running'
  }

  pause(now: number): void {
    if (this.state !== 'running') return
    this.update(now)
    if (this.state !== 'running') return
    this.state = 'paused'
    this.unschedule(now)
    this.silence(now)
  }

  /** Ends the run without finishing it: takes back scheduled sounds and releases sounding ones. */
  stop(now: number): void {
    if (this.state === 'idle' || this.state === 'finished') return
    this.state = 'finished'
    this.unschedule(now)
    this.silence(now)
  }

  /** Carries on. In timed mode the music first waits a bar while the metronome counts you back in. */
  resume(now: number): void {
    if (this.state !== 'paused') return
    this.state = 'running'
    if (this.mode === 'timed') {
      const bpb = this.chart.beatsPerBar
      this.resumeAt = now + bpb * this.secondsPerBeat
      for (let i = 0; i < bpb; i++) this.events.click?.(i === 0, now + i * this.secondsPerBeat)
      this.lastNow = this.resumeAt
    } else {
      this.lastNow = now
    }
  }

  /** Beats left of the count-in after a resume (0 when not counting). */
  resumeCount(now: number): number {
    return this.state === 'running' && now < this.resumeAt ? (this.resumeAt - now) / this.secondsPerBeat : 0
  }

  /**
   * Call once per frame with the current clock time in seconds. Sounds due within
   * `lead` seconds are emitted now, stamped with when they should be heard.
   */
  update(now: number, lead = 0): void {
    if (this.state !== 'running') return
    let dt = now - this.lastNow
    if (dt < 0) {
      dt = 0 // counting back in after a resume
    } else {
      this.lastNow = now
      if (dt > MAX_FRAME_S) dt = 0
    }

    let target = this.beat + dt / this.secondsPerBeat
    let hold = Infinity
    if (this.mode === 'wait' && this.judge) {
      const pending = this.judge.pendingGroup()
      if (pending.length) hold = this.chart.notes[this.judged[pending[0]]].startBeat
      target = Math.min(target, hold)
    }
    this.beat = target

    // Schedule what will sound within the lead time (never past where a wait will hold).
    const horizon = Math.min(hold, this.beat + Math.max(0, now + lead - this.lastNow) / this.secondsPerBeat)
    // Anything already due (after a jump, or a late frame) sounds right away.
    const timeOf = (beat: number) => Math.max(now, this.lastNow + (beat - this.beat) * this.secondsPerBeat)
    if (this.metronome) {
      const bpb = this.chart.beatsPerBar
      while (this.nextClick <= horizon + EPS && this.nextClick < this.rangeEnd - EPS) {
        const at = timeOf(this.nextClick)
        this.clickAt.push({ beat: this.nextClick, at })
        this.events.click?.((((this.nextClick % bpb) + bpb) % bpb) === 0, at)
        this.nextClick++
      }
    }
    while (this.onPos < this.ons.length && this.ons[this.onPos].beat <= horizon + EPS) {
      const e = this.ons[this.onPos]
      const at = timeOf(e.beat)
      this.onAt[this.onPos++] = at
      this.sounding.set(e.pitch, e.hand)
      this.events.autoNote?.(e.pitch, true, e.hand, at)
    }
    while (this.offPos < this.offs.length && this.offs[this.offPos].beat <= this.beat + EPS) {
      const e = this.offs[this.offPos++]
      this.sounding.delete(e.pitch)
      this.events.autoNote?.(e.pitch, false, e.hand, timeOf(e.beat))
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
        this.silence(now)
        this.events.finished?.()
      }
    }
  }

  press(pitch: number, now: number): void {
    if (this.state !== 'running' || !this.judge || now < this.resumeAt) return
    const time = this.judgeTime(this.beatAt(now))
    // Noodling during the count-in is not a mistake.
    if (this.mode === 'timed' && time < this.rangeStart * this.secondsPerBeat - GOOD_MS / 1000) return
    const result = this.judge.press(pitch, time)
    if (result.kind === 'hit') {
      const index = this.judged[result.index]
      this.noteState[index] = result.grade
      // Played before it arrived (wait mode): bring the music forward to meet the player.
      if (this.mode === 'wait' && this.chart.notes[index].startBeat > this.beat) {
        this.unschedule(this.lastNow)
        this.beat = this.chart.notes[index].startBeat
      }
      this.events.judged?.(index, result.grade, result.offsetMs)
    } else {
      this.events.wrong?.(pitch)
    }
  }

  /** A key came up: in timed mode, checks that long notes were held long enough. */
  release(pitch: number, now: number): void {
    if (this.state !== 'running' || !this.judge || this.mode !== 'timed') return
    const j = this.judge.release(pitch, this.judgeTime(this.beatAt(now)))
    if (j === null) return
    this.cut[this.judged[j]] = true
    this.events.short?.(this.judged[j])
  }

  /** Chart indexes of the notes a waiting session is holding for (empty when not waiting). */
  pendingNotes(): number[] {
    if (this.mode !== 'wait' || !this.judge) return []
    return this.judge.pendingGroup().map((j) => this.judged[j])
  }

  summary(): Summary {
    return (this.judge ?? new Judge([], 'timed')).summary()
  }

  /** The beat at the moment an input happened, usually a little before this frame. */
  private beatAt(now: number): number {
    let delta = now - this.lastNow
    if (this.mode !== 'timed' || Math.abs(delta) > MAX_FRAME_S) delta = 0
    return this.beat + delta / this.secondsPerBeat
  }

  private judgeTime(beat: number): number {
    return beat * this.secondsPerBeat - (this.mode === 'timed' ? this.latency : 0)
  }

  /** Takes back sounds scheduled for after `now`, so they are emitted again on the new timeline. */
  private unschedule(now: number): void {
    let pos = this.onPos
    while (pos > 0 && this.onAt[pos - 1] > now + EPS) pos--
    for (let i = pos; i < this.onPos; i++) this.sounding.delete(this.ons[i].pitch)
    this.onPos = pos
    while (this.clickAt.length && this.clickAt[this.clickAt.length - 1].at > now + EPS) this.nextClick = this.clickAt.pop()!.beat
    this.events.cancel?.(now)
  }

  /** Back to the start of the range; `overshoot` beats carry over when looping. */
  private reset(overshoot: number): void {
    this.unschedule(this.lastNow)
    this.silence(this.lastNow)
    this.beat = this.countIn ? this.rangeStart - this.chart.beatsPerBar : this.rangeStart + Math.max(0, overshoot)
    this.nextClick = Math.ceil(this.beat - EPS)
    this.clickAt = []
    this.onPos = 0
    this.offPos = 0
    this.onAt = []
    this.resumeAt = -Infinity
    for (const i of this.judged) {
      this.noteState[i] = 'pending'
      this.cut[i] = false
    }
    const minHold = (beats: number) =>
      this.mode === 'timed' && beats >= LONG_NOTE_BEATS - EPS ? beats * HOLD_FRACTION * this.secondsPerBeat : 0
    this.judge =
      this.mode === 'demo'
        ? null
        : new Judge(
            this.judged.map((i) => {
              const n = this.chart.notes[i]
              return { pitch: n.pitch, time: n.startBeat * this.secondsPerBeat, hand: n.hand, minHold: minHold(n.durationBeats) }
            }),
            this.mode === 'wait' ? 'pitch' : 'timed',
          )
  }

  private silence(at: number): void {
    for (const [pitch, hand] of this.sounding) this.events.autoNote?.(pitch, false, hand, at)
    this.sounding.clear()
  }
}
