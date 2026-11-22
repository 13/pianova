import { describe, expect, it } from 'vitest'
import { splitHands } from '../src/chart/hands'

/** Chords in order, one beat apart (or at the beats given). */
const chords = (cs: number[][], beats?: number[]) => cs.flatMap((ps, i) => ps.map((pitch) => ({ pitch, start: beats?.[i] ?? i })))
const hands = (cs: number[][], beats?: number[]) => splitHands(chords(cs, beats)).join('')

describe('splitHands', () => {
  it('gives a left hand that plays bass then chord its chords, even above middle C', () => {
    // F3 | A♭3 C4 | F3 | A♭3 C4 | B♭3 | D4 F4 | B♭3 | D4 F4
    expect(hands([[53], [56, 60], [53], [56, 60], [58], [62, 65], [58], [62, 65]])).toBe('LLLLLLLLLLLL')
  })
  it('keeps the tune above the accompaniment in the right hand', () => {
    // Tune A♭4 C5 G4 A♭4 over F3 | A♭3 C4, in eighths.
    expect(hands([[53, 68], [72], [56, 60, 67], [68]], [0, 0.5, 1, 1.5])).toBe('LR' + 'R' + 'LLR' + 'R')
  })
  it('shares a chord the same way where it comes back with the tune resting', () => {
    // D4 F4 under a busy tune on B♭4 (clearly the left hand's), then again with the tune resting.
    const busy = [[58, 70], [70], [62, 65], [70], [58], [69], [62, 65, 67], [65]]
    const resting = [[53, 68], [72], [56, 60, 67], [68], [53, 65], [67], [56, 60, 63], [62], [58], [], [62, 65], [], [58], [], [62, 65]]
    const cs = [...busy, ...resting].filter((c) => c.length)
    const result = splitHands(chords(cs, cs.map((_, i) => i / 2)))
    const pitches = chords(cs, cs.map((_, i) => i / 2))
    // Every D4 and F4 struck together is the left hand's.
    pitches.forEach((n, i) => {
      const together = pitches.filter((m) => m.start === n.start).map((m) => m.pitch)
      if (together.join() === '62,65') expect(result[i]).toBe('L')
    })
  })
  it('keeps hands apart: wide chords split, low notes left, high notes right', () => {
    expect(hands([[36, 43, 76, 79]])).toBe('LLRR')
    expect(hands([[40], [84]])).toBe('LR')
  })
  it('handles nothing and lone notes', () => {
    expect(splitHands([])).toEqual([])
    expect(hands([[60]])).toHaveLength(1)
  })
})
