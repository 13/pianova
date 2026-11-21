import { isBlack } from '../core/pitch'
import type { Chart, Hand } from '../core/types'
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

/** Notes still sounding at `beat` or starting within `window` beats of it. */
function upcoming(chart: Chart, beat: number, window: number, hand?: Hand): number[] {
  const pitches: number[] = []
  for (const n of chart.notes) {
    if (hand && n.hand !== hand) continue
    if (n.startBeat + n.durationBeats > beat && n.startBeat < beat + window) pitches.push(n.pitch)
  }
  return pitches
}

export interface Range {
  lo: number
  hi: number
}

const HAND_WHITES = 5

/** Where each hand will be playing soon: its notes, widened to at least a five-finger reach. */
export function handZones(chart: Chart, beat: number, window: number): Partial<Record<Hand, Range>> {
  const zones: Partial<Record<Hand, Range>> = {}
  for (const hand of ['L', 'R'] as Hand[]) {
    const pitches = upcoming(chart, beat, window, hand)
    if (!pitches.length) continue
    let lo = Math.min(...pitches)
    let hi = Math.max(...pitches)
    const whites = () => {
      let count = 0
      for (let p = lo; p <= hi; p++) if (!isBlack(p)) count++
      return count
    }
    // Grow one white key at a time, below then above, until a hand fits.
    for (let down = true; whites() < HAND_WHITES; down = !down) {
      if (down) do lo--; while (isBlack(lo))
      else do hi++; while (isBlack(hi))
    }
    zones[hand] = { lo, hi }
  }
  return zones
}

/** The span of keys the music needs over the next `window` beats, or null if nothing is coming. */
export function focusRange(chart: Chart, beat: number, window: number): Range | null {
  const pitches = upcoming(chart, beat, window)
  return pitches.length ? { lo: Math.min(...pitches), hi: Math.max(...pitches) } : null
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
