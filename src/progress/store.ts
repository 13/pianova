import type { Hand } from '../core/types'
import type { Grade } from '../judge/judge'
import { placement } from '../curriculum/skill'

export interface Settings {
  latencyMs: number
  volume: number
  labels: boolean
  midiInputId: string | null
  /** Which keyboard you play: 'auto' (recognised over USB) or a model id from KEYBOARDS. */
  keyboard: string
  /** Whether Pianova sounds the keys you play: 'auto' = not when the keyboard has its own speakers. */
  soundKeys: 'auto' | 'on' | 'off'
  /** Interface and lesson language: 'auto' follows the browser. */
  language: 'auto' | 'en' | 'de'
  /** How music is shown while playing: the note highway, sheet music, or both at once. */
  view: 'highway' | 'sheet' | 'both'
  /** Minutes of playing a day that count towards the streak. */
  dailyGoalMin: number
  /** Mixer: the notes played for you, the backing band, and the metronome, 0..1 each. */
  mix: { accomp: number; band: number; click: number }
}

/** Where you are with one song: a level and a best share of notes played right, per part. */
export interface SongProgress {
  levels: number[]
  shares: number[]
  /** Best mastery reached, 0..1. */
  mastery: number
}

export interface StatEvent {
  /** Lesson or piece id ('import' for imported files). */
  id: string
  pitch: number
  hand: Hand
  grade: Grade
  offsetMs: number
  /** Unix ms. */
  at: number
}

export interface Result {
  stars: number
  best: number
}

/** The slice of the Storage API we use, so tests can fake it. */
export interface KV {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export const STORAGE_KEY = 'pianova.v1'
export const BACKUP_KEY = 'pianova.backup'
/**
 * 2: the clock now follows what is heard, so the timing offset only covers input delay.
 * Offsets saved by version 1 also held the output delay and are reset.
 */
const VERSION = 2
const MAX_STATS = 5000
const DEFAULT_SETTINGS: Settings = { latencyMs: 0, volume: 0.8, labels: true, midiInputId: null, keyboard: 'auto', soundKeys: 'auto', language: 'auto', view: 'highway', dailyGoalMin: 10, mix: { accomp: 0.8, band: 0.7, click: 0.8 } }

interface Blob {
  version: number
  lessons: Record<string, Result>
  pieces: Record<string, Result>
  settings: Settings
  stats: StatEvent[]
  songs: Record<string, SongProgress>
  /** Tests passed in the skill check (0–4), or null if it hasn't been taken. */
  skill: number | null
  /** Seconds played on each local day, 'YYYY-MM-DD'. */
  practice: Record<string, number>
  /** The built-in song last opened, to pick up again from home. */
  lastSong: string | null
}

const fresh = (): Blob => ({
  version: VERSION,
  lessons: {},
  pieces: {},
  settings: { ...DEFAULT_SETTINGS },
  stats: [],
  songs: {},
  skill: null,
  practice: {},
  lastSong: null,
})

/** A local calendar day as 'YYYY-MM-DD'. */
export function dayKey(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

const daysBefore = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - n)
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Everything Pianova remembers. Falls back to memory when storage is unusable. */
export class ProgressStore {
  private blob: Blob

  constructor(
    private kv: KV | null,
    private lessonIds: string[],
    /** Each lesson's unit, in the same order, so the skill check can open whole units. */
    private lessonUnits: number[] = [],
  ) {
    this.blob = this.load()
  }

  get settings(): Settings {
    return { ...this.blob.settings }
  }

  setSettings(patch: Partial<Settings>): void {
    this.blob.settings = { ...this.blob.settings, ...patch }
    this.save()
  }

  /** The first lesson is always open; each later one needs a star on the one before. */
  isUnlocked(lessonId: string): boolean {
    const i = this.lessonIds.indexOf(lessonId)
    if (i <= 0) return i === 0
    if ((this.lessonUnits[i] ?? Infinity) <= placement(this.blob.skill).openUnit) return true
    return (this.blob.lessons[this.lessonIds[i - 1]]?.stars ?? 0) >= 1
  }

  lessonResult(id: string): Result | undefined {
    return this.blob.lessons[id]
  }

  recordLesson(id: string, accuracy: number, stars: number): void {
    this.record(this.blob.lessons, id, accuracy, stars)
  }

  pieceResult(id: string): Result | undefined {
    return this.blob.pieces[id]
  }

  recordPiece(id: string, accuracy: number, stars: number): void {
    this.record(this.blob.pieces, id, accuracy, stars)
  }

  get skill(): number | null {
    return this.blob.skill
  }

  setSkill(skill: number): void {
    this.blob.skill = skill
    this.save()
  }

  /** A song's saved levels, if they were saved for a song split into `parts` parts. */
  song(id: string, parts: number): SongProgress | undefined {
    const p = this.blob.songs[id]
    return p && p.levels.length === parts && p.shares.length === parts ? { ...p, levels: [...p.levels], shares: [...p.shares] } : undefined
  }

  /** Best mastery reached on a song, if it has been played as a lesson. */
  songMastery(id: string): number | undefined {
    return this.blob.songs[id]?.mastery
  }

  saveSong(id: string, progress: SongProgress): void {
    const old = this.blob.songs[id]
    this.blob.songs[id] = { ...progress, mastery: Math.max(progress.mastery, old?.levels.length === progress.levels.length ? old.mastery : 0) }
    this.save()
  }

  addStats(events: StatEvent[]): void {
    this.blob.stats = this.blob.stats.concat(events).slice(-MAX_STATS)
    this.save()
  }

  stats(): StatEvent[] {
    return this.blob.stats
  }

  /** Adds playing time to a day (today by default). */
  addPractice(seconds: number, date = new Date()): void {
    if (!(seconds > 0)) return
    const key = dayKey(date)
    this.blob.practice[key] = (this.blob.practice[key] ?? 0) + seconds
    // Only the last year is needed for streaks and the week view.
    const oldest = dayKey(daysBefore(date, 400))
    for (const k of Object.keys(this.blob.practice)) if (k < oldest) delete this.blob.practice[k]
    this.save()
  }

  /** Seconds played on a day. */
  practiceOn(date = new Date()): number {
    return this.blob.practice[dayKey(date)] ?? 0
  }

  /**
   * Days in a row the daily goal was met, up to today. A today still in progress does not
   * break the streak: it counts from yesterday until the goal is reached.
   */
  streak(today = new Date()): number {
    const goal = this.blob.settings.dailyGoalMin * 60
    const met = (n: number) => (this.blob.practice[dayKey(daysBefore(today, n))] ?? 0) >= goal
    let n = met(0) ? 0 : 1
    let count = 0
    while (met(n)) {
      count++
      n++
    }
    return count
  }

  get lastSong(): string | null {
    return this.blob.lastSong
  }

  setLastSong(id: string): void {
    this.blob.lastSong = id
    this.save()
  }

  private record(table: Record<string, Result>, id: string, accuracy: number, stars: number): void {
    const old = table[id]
    table[id] = { stars: Math.max(old?.stars ?? 0, stars), best: Math.max(old?.best ?? 0, accuracy) }
    this.save()
  }

  private load(): Blob {
    let raw: string | null = null
    try {
      raw = this.kv?.getItem(STORAGE_KEY) ?? null
    } catch {
      return fresh()
    }
    if (raw === null) return fresh()
    try {
      const data: unknown = JSON.parse(raw)
      if (!isObject(data) || (data.version !== VERSION && data.version !== 1)) throw new Error('unknown save format')
      const blob = fresh()
      if (isObject(data.lessons)) blob.lessons = data.lessons as Record<string, Result>
      if (isObject(data.pieces)) blob.pieces = data.pieces as Record<string, Result>
      if (isObject(data.settings)) blob.settings = { ...DEFAULT_SETTINGS, ...(data.settings as Partial<Settings>) }
      if (Array.isArray(data.stats)) blob.stats = data.stats as StatEvent[]
      if (isObject(data.songs)) blob.songs = data.songs as Record<string, SongProgress>
      if (typeof data.skill === 'number') blob.skill = data.skill
      if (isObject(data.practice)) blob.practice = data.practice as Record<string, number>
      if (typeof data.lastSong === 'string') blob.lastSong = data.lastSong
      if (data.version === 1) blob.settings.latencyMs = DEFAULT_SETTINGS.latencyMs
      return blob
    } catch {
      // Unreadable save: keep it aside rather than silently destroying it.
      try {
        this.kv?.setItem(BACKUP_KEY, raw)
      } catch {
        /* nothing more we can do */
      }
      return fresh()
    }
  }

  private save(): void {
    try {
      this.kv?.setItem(STORAGE_KEY, JSON.stringify(this.blob))
    } catch {
      /* storage full or blocked: keep going in memory */
    }
  }
}
