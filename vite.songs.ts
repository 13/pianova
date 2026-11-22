import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'
import { knownArtist, readSongFile, SONG_EXTENSIONS, type SongFile } from './src/songs/read.ts'

const LIST = 'virtual:songs'
const ONE = 'virtual:songs/'

/**
 * The songs folder as part of the app: `virtual:songs` lists every song file found there
 * (Guitar Pro or MIDI), and each song's notes load from `virtual:songs/<id>` only when it
 * is opened. Files are read here, at build time, so the site never ships a Guitar Pro reader.
 * A file that cannot be read is skipped with a warning. The dev server reloads when the
 * folder changes.
 */
export function songsFolder(dir = 'songs'): Plugin {
  const root = resolve(dir)
  const cache = new Map<string, { mtime: number; song: SongFile | Error }>()

  const files = (): string[] => {
    try {
      return readdirSync(root)
        .filter((f) => SONG_EXTENSIONS.includes(f.split('.').pop()?.toLowerCase() ?? ''))
        .sort()
    } catch {
      return []
    }
  }
  const read = (file: string): SongFile | Error => {
    const path = join(root, file)
    const mtime = statSync(path).mtimeMs
    const have = cache.get(file)
    if (have && have.mtime === mtime) return have.song
    let song: SongFile | Error
    try {
      song = readSongFile(file, new Uint8Array(readFileSync(path)))
    } catch (err) {
      song = err instanceof Error ? err : new Error(String(err))
    }
    cache.set(file, { mtime, song })
    return song
  }
  /** A file's id: its name without the extension, as letters, digits and dashes. Unique in the folder. */
  const idOf = (file: string) =>
    file
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  const reload = (server: ViteDevServer) => {
    for (const env of Object.values(server.environments)) {
      const graph = env.moduleGraph
      for (const id of [...graph.idToModuleMap.keys()]) if (id.startsWith('\0' + LIST)) graph.invalidateModule(graph.idToModuleMap.get(id)!)
    }
    server.ws.send({ type: 'full-reload' })
  }

  return {
    name: 'pianova-songs',
    resolveId: (id) => (id === LIST || id.startsWith(ONE) ? '\0' + id : undefined),
    load(id) {
      if (id === '\0' + LIST) {
        const songs = files().map((file) => ({ file, song: read(file) }))
        const artists = songs.flatMap(({ song }) => (song instanceof Error || !song.artist ? [] : [song.artist]))
        const entries = songs.flatMap(({ file, song: read }) => {
          if (read instanceof Error) {
            this.warn(`songs/${file} skipped: ${read.message}`)
            return []
          }
          const song = { ...read, ...knownArtist(read, artists) }
          const songId = idOf(file)
          const parts = song.midi.tracks.filter((t) => t.notes.length).map((t) => t.name || t.instrument?.name || '')
          return [
            `{ id: ${JSON.stringify(songId)}, file: ${JSON.stringify(file)}, title: ${JSON.stringify(song.title)}, artist: ${JSON.stringify(song.artist)}, ` +
              `parts: ${JSON.stringify(parts)}, load: () => import(${JSON.stringify(ONE + songId)}).then((m) => m.default) }`,
          ]
        })
        return `export default [\n${entries.join(',\n')}\n]\n`
      }
      if (id.startsWith('\0' + ONE)) {
        const file = files().find((f) => idOf(f) === id.slice(1 + ONE.length))
        const song = file && read(file)
        if (!song || song instanceof Error) throw new Error(`No readable song for ${id.slice(1)}`)
        return `export default ${JSON.stringify(song.midi)}\n`
      }
    },
    configureServer(server) {
      server.watcher.add(root)
      const changed = (path: string) => {
        if (resolve(path).startsWith(root)) reload(server)
      }
      server.watcher.on('add', changed)
      server.watcher.on('unlink', changed)
      server.watcher.on('change', changed)
    },
  }
}
