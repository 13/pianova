import type { Chart, ChartNote, Hand } from '../core/types'
import { t as tx } from '../i18n'

/** The part of @tonejs/midi's parsed file that we read. */
export interface MidiJson {
  header: {
    ppq: number
    tempos: { bpm: number }[]
    timeSignatures: { timeSignature: number[] }[]
  }
  tracks: {
    name?: string
    channel?: number
    instrument?: { name?: string; family?: string; percussion?: boolean }
    notes: { midi: number; ticks: number; durationTicks: number }[]
  }[]
}

/** What to do with one track: give it to a hand, split it at middle C, or leave it out. */
export type TrackRole = 'R' | 'L' | 'split' | 'off'

export interface TrackInfo {
  /** Index into `MidiJson.tracks`. */
  index: number
  name: string
  instrument: string
  notes: number
  percussion: boolean
  /** The suggested role. */
  role: TrackRole
}

const PIANO_LOW = 21
const PIANO_HIGH = 108
const MIDDLE_C = 60
const MIN_BEATS = 0.05
/** MIDI channel 10 (9 counting from 0) is drums by convention. */
const DRUM_CHANNEL = 9

/**
 * Limits that keep an odd or hostile file from locking up the page: parsing is
 * synchronous, and the band, harmony and sections all scale with the song's length.
 * Real piano files are far below every one of them.
 */
export const MAX_FILE_BYTES = 4 * 1024 * 1024
export const MAX_NOTES = 20_000
/** About 2,000 bars of 4/4: over an hour at a moderate tempo. */
export const MAX_BEATS = 8_000
/** A note held longer than this (eight bars of 4/4) is cut short; usually a missing note-off. */
export const MAX_NOTE_BEATS = 32

/**
 * The tracks that have notes, each with a suggested role. Drums are left out. Two
 * tracks are taken as right hand then left hand; one is split at middle C; with more,
 * the piano tracks are split and the rest (strings, bass, …) left out, unless there
 * are no piano tracks, in which case everything is split.
 */
export function describeTracks(midi: MidiJson): TrackInfo[] {
  const tracks = midi.tracks
    .map((t, index) => {
      const percussion = !!t.instrument?.percussion || t.channel === DRUM_CHANNEL
      return {
        index,
        name: t.name?.trim() || `Track ${index + 1}`,
        instrument: percussion ? 'Drums' : t.instrument?.name || 'Piano',
        notes: t.notes.length,
        percussion,
        family: t.instrument?.family,
        role: 'off' as TrackRole,
      }
    })
    .filter((t) => t.notes > 0)
  const tonal = tracks.filter((t) => !t.percussion)
  if (tonal.length === 2) {
    tonal[0].role = 'R'
    tonal[1].role = 'L'
  } else {
    // Without instrument info every track counts as piano.
    const piano = tonal.filter((t) => !t.family || t.family === 'piano')
    for (const t of piano.length ? piano : tonal) t.role = 'split'
  }
  return tracks.map(({ family: _family, ...t }) => t)
}

/**
 * Converts a parsed MIDI file into a chart. Positions come from ticks, so they stay
 * right in beats even when the file changes tempo; playback uses the first tempo.
 * `roles` (by track index) defaults to `describeTracks`' suggestions.
 */
export function chartFromMidiJson(midi: MidiJson, title: string, roles?: Record<number, TrackRole>): Chart {
  const ppq = midi.header.ppq > 0 ? midi.header.ppq : 480
  const role = roles ?? Object.fromEntries(describeTracks(midi).map((t) => [t.index, t.role]))
  const seen = new Set<string>()
  const notes: ChartNote[] = []
  midi.tracks.forEach((track, t) => {
    const r = role[t] ?? 'off'
    if (r === 'off') return
    for (const n of track.notes) {
      if (n.midi < PIANO_LOW || n.midi > PIANO_HIGH) continue
      if (!Number.isFinite(n.ticks) || n.ticks < 0) continue
      const key = `${n.midi}@${n.ticks}`
      if (seen.has(key)) continue
      seen.add(key)
      const hand: Hand = r === 'split' ? (n.midi >= MIDDLE_C ? 'R' : 'L') : r
      const beats = n.durationTicks / ppq
      const durationBeats = Number.isFinite(beats) ? Math.min(MAX_NOTE_BEATS, Math.max(MIN_BEATS, beats)) : MIN_BEATS
      notes.push({ pitch: n.midi, startBeat: n.ticks / ppq, durationBeats, hand })
      if (notes.length > MAX_NOTES) throw new Error(tooMany())
    }
  })
  if (notes.length === 0) throw new Error(noNotes())
  notes.sort((a, b) => a.startBeat - b.startBeat || a.pitch - b.pitch)

  const [num, den] = midi.header.timeSignatures[0]?.timeSignature ?? [4, 4]
  const beatsPerBar = Math.max(1, Math.round((num * 4) / (den || 4))) || 4
  const lead = Math.floor(notes[0].startBeat / beatsPerBar) * beatsPerBar
  for (const n of notes) n.startBeat -= lead

  const bpm = midi.header.tempos[0]?.bpm
  const end = notes.reduce((m, n) => Math.max(m, n.startBeat + n.durationBeats), 0)
  if (end > MAX_BEATS) throw new Error(tx('This song is too long to learn here (more than about 2,000 bars)', 'Dieses Lied ist zu lang zum Lernen (mehr als etwa 2.000 Takte)'))
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
export async function readMidiFile(file: File): Promise<{ midi: MidiJson; title: string }> {
  if (file.size > MAX_FILE_BYTES) throw new Error(tx('The file is too big for a MIDI file (over 4 MB)', 'Die Datei ist zu groß für eine MIDI-Datei (über 4 MB)'))
  const { Midi } = await import('@tonejs/midi')
  let midi: MidiJson
  try {
    midi = new Midi(await file.arrayBuffer()) as unknown as MidiJson
  } catch {
    throw new Error(tx('This does not look like a MIDI file', 'Das sieht nicht nach einer MIDI-Datei aus'))
  }
  const tracks = describeTracks(midi)
  if (!tracks.some((t) => !t.percussion)) throw new Error(noNotes())
  if (tracks.reduce((sum, t) => sum + t.notes, 0) > MAX_NOTES * 4) throw new Error(tooMany())
  return { midi, title: file.name.replace(/\.(mid|midi)$/i, '') }
}

const noNotes = () => tx('No notes found in this file', 'In dieser Datei sind keine Noten')
const tooMany = () => tx(`This file has too many notes to learn here (more than ${MAX_NOTES.toLocaleString('en')})`, `Diese Datei hat zu viele Noten zum Lernen (mehr als ${MAX_NOTES.toLocaleString('de')})`)
