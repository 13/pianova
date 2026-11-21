import { describe, expect, it } from 'vitest'
import { arrangement, melodyLine, voiceChords } from '../src/chart/arrangements'
import { chordLabel, harmonize } from '../src/chart/harmony'
import { PIECES } from '../src/curriculum'

const piece = (id: string) => PIECES.find((p) => p.id === id)!.chart

describe('harmony', () => {
  it('hears C, F and G under Jingle Bells', () => {
    const labels = new Set(harmonize(piece('jingle-bells')).map(chordLabel))
    expect([...labels].sort()).toEqual(['C', 'F', 'G'])
  })
  it('covers the whole song without gaps or overlaps', () => {
    for (const p of PIECES) {
      const spans = harmonize(p.chart)
      expect(spans[0].startBeat, p.id).toBe(0)
      for (let i = 1; i < spans.length; i++) expect(spans[i].startBeat, p.id).toBeCloseTo(spans[i - 1].startBeat + spans[i - 1].durationBeats)
    }
  })
})

describe('arrangements', () => {
  it('melody keeps one note at a time, in the right hand', () => {
    const line = melodyLine(piece('ode-to-joy'))
    expect(line.every((n) => n.hand === 'R')).toBe(true)
    expect(new Set(line.map((n) => n.startBeat)).size).toBe(line.length)
    expect(line.slice(0, 4).map((n) => n.pitch)).toEqual([64, 64, 65, 67])
  })
  it('voices chords close together in the left hand', () => {
    const v = voiceChords([
      { startBeat: 0, durationBeats: 4, root: 0, minor: false },
      { startBeat: 4, durationBeats: 4, root: 5, minor: false },
      { startBeat: 8, durationBeats: 4, root: 7, minor: false },
    ])
    for (const chord of v) {
      expect(chord.length).toBe(3)
      expect(chord[2] - chord[0]).toBeLessThanOrEqual(9)
      expect(chord[0]).toBeGreaterThanOrEqual(45)
      expect(chord[2]).toBeLessThanOrEqual(62)
    }
    // C to F moves by small steps, not a jump of the whole hand.
    const moved = v[1].reduce((s, p, i) => s + Math.abs(p - v[0][i]), 0)
    expect(moved).toBeLessThanOrEqual(5)
  })
  it('gives every arrangement notes, hands and a tier per note, with no key doubled at once', () => {
    for (const p of PIECES)
      for (const id of ['melody', 'chords', 'simple', 'full'] as const) {
        const a = arrangement(p.chart, id)
        expect(a.chart.notes.length, `${p.id} ${id}`).toBeGreaterThan(4)
        expect(a.tiers.length).toBe(a.chart.notes.length)
        expect(a.tiers.every((t) => t >= 1 && t <= 5)).toBe(true)
        const seen = new Set<string>()
        for (const n of a.chart.notes) {
          const key = `${n.pitch}@${n.startBeat}`
          expect(seen.has(key), `${p.id} ${id} ${key}`).toBe(false)
          seen.add(key)
        }
      }
  })
  it('lets the music play the tune in the chords arrangement', () => {
    const a = arrangement(piece('twinkle'), 'chords')
    expect(a.hands).toEqual(['L'])
    expect(a.chart.notes.filter((n) => n.hand === 'L').length).toBeGreaterThan(10)
  })
})
