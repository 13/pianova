import { describe, expect, it } from 'vitest'
import { noteIndex, noteSpan } from '../src/chart/window'
import type { Chart, ChartNote } from '../src/core/types'
import { LESSONS, PIECES } from '../src/curriculum'

const note = (startBeat: number, durationBeats = 1, pitch = 60): ChartNote => ({ pitch, startBeat, durationBeats, hand: 'R' })
const chart = (notes: ChartNote[]): Chart => ({ id: 't', title: 't', bpm: 120, beatsPerBar: 4, notes, lengthBeats: 64 })

/** Every note overlapping [from, to], by brute force. */
const brute = (c: Chart, from: number, to: number) =>
  c.notes.flatMap((n, i) => (n.startBeat <= to && n.startBeat + n.durationBeats >= from ? [i] : []))
const viaSpan = (c: Chart, from: number, to: number) => {
  const { order } = noteIndex(c)
  const { lo, hi } = noteSpan(c, from, to)
  return [...order.slice(lo, hi)].filter((i) => brute(c, from, to).includes(i)).sort((a, b) => a - b)
}

describe('noteSpan', () => {
  it('finds exactly the notes a brute-force scan finds', () => {
    const c = chart([note(0, 8), note(1), note(2, 0.5), note(2, 3), note(9), note(12, 0.25), note(20, 1)])
    for (let from = -2; from < 24; from += 0.5) {
      for (const len of [0, 1, 4, 8]) expect(viaSpan(c, from, from + len)).toEqual(brute(c, from, from + len))
    }
  })

  it('handles notes out of start order', () => {
    const c = chart([note(10), note(0), note(5, 6), note(3)])
    expect(viaSpan(c, 6, 7)).toEqual(brute(c, 6, 7))
    expect([...noteIndex(c).starts]).toEqual([0, 3, 5, 10])
  })

  it('is empty for an empty chart', () => {
    expect(noteSpan(chart([]), 0, 8)).toEqual({ lo: 0, hi: 0 })
  })

  it('agrees with a full scan on every built-in chart', () => {
    const charts = [...PIECES.map((p) => p.chart), ...LESSONS.flatMap((l) => l.steps.flatMap((s) => ('chart' in s && s.chart ? [s.chart as Chart] : [])))]
    expect(charts.length).toBeGreaterThan(5)
    for (const c of charts) {
      for (let from = -1; from < c.lengthBeats; from += 1.5) expect(viaSpan(c, from, from + 8)).toEqual(brute(c, from, from + 8))
    }
  })
})
