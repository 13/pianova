import { describe, expect, it } from 'vitest'
import { compileChart } from '../src/chart/notation'
import { isBlack, midiToName, nameToMidi } from '../src/core/pitch'

const base = { id: 't', title: 'T', bpm: 100 }

describe('pitch names', () => {
  it('converts names to MIDI numbers', () => {
    expect(nameToMidi('C4')).toBe(60)
    expect(nameToMidi('F#3')).toBe(54)
    expect(nameToMidi('Bb3')).toBe(58)
    expect(nameToMidi('A0')).toBe(21)
  })
  it('converts MIDI numbers to sharp names', () => {
    expect(midiToName(60)).toBe('C4')
    expect(midiToName(58)).toBe('A#3')
  })
  it('knows black keys', () => {
    expect(isBlack(61)).toBe(true)
    expect(isBlack(60)).toBe(false)
  })
  it('rejects nonsense', () => {
    expect(() => nameToMidi('H9')).toThrow(/H9/)
  })
})

describe('compileChart', () => {
  it('places notes, rests, durations and fingers', () => {
    const c = compileChart({ ...base, R: 'C4 D4:2 -:1 E4/3' })
    expect(c.notes.map((n) => n.startBeat)).toEqual([0, 1, 4])
    expect(c.notes.map((n) => n.durationBeats)).toEqual([1, 2, 1])
    expect(c.notes[2].finger).toBe(3)
    expect(c.notes[0].finger).toBeUndefined()
    expect(c.notes.every((n) => n.hand === 'R')).toBe(true)
  })
  it('supports finger with duration and fractional beats', () => {
    const c = compileChart({ ...base, R: 'C4/1:0.5 D4/2:0.5' })
    expect(c.notes[1]).toMatchObject({ pitch: 62, startBeat: 0.5, durationBeats: 0.5, finger: 2 })
  })
  it('compiles chords to simultaneous notes', () => {
    const c = compileChart({ ...base, L: '[C3/5 E3/3 G3/1]:2 C3' })
    expect(c.notes.slice(0, 3).map((n) => [n.pitch, n.startBeat, n.durationBeats, n.finger])).toEqual([
      [48, 0, 2, 5],
      [52, 0, 2, 3],
      [55, 0, 2, 1],
    ])
    expect(c.notes[3].startBeat).toBe(2)
  })
  it('merges both hands sorted by beat then pitch and ignores bar lines', () => {
    const c = compileChart({ ...base, R: 'E4 | G4', L: 'C3:2 |' })
    expect(c.notes.map((n) => [n.hand, n.pitch, n.startBeat])).toEqual([
      ['L', 48, 0],
      ['R', 64, 0],
      ['R', 67, 1],
    ])
  })
  it('rounds length up to a whole bar and defaults to 4/4', () => {
    const c = compileChart({ ...base, R: 'C4 C4 C4 C4 C4' })
    expect(c.beatsPerBar).toBe(4)
    expect(c.lengthBeats).toBe(8)
    expect(compileChart({ ...base, beatsPerBar: 3, R: 'C4 C4 C4 C4' }).lengthBeats).toBe(6)
  })
  it('names the bad token', () => {
    expect(() => compileChart({ ...base, R: 'C4 H9 D4' })).toThrow(/H9/)
    expect(() => compileChart({ ...base, R: 'C4/7' })).toThrow(/C4\/7/)
    expect(() => compileChart({ ...base, R: '[C4 E4' })).toThrow()
  })
})
