import { describe, expect, it } from 'vitest'
import { chartFromMidiJson, type MidiJson } from '../src/chart/midiImport'

const note = (midi: number, ticks: number, durationTicks = 480) => ({ midi, ticks, durationTicks })
const file = (tracks: ReturnType<typeof note>[][], header: Partial<MidiJson['header']> = {}): MidiJson => ({
  header: { ppq: 480, tempos: [{ bpm: 90 }], timeSignatures: [{ timeSignature: [4, 4] }], ...header },
  tracks: tracks.map((notes) => ({ notes })),
})

describe('chartFromMidiJson', () => {
  it('converts ticks to beats and keeps the tempo and title', () => {
    const c = chartFromMidiJson(file([[note(60, 0), note(62, 480, 960), note(64, 1440, 240)]]), 'My song')
    expect(c).toMatchObject({ id: 'import', title: 'My song', bpm: 90, beatsPerBar: 4, lengthBeats: 4 })
    expect(c.notes.map((n) => [n.pitch, n.startBeat, n.durationBeats])).toEqual([
      [60, 0, 1],
      [62, 1, 2],
      [64, 3, 0.5],
    ])
  })
  it('gives the first of two tracks to the right hand and the second to the left', () => {
    const c = chartFromMidiJson(file([[], [note(48, 0)], [note(72, 0)]]), 't')
    expect(c.notes.map((n) => [n.pitch, n.hand])).toEqual([
      [48, 'R'],
      [72, 'L'],
    ])
  })
  it('splits a single track (or three or more) at middle C', () => {
    const one = chartFromMidiJson(file([[note(59, 0), note(60, 0)]]), 't')
    expect(one.notes.map((n) => n.hand)).toEqual(['L', 'R'])
    const three = chartFromMidiJson(file([[note(40, 0)], [note(70, 0)], [note(50, 480)]]), 't')
    expect(three.notes.map((n) => n.hand)).toEqual(['L', 'R', 'L'])
  })
  it('falls back to 120 bpm and 4/4 when the file says nothing', () => {
    const c = chartFromMidiJson(file([[note(60, 0)]], { tempos: [], timeSignatures: [] }), 't')
    expect(c.bpm).toBe(120)
    expect(c.beatsPerBar).toBe(4)
  })
  it('reads the time signature in quarter-note beats', () => {
    expect(chartFromMidiJson(file([[note(60, 0)]], { timeSignatures: [{ timeSignature: [3, 4] }] }), 't').beatsPerBar).toBe(3)
    expect(chartFromMidiJson(file([[note(60, 0)]], { timeSignatures: [{ timeSignature: [6, 8] }] }), 't').beatsPerBar).toBe(3)
  })
  it('drops notes that are not on a piano', () => {
    const c = chartFromMidiJson(file([[note(20, 0), note(21, 0), note(108, 480), note(109, 480)]]), 't')
    expect(c.notes.map((n) => n.pitch)).toEqual([21, 108])
  })
  it('skips leading empty bars', () => {
    const c = chartFromMidiJson(file([[note(60, 480 * 9), note(62, 480 * 10)]]), 't')
    expect(c.notes.map((n) => n.startBeat)).toEqual([1, 2])
  })
  it('collapses duplicate notes and survives odd values', () => {
    const c = chartFromMidiJson(file([[note(60, 0), note(60, 0), note(62, 480, 0)]], { tempos: [{ bpm: 0 }] }), 't')
    expect(c.notes).toHaveLength(2)
    expect(c.notes[1].durationBeats).toBeGreaterThan(0)
    expect(c.bpm).toBe(120)
  })
  it('refuses a file with no playable notes', () => {
    expect(() => chartFromMidiJson(file([[], []]), 't')).toThrow('No notes found in this file')
    expect(() => chartFromMidiJson(file([[note(5, 0)]]), 't')).toThrow('No notes found in this file')
  })
})
