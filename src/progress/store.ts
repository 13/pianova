import type { Hand } from '../core/types'
import type { Grade } from '../judge/judge'

export interface Settings {
  latencyMs: number
  volume: number
  labels: boolean
  midiInputId: string | null
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
const VERSION = 1
const MAX_STATS = 5000
const DEFAULT_SETTINGS: Settings = { latencyMs: 0, volume: 0.8, labels: true, midiInputId: null }

interface Blob {
  version: number
  lessons: Record<string, Result>
  pieces: Record<string, Result>
  settings: Settings
  stats: StatEvent[]
}

const fresh = (): Blob => ({ version: VERSION, lessons: {}, pieces: {}, settings: { ...DEFAULT_SETTINGS }, stats: [] })
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Everything Pianova remembers. Falls back to memory when storage is unusable. */
export class ProgressStore {
  private blob: Blob

  constructor(
    private kv: KV | null,
    private lessonIds: string[],
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

  addStats(events: StatEvent[]): void {
    this.blob.stats = this.blob.stats.concat(events).slice(-MAX_STATS)
    this.save()
  }

  stats(): StatEvent[] {
    return this.blob.stats
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
      if (!isObject(data) || data.version !== VERSION) throw new Error('unknown save format')
      const blob = fresh()
      if (isObject(data.lessons)) blob.lessons = data.lessons as Record<string, Result>
      if (isObject(data.pieces)) blob.pieces = data.pieces as Record<string, Result>
      if (isObject(data.settings)) blob.settings = { ...DEFAULT_SETTINGS, ...(data.settings as Partial<Settings>) }
      if (Array.isArray(data.stats)) blob.stats = data.stats as StatEvent[]
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
