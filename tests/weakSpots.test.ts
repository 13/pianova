import { describe, expect, it } from 'vitest'
import type { Grade } from '../src/judge/judge'
import { weakNotes, weakSpotChart } from '../src/practice/weakSpots'
import type { StatEvent } from '../src/progress/store'

const ev = (pitch: number, grade: Grade, hand: 'L' | 'R' = 'R'): StatEvent => ({ id: 'x', pitch, hand, grade, offsetMs: 0, at: 0 })
const times = (count: number, e: StatEvent) => Array.from({ length: count }, () => e)

describe('weakNotes', () => {
  it('ranks notes by how often they go wrong', () => {
    const stats = [
      ...times(6, ev(60, 'perfect')),
      ...times(3, ev(64, 'miss')),
      ...times(3, ev(64, 'perfect')),
      ...times(4, ev(62, 'miss')),
      ...times(1, ev(62, 'perfect')),
    ]
    expect(weakNotes(stats).map((w) => [w.pitch, w.weakness])).toEqual([
      [62, 0.8],
      [64, 0.5],
    ])
  })
  it('needs a few attempts before calling a note weak', () => {
    expect(weakNotes(times(3, ev(60, 'miss')))).toEqual([])
  })
  it('counts slightly-off hits a little, and ignores notes off the lesson keyboard', () => {
    expect(weakNotes(times(4, ev(60, 'good')))[0].weakness).toBe(0.25)
    expect(weakNotes(times(8, ev(90, 'miss')))).toEqual([])
  })
  it('remembers which hand plays the note', () => {
    expect(weakNotes([...times(5, ev(48, 'miss', 'L')), ev(48, 'miss', 'R')])[0].hand).toBe('L')
  })
})

describe('weakSpotChart', () => {
  it('is null when there is nothing to work on', () => {
    expect(weakSpotChart([])).toBeNull()
  })
  it('steps into each weak note from both sides, in its own hand', () => {
    const c = weakSpotChart([
      { pitch: 64, hand: 'R', attempts: 5, weakness: 1 },
      { pitch: 48, hand: 'L', attempts: 5, weakness: 1 },
    ])!
    const right = c.notes.filter((n) => n.hand === 'R').map((n) => n.pitch)
    const left = c.notes.filter((n) => n.hand === 'L').map((n) => [n.pitch, n.startBeat])
    expect(right).toEqual([62, 64, 65, 64, 64, 62, 64])
    // C3 is the bottom of the keyboard, so it is approached from D3 on both sides.
    expect(left[0]).toEqual([50, 8])
    expect(left.every(([p]) => p >= 48 && p <= 72)).toBe(true)
    expect(c.lengthBeats).toBe(16)
  })
  it('steps by semitone around a black key', () => {
    const c = weakSpotChart([{ pitch: 66, hand: 'R', attempts: 5, weakness: 1 }])!
    expect(c.notes.slice(0, 3).map((n) => n.pitch)).toEqual([65, 66, 67])
  })
})
