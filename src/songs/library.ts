import songs from 'virtual:songs'
import { chartFromMidiJson } from '../chart/midiImport'
import type { Chart } from '../core/types'

/** A song from the `songs/` folder. Its notes load when it is opened. */
export interface FolderSong {
  /** Where its progress is saved; never the same as a built-in piece's. */
  id: string
  /** The file it came from. */
  file: string
  title: string
  /** Empty when the file does not say. */
  artist: string
  parts: string[]
  /** The song as a chart, its tracks given to the hands and the band as for an opened MIDI file. */
  chart(): Promise<Chart>
}

export const FOLDER_SONGS: FolderSong[] = songs.map((s) => {
  const id = `song:${s.id}`
  return { id, file: s.file, title: s.title, artist: s.artist, parts: s.parts, chart: async () => ({ ...chartFromMidiJson(await s.load(), s.title), id }) }
})
