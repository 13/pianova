/**
 * Reads the song files in the `songs/` folder into the shape a MIDI import has, so they
 * go through the same track roles, band and arrangements as an opened .mid file.
 *
 * Runs when the app is built (and in the dev server), never in the browser: the Guitar
 * Pro reader is large, and the site only needs the notes it finds.
 */
import * as alphaTab from '@coderline/alphatab'
import * as tonejs from '@tonejs/midi'
import type { MidiJson } from '../chart/midiImport'

// @tonejs/midi is CommonJS: plain Node (which loads vite.config) only offers it as `default`.
const { Midi } = (tonejs as typeof tonejs & { default?: typeof tonejs }).default ?? tonejs
type Midi = InstanceType<typeof Midi>

export interface SongFile {
  title: string
  artist: string
  midi: MidiJson
}

const GUITAR_PRO = ['gp', 'gp3', 'gp4', 'gp5', 'gpx']
const MIDI = ['mid', 'midi']
/** File extensions the songs folder reads. */
export const SONG_EXTENSIONS = [...GUITAR_PRO, ...MIDI]

/** The song in a file's bytes; `name` is its file name. Throws when it cannot be read. */
export function readSongFile(name: string, bytes: Uint8Array): SongFile {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const fallback = name.replace(/\.[^.]+$/, '')
  if (MIDI.includes(ext)) return { ...songName(fallback), midi: slim(new Midi(bytes)) }
  if (GUITAR_PRO.includes(ext)) return readGuitarPro(bytes, fallback)
  throw new Error(`not a song file: ${name}`)
}

/**
 * The title and artist a MIDI file's name gives, which is all a MIDI file usually says:
 * "Mad World By_ Gary Jules" (a "By:" that cannot be in a file name), "Gary Jules - Mad
 * World". Download-site tags, dates and "midi" words are left out
 * ("Gary-Jules-Mad-World-VisionMidis-20220731211542-nonstop2k.com" is "Gary Jules Mad World").
 */
export function songName(name: string): { title: string; artist: string } {
  const by = name.match(/^(.+?)\s+by[_:]\s*(.+)$/i)
  if (by) return { title: tidy(by[1]), artist: tidy(by[2]) }
  const dash = name.match(/^(.+?)\s+-\s+(.+)$/)
  if (dash) return { title: tidy(dash[2]), artist: tidy(dash[1]) }
  return { title: tidy(name) || name, artist: '' }
}

/**
 * A title that starts with an artist named by another song ("Gary Jules Mad World", with a
 * Guitar Pro file by Gary Jules beside it) as that artist's song ("Mad World").
 */
export function knownArtist(song: { title: string; artist: string }, artists: readonly string[]): { title: string; artist: string } {
  if (song.artist) return song
  for (const artist of artists) {
    if (!artist || song.title.length <= artist.length + 1) continue
    if (song.title.toLowerCase().startsWith(artist.toLowerCase() + ' ')) return { title: song.title.slice(artist.length + 1), artist }
  }
  return song
}

function tidy(text: string): string {
  return text
    .replace(/\w+\.(com|net|org|info|de|ru|uk|fr|it|nl|es)\b/gi, ' ')
    .split(/[\s_-]+/)
    .filter((word) => word && !/^\d{6,}$/.test(word) && !/midi/i.test(word))
    .join(' ')
}

/**
 * A Guitar Pro score played through: repeats and alternate endings in order, ties held,
 * let-ring and palm mutes as they sound. Dead (muted, "x") notes are left out; they are
 * a guitarist's percussion, not keys to press.
 */
function readGuitarPro(bytes: Uint8Array, fallback: string): SongFile {
  const settings = new alphaTab.Settings()
  const score = alphaTab.importer.ScoreLoader.loadScoreFromBytes(bytes, settings)
  for (const track of score.tracks)
    for (const staff of track.staves)
      for (const bar of staff.bars)
        for (const voice of bar.voices) for (const beat of voice.beats) for (const note of beat.notes.filter((n) => n.isDead)) beat.removeNote(note)

  const file = new alphaTab.midi.MidiFile()
  file.format = alphaTab.midi.MidiFileFormat.MultiTrack
  new alphaTab.midi.MidiFileGenerator(score, settings, new alphaTab.midi.AlphaSynthMidiFileHandler(file, true)).generate()

  let bpm = score.tempo
  // Events land in the MIDI track of their score track. Each note-off ends the oldest
  // sounding note of its key, so a note struck again as the last one stops pairs right
  // whichever of the two events comes first.
  const notes = score.tracks.map(() => [] as MidiJson['tracks'][number]['notes'])
  const sounding = new Map<string, { ticks: number; velocity: number }[]>()
  for (const e of file.events) {
    if (e instanceof alphaTab.midi.TempoChangeEvent) {
      if (e.tick === 0) bpm = e.beatsPerMinute
      continue
    }
    if (!(e instanceof alphaTab.midi.NoteOnEvent || e instanceof alphaTab.midi.NoteOffEvent) || !notes[e.track]) continue
    const key = `${e.track}:${e.channel}:${e.noteKey}`
    const queue = sounding.get(key) ?? []
    sounding.set(key, queue)
    if (e instanceof alphaTab.midi.NoteOnEvent && e.noteVelocity > 0) {
      queue.push({ ticks: e.tick, velocity: round(e.noteVelocity / 127) })
      continue
    }
    const start = queue.shift()
    if (start) notes[e.track].push({ midi: e.noteKey, ticks: start.ticks, durationTicks: e.tick - start.ticks, velocity: start.velocity })
  }

  const bar = score.masterBars[0]
  return {
    title: score.title.trim() || fallback,
    artist: score.artist.trim(),
    midi: {
      header: {
        ppq: file.division,
        tempos: [{ bpm: round(bpm) }],
        timeSignatures: bar ? [{ timeSignature: [bar.timeSignatureNumerator, bar.timeSignatureDenominator] }] : [],
      },
      tracks: score.tracks.map((track, i) => {
        const percussion = track.staves.some((s) => s.isPercussion)
        return {
          name: track.name.trim(),
          channel: percussion ? 9 : track.playbackInfo.primaryChannel,
          instrument: { ...instrument(track.playbackInfo.program), percussion },
          notes: notes[i].sort((a, b) => a.ticks - b.ticks || a.midi - b.midi),
        }
      }),
    },
  }
}

/** A General MIDI program's name and family ("piano", "guitar", …), as @tonejs/midi names them. */
function instrument(program: number): { name: string; family: string } {
  const track = new Midi().addTrack()
  track.instrument.number = Math.max(0, Math.min(127, program))
  return { name: track.instrument.name, family: track.instrument.family }
}

/** Just the parts of a parsed MIDI file that `chartFromMidiJson` reads. */
function slim(midi: Midi): MidiJson {
  return {
    header: {
      ppq: midi.header.ppq,
      tempos: midi.header.tempos.slice(0, 1).map((t) => ({ bpm: round(t.bpm) })),
      timeSignatures: midi.header.timeSignatures.slice(0, 1).map((t) => ({ timeSignature: t.timeSignature })),
    },
    tracks: midi.tracks.map((t) => ({
      name: t.name,
      channel: t.channel,
      instrument: { name: t.instrument.name, family: t.instrument.family, percussion: t.instrument.percussion },
      notes: t.notes.map((n) => ({ midi: n.midi, ticks: n.ticks, durationTicks: n.durationTicks, velocity: round(n.velocity) })),
    })),
  }
}

const round = (x: number) => Math.round(x * 100) / 100
