import { chartFromMidiFile } from '../chart/midiImport'
import type { Chart } from '../core/types'
import { PIECES } from '../curriculum'
import { starsFor } from '../judge/judge'
import type { App } from './app'
import { h, icon, percent, stars, type View } from './dom'
import { PlayView, type PlayResult } from './play'
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
        app.show(playPiece(app, await chartFromMidiFile(chosen), null))
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

function playPiece(app: App, chart: Chart, pieceId: string | null): View {
  const body = h('div', { class: 'lesson-body' })
  let current: View | null = null
  const mount = (view: View) => {
    current?.destroy?.()
    app.synth.allOff()
    current = view
    body.replaceChildren(view.el)
  }

  const start = () =>
    mount(
      new PlayView(app, {
        chart,
        mode: 'timed',
        tools: true,
        scored: true,
        label: 'Free play',
        onExit: () => app.goFreePlay(),
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
              ? 'Scores for imported files are not saved.'
              : 'Practice run. Play both hands at full tempo, without Wait or Loop, to save a score.',
          actions: [
            { label: 'Play again', primary: true, onclick: start },
            { label: 'Choose another', onclick: () => app.goFreePlay() },
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
      h('button', { class: 'btn ghost', onclick: () => app.goFreePlay() }, icon('back'), 'Free play'),
      h('strong', null, chart.title),
    ),
    body,
  )
  app.input.allowOctaveShift(true)
  start()
  return {
    el,
    destroy() {
      current?.destroy?.()
      app.input.allowOctaveShift(false)
    },
  }
}
