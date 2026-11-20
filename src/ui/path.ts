import { LESSONS, UNITS } from '../curriculum'
import type { MidiStatus } from '../input/hub'
import type { App } from './app'
import { h, icon, stars, type View } from './dom'

/** Home: the six units as a path of lessons. */
export function pathView(app: App): View {
  const next = LESSONS.find((l) => app.progress.isUnlocked(l.id) && !(app.progress.lessonResult(l.id)?.stars ?? 0))
  const earned = LESSONS.reduce((sum, l) => sum + (app.progress.lessonResult(l.id)?.stars ?? 0), 0)

  const pill = h('span', { class: 'pill' })
  const banner = h('div', { class: 'banner', hidden: true })
  const renderStatus = (s: MidiStatus) => {
    const name = s.inputs.length === 1 ? s.inputs[0].name : `${s.inputs.length} MIDI devices`
    pill.textContent = s.inputs.length ? name : 'Computer keys'
    pill.className = s.inputs.length ? 'pill ok' : 'pill'
    const problem = !s.supported
      ? 'This browser cannot talk to MIDI keyboards. Open Pianova in Chrome or Chromium to use one. Your computer keys still work.'
      : s.error
        ? 'MIDI access was blocked, so your keyboard cannot be heard. Allow MIDI for this page in the address bar, then reload. Your computer keys still work.'
        : ''
    banner.textContent = problem
    banner.hidden = !problem
  }
  renderStatus(app.input.status)
  const off = app.input.onStatus(renderStatus)

  const units = UNITS.map((unit) => {
    const lessons = LESSONS.filter((l) => l.unit === unit.n)
    const done = lessons.filter((l) => (app.progress.lessonResult(l.id)?.stars ?? 0) > 0).length
    return h(
      'section',
      { class: 'unit' },
      h(
        'div',
        { class: 'unit-head' },
        h('span', { class: 'eyebrow' }, `Unit ${unit.n}`),
        h('h2', null, unit.title),
        h('p', { class: 'muted' }, unit.blurb),
        h('span', { class: 'unit-count' }, `${done} of ${lessons.length}`),
      ),
      h(
        'ol',
        { class: 'nodes' },
        lessons.map((lesson, i) => {
          const result = app.progress.lessonResult(lesson.id)
          const unlocked = app.progress.isUnlocked(lesson.id)
          const passed = (result?.stars ?? 0) > 0
          const state = !unlocked ? 'locked' : passed ? 'passed' : lesson === next ? 'next' : 'open'
          return h(
            'li',
            null,
            h(
              'button',
              {
                class: `node ${state}`,
                disabled: !unlocked,
                title: unlocked ? lesson.summary : 'Pass the lesson before this one to unlock it',
                onclick: () => app.goLesson(lesson),
              },
              h('span', { class: 'node-dot' }, !unlocked ? icon('lock') : passed ? icon('check') : String(i + 1)),
              h('span', { class: 'node-title' }, lesson.title),
              unlocked ? stars(result?.stars ?? 0) : h('span', { class: 'stars' }),
            ),
          )
        }),
      ),
    )
  })

  const el = h(
    'div',
    { class: 'screen' },
    h(
      'header',
      { class: 'topbar' },
      h('span', { class: 'wordmark' }, icon('nova'), 'Pianova'),
      h('span', { class: 'spacer' }),
      pill,
      h('button', { class: 'btn ghost', onclick: () => app.goFreePlay() }, icon('music'), 'Free play'),
      h('button', { class: 'btn ghost', onclick: () => app.goSettings() }, icon('gear'), 'Settings'),
    ),
    h(
      'main',
      { class: 'path' },
      banner,
      h(
        'section',
        { class: 'hero' },
        h(
          'div',
          null,
          h('span', { class: 'eyebrow' }, next ? (earned ? 'Up next' : 'Start here') : 'Course complete'),
          h('h1', null, next ? next.title : 'You finished every lesson'),
          h('p', { class: 'muted' }, next ? next.summary : 'Go back for more stars, or play whole pieces in Free play.'),
        ),
        h('div', { class: 'hero-side' }, h('span', { class: 'star-total' }, h('span', { class: 'star lit' }, '★'), `${earned} / ${LESSONS.length * 3}`),
          next
            ? h('button', { class: 'btn primary large', onclick: () => app.goLesson(next) }, earned ? 'Continue' : 'Begin')
            : h('button', { class: 'btn primary large', onclick: () => app.goFreePlay() }, 'Free play'),
        ),
      ),
      units,
    ),
  )
  return { el, destroy: off }
}
