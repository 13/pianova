import type { Chart, Hand } from '../core/types'
import type { Section } from './sections'

/**
 * Dynamic difficulty: every song can be played at five levels, from a bare outline of
 * the tune up to the full arrangement. Each note gets a tier, the lowest level it appears
 * at; each part of the song has its own level, so the parts you know well fill in while
 * the hard ones stay simple.
 *
 *   1  the tune's strong beats (the first and middle of each bar, and long notes)
 *   2  the tune on every beat
 *   3  the whole tune, plus the bass note at the start of each bar
 *   4  the bass on every beat, and the bottom notes of the tune's chords
 *   5  everything
 */
export const MAX_LEVEL = 5

export function noteTiers(chart: Chart): number[] {
  const notes = chart.notes
  const bpb = chart.beatsPerBar
  const mean = (hand: Hand) => {
    const ps = notes.filter((n) => n.hand === hand).map((n) => n.pitch)
    return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : -Infinity
  }
  // The tune is in the higher hand; a one-handed piece is all tune.
  const tune: Hand = mean('R') >= mean('L') ? 'R' : 'L'

  // Chord shapes: which notes start together in the same hand.
  const groups = new Map<string, number[]>()
  notes.forEach((n, i) => {
    const key = `${n.hand}|${Math.round(n.startBeat * 1e6)}`
    groups.set(key, [...(groups.get(key) ?? []), i])
  })

  return notes.map((n) => {
    const group = groups.get(`${n.hand}|${Math.round(n.startBeat * 1e6)}`)!
    const pitches = group.map((j) => notes[j].pitch)
    const top = n.pitch === Math.max(...pitches)
    const bottom = n.pitch === Math.min(...pitches)
    const inBar = ((n.startBeat % bpb) + bpb) % bpb
    const onBeat = Math.abs(inBar - Math.round(inBar)) < 1e-6
    const downbeat = inBar < 1e-6
    const strong = downbeat || (bpb % 2 === 0 && Math.abs(inBar - bpb / 2) < 1e-6) || n.durationBeats >= 2
    if (n.hand === tune) {
      if (top) return strong ? 1 : onBeat ? 2 : 3
      return bottom ? 4 : 5
    }
    if (bottom) return downbeat ? 3 : onBeat ? 4 : 5
    return 5
  })
}

export interface Arrangement {
  chart: Chart
  /** For each note of the arranged chart, its index in the full chart. */
  source: number[]
}

/**
 * The song with each part at its own level. A part never ends up empty: if its level
 * leaves nothing to play, its simplest notes are kept.
 */
export function arrange(chart: Chart, sections: Section[], levels: number[], tiers = noteTiers(chart)): Arrangement {
  const keep = new Set<number>()
  sections.forEach((s, k) => {
    const level = levels[k] ?? MAX_LEVEL
    let picked = s.notes.filter((i) => tiers[i] <= level)
    if (!picked.length && s.notes.length) {
      const easiest = Math.min(...s.notes.map((i) => tiers[i]))
      picked = s.notes.filter((i) => tiers[i] === easiest)
    }
    for (const i of picked) keep.add(i)
  })
  const source = chart.notes.map((_, i) => i).filter((i) => keep.has(i))
  return { chart: { ...chart, notes: source.map((i) => chart.notes[i]) }, source }
}

/** How many of a part's notes are played at a level. */
export function notesAtLevel(section: Section, level: number, tiers: number[]): number {
  const n = section.notes.filter((i) => tiers[i] <= level).length
  return n || (section.notes.length ? section.notes.filter((i) => tiers[i] === Math.min(...section.notes.map((j) => tiers[j]))).length : 0)
}

/**
 * Mastery, 0..1: how much of the real song you have shown you can play. Each part counts
 * by its full number of notes; `shares` holds, per part, the best fraction of those notes
 * played right so far.
 */
export function mastery(sections: Section[], shares: number[]): number {
  let total = 0
  let got = 0
  sections.forEach((s, k) => {
    total += s.notes.length
    got += s.notes.length * Math.min(1, shares[k] ?? 0)
  })
  return total ? got / total : 0
}

/** The share of a part's real notes covered by playing it at `level` with `accuracy`. */
export function shareFor(section: Section, level: number, accuracy: number, tiers: number[]): number {
  return section.notes.length ? (notesAtLevel(section, level, tiers) / section.notes.length) * accuracy : 0
}
