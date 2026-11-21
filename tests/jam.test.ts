import { describe, expect, it } from 'vitest'
import { chordTones, fits, jamBand, jamChart, jamChords, jamLength, PROGRESSIONS, scaleOf } from '../src/practice/jam'
import { Session } from '../src/session/session'

describe('jam', () => {
  it('lays a progression out in the chosen key, one bar a chord', () => {
    expect(jamChords(7, 'pop').map((c) => [c.root, c.minor, c.startBeat])).toEqual([
      [7, false, 0],
      [2, false, 4],
      [4, true, 8],
      [0, false, 12],
    ])
    expect(jamLength('blues')).toBe(48)
    expect(jamChords(0, 'blues').reduce((s, c) => s + c.durationBeats, 0)).toBe(48)
    for (const p of PROGRESSIONS) expect(jamLength(p.id) % 4).toBe(0)
  })
  it('plays drums that run on, a bass and a pad on every chord', () => {
    const band = jamBand(0, 'pop')
    for (const sound of ['kick', 'snare', 'hat', 'bass', 'pad']) expect(band.some((e) => e.sound === sound), sound).toBe(true)
    // No ring-out: the last bar grooves like the others so the loop is seamless.
    expect(band.filter((e) => e.sound === 'hat' && e.beat >= 12).length).toBe(8)
    expect(band.filter((e) => e.sound === 'pad').map((e) => e.beat)).toEqual([0, 4, 8, 12])
  })
  it('keeps the band going round and round', () => {
    const band = jamBand(0, 'ballad')
    const chart = jamChart('ballad', 120)
    let heard = 0
    const s = new Session({ chart, mode: 'demo', hands: [], loop: { fromBar: 1, toBar: 4 }, extras: band }, { extra: () => heard++ })
    s.start(0)
    for (let t = 0; t <= 24 + 0.01; t += 0.02) s.update(t, 0.1)
    // 24 s at 120 bpm is three times round the 16-beat progression.
    expect(heard).toBeGreaterThanOrEqual(band.length * 3)
    expect(s.state).toBe('running')
  })
  it('says which notes fit: the pentatonic scale, and the chord sounding', () => {
    expect([...scaleOf(0, 'pop')].sort((a, b) => a - b)).toEqual([0, 2, 4, 7, 9])
    expect([...scaleOf(9, 'minor')].sort((a, b) => a - b)).toEqual([0, 2, 4, 7, 9])
    expect(scaleOf(0, 'blues').has(3)).toBe(true)
    expect([...chordTones({ root: 5, minor: false })]).toEqual([5, 9, 0])
    const f = { root: 5, minor: false }
    expect(fits(65, f, scaleOf(0, 'pop'))).toBe(true) // F: in the F chord, though not in the scale
    expect(fits(66, f, scaleOf(0, 'pop'))).toBe(false) // F#
    expect(fits(62, undefined, scaleOf(0, 'pop'))).toBe(true)
  })
})
