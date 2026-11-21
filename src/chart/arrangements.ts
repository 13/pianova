import type { Chart, ChartNote, Hand } from '../core/types'
import { both, type Text } from '../i18n'
import { noteTiers } from './difficulty'
import { harmonize, type ChordSpan } from './harmony'

/**
 * Ways to play a song, like choosing a part in a band:
 * melody — the tune in the right hand alone;
 * chords — block chords in the left hand while the tune plays along;
 * simple — the tune over one bass note per chord;
 * full — every note as written.
 */
export type ArrangementId = 'melody' | 'chords' | 'simple' | 'full'

export const ARRANGEMENTS: { id: ArrangementId; name: Text; blurb: Text }[] = [
  { id: 'melody', name: both('Melody', 'Melodie'), blurb: both('The tune alone, right hand.', 'Nur die Melodie, rechte Hand.') },
  {
    id: 'chords',
    name: both('Chords', 'Akkorde'),
    blurb: both('Left-hand chords while the tune plays along.', 'Akkorde links, die Melodie spielt mit.'),
  },
  {
    id: 'simple',
    name: both('Two hands, simple', 'Zweihändig, leicht'),
    blurb: both('The tune over one bass note per chord.', 'Die Melodie über einem Basston pro Akkord.'),
  },
  { id: 'full', name: both('Full', 'Vollständig'), blurb: both('Every note, both hands.', 'Jede Note, beide Hände.') },
]

export interface Arranged {
  chart: Chart
  /** The hands the player plays; any other hand is played for them. */
  hands: Hand[]
  /** Difficulty tier of each note (1 = always kept) for the level system. */
  tiers: number[]
}

const EPS = 1e-6

/** The hand that carries the tune: the one sitting higher on average. */
function tuneHand(chart: Chart): Hand {
  const mean = (hand: Hand) => {
    const ps = chart.notes.filter((n) => n.hand === hand).map((n) => n.pitch)
    return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : -Infinity
  }
  return mean('R') >= mean('L') ? 'R' : 'L'
}

/** The top line of the tune hand, played by the right hand. */
export function melodyLine(chart: Chart): ChartNote[] {
  const hand = tuneHand(chart)
  const tops = new Map<number, ChartNote>()
  for (const n of chart.notes) {
    if (n.hand !== hand) continue
    const key = Math.round(n.startBeat * 1e6)
    const have = tops.get(key)
    if (!have || n.pitch > have.pitch) tops.set(key, n)
  }
  const line = [...tops.values()].sort((a, b) => a.startBeat - b.startBeat)
  // A melody taken from the left hand moves up into the right hand's reach.
  const shift = hand === 'L' && line.length && Math.min(...line.map((n) => n.pitch)) < 55 ? 12 : 0
  return line.map((n, i) => {
    const next = line[i + 1]
    const room = next ? next.startBeat - n.startBeat : n.durationBeats
    return { pitch: n.pitch + shift, startBeat: n.startBeat, durationBeats: Math.min(n.durationBeats, room), hand: 'R' as Hand, finger: hand === 'R' ? n.finger : undefined }
  })
}

/** Close-position triads that move as little as possible, kept between A2 and E4. */
export function voiceChords(spans: ChordSpan[]): number[][] {
  const voicings: number[][] = []
  let prev: number[] | null = null
  for (const s of spans) {
    const pcs = [s.root, (s.root + (s.minor ? 3 : 4)) % 12, (s.root + 7) % 12]
    const options: number[][] = []
    for (let inv = 0; inv < 3; inv++) {
      const order = [pcs[inv], pcs[(inv + 1) % 3], pcs[(inv + 2) % 3]]
      for (let base = 36; base <= 60; base++) {
        if (base % 12 !== order[0]) continue
        const notes = [base]
        for (const pc of order.slice(1)) {
          let p = notes[notes.length - 1] + 1
          while (p % 12 !== pc) p++
          notes.push(p)
        }
        if (notes[0] >= 45 && notes[2] <= 62) options.push(notes)
      }
    }
    const centre = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length
    const cost = (v: number[]) =>
      prev ? v.reduce((sum, p, i) => sum + Math.abs(p - prev![i]), 0) : Math.abs(centre(v) - 52) + (v[0] % 12 === s.root ? 0 : 3)
    options.sort((a, b) => cost(a) - cost(b))
    prev = options[0]
    voicings.push(prev)
  }
  return voicings
}

/** Cuts a chord span into notes no longer than `most` beats that never cross a bar line. */
function pieces(start: number, length: number, bpb: number, most: number): [number, number][] {
  const out: [number, number][] = []
  let at = start
  const end = start + length
  while (at < end - EPS) {
    const barEnd = (Math.floor(at / bpb + EPS) + 1) * bpb
    const len = Math.min(most, end - at, barEnd - at)
    out.push([at, len])
    at += len
  }
  return out
}

function withNotes(chart: Chart, notes: ChartNote[], suffix: string): Chart {
  const sorted = [...notes].sort((a, b) => a.startBeat - b.startBeat || a.pitch - b.pitch)
  return { ...chart, id: `${chart.id}${suffix}`, notes: sorted }
}

/** A song in one of its arrangements, with the hands to play and how notes drop out at lower levels. */
export function arrangement(chart: Chart, id: ArrangementId): Arranged {
  const bpb = chart.beatsPerBar
  const strong = (beat: number) => Math.abs(beat / bpb - Math.round(beat / bpb)) < EPS
  if (id === 'full') {
    const hands = (['L', 'R'] as Hand[]).filter((hand) => chart.notes.some((n) => n.hand === hand))
    return { chart, hands, tiers: noteTiers(chart) }
  }
  const melody = melodyLine(chart)
  if (id === 'melody') {
    const c = withNotes(chart, melody, '@melody')
    // At low levels the tune keeps its downbeats, then its beats, then everything.
    const tiers = c.notes.map((n) => (strong(n.startBeat) ? 1 : Math.abs(n.startBeat - Math.round(n.startBeat)) < EPS ? 2 : 3))
    return { chart: c, hands: ['R'], tiers }
  }
  const spans = harmonize(chart)
  if (id === 'chords') {
    const voicings = voiceChords(spans)
    const chordNotes: ChartNote[] = []
    spans.forEach((s, k) => {
      for (const [start, len] of pieces(s.startBeat, s.durationBeats, bpb, bpb % 2 === 0 ? 2 : bpb)) {
        for (const pitch of voicings[k]) {
          // Where the tune already sounds that key, leave it to the tune.
          if (melody.some((m) => m.pitch === pitch && Math.abs(m.startBeat - start) < EPS)) continue
          chordNotes.push({ pitch, startBeat: start, durationBeats: len, hand: 'L' })
        }
      }
    })
    const c = withNotes(chart, [...melody, ...chordNotes], '@chords')
    // The tune is played for you and always sounds; chords start as a bass note on each bar.
    const tiers = c.notes.map((n) => {
      if (n.hand === 'R') return 1
      const group = c.notes.filter((m) => m.hand === 'L' && Math.abs(m.startBeat - n.startBeat) < EPS).map((m) => m.pitch)
      const bottom = n.pitch === Math.min(...group)
      if (bottom) return strong(n.startBeat) ? 1 : 2
      return n.pitch === Math.max(...group) ? 4 : 3
    })
    return { chart: c, hands: ['L'], tiers }
  }
  // simple: the tune plus the root of each chord, low in the left hand.
  const bass: ChartNote[] = []
  for (const s of spans) {
    let pitch = 48 + s.root
    if (pitch > 55) pitch -= 12
    for (const [start, len] of pieces(s.startBeat, s.durationBeats, bpb, bpb)) bass.push({ pitch, startBeat: start, durationBeats: len, hand: 'L' })
  }
  const c = withNotes(chart, [...melody, ...bass], '@simple')
  const tiers = c.notes.map((n) => (n.hand === 'L' ? (strong(n.startBeat) ? 2 : 3) : strong(n.startBeat) ? 1 : 2))
  return { chart: c, hands: ['L', 'R'], tiers }
}
