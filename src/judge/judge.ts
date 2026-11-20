import type { Hand } from '../core/types'

export type Grade = 'perfect' | 'good' | 'miss'

export interface JudgeNote {
  pitch: number
  /** Note start in seconds. */
  time: number
  hand: Hand
  /** Seconds the key must stay down to count as held (long notes); 0 or absent = any length. */
  minHold?: number
}

export type PressResult =
  | { kind: 'hit'; index: number; grade: Grade; offsetMs: number }
  | { kind: 'wrong'; pitch: number }

export interface Summary {
  total: number
  perfect: number
  good: number
  miss: number
  wrong: number
  /** Long notes let go of too soon. */
  short: number
  /** 0..1: weighted hits / (notes + wrong presses). */
  accuracy: number
  /** The same measure over only what has been judged so far (equals `accuracy` once done). */
  soFar: number
  streak: number
  bestStreak: number
  /** Mean timing offset of hits in ms; negative means early. */
  meanOffsetMs: number
  /** pitch → number of times it was missed. */
  missedPitches: Record<number, number>
}

export const PERFECT_MS = 50
export const GOOD_MS = 120
/** Score per note in tenths (perfect 1.0, good 0.7); integers keep pass marks exact. */
const TENTHS: Record<Grade, number> = { perfect: 10, good: 7, miss: 0 }
/** A long note released too soon is worth at most half. */
const SHORT_TENTHS = 5
/** Notes starting within this many seconds of each other form one chord. */
const GROUP_EPS = 1e-6

/**
 * Decides whether each key press hits a note. Pure: time is passed in.
 *  - 'timed': a press hits the nearest unjudged note of that pitch within ±120 ms.
 *  - 'pitch': time is ignored; only the next note (or chord) in order can be hit.
 */
export class Judge {
  private grades: (Grade | undefined)[]
  private shorts: boolean[]
  /** pitch → index of the hit note that key is holding. */
  private holding = new Map<number, number>()
  private offsets: number[] = []
  private wrong = 0
  private streak = 0
  private bestStreak = 0

  constructor(
    private notes: JudgeNote[],
    private mode: 'timed' | 'pitch',
  ) {
    this.grades = notes.map(() => undefined)
    this.shorts = notes.map(() => false)
  }

  press(pitch: number, time: number): PressResult {
    return this.mode === 'pitch' ? this.pressPitch(pitch) : this.pressTimed(pitch, time)
  }

  private pressTimed(pitch: number, time: number): PressResult {
    let best = -1
    let bestOffset = Infinity
    for (let i = 0; i < this.notes.length; i++) {
      const note = this.notes[i]
      if (note.pitch !== pitch || this.grades[i] !== undefined) continue
      const offsetMs = Math.round((time - note.time) * 1e6) / 1e3
      if (Math.abs(offsetMs) <= GOOD_MS && Math.abs(offsetMs) < Math.abs(bestOffset)) {
        best = i
        bestOffset = offsetMs
      }
    }
    if (best < 0) return this.markWrong(pitch)
    const grade: Grade = Math.abs(bestOffset) <= PERFECT_MS ? 'perfect' : 'good'
    this.markHit(best, grade)
    this.holding.set(pitch, best)
    this.offsets.push(bestOffset)
    return { kind: 'hit', index: best, grade, offsetMs: bestOffset }
  }

  private pressPitch(pitch: number): PressResult {
    const index = this.pendingGroup().find((i) => this.notes[i].pitch === pitch)
    if (index === undefined) return this.markWrong(pitch)
    this.markHit(index, 'perfect')
    return { kind: 'hit', index, grade: 'perfect', offsetMs: 0 }
  }

  /**
   * Timed mode: a key came up. If it was holding a long note that needed to be held
   * longer, that note is marked short; returns its index, otherwise null.
   */
  release(pitch: number, time: number): number | null {
    const index = this.holding.get(pitch)
    if (index === undefined) return null
    this.holding.delete(pitch)
    const note = this.notes[index]
    if (!note.minHold || time >= note.time + note.minHold) return null
    this.shorts[index] = true
    return index
  }

  private markHit(index: number, grade: Grade): void {
    this.grades[index] = grade
    this.streak++
    this.bestStreak = Math.max(this.bestStreak, this.streak)
  }

  private markWrong(pitch: number): PressResult {
    this.wrong++
    this.streak = 0
    return { kind: 'wrong', pitch }
  }

  /** Timed mode: marks notes whose window has passed as missed; returns their indexes. */
  advance(time: number): number[] {
    if (this.mode === 'pitch') return []
    const missed: number[] = []
    for (let i = 0; i < this.notes.length; i++) {
      if (this.grades[i] === undefined && time > this.notes[i].time + GOOD_MS / 1000) {
        this.grades[i] = 'miss'
        missed.push(i)
      }
    }
    if (missed.length) this.streak = 0
    return missed
  }

  /** Unjudged notes of the earliest unfinished start time (the chord to play next). */
  pendingGroup(): number[] {
    const first = this.grades.findIndex((g) => g === undefined)
    if (first < 0) return []
    const time = this.notes[first].time
    const group: number[] = []
    for (let i = first; i < this.notes.length; i++) {
      if (Math.abs(this.notes[i].time - time) > GROUP_EPS) continue
      if (this.grades[i] === undefined) group.push(i)
    }
    return group
  }

  done(): boolean {
    return this.grades.every((g) => g !== undefined)
  }

  summary(): Summary {
    const s: Summary = {
      total: this.notes.length,
      perfect: 0,
      good: 0,
      miss: 0,
      wrong: this.wrong,
      short: this.shorts.filter(Boolean).length,
      accuracy: 0,
      soFar: 0,
      streak: this.streak,
      bestStreak: this.bestStreak,
      meanOffsetMs: this.offsets.length ? this.offsets.reduce((a, b) => a + b, 0) / this.offsets.length : 0,
      missedPitches: {},
    }
    // A chord scores as its weakest member; unjudged notes count as 0 in the final score.
    const key = (i: number) => Math.round(this.notes[i].time / GROUP_EPS)
    const worth = (i: number) => {
      const g = this.grades[i]
      return g ? Math.min(TENTHS[g], this.shorts[i] ? SHORT_TENTHS : 10) : 0
    }
    const groupMin = new Map<number, number>()
    const judgedMin = new Map<number, number>()
    this.grades.forEach((g, i) => {
      if (g) s[g]++
      if (g === 'miss') s.missedPitches[this.notes[i].pitch] = (s.missedPitches[this.notes[i].pitch] ?? 0) + 1
      groupMin.set(key(i), Math.min(groupMin.get(key(i)) ?? 10, worth(i)))
      if (g) judgedMin.set(key(i), Math.min(judgedMin.get(key(i)) ?? 10, worth(i)))
    })
    let score = 0
    let judgedScore = 0
    let judged = 0
    this.notes.forEach((_, i) => {
      score += groupMin.get(key(i)) ?? 0
      if (this.grades[i]) {
        judgedScore += judgedMin.get(key(i)) ?? 0
        judged++
      }
    })
    s.accuracy = s.total ? score / (10 * (s.total + s.wrong)) : 0
    s.soFar = judged + s.wrong ? judgedScore / (10 * (judged + s.wrong)) : 0
    return s
  }
}

/** 0 below the pass mark, then 1 / 2 (≥ 0.90) / 3 (≥ 0.97). */
export function starsFor(accuracy: number, pass = 0.8): 0 | 1 | 2 | 3 {
  if (accuracy < pass) return 0
  if (accuracy >= 0.97) return 3
  if (accuracy >= 0.9) return 2
  return 1
}
