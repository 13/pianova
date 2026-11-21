import { describe, expect, it } from 'vitest'
import { arrange } from '../src/chart/difficulty'
import { chordAt, chordMarks, songHarmony } from '../src/chart/harmony'
import { songSections } from '../src/chart/sections'
import type { Chart } from '../src/core/types'
import { PIECES } from '../src/curriculum'

const piece = (id: string) => PIECES.find((p) => p.id === id)!.chart

describe('chord names', () => {
  it('names the chords of a song where each starts, in order', () => {
    const marks = chordMarks(piece('jingle-bells'))
    expect(marks.length).toBeGreaterThan(2)
    expect(marks[0]).toEqual({ name: 'C', startBeat: 0 })
    expect(marks.every((m, i) => i === 0 || m.startBeat > marks[i - 1].startBeat)).toBe(true)
  })
  it('keeps showing the real harmony when a level leaves notes out', () => {
    const chart = piece('jingle-bells')
    const sections = songSections(chart)
    const { chart: easy } = arrange(chart, sections, sections.map(() => 1))
    expect(chordMarks(easy)).toEqual(chordMarks(chart))
  })
  it("hears an imported file's bass and other instruments, but not its drums", () => {
    // A tune of nothing but G, over an E-minor bass and strings.
    const chart: Chart = {
      id: 't',
      title: 't',
      bpm: 100,
      beatsPerBar: 4,
      lengthBeats: 4,
      notes: [0, 1, 2, 3].map((b) => ({ pitch: 67, startBeat: b, durationBeats: 1, hand: 'R' as const })),
      backing: [
        { pitch: 40, startBeat: 0, durationBeats: 4, voice: 'bass', velocity: 0.8 },
        { pitch: 59, startBeat: 0, durationBeats: 4, voice: 'strings', velocity: 0.5 },
        { pitch: 38, startBeat: 0, durationBeats: 0.25, voice: 'drums', velocity: 1 },
      ],
    }
    expect(songHarmony(chart).map((s) => [s.root, s.minor])).toEqual([[4, true]])
  })
  it('finds the chord sounding at a beat', () => {
    const marks = [{ startBeat: 0 }, { startBeat: 2 }, { startBeat: 4 }]
    expect([-1, 0, 1.9, 2, 3, 4, 9].map((b) => chordAt(marks, b))).toEqual([-1, 0, 0, 1, 1, 2, 2])
    expect(chordAt([], 3)).toBe(-1)
  })
})
