import { isBlack, midiToName } from '../core/pitch'
import type { Chart, Hand } from '../core/types'
import { chart } from '../curriculum/build'
import type { StatEvent } from '../progress/store'

export interface WeakNote {
  pitch: number
  hand: Hand
  attempts: number
  /** 0..1: misses count fully, "good" (slightly off the beat) hits count a little. */
  weakness: number
}

/** Only recent playing counts: old mistakes that have since been fixed should fade out. */
const RECENT = 1500
const MIN_ATTEMPTS = 4
const MIN_WEAKNESS = 0.15
const MAX_NOTES = 4
/** Generated exercises stay on the lesson keyboard, C3–C5. */
const LOW = 48
const HIGH = 72
const BPM = 72
const GOOD_WEIGHT = 0.25

/** The notes played least reliably lately, worst first. */
export function weakNotes(stats: StatEvent[]): WeakNote[] {
  const byPitch = new Map<number, { attempts: number; score: number; hands: Record<Hand, number> }>()
  for (const e of stats.slice(-RECENT)) {
    if (e.pitch < LOW || e.pitch > HIGH) continue
    const entry = byPitch.get(e.pitch) ?? { attempts: 0, score: 0, hands: { L: 0, R: 0 } }
    entry.attempts++
    entry.score += e.grade === 'miss' ? 1 : e.grade === 'good' ? GOOD_WEIGHT : 0
    entry.hands[e.hand]++
    byPitch.set(e.pitch, entry)
  }
  return [...byPitch]
    .map(([pitch, e]) => ({
      pitch,
      hand: (e.hands.L > e.hands.R ? 'L' : 'R') as Hand,
      attempts: e.attempts,
      weakness: e.score / e.attempts,
    }))
    .filter((w) => w.attempts >= MIN_ATTEMPTS && w.weakness >= MIN_WEAKNESS)
    .sort((a, b) => b.weakness - a.weakness || a.pitch - b.pitch)
    .slice(0, MAX_NOTES)
}

/** The white key a step below or above (or the neighbouring key, from a black key), kept on the keyboard. */
function neighbour(pitch: number, dir: -1 | 1): number {
  let p = pitch + dir
  if (!isBlack(pitch)) while (isBlack(p)) p += dir
  return p < LOW || p > HIGH ? neighbour(pitch, -dir as -1 | 1) : p
}

/**
 * A short exercise around the weak notes: for each, two bars that step into it from
 * either side and repeat it, in the hand that usually plays it. Null when there is
 * nothing to work on yet.
 */
export function weakSpotChart(weak: WeakNote[]): Chart | null {
  if (!weak.length) return null
  const parts: Record<Hand, string[]> = { L: [], R: [] }
  for (const w of weak) {
    const [lo, hi, n] = [neighbour(w.pitch, -1), neighbour(w.pitch, 1), w.pitch].map(midiToName)
    parts[w.hand].push(`${lo} ${n} ${hi} ${n} | ${n} ${lo} ${n}:2 |`)
    parts[w.hand === 'L' ? 'R' : 'L'].push('-:4 | -:4 |')
  }
  const line = (hand: Hand) => (parts[hand].some((p) => !p.startsWith('-')) ? parts[hand].join(' ') : undefined)
  return chart('practice', 'Weak spots', BPM, { R: line('R'), L: line('L') })
}
