import { describe, expect, it } from 'vitest'
import { nameToMidi as m } from '../src/core/pitch'
import type { Chart, ChartNote } from '../src/core/types'
import { chordGroups, chordName, focusRange, handZones, streakMilestone, timingLabel } from '../src/render/staging'

const chart = (notes: ChartNote[]): Chart => ({ id: 't', title: 'T', bpm: 100, beatsPerBar: 4, notes, lengthBeats: 16 })
const note = (name: string, startBeat: number, hand: 'L' | 'R' = 'R', durationBeats = 1): ChartNote => ({
  pitch: m(name),
  startBeat,
  durationBeats,
  hand,
})

describe('chordName', () => {
  it('names triads in root position', () => {
    expect(chordName([m('C4'), m('E4'), m('G4')])).toBe('C')
    expect(chordName([m('A3'), m('C4'), m('E4')])).toBe('Am')
    expect(chordName([m('B3'), m('D4'), m('F4')])).toBe('Bdim')
    expect(chordName([m('C4'), m('E4'), m('G#4')])).toBe('C+')
  })
  it('names inversions with the bass note', () => {
    expect(chordName([m('E4'), m('G4'), m('C5')])).toBe('C/E')
    expect(chordName([m('G3'), m('C4'), m('E4')])).toBe('C/G')
  })
  it('names sevenths, suspensions and power chords', () => {
    expect(chordName([m('G3'), m('B3'), m('D4'), m('F4')])).toBe('G7')
    expect(chordName([m('C4'), m('E4'), m('G4'), m('B4')])).toBe('Cmaj7')
    expect(chordName([m('D4'), m('F4'), m('A4'), m('C5')])).toBe('Dm7')
    expect(chordName([m('C4'), m('F4'), m('G4')])).toBe('Csus4')
    expect(chordName([m('C3'), m('G3')])).toBe('C5')
  })
  it('ignores doubled notes', () => {
    expect(chordName([m('C3'), m('C4'), m('E4'), m('G4'), m('C5')])).toBe('C')
  })
  it('gives nothing for shapes it does not know', () => {
    expect(chordName([m('C4'), m('D4')])).toBeNull()
    expect(chordName([m('C4'), m('C5')])).toBeNull()
    expect(chordName([m('C4')])).toBeNull()
  })
})

describe('chordGroups', () => {
  it('groups notes of one hand that start together', () => {
    const c = chart([note('C4', 0), note('E4', 0), note('G4', 0), note('C3', 0, 'L'), note('D4', 1), note('F4', 2), note('A4', 2)])
    const groups = chordGroups(c)
    expect(groups).toHaveLength(2)
    expect(groups[0]).toMatchObject({ startBeat: 0, hand: 'R', name: 'C', lo: m('C4'), hi: m('G4') })
    expect(groups[0].notes).toEqual([0, 1, 2])
    expect(groups[1]).toMatchObject({ startBeat: 2, hand: 'R', name: null, lo: m('F4'), hi: m('A4') })
  })
})

describe('handZones', () => {
  it('spans the notes each hand plays soon, at least a five-finger reach', () => {
    const c = chart([note('C4', 0), note('E4', 1), note('G4', 2), note('C3', 0, 'L'), note('C5', 20)])
    const zones = handZones(c, 0, 4)
    expect(zones.R).toEqual({ lo: m('C4'), hi: m('G4') })
    // A single note still gets a hand-sized zone, five white keys centred on it.
    expect(zones.L).toEqual({ lo: m('A2'), hi: m('E3') })
  })
  it('leaves out hands with nothing coming up', () => {
    const c = chart([note('C4', 0), note('C3', 0, 'L')])
    expect(handZones(c, 3, 4)).toEqual({})
  })
})

describe('focusRange', () => {
  it('covers the upcoming notes with some keys spare', () => {
    const c = chart([note('C4', 0), note('G4', 2), note('C2', 30, 'L')])
    const r = focusRange(c, 0, 6)
    expect(r).not.toBeNull()
    expect(r!.lo).toBe(m('C4'))
    expect(r!.hi).toBe(m('G4'))
  })
  it('is null when nothing is coming', () => {
    expect(focusRange(chart([note('C4', 0)]), 5, 6)).toBeNull()
  })
})

describe('streakMilestone', () => {
  it('fires when a milestone is reached', () => {
    expect(streakMilestone(9, 10)).toBe(10)
    expect(streakMilestone(24, 25)).toBe(25)
    expect(streakMilestone(49, 50)).toBe(50)
    expect(streakMilestone(149, 150)).toBe(150)
  })
  it('stays quiet otherwise', () => {
    expect(streakMilestone(10, 11)).toBeNull()
    expect(streakMilestone(10, 0)).toBeNull()
    expect(streakMilestone(10, 10)).toBeNull()
  })
})

describe('timingLabel', () => {
  it('reads the timing of a hit', () => {
    expect(timingLabel('perfect', 10, true)).toEqual({ text: 'Perfect', tone: 'ok' })
    expect(timingLabel('good', -80, true)).toEqual({ text: 'Early', tone: 'warn' })
    expect(timingLabel('good', 80, true)).toEqual({ text: 'Late', tone: 'warn' })
    expect(timingLabel('miss', 0, true)).toEqual({ text: 'Miss', tone: 'bad' })
  })
  it('does not judge timing when the music waits', () => {
    expect(timingLabel('perfect', 300, false)).toEqual({ text: 'Nice', tone: 'ok' })
    expect(timingLabel('good', 300, false)).toEqual({ text: 'Nice', tone: 'ok' })
  })
})
