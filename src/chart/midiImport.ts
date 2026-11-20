import type { Chart, ChartNote, Hand } from '../core/types'

/** The part of @tonejs/midi's parsed file that we read. */
export interface MidiJson {
  header: {
    ppq: number
    tempos: { bpm: number }[]
    timeSignatures: { timeSignature: number[] }[]
  }
  tracks: { notes: { midi: number; ticks: number; durationTicks: number }[] }[]
}

const PIANO_LOW = 21
const PIANO_HIGH = 108
const MIDDLE_C = 60
const MIN_BEATS = 0.05

/**
 * Converts a parsed MIDI file into a chart. Positions come from ticks, so they stay
 * right in beats even when the file changes tempo; playback uses the first tempo.
 */
export function chartFromMidiJson(midi: MidiJson, title: string): Chart {
  const ppq = midi.header.ppq > 0 ? midi.header.ppq : 480
  const tracks = midi.tracks.filter((t) => t.notes.length > 0)
  // Two tracks is the usual right-hand / left-hand layout; anything else we split by pitch.
  const byTrack = tracks.length === 2
  const seen = new Set<string>()
  const notes: ChartNote[] = []
  tracks.forEach((track, t) => {
    for (const n of track.notes) {
      if (n.midi < PIANO_LOW || n.midi > PIANO_HIGH) continue
      const key = `${n.midi}@${n.ticks}`
      if (seen.has(key)) continue
      seen.add(key)
      const hand: Hand = byTrack ? (t === 0 ? 'R' : 'L') : n.midi >= MIDDLE_C ? 'R' : 'L'
      notes.push({ pitch: n.midi, startBeat: n.ticks / ppq, durationBeats: Math.max(MIN_BEATS, n.durationTicks / ppq), hand })
    }
  })
  if (notes.length === 0) throw new Error('No notes found in this file')
  notes.sort((a, b) => a.startBeat - b.startBeat || a.pitch - b.pitch)

  const [num, den] = midi.header.timeSignatures[0]?.timeSignature ?? [4, 4]
  const beatsPerBar = Math.max(1, Math.round((num * 4) / (den || 4))) || 4
  const lead = Math.floor(notes[0].startBeat / beatsPerBar) * beatsPerBar
  for (const n of notes) n.startBeat -= lead

  const bpm = midi.header.tempos[0]?.bpm
  const end = notes.reduce((m, n) => Math.max(m, n.startBeat + n.durationBeats), 0)
  return {
    id: 'import',
    title,
    bpm: bpm && bpm > 0 && Number.isFinite(bpm) ? Math.round(bpm * 100) / 100 : 120,
    beatsPerBar,
    notes,
    lengthBeats: Math.max(beatsPerBar, Math.ceil(end / beatsPerBar - 1e-9) * beatsPerBar),
  }
}

/** Reads a .mid file chosen by the user. Rejects with a readable message. */
export async function chartFromMidiFile(file: File): Promise<Chart> {
  const { Midi } = await import('@tonejs/midi')
  let parsed: MidiJson
  try {
    parsed = new Midi(await file.arrayBuffer()) as unknown as MidiJson
  } catch {
    throw new Error('This does not look like a MIDI file')
  }
  return chartFromMidiJson(parsed, file.name.replace(/\.(mid|midi)$/i, ''))
}
