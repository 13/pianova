import * as alphaTab from '@coderline/alphatab'
import { describe, expect, it } from 'vitest'
import { chartFromMidiJson, describeTracks } from '../src/chart/midiImport'
import { readSongFile } from '../src/songs/read'

/** A Guitar Pro 7 file written from alphaTex, as a songs-folder file would be. */
function gp(tex: string): Uint8Array {
  const settings = new alphaTab.Settings()
  const importer = new alphaTab.importer.AlphaTexImporter()
  importer.initFromString(tex, settings)
  return new alphaTab.exporter.Gp7Exporter().export(importer.readScore(), settings)
}

const notes = (song: ReturnType<typeof readSongFile>, track = 0) => song.midi.tracks[track].notes.map((n) => [n.midi, n.ticks / song.midi.header.ppq, n.durationTicks / song.midi.header.ppq])

describe('readSongFile (Guitar Pro)', () => {
  it('reads the title, artist, tempo and time signature', () => {
    const song = readSongFile('x.gp', gp('\\title "Waltz " \\artist "Someone" \\tempo 90 \\ts 3 4 C4.4 D4 E4'))
    expect(song.title).toBe('Waltz')
    expect(song.artist).toBe('Someone')
    expect(song.midi.header.tempos).toEqual([{ bpm: 90 }])
    expect(song.midi.header.timeSignatures).toEqual([{ timeSignature: [3, 4] }])
    expect(notes(song)).toEqual([
      [60, 0, 1],
      [62, 1, 1],
      [64, 2, 1],
    ])
  })

  it('falls back to the file name for an untitled score', () => {
    expect(readSongFile('my tune.gp', gp('C4.4 D4 E4 F4')).title).toBe('my tune')
  })

  it('plays repeats through', () => {
    const song = readSongFile('x.gp', gp('\\ro C4.2 D4 | \\rc 2 E4.1'))
    expect(notes(song).map(([pitch, beat]) => [pitch, beat])).toEqual([
      [60, 0],
      [62, 2],
      [64, 4],
      [60, 8],
      [62, 10],
      [64, 12],
    ])
  })

  it('holds tied notes as one', () => {
    const song = readSongFile('x.gp', gp('C4.2 C4{t}.2 | C4{t}.1'))
    expect(notes(song)).toEqual([[60, 0, 8]])
  })

  it('leaves out dead notes', () => {
    const song = readSongFile('x.gp', gp('C4.4 C4{x}.4 D4.4 D4.4'))
    expect(notes(song).map(([pitch, beat]) => [pitch, beat])).toEqual([
      [60, 0],
      [62, 2],
      [62, 3],
    ])
  })

  it('keeps each track with its name and instrument, the hands taken from the names', () => {
    const song = readSongFile(
      'x.gp',
      gp('\\track "Left" \\instrument piano C3.1 \\track "Right" \\instrument piano C5.1 \\track "Voice" \\instrument flute G4.1'),
    )
    expect(song.midi.tracks.map((t) => [t.name, t.instrument?.family])).toEqual([
      ['Left', 'piano'],
      ['Right', 'piano'],
      ['Voice', 'pipe'],
    ])
    expect(describeTracks(song.midi).map((t) => t.role)).toEqual(['L', 'R', 'band'])
    const chart = chartFromMidiJson(song.midi, song.title)
    expect(chart.notes.map((n) => [n.pitch, n.hand])).toEqual([
      [48, 'L'],
      [72, 'R'],
    ])
    expect(chart.backing).toMatchObject([{ pitch: 67, voice: 'lead' }])
  })

  it('rejects other files', () => {
    expect(() => readSongFile('notes.txt', new Uint8Array([1, 2, 3]))).toThrow()
    expect(() => readSongFile('broken.gp5', new Uint8Array([1, 2, 3]))).toThrow()
  })
})
