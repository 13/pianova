import type { Chart, ChartNote, Hand } from '../core/types'

/**
 * Moves music that runs off the ends of a smaller keyboard back onto it. Each hand is
 * first shifted by whole octaves as a block, so its tune keeps its shape; any notes still
 * out of reach are then folded in an octave at a time. Doubled notes that result are dropped.
 */
export function fitToRange(chart: Chart, lo: number, hi: number): Chart {
  if (chart.notes.every((n) => n.pitch >= lo && n.pitch <= hi)) return chart
  const shift: Record<Hand, number> = { L: 0, R: 0 }
  for (const hand of ['L', 'R'] as Hand[]) {
    const pitches = chart.notes.filter((n) => n.hand === hand).map((n) => n.pitch)
    let best = Infinity
    for (const s of [0, -12, 12, -24, 24, -36, 36]) {
      const out = pitches.filter((p) => p + s < lo || p + s > hi).length
      if (out < best) {
        best = out
        shift[hand] = s
      }
    }
  }
  const seen = new Set<string>()
  const notes: ChartNote[] = []
  for (const n of chart.notes) {
    let pitch = n.pitch + shift[n.hand]
    while (pitch < lo) pitch += 12
    while (pitch > hi) pitch -= 12
    const key = `${n.hand}|${pitch}|${n.startBeat}`
    if (seen.has(key)) continue
    seen.add(key)
    notes.push({ ...n, pitch })
  }
  notes.sort((a, b) => a.startBeat - b.startBeat || a.pitch - b.pitch)
  return { ...chart, notes }
}
