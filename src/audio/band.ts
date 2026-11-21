import { harmonize } from '../chart/harmony'
import type { Chart } from '../core/types'

export type BandSound = 'kick' | 'snare' | 'hat' | 'bass' | 'pad'

/** One sound of the backing band, placed in beats like a chart note. */
export interface BandEvent {
  beat: number
  sound: BandSound
  /** Pitches for bass and pad; empty for drums. */
  pitches: number[]
  durationBeats: number
  /** 0..1 */
  velocity: number
}

const EPS = 1e-6

/** Drum hits for one bar: [beat in bar, sound, velocity]. */
function groove(bpb: number): [number, BandSound, number][] {
  if (bpb === 4)
    return [
      [0, 'kick', 1],
      [1, 'snare', 0.8],
      [2, 'kick', 0.85],
      [2.5, 'kick', 0.45],
      [3, 'snare', 0.8],
      ...[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b): [number, BandSound, number] => [b, 'hat', b % 1 ? 0.45 : 0.7]),
    ]
  if (bpb === 3)
    return [
      [0, 'kick', 1],
      [1, 'hat', 0.6],
      [1, 'snare', 0.35],
      [2, 'hat', 0.6],
      [2, 'snare', 0.35],
    ]
  if (bpb === 2)
    return [
      [0, 'kick', 1],
      [1, 'snare', 0.75],
      ...[0, 0.5, 1, 1.5].map((b): [number, BandSound, number] => [b, 'hat', b % 1 ? 0.45 : 0.65]),
    ]
  return [[0, 'kick', 1], ...Array.from({ length: bpb }, (_, b): [number, BandSound, number] => [b, 'hat', 0.6])]
}

/**
 * A backing band generated from the song itself: drums in a groove for its metre, a bass
 * that plays the root of each chord (and the fifth halfway through a 4/4 bar), and a soft
 * pad holding the chord. It follows the harmony the notes imply, so any song or imported
 * file gets a band that fits.
 */
export function bandFor(chart: Chart): BandEvent[] {
  const bpb = chart.beatsPerBar
  const end = chart.lengthBeats
  const events: BandEvent[] = []
  const bars = Math.ceil(end / bpb - EPS)
  for (let bar = 0; bar < bars; bar++) {
    const last = bar === bars - 1
    for (const [at, sound, velocity] of groove(bpb)) {
      const beat = bar * bpb + at
      // The last bar rings out on its downbeat.
      if (beat >= end - EPS || (last && at > 0)) continue
      events.push({ beat, sound, pitches: [], durationBeats: 0.25, velocity: last && sound === 'kick' ? 1 : velocity })
    }
  }
  for (const span of harmonize(chart)) {
    let root = 36 + span.root
    if (root > 43) root -= 12
    const third = span.root + (span.minor ? 3 : 4)
    // Pad: the triad in a close voicing around G3–G4.
    const pad = [span.root, third, span.root + 7].map((pc) => {
      let p = 55 + (((pc - 55) % 12) + 12) % 12
      if (p > 66) p -= 12
      return p
    })
    events.push({ beat: span.startBeat, sound: 'pad', pitches: pad.sort((a, b) => a - b), durationBeats: span.durationBeats, velocity: 0.6 })
    // Bass: root on each bar (or chord) start, the fifth on beat 3 of a long 4/4 stretch.
    for (let beat = span.startBeat; beat < span.startBeat + span.durationBeats - EPS; ) {
      const barEnd = (Math.floor(beat / bpb + EPS) + 1) * bpb
      const stop = Math.min(barEnd, span.startBeat + span.durationBeats)
      const len = stop - beat
      if (bpb === 4 && len >= 4 - EPS) {
        events.push({ beat, sound: 'bass', pitches: [root], durationBeats: 1.9, velocity: 0.9 })
        events.push({ beat: beat + 2, sound: 'bass', pitches: [root + 7], durationBeats: 1.9, velocity: 0.75 })
      } else {
        events.push({ beat, sound: 'bass', pitches: [root], durationBeats: len * 0.95, velocity: 0.9 })
      }
      beat = stop
    }
  }
  return events.sort((a, b) => a.beat - b.beat)
}
