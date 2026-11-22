import { chartFromMidiJson, describeTracks, readMidiFile, type MidiJson, type TrackRole } from '../chart/midiImport'
import { arrange, MAX_LEVEL, noteTiers } from '../chart/difficulty'
import { songSections } from '../chart/sections'
import type { Chart, Hand } from '../core/types'
import { PIECES } from '../curriculum'
import { FOLDER_SONGS, type FolderSong } from '../songs/library'
import { starsFor } from '../judge/judge'
import type { App } from './app'
import { h, icon, percent, stars, type View } from './dom'
import { midiPill } from './midiPill'
import { PlayView, type PlayResult, type Practice } from './play'
import { resultsCard } from './results'
import { jamView } from './jam'
import { songView } from './song'
import { t, tr } from '../i18n'

/** Free play: pick a built-in piece or import a MIDI file, with all practice tools. */
export function freePlayView(app: App): View {
  const error = h('p', { class: 'error', role: 'alert', hidden: true })
  const file = h('input', {
    type: 'file',
    accept: '.mid,.midi,audio/midi',
    hidden: true,
    onchange: async () => {
      const chosen = file.files?.[0]
      file.value = ''
      if (!chosen) return
      try {
        error.hidden = true
        const { midi, title } = await readMidiFile(chosen)
        // With one track there is nothing to choose; otherwise say which part each hand plays.
        if (describeTracks(midi).length > 1) app.show(trackPicker(app, midi, title))
        else app.show(importedSong(app, chartFromMidiJson(midi, title)))
      } catch (err) {
        error.textContent = t(`Could not open "${chosen.name}"`, `„${chosen.name}“ ließ sich nicht öffnen`) + `: ${err instanceof Error ? err.message : t('unknown error', 'unbekannter Fehler')}.`
        error.hidden = false
      }
    },
  })

  const el = h(
    'div',
    { class: 'screen' },
    h(
      'header',
      { class: 'topbar' },
      h('button', { class: 'btn ghost', onclick: () => app.goPath() }, icon('back'), t('Lessons', 'Lektionen')),
      h('strong', null, t('Songs', 'Lieder')),
    ),
    h(
      'main',
      { class: 'path' },
      h('p', { class: 'muted' }, t('Every song is a lesson: it starts simple and adds notes, part by part, as you play it well.', 'Jedes Lied ist eine Lektion: Es beginnt einfach und bekommt Teil für Teil mehr Noten, je besser du spielst.')),
      h(
        'div',
        { class: 'pieces' },
        PIECES.map((piece) => {
          const info = { id: piece.id, title: tr(piece.title), composer: tr(piece.composer), chart: piece.chart, pieceId: piece.id }
          return pieceCard(app, piece.id, info.title, info.composer, () => app.show(songView(app, info, () => app.goFreePlay())))
        }),
        FOLDER_SONGS.map((song) =>
          pieceCard(
            app,
            song.id,
            song.title,
            song.artist || t('Songs folder', 'Lieder-Ordner'),
            async () => {
              try {
                error.hidden = true
                app.show(await folderSongView(app, song, () => app.goFreePlay()))
              } catch (err) {
                error.textContent = t(`Could not open "${song.file}"`, `„${song.file}“ ließ sich nicht öffnen`) + `: ${err instanceof Error ? err.message : t('unknown error', 'unbekannter Fehler')}.`
                error.hidden = false
              }
            },
            `songs/${song.file} · ${song.parts.join(', ')}`,
          ),
        ),
        h(
          'button',
          { class: 'piece import', onclick: () => app.show(jamView(app)) },
          h('strong', null, t('Jam with the band', 'Mit der Band jammen')),
          h('span', { class: 'muted' }, t('The band plays chords round and round; you play anything. The keys that fit light up.', 'Die Band spielt Akkorde im Kreis, du spielst, was du willst. Die passenden Tasten leuchten.')),
        ),
        h(
          'button',
          { class: 'piece import', onclick: () => file.click() },
          h('strong', null, t('Open a MIDI file', 'MIDI-Datei öffnen')),
          h('span', { class: 'muted' }, t('Learn any .mid file from your computer. Its levels are remembered by its name.', 'Lerne jede .mid-Datei von deinem Computer. Ihre Stufen werden unter ihrem Namen gespeichert.')),
        ),
      ),
      file,
      error,
    ),
  )
  return { el }
}

/** A song to pick, with its stars and how much of it is mastered. */
function pieceCard(app: App, id: string, title: string, composer: string, onclick: () => void, tooltip?: string): HTMLElement {
  const best = app.progress.pieceResult(id)
  const mastered = app.progress.songMastery(id)
  return h(
    'button',
    { class: 'piece', title: tooltip, onclick },
    h('strong', null, title),
    h('span', { class: 'muted' }, composer),
    h(
      'span',
      { class: 'piece-score' },
      stars(best?.stars ?? 0),
      mastered !== undefined ? t(`${percent(mastered)} mastered`, `${percent(mastered)} gemeistert`) : best ? `${t('Best', 'Bestwert')} ${percent(best.best)}` : t('Not played yet', 'Noch nicht gespielt'),
    ),
  )
}

/** A song from the songs folder, loaded, as a song lesson that keeps its stars and levels. */
export async function folderSongView(app: App, song: FolderSong, back: () => void): Promise<View> {
  const chart = await song.chart()
  return songView(app, { id: song.id, title: song.title, composer: song.artist, chart, pieceId: song.id }, back)
}

const roleNames = (): Record<TrackRole, string> => ({
  R: t('Right hand', 'Rechte Hand'),
  L: t('Left hand', 'Linke Hand'),
  split: t('Both hands (split at middle C)', 'Beide Hände (geteilt am mittleren C)'),
  band: t('Plays along', 'Spielt mit'),
  off: t('Leave out', 'Weglassen'),
})

/** For an imported file with several tracks: which part each hand plays. */
function trackPicker(app: App, midi: MidiJson, title: string): View {
  const tracks = describeTracks(midi)
  const roles: Record<number, TrackRole> = Object.fromEntries(tracks.map((t) => [t.index, t.role]))
  const error = h('p', { class: 'error', role: 'alert', hidden: true })
  const rows = tracks.map((track) => {
    const select = h(
      'select',
      { 'aria-label': `${t('Part for', 'Stimme für')} ${track.name}`, onchange: () => (roles[track.index] = select.value as TrackRole) },
      (Object.entries(roleNames()) as [TrackRole, string][])
        // Drums can only be heard, never played on the keys.
        .filter(([r]) => !track.percussion || r === 'band' || r === 'off')
        .map(([r, name]) => h('option', { value: r, selected: r === track.role }, name)),
    )
    return h(
      'li',
      { class: 'track-row' },
      h('div', null, h('strong', null, track.name), h('span', { class: 'muted' }, `${track.instrument} · ${track.notes} ${t('notes', 'Noten')}`)),
      select,
    )
  })
  const play = () => {
    try {
      app.show(importedSong(app, chartFromMidiJson(midi, title, roles)))
    } catch (err) {
      error.textContent = err instanceof Error && /no notes/i.test(err.message) ? t('Choose at least one track to play.', 'Wähle mindestens eine Spur zum Spielen.') : String(err)
      error.hidden = false
    }
  }
  const el = h(
    'div',
    { class: 'screen' },
    h(
      'header',
      { class: 'topbar' },
      h('button', { class: 'btn ghost', onclick: () => app.goFreePlay() }, icon('back'), t('Songs', 'Lieder')),
      h('strong', null, title),
    ),
    h(
      'main',
      { class: 'path narrow' },
      h('p', { class: 'muted' }, t('This file has several parts. Choose what each hand plays; the parts that play along are your band. Pianova has made a first guess.', 'Diese Datei hat mehrere Stimmen. Wähle, was jede Hand spielt; die mitspielenden Stimmen sind deine Band. Pianova hat einen ersten Vorschlag gemacht.')),
      h('ol', { class: 'track-list' }, rows),
      error,
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: play }, t('Play', 'Spielen'))),
    ),
  )
  return { el }
}

/** An imported file as a song lesson; its levels are kept under its title. */
function importedSong(app: App, chart: Chart): View {
  return songView(app, { id: `import:${chart.title}`, title: chart.title, composer: t('Imported file', 'Importierte Datei'), chart, pieceId: null }, () => app.goFreePlay())
}

export interface PlayChartOptions {
  /** Piece id to save the best score under, or null to never save. */
  saveAs: string | null
  label: string
  /** Heading, when it differs from the chart's own (English) title. */
  title?: string
  /** The hands to play at first (an arrangement may leave one hand to the music). */
  hands?: Hand[]
  /** Play along with the generated backing band. */
  band?: boolean
  /** Shown on results when nothing is saved. */
  unsaved?: string
  backLabel: string
  back(): void
  /** Label of the results button that goes back. */
  another: string
}

/** A chart with every practice tool, then its results; used by Free play and practice. */
export function playChart(app: App, chart: Chart, o: PlayChartOptions): View {
  const pieceId = o.saveAs
  const body = h('div', { class: 'lesson-body' })
  const pill = midiPill(app)
  let current: View | null = null
  const mount = (view: View) => {
    current?.destroy?.()
    app.synth.allOff()
    current = view
    body.replaceChildren(view.el)
  }

  // Difficulty: every part at one level; the notes left out are played for you.
  const sections = songSections(chart)
  const tiers = noteTiers(chart)
  const atLevel = (level: number) => (level >= MAX_LEVEL ? chart : arrange(chart, sections, sections.map(() => level), tiers).chart)

  // "Play again" keeps the speed, level, hands, loop and wait settings of the run before.
  const start = (practice?: Practice) => {
    const view: PlayView = new PlayView(app, {
      chart: atLevel(practice?.level ?? MAX_LEVEL),
      sections,
      difficulty: { level: MAX_LEVEL, onChange: (level) => view.reconfigure({ chart: atLevel(level) }) },
      title: o.title,
      hands: o.hands,
      band: o.band,
      practice,
      mode: 'timed',
      tools: true,
      scored: true,
      label: o.label,
      onExit: o.back,
      onFinish: finish,
    })
    mount(view)
  }

  const finish = (result: PlayResult) => {
    const earned = starsFor(result.summary.accuracy)
    const saved = pieceId !== null && result.full
    if (saved) app.progress.recordPiece(pieceId, result.summary.accuracy, earned)
    app.progress.addStats(result.events)
    mount({
      el: h(
        'div',
        { class: 'centered' },
        resultsCard({
          title: o.title ?? chart.title,
          summary: result.summary,
          stars: earned,
          timed: result.timed,
          note: saved
            ? undefined
            : pieceId === null
              ? o.unsaved
              : t('Practice run. Play both hands at full speed and level 5, without Wait or Loop, to save a score.', 'Übungsdurchgang. Spiel beide Hände im vollen Tempo auf Stufe 5, ohne Warten oder Schleife, um ein Ergebnis zu speichern.'),
          actions: [
            { label: t('Play again', 'Nochmal spielen'), primary: true, onclick: () => start(result.practice) },
            { label: o.another, onclick: o.back },
          ],
        }),
      ),
    })
  }

  const el = h(
    'div',
    { class: 'screen lesson' },
    h(
      'header',
      { class: 'topbar' },
      h('button', { class: 'btn ghost', onclick: o.back }, icon('back'), o.backLabel),
      h('span', { class: 'spacer' }),
      pill.el,
    ),
    body,
  )
  app.input.allowOctaveShift(true)
  start()
  return {
    el,
    destroy() {
      current?.destroy?.()
      pill.destroy?.()
      app.input.allowOctaveShift(false)
    },
  }
}
