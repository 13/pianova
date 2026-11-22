import { describe, expect, it } from 'vitest'
import { nameToMidi } from '../src/core/pitch'
import type { Chart } from '../src/core/types'
import { LESSONS, PIECES, UNITS } from '../src/curriculum'
import { tr } from '../src/i18n'

const charts = (): { where: string; chart: Chart; unit: number }[] =>
  LESSONS.flatMap((l) => l.steps.flatMap((s) => (s.type === 'explain' ? [] : [{ where: `${l.id} ${tr(s.title)}`, chart: s.chart, unit: l.unit }])))

describe('curriculum', () => {
  it('has 8 course units and 5 practice units in path order with unique ids', () => {
    expect(UNITS.map((u) => u.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])
    expect(UNITS.filter((u) => u.open).map((u) => u.n)).toEqual([9, 10, 11, 12, 13])
    const upTo = (n: number) => Array.from({ length: n }, (_, i) => i + 1)
    // Unit 1 starts at lesson 2: the old first lesson was folded into "Finding C".
    const lessons: Record<number, number[]> = { 1: [2, 3, 4], 7: upTo(6), 9: upTo(18), 10: upTo(18), 11: upTo(7), 12: upTo(6), 13: upTo(6) }
    expect(LESSONS.map((l) => l.id)).toEqual(UNITS.flatMap((u) => (lessons[u.n] ?? [1, 2, 3, 4]).map((n) => `u${u.n}l${n}`)))
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length)
    LESSONS.forEach((l) => expect(l.id.startsWith(`u${l.unit}l`)).toBe(true))
  })
  it('keeps the first six units within C3–C5 (25 keys) and the rest within C2–C6 (49 keys)', () => {
    for (const { where, chart, unit } of charts()) {
      expect(chart.notes.length, where).toBeGreaterThan(0)
      const [lo, hi] = unit <= 6 ? [48, 72] : [36, 84]
      for (const n of chart.notes) expect(n.pitch >= lo && n.pitch <= hi, `${where}: ${n.pitch}`).toBe(true)
    }
  })
  it('ends every lesson with something scored', () => {
    for (const l of LESSONS) expect(l.steps.some((s) => s.type === 'perform'), l.id).toBe(true)
  })
  it('judges pitch only before rhythm is taught, and timing after (new techniques may start untimed)', () => {
    for (const l of LESSONS)
      for (const s of l.steps)
        if (s.type === 'perform') {
          if (l.unit <= 2) expect(s.judging, l.id).toBe('pitch')
          else if (l.unit <= 6) expect(s.judging, l.id).toBe('timed')
        }
    for (const u of [7, 8]) expect(LESSONS.some((l) => l.unit === u && l.steps.some((s) => s.type === 'perform' && s.judging === 'timed'))).toBe(true)
  })
  it('never asks one hand for more than three notes at once', () => {
    for (const { where, chart } of charts()) {
      const counts = new Map<string, number>()
      for (const n of chart.notes) counts.set(`${n.hand}@${n.startBeat}`, (counts.get(`${n.hand}@${n.startBeat}`) ?? 0) + 1)
      for (const [k, c] of counts) expect(c, `${where} ${k}`).toBeLessThanOrEqual(3)
    }
  })
  it('only names real keys in explanations', () => {
    for (const l of LESSONS)
      for (const s of l.steps)
        if (s.type === 'explain')
          for (const name of [...(s.highlight ?? []), ...(s.pressToContinue ? [s.pressToContinue] : [])]) {
            const midi = nameToMidi(name)
            expect(midi >= 36 && midi <= 84, `${l.id}: ${name}`).toBe(true)
          }
  })
  it('opens every lesson with an explanation and gives a fingering for lesson notes', () => {
    for (const l of LESSONS) expect(l.steps[0].type, l.id).toBe('explain')
    for (const { where, chart } of charts())
      for (const n of chart.notes) expect(n.finger, `${where}: pitch ${n.pitch} beat ${n.startBeat}`).toBeDefined()
  })
  it('never gives both hands the same key at the same moment', () => {
    for (const { where, chart } of [...charts(), ...PIECES.map((p) => ({ where: p.id, chart: p.chart }))]) {
      const seen = new Set<string>()
      for (const n of chart.notes) {
        const key = `${n.pitch}@${n.startBeat}`
        expect(seen.has(key), `${where} ${key}`).toBe(false)
        seen.add(key)
      }
    }
  })
  it('ships free-play pieces with unique ids and notes on a real piano', () => {
    expect(PIECES.length).toBeGreaterThanOrEqual(5)
    expect(new Set(PIECES.map((p) => p.id)).size).toBe(PIECES.length)
    for (const p of PIECES) {
      expect(p.chart.notes.length, p.id).toBeGreaterThan(8)
      for (const n of p.chart.notes) expect(n.pitch >= 21 && n.pitch <= 108, p.id).toBe(true)
    }
  })
  it('has German for every lesson text, title and unit', () => {
    // Song names stay as they are; any other plain-string sentence is an untranslated one.
    const names = ['Hot Cross Buns', 'Jingle Bells']
    const missing = (x: unknown) => typeof x === 'string' && !names.includes(x) && /[a-z]{3,} [a-z]{3,}/i.test(x)
    for (const u of UNITS) expect(missing(u.title) || missing(u.blurb), `unit ${u.n}`).toBe(false)
    for (const l of LESSONS) {
      expect(missing(l.title) || missing(l.summary), l.id).toBe(false)
      for (const s of l.steps) {
        expect(missing(s.title), `${l.id} ${tr(s.title)}`).toBe(false)
        if (s.type === 'explain') expect(missing(s.text), `${l.id} ${tr(s.title)}`).toBe(false)
      }
    }
  })
  it('writes out in-key chords for the band wherever the lesson is a single line', () => {
    // Unit 6 and most of unit 8 are made of chords; the band follows what those spell.
    const guessed = (l: { id: string; unit: number }) => l.unit === 6 || (l.unit === 8 && l.id !== 'u8l3')
    for (const l of LESSONS.filter((l) => !guessed(l))) {
      for (const s of l.steps)
        if (s.type !== 'explain') {
          const chords = s.chart.chords!
          expect(chords.length, l.id).toBeGreaterThan(0)
          expect(chords.reduce((sum, c) => sum + c.durationBeats, 0), l.id).toBe(s.chart.lengthBeats)
        }
    }
  })
  it('plays each scale in both directions with standard fingering', () => {
    const run = (id: string) => {
      const s = LESSONS.find((l) => l.id === id)!.steps.find((s) => s.type === 'perform')!
      if (s.type !== 'perform') throw new Error('expected a scored run')
      return s.chart.notes
    }
    // One octave, G major right hand: up 1 2 3 1 2 3 4 5 with F sharp, back down the same fingers.
    const g = run('u9l4')
    expect(g.slice(0, 15).map((n) => n.finger)).toEqual([1, 2, 3, 1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 2, 1])
    expect(g.slice(0, 8).map((n) => n.pitch)).toEqual([55, 57, 59, 60, 62, 64, 66, 67])
    // Two octaves, C major left hand: 5 4 3 2 1 3 2 1 4 3 2 1 3 2 1.
    expect(run('u10l2').slice(0, 15).map((n) => n.finger)).toEqual([5, 4, 3, 2, 1, 3, 2, 1, 4, 3, 2, 1, 3, 2, 1])
    // F major right hand keeps 4 on B flat.
    expect(run('u9l16').slice(0, 8).map((n) => n.finger)).toEqual([1, 2, 3, 4, 1, 2, 3, 4])
    // Hands together: an octave apart, all 32 beats.
    const both = run('u9l3')
    expect(both.filter((n) => n.hand === 'L').map((n) => n.pitch + 12)).toEqual(both.filter((n) => n.hand === 'R').map((n) => n.pitch))
    expect(LESSONS.find((l) => l.id === 'u10l3')!.steps[1].type === 'demo' && (LESSONS.find((l) => l.id === 'u10l3')!.steps[1] as { chart: Chart }).chart.lengthBeats).toBe(32)
  })
  it('fingers scales with the thumb passing under', () => {
    const scale = LESSONS.find((l) => l.id === 'u7l3')!
    const run = scale.steps.find((s) => s.type === 'perform')
    if (!run || run.type !== 'perform') throw new Error('expected a scored run')
    expect(run.chart.notes.slice(0, 8).map((n) => n.finger)).toEqual([1, 2, 3, 1, 2, 3, 4, 5])
  })
})
