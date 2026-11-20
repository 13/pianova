import { describe, expect, it } from 'vitest'
import { Judge, starsFor, type JudgeNote } from '../src/judge/judge'

const n = (pitch: number, time: number): JudgeNote => ({ pitch, time, hand: 'R' })
const four = () => [n(60, 1), n(62, 2), n(64, 3), n(65, 4)]

describe('Judge, timed', () => {
  it('grades by distance from the note start', () => {
    const j = new Judge(four(), 'timed')
    expect(j.press(60, 1.04)).toEqual({ kind: 'hit', index: 0, grade: 'perfect', offsetMs: 40 })
    expect(j.press(62, 1.9)).toMatchObject({ kind: 'hit', index: 1, grade: 'good', offsetMs: -100 })
    expect(j.press(64, 3.13)).toEqual({ kind: 'wrong', pitch: 64 })
  })
  it('treats the window edges as inside', () => {
    const j = new Judge(four(), 'timed')
    expect(j.press(60, 1.05)).toMatchObject({ grade: 'perfect' })
    expect(j.press(62, 2.12)).toMatchObject({ grade: 'good' })
  })
  it('calls a press of the wrong pitch wrong', () => {
    const j = new Judge(four(), 'timed')
    expect(j.press(61, 1)).toEqual({ kind: 'wrong', pitch: 61 })
  })
  it('marks a note missed once, after its window has passed', () => {
    const j = new Judge(four(), 'timed')
    expect(j.advance(1.1)).toEqual([])
    expect(j.advance(1.13)).toEqual([0])
    expect(j.advance(1.2)).toEqual([])
    expect(j.press(60, 1.1)).toEqual({ kind: 'wrong', pitch: 60 })
  })
  it('gives each of two close same-pitch notes its own press', () => {
    const j = new Judge([n(60, 1), n(60, 1.1)], 'timed')
    expect(j.press(60, 1.0)).toMatchObject({ kind: 'hit', index: 0 })
    expect(j.press(60, 1.1)).toMatchObject({ kind: 'hit', index: 1 })
    expect(j.press(60, 1.12)).toEqual({ kind: 'wrong', pitch: 60 })
  })
  it('scores accuracy as weighted hits over notes plus wrong presses', () => {
    const j = new Judge(four(), 'timed')
    j.press(60, 1)
    j.press(62, 2)
    j.press(64, 3)
    j.press(65, 4)
    expect(j.summary().accuracy).toBe(1)
    j.press(70, 4)
    expect(j.summary()).toMatchObject({ total: 4, perfect: 4, wrong: 1, accuracy: 0.8 })
  })
  it('weights good hits 0.7 and misses 0', () => {
    const j = new Judge([n(60, 1), n(62, 2)], 'timed')
    j.press(60, 1.1)
    j.advance(5)
    expect(j.summary()).toMatchObject({ good: 1, miss: 1 })
    expect(j.summary().accuracy).toBeCloseTo(0.35)
  })
  it('scores an all-good run as exactly 0.7, whatever its length', () => {
    for (const count of [7, 13, 26, 32]) {
      const j = new Judge(Array.from({ length: count }, (_, i) => n(60, i + 1)), 'timed')
      for (let i = 0; i < count; i++) j.press(60, i + 1.1)
      expect(j.summary().accuracy, `${count} notes`).toBe(0.7)
      expect(starsFor(j.summary().accuracy, 0.7)).toBe(1)
    }
  })
  it('scores a whole chord as its weakest note', () => {
    const j = new Judge([n(60, 1), n(64, 1), n(67, 1), n(60, 2)], 'timed')
    j.press(60, 1)
    j.press(64, 1)
    j.advance(1.5)
    j.press(60, 2)
    expect(j.summary().accuracy).toBeCloseTo(0.25)
  })
  it('tracks streaks, resetting on a miss or a wrong press', () => {
    const j = new Judge(four(), 'timed')
    j.press(60, 1)
    j.press(62, 2)
    expect(j.summary().streak).toBe(2)
    j.press(71, 2)
    expect(j.summary().streak).toBe(0)
    j.press(64, 3)
    j.advance(9)
    expect(j.summary()).toMatchObject({ streak: 0, bestStreak: 2 })
  })
  it('reports timing tendency and the pitches missed', () => {
    const j = new Judge(four(), 'timed')
    j.press(60, 1.04)
    j.press(62, 2.02)
    j.advance(9)
    const s = j.summary()
    expect(s.meanOffsetMs).toBeCloseTo(30)
    expect(s.missedPitches).toEqual({ 64: 1, 65: 1 })
  })
  it('is done when every note is judged, and handles an empty chart', () => {
    const j = new Judge([n(60, 1)], 'timed')
    expect(j.done()).toBe(false)
    j.advance(2)
    expect(j.done()).toBe(true)
    const empty = new Judge([], 'timed')
    expect(empty.done()).toBe(true)
    expect(empty.summary().accuracy).toBe(0)
  })
})

describe('Judge, pitch', () => {
  it('accepts only the next group, whenever it is pressed', () => {
    const j = new Judge(four(), 'pitch')
    expect(j.pendingGroup()).toEqual([0])
    expect(j.press(62, 0)).toEqual({ kind: 'wrong', pitch: 62 })
    expect(j.press(60, 99)).toEqual({ kind: 'hit', index: 0, grade: 'perfect', offsetMs: 0 })
    expect(j.pendingGroup()).toEqual([1])
    expect(j.advance(1000)).toEqual([])
  })
  it('needs every key of a chord before moving on', () => {
    const j = new Judge([n(60, 1), n(64, 1), n(67, 2)], 'pitch')
    expect(j.pendingGroup()).toEqual([0, 1])
    j.press(64, 0)
    expect(j.pendingGroup()).toEqual([0])
    expect(j.press(64, 0)).toEqual({ kind: 'wrong', pitch: 64 })
    j.press(60, 0)
    expect(j.pendingGroup()).toEqual([2])
  })
  it('lets wrong presses lower the score', () => {
    const j = new Judge([n(60, 1), n(62, 2), n(64, 3)], 'pitch')
    j.press(61, 0)
    j.press(60, 0)
    j.press(62, 0)
    j.press(64, 0)
    expect(j.summary().accuracy).toBe(0.75)
    expect(j.done()).toBe(true)
  })
})

describe('starsFor', () => {
  it('maps accuracy to stars', () => {
    expect(starsFor(0.79)).toBe(0)
    expect(starsFor(0.8)).toBe(1)
    expect(starsFor(0.9)).toBe(2)
    expect(starsFor(0.97)).toBe(3)
  })
  it('uses a custom pass mark for the first star only', () => {
    expect(starsFor(0.72, 0.7)).toBe(1)
    expect(starsFor(0.69, 0.7)).toBe(0)
  })
})

describe('Judge, held notes', () => {
  const long = (pitch: number, time: number, minHold: number): JudgeNote => ({ pitch, time, hand: 'R', minHold })
  it('halves a long note let go of too soon', () => {
    const j = new Judge([long(60, 1, 1.4)], 'timed')
    j.press(60, 1)
    expect(j.release(60, 1.5)).toBe(0)
    expect(j.summary()).toMatchObject({ perfect: 1, short: 1, accuracy: 0.5 })
  })
  it('accepts a long note held long enough', () => {
    const j = new Judge([long(60, 1, 1.4)], 'timed')
    j.press(60, 1)
    expect(j.release(60, 2.4)).toBeNull()
    expect(j.summary()).toMatchObject({ short: 0, accuracy: 1 })
  })
  it('ignores releases of keys that hit nothing, and short notes', () => {
    const j = new Judge([n(60, 1)], 'timed')
    expect(j.release(61, 1)).toBeNull()
    j.press(60, 1)
    expect(j.release(60, 1.01)).toBeNull()
  })
})

describe('Judge, accuracy so far', () => {
  it('scores only what has been judged, by the same rules as the final score', () => {
    const chord = [n(60, 1), n(64, 1), n(67, 1), n(62, 2)]
    const j = new Judge(chord, 'timed')
    j.press(60, 1)
    j.press(64, 1.1)
    j.press(67, 1)
    // The chord counts as its weakest note (good): 3 × 0.7 over 3 judged notes.
    expect(j.summary().soFar).toBeCloseTo(0.7)
    j.press(62, 2)
    const s = j.summary()
    expect(s.soFar).toBe(s.accuracy)
  })
  it('counts wrong presses against it', () => {
    const j = new Judge(four(), 'timed')
    j.press(60, 1)
    j.press(70, 1.5)
    expect(j.summary().soFar).toBe(0.5)
  })
})
