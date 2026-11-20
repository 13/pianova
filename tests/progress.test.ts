import { describe, expect, it } from 'vitest'
import { ProgressStore, STORAGE_KEY, BACKUP_KEY, type KV, type StatEvent } from '../src/progress/store'

const ids = ['a', 'b', 'c']
function fakeKV(initial: Record<string, string> = {}): KV & { data: Record<string, string> } {
  const data = { ...initial }
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) }
}
const stat = (at: number): StatEvent => ({ id: 'a', pitch: 60, hand: 'R', grade: 'perfect', offsetMs: 0, at })

describe('ProgressStore', () => {
  it('unlocks the first lesson and then each lesson after a passed one', () => {
    const p = new ProgressStore(fakeKV(), ids)
    expect(ids.map((id) => p.isUnlocked(id))).toEqual([true, false, false])
    p.recordLesson('a', 0.85, 1)
    expect(ids.map((id) => p.isUnlocked(id))).toEqual([true, true, false])
  })
  it('does not unlock on a failed run', () => {
    const p = new ProgressStore(fakeKV(), ids)
    p.recordLesson('a', 0.5, 0)
    expect(p.isUnlocked('b')).toBe(false)
    expect(p.lessonResult('a')).toEqual({ stars: 0, best: 0.5 })
  })
  it('keeps the best result when a worse run follows', () => {
    const p = new ProgressStore(fakeKV(), ids)
    p.recordLesson('a', 0.95, 2)
    p.recordLesson('a', 0.6, 0)
    expect(p.lessonResult('a')).toEqual({ stars: 2, best: 0.95 })
    expect(p.isUnlocked('b')).toBe(true)
  })
  it('tracks pieces separately', () => {
    const p = new ProgressStore(fakeKV(), ids)
    p.recordPiece('ode', 0.9, 2)
    expect(p.pieceResult('ode')).toEqual({ stars: 2, best: 0.9 })
    expect(p.lessonResult('ode')).toBeUndefined()
  })
  it('persists and reloads everything', () => {
    const kv = fakeKV()
    const p = new ProgressStore(kv, ids)
    p.recordLesson('a', 0.9, 2)
    p.setSettings({ latencyMs: 35, labels: false })
    p.addStats([stat(1)])
    const q = new ProgressStore(kv, ids)
    expect(q.lessonResult('a')).toEqual({ stars: 2, best: 0.9 })
    expect(q.settings).toEqual({ latencyMs: 35, volume: 0.8, labels: false, midiInputId: null })
    expect(q.stats()).toEqual([stat(1)])
  })
  it('starts with sensible default settings', () => {
    expect(new ProgressStore(fakeKV(), ids).settings).toEqual({ latencyMs: 0, volume: 0.8, labels: true, midiInputId: null })
  })
  it('starts fresh from garbage and keeps the old data as a backup', () => {
    for (const junk of ['{not json', '42', '{"version":99,"lessons":"x"}']) {
      const kv = fakeKV({ [STORAGE_KEY]: junk })
      const p = new ProgressStore(kv, ids)
      expect(p.isUnlocked('b')).toBe(false)
      expect(kv.data[BACKUP_KEY]).toBe(junk)
    }
  })
  it('fills in fields missing from an older save', () => {
    const kv = fakeKV({ [STORAGE_KEY]: JSON.stringify({ version: 1, lessons: { a: { stars: 1, best: 0.8 } } }) })
    const p = new ProgressStore(kv, ids)
    expect(p.isUnlocked('b')).toBe(true)
    expect(p.settings.volume).toBe(0.8)
    expect(p.stats()).toEqual([])
  })
  it('works in memory when storage is missing or refuses writes', () => {
    const none = new ProgressStore(null, ids)
    none.recordLesson('a', 1, 3)
    expect(none.isUnlocked('b')).toBe(true)
    const full: KV = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    const p = new ProgressStore(full, ids)
    p.recordLesson('a', 1, 3)
    expect(p.isUnlocked('b')).toBe(true)
    const broken: KV = {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {},
    }
    expect(new ProgressStore(broken, ids).isUnlocked('a')).toBe(true)
  })
  it('keeps only the most recent 5000 stat events', () => {
    const p = new ProgressStore(fakeKV(), ids)
    p.addStats(Array.from({ length: 4000 }, (_, i) => stat(i)))
    p.addStats(Array.from({ length: 2000 }, (_, i) => stat(4000 + i)))
    expect(p.stats()).toHaveLength(5000)
    expect(p.stats()[0].at).toBe(1000)
    expect(p.stats()[4999].at).toBe(5999)
  })
})
