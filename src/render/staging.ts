import { isBlack } from '../core/pitch'
import type { Chart, Hand } from '../core/types'
import { noteIndex, noteSpan, type Span } from '../chart/window'
import type { Grade } from '../judge/judge'
import { noteLetter, t } from '../i18n'

/**
 * Pure helpers that decide what the highway shows: chord brackets, where each hand
 * rests, which part of the keyboard the camera frames, streak milestones and timing words.
 */

const CHORDS: [number[], string][] = [
  [[0, 4, 7], ''],
  [[0, 3, 7], 'm'],
  [[0, 3, 6], 'dim'],
  [[0, 4, 8], '+'],
  [[0, 5, 7], 'sus4'],
  [[0, 2, 7], 'sus2'],
  [[0, 4, 7, 10], '7'],
  [[0, 4, 7, 11], 'maj7'],
  [[0, 3, 7, 10], 'm7'],
  [[0, 7], '5'],
]

/** 'C', 'Am', 'G7', 'C/E'… for the pitches of a chord, or null for a shape with no common name. */
export function chordName(pitches: number[]): string | null {
  if (pitches.length < 2) return null
  const pcs = [...new Set(pitches.map((p) => ((p % 12) + 12) % 12))]
  const bass = ((Math.min(...pitches) % 12) + 12) % 12
  let found: { root: number; suffix: string } | null = null
  for (const root of pcs) {
    const shape = pcs.map((pc) => (pc - root + 12) % 12).sort((a, b) => a - b)
    const match = CHORDS.find(([intervals]) => intervals.length === shape.length && intervals.every((v, i) => v === shape[i]))
    if (!match) continue
    // Of several readings (C F G is Csus4 or Fsus2), the one built on the bass wins.
    if (!found || root === bass) found = { root, suffix: match[1] }
    if (root === bass) break
  }
  if (!found) return null
  const name = noteLetter(found.root) + found.suffix
  return found.root === bass ? name : `${name}/${noteLetter(bass)}`
}

export interface ChordGroup {
  startBeat: number
  hand: Hand
  /** Indices into chart.notes. */
  notes: number[]
  lo: number
  hi: number
  name: string | null
}

/** Notes of one hand that start together, two or more at a time. */
export function chordGroups(chart: Chart): ChordGroup[] {
  const byKey = new Map<string, number[]>()
  chart.notes.forEach((n, i) => {
    const key = `${n.hand}|${Math.round(n.startBeat * 1e6)}`
    const list = byKey.get(key)
    if (list) list.push(i)
    else byKey.set(key, [i])
  })
  const groups: ChordGroup[] = []
  for (const indices of byKey.values()) {
    if (indices.length < 2) continue
    const pitches = indices.map((i) => chart.notes[i].pitch)
    const first = chart.notes[indices[0]]
    groups.push({
      startBeat: first.startBeat,
      hand: first.hand,
      notes: indices,
      lo: Math.min(...pitches),
      hi: Math.max(...pitches),
      name: chordName(pitches),
    })
  }
  return groups.sort((a, b) => a.startBeat - b.startBeat || a.hand.localeCompare(b.hand))
}

export interface Range {
  lo: number
  hi: number
}

const span: Span = { lo: 0, hi: 0 }

/**
 * Lowest and highest pitch of the notes (of `hand`, if given) still sounding at `beat`
 * or starting within `window` beats of it, written to `out`. False if there are none.
 * Visits only the notes near `beat`, so it is cheap enough to run every frame.
 */
function upcoming(chart: Chart, beat: number, window: number, hand: Hand | undefined, out: Range): boolean {
  const { order } = noteIndex(chart)
  const notes = chart.notes
  noteSpan(chart, beat, beat + window, span)
  let lo = Infinity
  let hi = -Infinity
  for (let k = span.lo; k < span.hi; k++) {
    const n = notes[order[k]]
    if (hand && n.hand !== hand) continue
    if (n.startBeat + n.durationBeats > beat && n.startBeat < beat + window) {
      if (n.pitch < lo) lo = n.pitch
      if (n.pitch > hi) hi = n.pitch
    }
  }
  if (lo === Infinity) return false
  out.lo = lo
  out.hi = hi
  return true
}

const HAND_WHITES = 5
const HANDS: Hand[] = ['L', 'R']

function whitesIn(lo: number, hi: number): number {
  let count = 0
  for (let p = lo; p <= hi; p++) if (!isBlack(p)) count++
  return count
}

/**
 * Where each hand will be playing soon: its notes, widened to at least a five-finger reach.
 * Pass `out` (as a frame loop does) to reuse its range objects instead of allocating.
 */
export function handZones(chart: Chart, beat: number, window: number, out: Partial<Record<Hand, Range>> = {}): Partial<Record<Hand, Range>> {
  for (const hand of HANDS) {
    const r = out[hand] ?? { lo: 0, hi: 0 }
    if (!upcoming(chart, beat, window, hand, r)) {
      delete out[hand]
      continue
    }
    let { lo, hi } = r
    // Grow one white key at a time, below then above, until a hand fits.
    for (let down = true; whitesIn(lo, hi) < HAND_WHITES; down = !down) {
      if (down) do lo--; while (isBlack(lo))
      else do hi++; while (isBlack(hi))
    }
    r.lo = lo
    r.hi = hi
    out[hand] = r
  }
  return out
}

/** The span of keys the music needs over the next `window` beats, or null if nothing is coming. */
export function focusRange(chart: Chart, beat: number, window: number, out: Range = { lo: 0, hi: 0 }): Range | null {
  return upcoming(chart, beat, window, undefined, out) ? out : null
}

/** The milestone (10, 25, 50, then every 50) just reached going from `prev` to `streak`, if any. */
export function streakMilestone(prev: number, streak: number): number | null {
  if (streak <= prev) return null
  let hit: number | null = null
  for (const m of [10, 25]) if (prev < m && streak >= m) hit = m
  const fifty = Math.floor(streak / 50) * 50
  if (fifty >= 50 && prev < fifty) hit = fifty
  return hit
}

export type Tone = 'ok' | 'warn' | 'bad'

/** The word that floats up from a key after it is judged. */
export function timingLabel(grade: Grade, offsetMs: number, timed: boolean): { text: string; tone: Tone } {
  if (grade === 'miss') return { text: t('Miss', 'Daneben'), tone: 'bad' }
  if (!timed) return { text: t('Nice', 'Gut'), tone: 'ok' }
  if (grade === 'perfect') return { text: t('Perfect', 'Perfekt'), tone: 'ok' }
  return { text: offsetMs < 0 ? t('Early', 'Früh') : t('Late', 'Spät'), tone: 'warn' }
}
