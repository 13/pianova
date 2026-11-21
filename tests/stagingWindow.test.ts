import { describe, expect, it } from 'vitest'
import { isBlack } from '../src/core/pitch'
import type { Chart, ChartNote, Hand } from '../src/core/types'
import { focusRange, handZones } from '../src/render/staging'

/** The plain whole-chart scans the windowed helpers must agree with. */
function bruteUpcoming(chart: Chart, beat: number, window: number, hand?: Hand): number[] {
  return chart.notes.filter((n) => (!hand || n.hand === hand) && n.startBeat + n.durationBeats > beat && n.startBeat < beat + window).map((n) => n.pitch)
}

function bruteZone(chart: Chart, beat: number, window: number, hand: Hand) {
  const p = bruteUpcoming(chart, beat, window, hand)
  if (!p.length) return undefined
  let lo = Math.min(...p)
  let hi = Math.max(...p)
  const whites = () => {
    let c = 0
    for (let x = lo; x <= hi; x++) if (!isBlack(x)) c++
    return c
  }
  for (let down = true; whites() < 5; down = !down) {
    if (down) do lo--; while (isBlack(lo))
    else do hi++; while (isBlack(hi))
  }
  return { lo, hi }
}

describe('windowed staging helpers', () => {
  it('match a whole-chart scan, long notes and unsorted charts included', () => {
    let seed = 7
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
    for (let c = 0; c < 20; c++) {
      const notes: ChartNote[] = Array.from({ length: 60 }, () => ({
        pitch: 40 + Math.floor(rand() * 40),
        startBeat: Math.floor(rand() * 64) / 2,
        durationBeats: rand() < 0.1 ? 4 + rand() * 8 : 0.5 + rand(),
        hand: rand() < 0.5 ? 'L' : 'R',
      }))
      if (c % 2) notes.sort((a, b) => a.startBeat - b.startBeat)
      const chart: Chart = { id: 'r', title: 'R', bpm: 100, beatsPerBar: 4, notes, lengthBeats: 40 }
      const out = {}
      for (let beat = -2; beat < 40; beat += 0.75) {
        const p = bruteUpcoming(chart, beat, 6.4)
        expect(focusRange(chart, beat, 6.4)).toEqual(p.length ? { lo: Math.min(...p), hi: Math.max(...p) } : null)
        const zones = handZones(chart, beat, 4, out)
        for (const hand of ['L', 'R'] as Hand[]) expect(zones[hand]).toEqual(bruteZone(chart, beat, 4, hand))
      }
    }
  })
})
