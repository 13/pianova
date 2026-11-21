import { describe, expect, it } from 'vitest'
import { chartFromMidiJson, describeTracks, MAX_NOTE_BEATS, MAX_NOTES, readMidiFile, type MidiJson } from '../src/chart/midiImport'

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
  it('leaves out drum tracks', () => {
    const midi = file([[note(60, 0)], [note(38, 0)], [note(48, 0)]])
    midi.tracks[1].channel = 9
    const c = chartFromMidiJson(midi, 't')
    expect(c.notes.map((n) => [n.pitch, n.hand])).toEqual([
      [48, 'L'],
      [60, 'R'],
    ])
    expect(describeTracks(midi).map((t) => [t.instrument, t.role])).toEqual([
      ['Piano', 'R'],
      ['Drums', 'off'],
      ['Piano', 'L'],
    ])
  })
  it('in a band arrangement, plays only the piano tracks', () => {
    const midi = file([[note(72, 0)], [note(40, 0)], [note(64, 0)]])
    midi.tracks[0].instrument = { name: 'acoustic grand piano', family: 'piano' }
    midi.tracks[1].instrument = { name: 'electric bass (finger)', family: 'bass' }
    midi.tracks[2].instrument = { name: 'string ensemble 1', family: 'strings' }
    expect(describeTracks(midi).map((t) => t.role)).toEqual(['split', 'off', 'off'])
    expect(chartFromMidiJson(midi, 't').notes.map((n) => n.pitch)).toEqual([72])
  })
  it('follows the roles it is given', () => {
    const midi = file([[note(72, 0)], [note(40, 0)], [note(64, 0)]])
    const c = chartFromMidiJson(midi, 't', { 0: 'L', 1: 'off', 2: 'R' })
    expect(c.notes.map((n) => [n.pitch, n.hand])).toEqual([
      [64, 'R'],
      [72, 'L'],
    ])
    expect(() => chartFromMidiJson(midi, 't', { 0: 'off', 1: 'off', 2: 'off' })).toThrow('No notes found')
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

describe('import limits', () => {
  it('cuts a note with no end (a missing note-off) short instead of making the song endless', () => {
    const c = chartFromMidiJson(file([[note(60, 0, 0x0fffffff), note(64, 0)]]), 't')
    expect(Math.max(...c.notes.map((n) => n.durationBeats))).toBe(MAX_NOTE_BEATS)
    expect(c.lengthBeats).toBe(MAX_NOTE_BEATS)
  })
  it('refuses a song that runs on for thousands of bars', () => {
    expect(() => chartFromMidiJson(file([[note(60, 0), note(62, 480 * 100_000)]]), 't')).toThrow('too long')
  })
  it('refuses a file with more notes than anyone could learn', () => {
    const many = Array.from({ length: MAX_NOTES + 1 }, (_, i) => note(21 + (i % 88), i * 60, 60))
    expect(() => chartFromMidiJson(file([many]), 't')).toThrow('too many notes')
  })
  it('skips notes with impossible positions', () => {
    const c = chartFromMidiJson(file([[note(60, Number.NaN), note(62, -480), note(64, 0)]]), 't')
    expect(c.notes.map((n) => n.pitch)).toEqual([64])
  })
  it('rejects an oversized file before reading it', async () => {
    const big = { size: 50 * 1024 * 1024, name: 'huge.mid', arrayBuffer: () => { throw new Error('should not be read') } } as unknown as File
    await expect(readMidiFile(big)).rejects.toThrow('too big')
  })
})
