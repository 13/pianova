import { chartFromMidiJson, describeTracks, readMidiFile, type MidiJson, type TrackRole } from '../chart/midiImport'
import type { Chart } from '../core/types'
import { PIECES } from '../curriculum'
import { starsFor } from '../judge/judge'
import type { App } from './app'
import { h, icon, percent, stars, type View } from './dom'
import { midiPill } from './midiPill'
import { PlayView, type PlayResult, type Practice } from './play'
import { resultsCard } from './results'

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
        else app.show(playPiece(app, chartFromMidiJson(midi, title), null))
      } catch (err) {
        error.textContent = `Could not open "${chosen.name}": ${err instanceof Error ? err.message : 'unknown error'}.`
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
      h('button', { class: 'btn ghost', onclick: () => app.goPath() }, icon('back'), 'Lessons'),
      h('strong', null, 'Free play'),
    ),
    h(
      'main',
      { class: 'path' },
      h('p', { class: 'muted' }, 'Play whole pieces with every practice tool: slow the tempo, loop a few bars, or take one hand at a time.'),
      h(
        'div',
        { class: 'pieces' },
        PIECES.map((piece) => {
          const best = app.progress.pieceResult(piece.id)
          return h(
            'button',
            { class: 'piece', onclick: () => app.show(playPiece(app, piece.chart, piece.id)) },
            h('strong', null, piece.title),
            h('span', { class: 'muted' }, piece.composer),
            h('span', { class: 'piece-score' }, stars(best?.stars ?? 0), best ? `Best ${percent(best.best)}` : 'Not played yet'),
          )
        }),
        h(
          'button',
          { class: 'piece import', onclick: () => file.click() },
          h('strong', null, 'Open a MIDI file'),
          h('span', { class: 'muted' }, 'Play any .mid file from your computer. It is not kept after you leave.'),
        ),
      ),
      file,
      error,
    ),
  )
  return { el }
}

const ROLE_NAMES: Record<TrackRole, string> = { R: 'Right hand', L: 'Left hand', split: 'Both hands (split at middle C)', off: 'Leave out' }

/** For an imported file with several tracks: which part each hand plays. */
function trackPicker(app: App, midi: MidiJson, title: string): View {
  const tracks = describeTracks(midi)
  const roles: Record<number, TrackRole> = Object.fromEntries(tracks.map((t) => [t.index, t.role]))
  const error = h('p', { class: 'error', role: 'alert', hidden: true })
  const rows = tracks.map((t) => {
    const select = h(
      'select',
      { 'aria-label': `Part for ${t.name}`, onchange: () => (roles[t.index] = select.value as TrackRole) },
      (Object.keys(ROLE_NAMES) as TrackRole[]).map((r) => h('option', { value: r, selected: r === t.role }, ROLE_NAMES[r])),
    )
    return h(
      'li',
      { class: 'track-row' },
      h('div', null, h('strong', null, t.name), h('span', { class: 'muted' }, `${t.instrument} · ${t.notes} notes`)),
      select,
    )
  })
  const play = () => {
    try {
      app.show(playPiece(app, chartFromMidiJson(midi, title, roles), null))
    } catch (err) {
      error.textContent = err instanceof Error && /no notes/i.test(err.message) ? 'Choose at least one track to play.' : String(err)
      error.hidden = false
    }
  }
  const el = h(
    'div',
    { class: 'screen' },
    h(
      'header',
      { class: 'topbar' },
      h('button', { class: 'btn ghost', onclick: () => app.goFreePlay() }, icon('back'), 'Free play'),
      h('strong', null, title),
    ),
    h(
      'main',
      { class: 'path narrow' },
      h('p', { class: 'muted' }, 'This file has several parts. Choose what each hand plays. Pianova has made a first guess; drums are always left out.'),
      h('ol', { class: 'track-list' }, rows),
      error,
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: play }, 'Play')),
    ),
  )
  return { el }
}

function playPiece(app: App, chart: Chart, pieceId: string | null): View {
  return playChart(app, chart, {
    saveAs: pieceId,
    label: pieceId ? `Free play • ${PIECES.find((p) => p.id === pieceId)?.composer ?? ''}` : 'Free play • Imported file',
    unsaved: pieceId === null ? 'Scores for imported files are not saved.' : undefined,
    backLabel: 'Free play',
    back: () => app.goFreePlay(),
    another: 'Choose another',
  })
}

export interface PlayChartOptions {
  /** Piece id to save the best score under, or null to never save. */
  saveAs: string | null
  label: string
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

  // "Play again" keeps the tempo, hands, loop and wait settings of the run before.
  const start = (practice?: Practice) =>
    mount(
      new PlayView(app, {
        chart,
        practice,
        mode: 'timed',
        tools: true,
        scored: true,
        label: o.label,
        onExit: o.back,
        onFinish: finish,
      }),
    )

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
          title: chart.title,
          summary: result.summary,
          stars: earned,
          timed: result.timed,
          note: saved
            ? undefined
            : pieceId === null
              ? o.unsaved
              : 'Practice run. Play both hands at full tempo, without Wait or Loop, to save a score.',
          actions: [
            { label: 'Play again', primary: true, onclick: () => start(result.practice) },
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
