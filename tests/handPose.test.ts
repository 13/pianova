import { describe, expect, it } from 'vitest'
import { handPose } from '../src/practice/handPose'
import type { Chart, ChartNote, Finger, Hand } from '../src/core/types'

const note = (pitch: number, startBeat: number, finger: Finger, hand: Hand = 'R', durationBeats = 1): ChartNote => ({ pitch, startBeat, durationBeats, hand, finger })
const chart = (notes: ChartNote[]): Chart => ({ id: 't', title: 't', bpm: 100, beatsPerBar: 4, notes, lengthBeats: 16 })

describe('handPose', () => {
  it('puts the finger for the next note on its key and the others on the white keys beside it', () => {
    // E4 with finger 3: a C position, thumb on C4.
    const pose = handPose(chart([note(64, 1, 3)]), 'R', 0)!
    expect(pose.pitches).toEqual([60, 62, 64, 65, 67])
    expect(pose.placed).toEqual([false, false, true, false, false])
    expect(pose.states).toEqual(['', '', 'next', '', ''])
  })

  it('rests a free finger on the key it plays next, e.g. the thumb on C in F major', () => {
    // Left hand F major: 5 F3, 4 G3, 3 A3, 2 Bb3, 1 C4, one after another.
    const c = chart([note(53, 1, 5, 'L'), note(55, 2, 4, 'L'), note(57, 3, 3, 'L'), note(58, 4, 2, 'L'), note(60, 4.5, 1, 'L')])
    const pose = handPose(c, 'L', 3.5, ['perfect', 'perfect', 'perfect', 'pending', 'pending'])!
    expect(pose.pitches).toEqual([60, 58, 57, 55, 53])
    expect(pose.source).toEqual(['ahead', 'play', 'play', 'guess', 'guess']) // A3 still sounds
  })

  it('guesses a free finger onto the music\'s scale, not just the next white key', () => {
    // F major (with B flat) in the right hand; finger 5 never plays: it rests on C, not B.
    const c = chart([65, 67, 69, 70, 72, 74, 76].map((p, i) => note(p, 8 + i, 1)).concat([note(65, 1, 1), note(67, 2, 2), note(69, 3, 3), note(70, 4, 4)]))
    const pose = handPose(c, 'R', 0.5)!
    expect(pose.pitches).toEqual([65, 67, 69, 70, 72])
  })

  it('mirrors the left hand: its thumb is the highest finger', () => {
    // C3 with finger 5 in the left hand: thumb on G3.
    const pose = handPose(chart([note(48, 1, 5, 'L')]), 'L', 0)!
    expect(pose.pitches).toEqual([55, 53, 52, 50, 48])
  })

  it('marks a note due now, and a whole chord at once', () => {
    const pose = handPose(chart([note(60, 2, 1), note(64, 2, 3), note(67, 2, 5)]), 'R', 1.9)!
    expect(pose.pitches).toEqual([60, 62, 64, 65, 67])
    expect(pose.states).toEqual(['now', '', 'now', '', 'now'])
  })

  it('keeps a held note under its finger while the next one comes', () => {
    const c = chart([note(60, 0, 1, 'R', 4), note(67, 2, 5)])
    const pose = handPose(c, 'R', 1, ['perfect', 'pending'])!
    expect(pose.pitches[0]).toBe(60)
    expect(pose.pitches[4]).toBe(67)
    expect(pose.states).toEqual(['hold', '', '', '', 'next'])
  })

  it('moves on once a note is played, and rests when nothing is coming', () => {
    const c = chart([note(60, 0, 1), note(62, 1, 2)])
    expect(handPose(c, 'R', 0.5, ['perfect', 'pending'])!.states[1]).toBe('next')
    expect(handPose(c, 'R', 10, ['perfect', 'perfect'])).toBeNull()
    expect(handPose(c, 'L', 0)).toBeNull()
  })

  it('ignores notes the app plays for the player', () => {
    expect(handPose(chart([note(60, 1, 1)]), 'R', 0, undefined, [false])).toBeNull()
  })

  it('stays on the keyboard at its ends', () => {
    const pose = handPose(chart([note(21, 1, 1)]), 'L', 0, undefined, undefined, { lo: 21, hi: 108 })
    expect(pose).toBeNull() // a right-hand finger 1 note is not the left hand's
    const left = handPose(chart([note(23, 1, 1, 'L')]), 'L', 0, undefined, undefined, { lo: 21, hi: 108 })!
    expect(Math.min(...left.pitches)).toBeGreaterThanOrEqual(21)
  })
})
