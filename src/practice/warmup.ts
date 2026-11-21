import type { Chart, ChartNote } from '../core/types'

/** Keys the daily warm-up goes through, one per day: tonic pitch class and name. */
export const WARMUP_KEYS = [
  { pc: 0, name: 'C' },
  { pc: 7, name: 'G' },
  { pc: 5, name: 'F' },
  { pc: 2, name: 'D' },
] as const

const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12]

/**
 * A two-minute warm-up: the major scale up and down with both hands an octave apart,
 * then the I–IV–V–I chords (right-hand triads over a left-hand bass). The key changes
 * from day to day, so over a week the hands meet a few different shapes.
 */
export function warmupChart(day: number): { chart: Chart; key: string } {
  const key = WARMUP_KEYS[((day % WARMUP_KEYS.length) + WARMUP_KEYS.length) % WARMUP_KEYS.length]
  // Right hand from the tonic nearest above middle C; G and D start lower so the top stays in reach.
  const tonic = 60 + key.pc - (key.pc > 5 ? 12 : 0)
  const notes: ChartNote[] = []
  const scale = [...MAJOR, ...MAJOR.slice(0, -1).reverse()]
  scale.forEach((step, i) => {
    const last = i === scale.length - 1
    for (const [hand, base] of [
      ['R', tonic],
      ['L', tonic - 12],
    ] as const)
      notes.push({ pitch: base + step, startBeat: i, durationBeats: last ? 2 : 1, hand })
  })
  // I IV V I, a bar each, in close position so the hand barely moves.
  const triads = [
    [0, 4, 7],
    [0, 5, 9],
    [-1, 2, 7],
    [0, 4, 7],
  ]
  const roots = [0, 5, 7, 0]
  triads.forEach((triad, bar) => {
    const start = 16 + bar * 4
    for (const step of triad) notes.push({ pitch: tonic + step, startBeat: start, durationBeats: 4, hand: 'R' })
    const bass = tonic - 12 + roots[bar]
    notes.push({ pitch: bass > tonic - 5 ? bass - 12 : bass, startBeat: start, durationBeats: 4, hand: 'L' })
  })
  notes.sort((a, b) => a.startBeat - b.startBeat || a.pitch - b.pitch)
  return {
    key: key.name,
    chart: { id: `warmup-${key.name}`, title: `Warm-up in ${key.name} major`, bpm: 76, beatsPerBar: 4, notes, lengthBeats: 32 },
  }
}

/** Days since a fixed date, so the warm-up key follows the calendar. */
export function dayNumber(date = new Date()): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000)
}
