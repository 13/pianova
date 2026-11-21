import { grooveEvents, harmonyEvents, type BandEvent } from '../audio/band'
import type { ChordSpan } from '../chart/harmony'
import type { Chart } from '../core/types'
import { both, type Text } from '../i18n'

/**
 * Jam: the band plays a chord progression round and round in a key you choose, and you
 * play whatever you like over it. The keys that fit light up: the notes of the chord
 * sounding now, over the scale of the key.
 */
export type ProgressionId = 'pop' | 'ballad' | 'blues' | 'minor' | 'jazz'

interface Progression {
  id: ProgressionId
  name: Text
  /** Each chord as [semitones above the key note, minor?, bars]. */
  chords: [number, boolean, number][]
  /** The key is minor (its scale and its name). */
  minor: boolean
}

export const PROGRESSIONS: Progression[] = [
  { id: 'pop', name: both('Pop (I–V–vi–IV)', 'Pop (I–V–vi–IV)'), minor: false, chords: [[0, false, 1], [7, false, 1], [9, true, 1], [5, false, 1]] },
  { id: 'ballad', name: both('Ballad (I–vi–IV–V)', 'Ballade (I–vi–IV–V)'), minor: false, chords: [[0, false, 1], [9, true, 1], [5, false, 1], [7, false, 1]] },
  {
    id: 'blues',
    name: both('12-bar blues', '12-taktiger Blues'),
    minor: false,
    chords: [[0, false, 4], [5, false, 2], [0, false, 2], [7, false, 1], [5, false, 1], [0, false, 1], [7, false, 1]],
  },
  { id: 'minor', name: both('Minor (i–VI–III–VII)', 'Moll (i–VI–III–VII)'), minor: true, chords: [[0, true, 1], [8, false, 1], [3, false, 1], [10, false, 1]] },
  { id: 'jazz', name: both('Jazz turnaround (ii–V–I)', 'Jazz-Kadenz (ii–V–I)'), minor: false, chords: [[2, true, 1], [7, false, 1], [0, false, 2]] },
]

export const JAM_BPB = 4

export function progression(id: ProgressionId): Progression {
  return PROGRESSIONS.find((p) => p.id === id) ?? PROGRESSIONS[0]
}

/** One time round the progression in key `key` (0 = C), as chords placed in beats. */
export function jamChords(key: number, id: ProgressionId): ChordSpan[] {
  const spans: ChordSpan[] = []
  let beat = 0
  for (const [offset, minor, bars] of progression(id).chords) {
    spans.push({ startBeat: beat, durationBeats: bars * JAM_BPB, root: (key + offset) % 12, minor })
    beat += bars * JAM_BPB
  }
  return spans
}

/** How many beats one time round the progression lasts. */
export function jamLength(id: ProgressionId): number {
  return progression(id).chords.reduce((sum, [, , bars]) => sum + bars * JAM_BPB, 0)
}

/** The band for one time round: drums that keep going, a bass and a pad on the chords. */
export function jamBand(key: number, id: ProgressionId): BandEvent[] {
  const length = jamLength(id)
  return [...grooveEvents(JAM_BPB, length, false), ...harmonyEvents(jamChords(key, id), JAM_BPB)].sort((a, b) => a.beat - b.beat)
}

/** An empty chart one time round long, for the session that keeps the band in time. */
export function jamChart(id: ProgressionId, bpm: number): Chart {
  return { id: 'jam', title: 'Jam', bpm, beatsPerBar: JAM_BPB, notes: [], lengthBeats: jamLength(id) }
}

/**
 * The pitch classes that sound good over the progression: the key's pentatonic scale
 * (major, or minor for a minor key), which never clashes, plus the blue note in a blues.
 */
export function scaleOf(key: number, id: ProgressionId): Set<number> {
  const p = progression(id)
  const steps = p.minor ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9]
  if (id === 'blues') steps.push(3)
  return new Set(steps.map((s) => (key + s) % 12))
}

/** The pitch classes of a chord's triad. */
export function chordTones(span: { root: number; minor: boolean }): Set<number> {
  return new Set([span.root, (span.root + (span.minor ? 3 : 4)) % 12, (span.root + 7) % 12])
}

/** Whether a key you pressed fits the music right now: in the chord or the scale. */
export function fits(pitch: number, chord: { root: number; minor: boolean } | undefined, scale: Set<number>): boolean {
  const pc = ((pitch % 12) + 12) % 12
  return scale.has(pc) || (!!chord && chordTones(chord).has(pc))
}
