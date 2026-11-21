import { describe, expect, it } from 'vitest'
import { nameToMidi } from '../src/core/pitch'
import type { Chart } from '../src/core/types'
import { LESSONS, PIECES, UNITS } from '../src/curriculum'
import { tr } from '../src/i18n'

const charts = (): { where: string; chart: Chart; unit: number }[] =>
  LESSONS.flatMap((l) => l.steps.flatMap((s) => (s.type === 'explain' ? [] : [{ where: `${l.id} ${tr(s.title)}`, chart: s.chart, unit: l.unit }])))

describe('curriculum', () => {
  it('has 8 units in path order with unique ids', () => {
    expect(UNITS.map((u) => u.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    // Unit 1 starts at lesson 2: the old first lesson was folded into "Finding C".
    const lessons: Record<number, number[]> = { 1: [2, 3, 4], 7: [1, 2, 3, 4, 5, 6] }
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
  it('fingers scales with the thumb passing under', () => {
    const scale = LESSONS.find((l) => l.id === 'u7l3')!
    const run = scale.steps.find((s) => s.type === 'perform')
    if (!run || run.type !== 'perform') throw new Error('expected a scored run')
    expect(run.chart.notes.slice(0, 8).map((n) => n.finger)).toEqual([1, 2, 3, 1, 2, 3, 4, 5])
  })
})
