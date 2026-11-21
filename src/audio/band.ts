import { harmonize } from '../chart/harmony'
import type { BackingNote, Chart, Hand } from '../core/types'

export type DrumSound = 'kick' | 'snare' | 'hat' | 'tom' | 'crash'
export type PitchedSound = 'bass' | 'pad' | 'keys' | 'strings' | 'organ' | 'guitar' | 'brass' | 'lead'
export type BandSound = DrumSound | PitchedSound

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

/** The kit piece a General MIDI drum note is played on. */
export function drumFor(pitch: number): DrumSound {
  if (pitch === 35 || pitch === 36) return 'kick'
  if (pitch >= 37 && pitch <= 40) return 'snare'
  if ([41, 43, 45, 47, 48, 50].includes(pitch)) return 'tom'
  if ([49, 52, 55, 57].includes(pitch)) return 'crash'
  return 'hat'
}

/** The song's own backing (other instruments, notes left out at a level) as band sounds. */
export function backingEvents(backing: BackingNote[]): BandEvent[] {
  return backing.map((n) =>
    n.voice === 'drums'
      ? { beat: n.startBeat, sound: drumFor(n.pitch), pitches: [n.pitch], durationBeats: 0.25, velocity: n.velocity }
      : { beat: n.startBeat, sound: n.voice, pitches: [n.pitch], durationBeats: n.durationBeats, velocity: n.velocity },
  )
}

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
 * Everything that plays along with you: the song's own backing (an imported file's other
 * instruments, the notes a lower level leaves out of your part), and a band generated
 * from the song itself — drums in a groove for its metre, a bass that plays the root of
 * each chord (and the fifth halfway through a 4/4 bar), and a soft pad holding the chord.
 * The generated band follows the harmony the notes imply, so any song gets one that fits,
 * and it steps back from whatever the song's own backing already plays: no second drummer
 * over the file's drums, no second bass over its bass, no pad over its strings.
 *
 * With `generated` false only the song's own backing is returned.
 */
export function bandFor(chart: Chart, generated = true): BandEvent[] {
  const backing = chart.backing ?? []
  const events = backingEvents(backing)
  if (!generated) return events.sort((a, b) => a.beat - b.beat)
  const has = (pred: (n: BackingNote) => boolean) => backing.some(pred)
  const drums = !has((n) => n.voice === 'drums')
  const bass = !has((n) => n.voice === 'bass')
  // Piano notes left out at a level do not count: the band still plays under them.
  const pad = !has((n) => n.voice !== 'drums' && n.voice !== 'bass' && n.voice !== 'keys')
  const bpb = chart.beatsPerBar
  const end = chart.lengthBeats
  const bars = Math.ceil(end / bpb - EPS)
  for (let bar = 0; drums && bar < bars; bar++) {
    const last = bar === bars - 1
    for (const [at, sound, velocity] of groove(bpb)) {
      const beat = bar * bpb + at
      // The last bar rings out on its downbeat.
      if (beat >= end - EPS || (last && at > 0)) continue
      events.push({ beat, sound, pitches: [], durationBeats: 0.25, velocity: last && sound === 'kick' ? 1 : velocity })
    }
  }
  // The chords come from all of the song's piano notes, the ones left out at a level too.
  const keys = backing.filter((n) => n.voice === 'keys').map((n) => ({ pitch: n.pitch, startBeat: n.startBeat, durationBeats: n.durationBeats, hand: (n.pitch < 60 ? 'L' : 'R') as Hand }))
  const whole = keys.length ? { ...chart, notes: [...chart.notes, ...keys].sort((a, b) => a.startBeat - b.startBeat || a.pitch - b.pitch) } : chart
  for (const span of pad || bass ? harmonize(whole) : []) {
    let root = 36 + span.root
    if (root > 43) root -= 12
    const third = span.root + (span.minor ? 3 : 4)
    // Pad: the triad in a close voicing around G3–G4.
    const chord = [span.root, third, span.root + 7].map((pc) => {
      let p = 55 + (((pc - 55) % 12) + 12) % 12
      if (p > 66) p -= 12
      return p
    })
    if (pad) events.push({ beat: span.startBeat, sound: 'pad', pitches: chord.sort((a, b) => a - b), durationBeats: span.durationBeats, velocity: 0.6 })
    if (!bass) continue
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
