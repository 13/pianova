import { describe, expect, it } from 'vitest'
import { compileChart } from '../src/chart/notation'
import { withFingering } from '../src/chart/fingering'
import { songSections, sectionAt } from '../src/chart/sections'

const fingers = (src: { R?: string; L?: string }, hand: 'L' | 'R' = 'R') =>
  withFingering(compileChart({ id: 't', title: 'T', bpm: 100, ...src }))
    .notes.filter((n) => n.hand === hand)
    .map((n) => n.finger)

describe('withFingering', () => {
  it('plays five-finger tunes from C position', () => {
    expect(fingers({ R: 'C4 D4 E4 F4 G4 F4 E4 D4 C4' })).toEqual([1, 2, 3, 4, 5, 4, 3, 2, 1])
    expect(fingers({ L: 'C3 D3 E3 F3 G3' }, 'L')).toEqual([5, 4, 3, 2, 1])
  })
  it('passes the thumb under for a scale', () => {
    expect(fingers({ R: 'C4 D4 E4 F4 G4 A4 B4 C5' })).toEqual([1, 2, 3, 1, 2, 3, 4, 5])
    // And crosses a finger over the thumb on the way back down.
    expect(fingers({ R: 'C5 B4 A4 G4 F4 E4 D4 C4' })).toEqual([5, 4, 3, 2, 1, 3, 2, 1])
    expect(fingers({ L: 'C3 D3 E3 F3 G3 A3 B3 C4' }, 'L')).toEqual([5, 4, 3, 2, 1, 3, 2, 1])
  })
  it('fingers chords across the hand', () => {
    expect(fingers({ R: '[C4 E4 G4]' })).toEqual([1, 3, 5])
    expect(fingers({ L: '[C3 E3 G3]' }, 'L')).toEqual([5, 3, 1])
    // Too wide for one position: stretched to the outer fingers.
    expect(fingers({ R: '[C4 C5]' })).toEqual([1, 5])
    expect(fingers({ R: '[C4 E4 G4 C5]' })).toEqual([1, 2, 3, 5])
  })
  it('gives a black key the slot of the white key the music leaves out', () => {
    // D position in D major: F# is played by the finger that would play F.
    expect(fingers({ R: 'D4 E4 F#4 G4 A4' })).toEqual([1, 2, 3, 4, 5])
    // C minor: Eb takes E's place.
    expect(fingers({ R: 'C4 D4 Eb4 F4 G4' })).toEqual([1, 2, 3, 4, 5])
  })
  it('keeps fingers written in the chart and fits the rest around them', () => {
    expect(fingers({ R: 'E4/1 F4 G4' })).toEqual([1, 2, 3])
    expect(fingers({ R: 'C4/1 G4/5 A4' })).toEqual([1, 5, 5])
  })
  it('leaves a fully fingered chart alone', () => {
    const chart = compileChart({ id: 't', title: 'T', bpm: 100, R: 'C4/2 D4/3' })
    expect(withFingering(chart)).toBe(chart)
  })
})

describe('songSections', () => {
  const tune = (bars: string[]) => compileChart({ id: 't', title: 'T', bpm: 100, R: bars.join(' | ') })
  const a = 'C4 D4 E4 C4'
  const b = 'G4 G4 A4 A4'
  const a2 = 'C4 D4 E4 E4'

  it('splits into four-bar parts named by their music', () => {
    const s = songSections(tune([a, a, a, a, b, b, b, b, a, a, a, a, a, a, a, a2]))
    expect(s.map((x) => x.name)).toEqual(['A', 'B', 'A', 'A′'])
    expect(s[1]).toMatchObject({ fromBar: 5, toBar: 8, startBeat: 16, endBeat: 32 })
    expect(s[1].notes).toHaveLength(16)
  })
  it('uses two-bar parts for short pieces and folds in a short leftover', () => {
    expect(songSections(tune([a, b, a, b, a])).map((x) => [x.fromBar, x.toBar])).toEqual([
      [1, 2],
      [3, 5],
    ])
    expect(songSections(tune([a, b])).map((x) => x.name)).toEqual(['A'])
  })
  it('joins silent bars onto the next part', () => {
    const chart = compileChart({ id: 't', title: 'T', bpm: 100, R: `-:16 | ${[a, b, a, b].join(' | ')}` })
    const s = songSections(chart)
    expect(s.map((x) => [x.fromBar, x.toBar])).toEqual([[1, 8]])
  })
  it('finds the section at a beat', () => {
    const s = songSections(tune([a, a, a, a, b, b, b, b]))
    expect(sectionAt(s, -4)).toBe(0)
    expect(sectionAt(s, 15.9)).toBe(0)
    expect(sectionAt(s, 16)).toBe(1)
    expect(sectionAt(s, 99)).toBe(1)
  })
})
