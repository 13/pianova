import { describe, expect, it } from 'vitest'
import { nameToMidi } from '../src/core/pitch'
import type { Chart } from '../src/core/types'
import { LESSONS, PIECES, UNITS } from '../src/curriculum'

const charts = (): { where: string; chart: Chart }[] =>
  LESSONS.flatMap((l) => l.steps.flatMap((s) => (s.type === 'explain' ? [] : [{ where: `${l.id} ${s.title}`, chart: s.chart }])))

describe('curriculum', () => {
  it('has 6 units of 4 lessons in path order with unique ids', () => {
    expect(UNITS.map((u) => u.n)).toEqual([1, 2, 3, 4, 5, 6])
    expect(LESSONS.map((l) => l.id)).toEqual(
      [1, 2, 3, 4, 5, 6].flatMap((u) => [1, 2, 3, 4].map((n) => `u${u}l${n}`)),
    )
    LESSONS.forEach((l) => expect(l.id.startsWith(`u${l.unit}l`)).toBe(true))
  })
  it('keeps every lesson note within C3–C5 so a 25-key keyboard works', () => {
    for (const { where, chart } of charts()) {
      expect(chart.notes.length, where).toBeGreaterThan(0)
      for (const n of chart.notes) expect(n.pitch >= 48 && n.pitch <= 72, `${where}: ${n.pitch}`).toBe(true)
    }
  })
  it('ends every lesson with something scored', () => {
    for (const l of LESSONS) expect(l.steps.some((s) => s.type === 'perform'), l.id).toBe(true)
  })
  it('judges pitch only before rhythm is taught, and timing after', () => {
    for (const l of LESSONS)
      for (const s of l.steps)
        if (s.type === 'perform') expect(s.judging, l.id).toBe(l.unit <= 2 ? 'pitch' : 'timed')
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
            expect(midi >= 48 && midi <= 72, `${l.id}: ${name}`).toBe(true)
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
})
