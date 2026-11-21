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
    expect(q.settings).toEqual({ latencyMs: 35, volume: 0.8, labels: false, midiInputId: null, keyboard: 'auto', soundKeys: 'auto', language: 'auto', view: 'highway', dailyGoalMin: 10, mix: { accomp: 0.8, band: 0.7, click: 0.8 }, measuredKeys: null, handOverlay: true, chordNames: true })
    expect(q.stats()).toEqual([stat(1)])
  })
  it('starts with sensible default settings', () => {
    expect(new ProgressStore(fakeKV(), ids).settings).toEqual({ latencyMs: 0, volume: 0.8, labels: true, midiInputId: null, keyboard: 'auto', soundKeys: 'auto', language: 'auto', view: 'highway', dailyGoalMin: 10, mix: { accomp: 0.8, band: 0.7, click: 0.8 }, measuredKeys: null, handOverlay: true, chordNames: true })
  })
  it('starts fresh from garbage and keeps the old data as a backup', () => {
    for (const junk of ['{not json', '42', '{"version":"x","lessons":"x"}']) {
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
  it('resets a version 1 timing offset, which also covered output delay, and keeps the rest', () => {
    const old = { version: 1, lessons: { a: { stars: 2, best: 0.9 } }, settings: { latencyMs: 60, volume: 0.5, labels: false, midiInputId: 'x' } }
    const p = new ProgressStore(fakeKV({ [STORAGE_KEY]: JSON.stringify(old) }), ids)
    expect(p.settings).toEqual({ latencyMs: 0, volume: 0.5, labels: false, midiInputId: 'x', keyboard: 'auto', soundKeys: 'auto', language: 'auto', view: 'highway', dailyGoalMin: 10, mix: { accomp: 0.8, band: 0.7, click: 0.8 }, measuredKeys: null, handOverlay: true, chordNames: true })
    expect(p.lessonResult('a')).toEqual({ stars: 2, best: 0.9 })
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
  it('opens whole units from the skill check, and keeps song levels', () => {
    const kv = fakeKV()
    const p = new ProgressStore(kv, ['a', 'b', 'c', 'd'], [1, 2, 2, 4])
    expect(p.isUnlocked('b')).toBe(false)
    p.setSkill(1) // knows the keys: units 1 and 2 open
    expect(p.isUnlocked('c')).toBe(true)
    expect(p.isUnlocked('d')).toBe(false)
    p.saveSong('s', { levels: [2, 3], shares: [0.5, 0.2], mastery: 0.35 })
    p.saveSong('s', { levels: [1, 3], shares: [0.5, 0.2], mastery: 0.1 })
    const q = new ProgressStore(kv, ['a', 'b', 'c', 'd'], [1, 2, 2, 4])
    expect(q.skill).toBe(1)
    expect(q.song('s', 2)).toEqual({ levels: [1, 3], shares: [0.5, 0.2], mastery: 0.35 })
    // A song now split differently starts over.
    expect(q.song('s', 3)).toBeUndefined()
  })
})

describe('daily practice', () => {
  const day = (d: number) => new Date(2026, 10, d, 12)
  it('counts the streak of days that met the goal, without breaking on an unfinished today', () => {
    const p = new ProgressStore(fakeKV(), ['a'])
    p.addPractice(600, day(18))
    p.addPractice(300, day(19))
    p.addPractice(400, day(19))
    p.addPractice(120, day(21))
    expect(p.practiceOn(day(19))).toBe(700)
    // 20th missed: a streak that ended yesterday-but-one is gone.
    expect(p.streak(day(21))).toBe(0)
    p.addPractice(600, day(20))
    expect(p.streak(day(21))).toBe(3)
    p.addPractice(480, day(21))
    expect(p.streak(day(21))).toBe(4)
  })
  it('remembers practice and the last song across reloads', () => {
    const kv = fakeKV()
    const p = new ProgressStore(kv, ['a'])
    p.addPractice(90, day(5))
    p.setLastSong('ode-to-joy')
    const q = new ProgressStore(kv, ['a'])
    expect(q.practiceOn(day(5))).toBe(90)
    expect(q.lastSong).toBe('ode-to-joy')
  })

  it('leaves a save from a newer version alone instead of overwriting it', () => {
    const newer = JSON.stringify({ version: 99, lessons: { a: { stars: 3, best: 1 } } })
    const kv = fakeKV({ [STORAGE_KEY]: newer })
    const p = new ProgressStore(kv, ids)
    expect(p.readOnly).toBe(true)
    p.recordLesson('b', 0.9, 2)
    expect(kv.data[STORAGE_KEY]).toBe(newer)
    expect(kv.data[BACKUP_KEY]).toBeUndefined()
  })
  it('falls back field by field on a save with wrong types instead of crashing', () => {
    const kv = fakeKV({
      [STORAGE_KEY]: JSON.stringify({
        version: 2,
        settings: { dailyGoalMin: 0, mix: null, volume: 'loud', view: 'cube', labels: false },
        lessons: { a: { stars: 2, best: 0.9 }, b: 'x', c: { stars: 'many' } },
        songs: { s: { mastery: 0.5 }, ok: { levels: [1, 2], shares: [0.5, 0.6], mastery: 0.4 } },
        stats: [stat(1), { id: 'a' }, null],
        practice: { '2026-01-01': 120, nonsense: 5, '2026-01-02': 'x' },
        skill: 'expert',
      }),
    })
    const p = new ProgressStore(kv, ids)
    expect(p.settings).toMatchObject({ dailyGoalMin: 1, volume: 0.8, view: 'highway', labels: false, mix: { accomp: 0.8, band: 0.7, click: 0.8 }, measuredKeys: null, handOverlay: true, chordNames: true })
    expect(p.lessonResult('a')).toEqual({ stars: 2, best: 0.9 })
    expect(p.lessonResult('b')).toBeUndefined()
    expect(p.song('s', 0)).toBeUndefined()
    expect(p.song('ok', 2)).toEqual({ levels: [1, 2], shares: [0.5, 0.6], mastery: 0.4 })
    expect(p.stats()).toEqual([stat(1)])
    expect(p.practiceOn(new Date(2026, 0, 1))).toBe(120)
    expect(p.skill).toBeNull()
  })
  it('never loops forever counting a streak', () => {
    const kv = fakeKV()
    const p = new ProgressStore(kv, ids)
    // Even if every day of the past year was played, the count stops.
    for (let d = 0; d < 500; d++) p.addPractice(3600, new Date(2026, 0, 1 + d))
    expect(p.streak(new Date(2027, 4, 15))).toBeLessThanOrEqual(401)
  })
  it('keeps progress saved by another tab instead of overwriting it', () => {
    const kv = fakeKV()
    const tab1 = new ProgressStore(kv, ids)
    const tab2 = new ProgressStore(kv, ids)
    tab1.recordLesson('a', 0.9, 2)
    tab1.addStats([stat(1)])
    tab1.addPractice(60, new Date(2026, 5, 1))
    tab2.recordLesson('b', 0.8, 1)
    tab2.recordLesson('a', 0.7, 1)
    tab2.addStats([stat(2)])
    const fresh = new ProgressStore(kv, ids)
    expect(fresh.lessonResult('a')).toEqual({ stars: 2, best: 0.9 })
    expect(fresh.lessonResult('b')).toEqual({ stars: 1, best: 0.8 })
    expect(fresh.stats()).toEqual([stat(1), stat(2)])
    expect(fresh.practiceOn(new Date(2026, 5, 1))).toBe(60)
  })
})
