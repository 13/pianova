/** The songs folder, read when the app is built (see vite.songs.ts). */
declare module 'virtual:songs' {
  const songs: {
    /** From the file name: letters, digits and dashes. */
    id: string
    file: string
    title: string
    /** Empty when the file does not say. */
    artist: string
    /** Names of the parts that have notes. */
    parts: string[]
    load(): Promise<import('../chart/midiImport').MidiJson>
  }[]
  export default songs
}
