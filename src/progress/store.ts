import type { Hand } from '../core/types'
import type { Grade } from '../judge/judge'
import { placement } from '../curriculum/skill'
import { validRange, type KeyRange } from '../input/instruments'

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
  /** The player's keyboard as measured by pressing its lowest and highest key. */
  measuredKeys: KeyRange | null
  /** Draw see-through hands over the keys, showing which finger plays next. */
  handOverlay: boolean
  /** Show the song's chord names on the highway and over the staff. */
  chordNames: boolean
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
const DEFAULT_SETTINGS: Settings = { latencyMs: 0, volume: 0.8, labels: true, midiInputId: null, keyboard: 'auto', soundKeys: 'auto', language: 'auto', view: 'highway', dailyGoalMin: 10, mix: { accomp: 0.8, band: 0.7, click: 0.8 }, measuredKeys: null, handOverlay: true, chordNames: true }

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
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
/** A finite number clamped into range, or the fallback. */
const num = (v: unknown, lo: number, hi: number, fallback: number) => (isNum(v) ? clamp(v, lo, hi) : fallback)
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T => (options.includes(v as T) ? (v as T) : fallback)
/** The streak never looks further back than practice is kept. */
const MAX_STREAK_DAYS = 400

/**
 * Saved data is checked field by field: anything of the wrong type or out of range falls
 * back to its default, so a damaged or hand-edited save can never stop the app starting.
 */
function readSettings(v: unknown): Settings {
  const d = DEFAULT_SETTINGS
  if (!isObject(v)) return { ...d, mix: { ...d.mix } }
  const mix = isObject(v.mix) ? v.mix : {}
  return {
    latencyMs: num(v.latencyMs, -50, 300, d.latencyMs),
    volume: num(v.volume, 0, 1, d.volume),
    labels: typeof v.labels === 'boolean' ? v.labels : d.labels,
    midiInputId: typeof v.midiInputId === 'string' ? v.midiInputId : null,
    keyboard: typeof v.keyboard === 'string' ? v.keyboard : d.keyboard,
    soundKeys: oneOf(v.soundKeys, ['auto', 'on', 'off'], d.soundKeys),
    language: oneOf(v.language, ['auto', 'en', 'de'], d.language),
    view: oneOf(v.view, ['highway', 'sheet', 'both'], d.view),
    dailyGoalMin: Math.round(num(v.dailyGoalMin, 1, 600, d.dailyGoalMin)),
    mix: { accomp: num(mix.accomp, 0, 1, d.mix.accomp), band: num(mix.band, 0, 1, d.mix.band), click: num(mix.click, 0, 1, d.mix.click) },
    measuredKeys: validRange(v.measuredKeys) ? { lo: v.measuredKeys.lo, hi: v.measuredKeys.hi } : null,
    handOverlay: typeof v.handOverlay === 'boolean' ? v.handOverlay : d.handOverlay,
    chordNames: typeof v.chordNames === 'boolean' ? v.chordNames : d.chordNames,
  }
}

function readResults(v: unknown): Record<string, Result> {
  const out: Record<string, Result> = {}
  if (!isObject(v)) return out
  for (const [id, r] of Object.entries(v)) {
    if (isObject(r) && isNum(r.stars) && isNum(r.best)) out[id] = { stars: clamp(Math.round(r.stars), 0, 3), best: clamp(r.best, 0, 1) }
  }
  return out
}

function readSongs(v: unknown): Record<string, SongProgress> {
  const out: Record<string, SongProgress> = {}
  if (!isObject(v)) return out
  for (const [id, p] of Object.entries(v)) {
    if (!isObject(p) || !Array.isArray(p.levels) || !Array.isArray(p.shares)) continue
    if (p.levels.length !== p.shares.length || !p.levels.every(isNum) || !p.shares.every(isNum)) continue
    out[id] = { levels: p.levels as number[], shares: p.shares as number[], mastery: num(p.mastery, 0, 1, 0) }
  }
  return out
}

const GRADES: readonly Grade[] = ['perfect', 'good', 'miss']

function readStats(v: unknown): StatEvent[] {
  if (!Array.isArray(v)) return []
  return v
    .filter(
      (e): e is StatEvent =>
        isObject(e) && typeof e.id === 'string' && isNum(e.pitch) && (e.hand === 'L' || e.hand === 'R') && GRADES.includes(e.grade as Grade) && isNum(e.offsetMs) && isNum(e.at),
    )
    .slice(-MAX_STATS)
}

function readPractice(v: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  if (!isObject(v)) return out
  for (const [day, secs] of Object.entries(v)) if (/^\d{4}-\d{2}-\d{2}$/.test(day) && isNum(secs) && secs > 0) out[day] = secs
  return out
}

/** What another tab saved, folded into ours: the better result always wins, nothing is lost. */
function mergeBlobs(mine: Blob, theirs: Blob): void {
  for (const key of ['lessons', 'pieces'] as const) {
    for (const [id, r] of Object.entries(theirs[key])) {
      const m = mine[key][id]
      mine[key][id] = m ? { stars: Math.max(m.stars, r.stars), best: Math.max(m.best, r.best) } : r
    }
  }
  for (const [id, p] of Object.entries(theirs.songs)) {
    const m = mine.songs[id]
    if (!m) mine.songs[id] = p
    else if (m.levels.length === p.levels.length)
      mine.songs[id] = { levels: m.levels.map((l, i) => Math.max(l, p.levels[i])), shares: m.shares.map((s, i) => Math.max(s, p.shares[i])), mastery: Math.max(m.mastery, p.mastery) }
    else if (p.mastery > m.mastery) mine.songs[id] = p
  }
  for (const [day, secs] of Object.entries(theirs.practice)) mine.practice[day] = Math.max(mine.practice[day] ?? 0, secs)
  const key = (e: StatEvent) => `${e.at}|${e.id}|${e.pitch}|${e.grade}|${e.offsetMs}`
  const seen = new Set(mine.stats.map(key))
  const extra = theirs.stats.filter((e) => !seen.has(key(e)))
  if (extra.length) mine.stats = mine.stats.concat(extra).sort((a, b) => a.at - b.at).slice(-MAX_STATS)
  mine.skill ??= theirs.skill
  mine.lastSong ??= theirs.lastSong
}

/** Everything Pianova remembers. Falls back to memory when storage is unusable. */
export class ProgressStore {
  private blob: Blob
  /** What storage held when we last read or wrote it; anything else is another tab's save. */
  private lastRaw: string | null = null
  /** Set when the save was made by a newer Pianova: it is left untouched, not overwritten. */
  readonly readOnly: boolean = false

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
    while (n <= MAX_STREAK_DAYS && met(n)) {
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
    this.lastRaw = raw
    if (raw === null) return fresh()
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      data = null
    }
    if (isObject(data) && isNum(data.version) && data.version > VERSION) {
      // Saved by a newer Pianova (an old copy is running from cache): play along in memory
      // and leave that save for the newer version to pick up again.
      ;(this as { readOnly: boolean }).readOnly = true
      return fresh()
    }
    const blob = parse(data)
    if (blob) return blob
    // Unreadable save: keep it aside rather than silently destroying it.
    try {
      this.kv?.setItem(BACKUP_KEY, raw)
    } catch {
      /* nothing more we can do */
    }
    return fresh()
  }

  private save(): void {
    if (this.readOnly || !this.kv) return
    try {
      // Another tab saved since we last looked: fold its progress in before writing ours.
      const current = this.kv.getItem(STORAGE_KEY)
      if (current !== null && current !== this.lastRaw) {
        let theirs: Blob | null = null
        try {
          theirs = parse(JSON.parse(current))
        } catch {
          /* unreadable: ours replaces it */
        }
        if (theirs) mergeBlobs(this.blob, theirs)
      }
      const raw = JSON.stringify(this.blob)
      this.kv.setItem(STORAGE_KEY, raw)
      this.lastRaw = raw
    } catch {
      /* storage full or blocked: keep going in memory */
    }
  }
}

/** A save read back field by field, or null if it is not a Pianova save this version understands. */
function parse(data: unknown): Blob | null {
  if (!isObject(data) || (data.version !== VERSION && data.version !== 1)) return null
  const blob = fresh()
  blob.lessons = readResults(data.lessons)
  blob.pieces = readResults(data.pieces)
  blob.settings = readSettings(data.settings)
  blob.stats = readStats(data.stats)
  blob.songs = readSongs(data.songs)
  if (isNum(data.skill)) blob.skill = clamp(Math.round(data.skill), 0, 4)
  blob.practice = readPractice(data.practice)
  if (typeof data.lastSong === 'string') blob.lastSong = data.lastSong
  if (data.version === 1) blob.settings.latencyMs = DEFAULT_SETTINGS.latencyMs
  return blob
}
