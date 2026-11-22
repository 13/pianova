import { LESSONS, PIECES, UNITS } from '../curriculum'
import { FOLDER_SONGS } from '../songs/library'
import type { MidiStatus } from '../input/hub'
import { weakNotes } from '../practice/weakSpots'
import type { App } from './app'
import { h, icon, stars, type View } from './dom'
import { getLang, noteName, t, tr } from '../i18n'

/** Home: the six units as a path of lessons. */
export function pathView(app: App): View {
  const next = LESSONS.find((l) => app.progress.isUnlocked(l.id) && !(app.progress.lessonResult(l.id)?.stars ?? 0))
  const weak = weakNotes(app.progress.stats())
  const earned = LESSONS.reduce((sum, l) => sum + (app.progress.lessonResult(l.id)?.stars ?? 0), 0)

  const pill = h('span', { class: 'pill' })
  const banner = h('div', { class: 'banner', hidden: true })
  const measureCard = h(
    'section',
    { class: 'practice-card', hidden: true },
    h(
      'div',
      null,
      h('span', { class: 'eyebrow' }, t('Your keyboard', 'Dein Keyboard')),
      h('strong', null, t('How many keys does it have?', 'Wie viele Tasten hat es?')),
      h('p', { class: 'muted' }, t('Press its lowest and highest key once, and Pianova shows exactly your keys and fits every song to them.', 'Drück einmal die tiefste und die höchste Taste, dann zeigt Pianova genau deine Tasten und passt jedes Lied an sie an.')),
    ),
    h('button', { class: 'btn primary', onclick: () => app.goMeasure(() => app.goPath()) }, icon('target'), t('Measure', 'Ausmessen')),
  )
  const renderStatus = (s: MidiStatus) => {
    const name = s.inputs.length === 1 ? s.inputs[0].name : t(`${s.inputs.length} MIDI devices`, `${s.inputs.length} MIDI-Geräte`)
    pill.textContent = s.inputs.length ? name : t('Computer keys', 'Computertasten')
    pill.className = s.inputs.length ? 'pill ok' : 'pill'
    const problem = s.insecure
      ? t('MIDI keyboards only work on a secure page. Open Pianova over https, or at localhost on this computer. Your computer keys still work.', 'MIDI-Keyboards funktionieren nur auf einer sicheren Seite. Öffne Pianova über https oder unter localhost auf diesem Computer. Deine Computertasten funktionieren trotzdem.')
      : !s.supported
      ? t('This browser cannot talk to MIDI keyboards. Open Pianova in Chrome or Chromium to use one. Your computer keys still work.', 'Dieser Browser kann nicht mit MIDI-Keyboards sprechen. Öffne Pianova in Chrome oder Chromium, um eines zu nutzen. Deine Computertasten funktionieren trotzdem.')
      : s.error
        ? t('MIDI access was blocked, so your keyboard cannot be heard. Allow MIDI for this page in the address bar, then reload. Your computer keys still work.', 'Der MIDI-Zugriff wurde blockiert, daher ist dein Keyboard nicht zu hören. Erlaube MIDI für diese Seite in der Adressleiste und lade neu. Deine Computertasten funktionieren trotzdem.')
        : ''
    banner.textContent = problem
    banner.hidden = !problem
    // A keyboard whose size its USB name does not give away: offer to measure it.
    measureCard.hidden = !!problem || !app.keyboardUnknown
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
        h('span', { class: 'eyebrow' }, `${t('Unit', 'Einheit')} ${unit.n}`),
        h('h2', null, tr(unit.title)),
        h('p', { class: 'muted' }, tr(unit.blurb)),
        h('span', { class: 'unit-count' }, t(`${done} of ${lessons.length}`, `${done} von ${lessons.length}`)),
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
                title: unlocked ? tr(lesson.summary) : t('Pass the lesson before this one to unlock it', 'Bestehe die Lektion davor, um diese freizuschalten'),
                onclick: () => app.goLesson(lesson),
              },
              h('span', { class: 'node-dot' }, !unlocked ? icon('lock') : passed ? icon('check') : String(i + 1)),
              h('span', { class: 'node-title' }, tr(lesson.title)),
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
      h('button', { class: 'btn ghost', onclick: () => app.goFreePlay() }, icon('music'), t('Songs', 'Lieder')),
      h('button', { class: 'btn ghost', onclick: () => app.goSettings() }, icon('gear'), t('Settings', 'Einstellungen')),
    ),
    h(
      'main',
      { class: 'path' },
      banner,
      measureCard,
      h(
        'section',
        { class: 'hero' },
        h(
          'div',
          null,
          h('span', { class: 'eyebrow' }, next ? (earned ? t('Up next', 'Als Nächstes') : t('Start here', 'Hier beginnen')) : t('Course complete', 'Kurs abgeschlossen')),
          h('h1', null, next ? tr(next.title) : t('You finished every lesson', 'Du hast alle Lektionen geschafft')),
          h('p', { class: 'muted' }, next ? tr(next.summary) : t('Go back for more stars, or learn songs in Songs.', 'Hol dir mehr Sterne oder lerne Lieder unter „Lieder“.')),
        ),
        h('div', { class: 'hero-side' }, h('span', { class: 'star-total' }, h('span', { class: 'star lit' }, '★'), `${earned} / ${LESSONS.length * 3}`),
          next
            ? h('button', { class: 'btn primary large', onclick: () => app.goLesson(next) }, earned ? t('Continue', 'Weiter') : t('Begin', 'Loslegen'))
            : weak.length
              ? h('button', { class: 'btn primary large', onclick: () => app.goPractice() }, t('Practise', 'Üben'))
              : h('button', { class: 'btn primary large', onclick: () => app.goFreePlay() }, t('Songs', 'Lieder')),
        ),
      ),
      todayCard(app),
      weak.length > 0 &&
        h(
          'section',
          { class: 'practice-card' },
          h(
            'div',
            null,
            h('span', { class: 'eyebrow' }, t('Weak spots', 'Schwachstellen')),
            h('strong', null, `${t('Notes that slip most', 'Diese Töne wackeln am meisten')}: ${weak.map((w) => noteName(w.pitch)).join(', ')}`),
            h('p', { class: 'muted' }, t('A two-minute exercise built from your recent playing. It changes as you improve.', 'Eine Zwei-Minuten-Übung aus deinem letzten Spiel. Sie ändert sich, wenn du besser wirst.')),
          ),
          h('button', { class: 'btn', onclick: () => app.goPractice() }, icon('target'), t('Practise', 'Üben')),
        ),
      units,
    ),
  )
  return { el, destroy: off }
}

/** Today: minutes played against the daily goal, the streak, the week, and quick ways in. */
function todayCard(app: App): HTMLElement {
  const goal = app.progress.settings.dailyGoalMin
  const minutes = Math.floor(app.progress.practiceOn() / 60)
  const done = minutes >= goal
  const streak = app.progress.streak()
  const progress = Math.min(1, minutes / goal)
  const r = 26
  const ring = h('span', { class: 'ring' })
  ring.innerHTML = `<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
    <circle cx="32" cy="32" r="${r}" fill="none" stroke="rgba(150,165,255,0.16)" stroke-width="7"/>
    <circle cx="32" cy="32" r="${r}" fill="none" stroke="${done ? '#4ade80' : '#ffd76a'}" stroke-width="7" stroke-linecap="round"
      stroke-dasharray="${(2 * Math.PI * r * progress).toFixed(1)} 999" transform="rotate(-90 32 32)"/></svg>`
  ring.append(h('span', { class: 'ring-text' }, done ? icon('check') : String(minutes)))

  const today = new Date()
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + i)
    const secs = app.progress.practiceOn(day)
    const state = secs >= goal * 60 ? 'met' : secs > 0 ? 'some' : ''
    return h(
      'span',
      { class: `day ${state}${i === 6 ? ' today' : ''}`, title: `${day.toLocaleDateString(getLang(), { weekday: 'long' })}: ${Math.floor(secs / 60)} min` },
      h('i'),
      day.toLocaleDateString(getLang(), { weekday: 'narrow' }),
    )
  })
  const last = app.progress.lastSong
  const piece = last ? (PIECES.find((p) => p.id === last) ?? FOLDER_SONGS.find((s) => s.id === last)) : undefined
  return h(
    'section',
    { class: 'today-card' },
    ring,
    h(
      'div',
      { class: 'today-text' },
      h('span', { class: 'eyebrow' }, t('Today', 'Heute')),
      h(
        'strong',
        null,
        done ? t('Daily goal reached', 'Tagesziel erreicht') : t(`${minutes} of ${goal} minutes`, `${minutes} von ${goal} Minuten`),
      ),
      h(
        'span',
        { class: streak ? 'streak on' : 'streak' },
        icon('flame'),
        streak === 1 ? t('1 day in a row', '1 Tag in Folge') : t(`${streak} days in a row`, `${streak} Tage in Folge`),
      ),
    ),
    h('div', { class: 'week' }, week),
    h(
      'div',
      { class: 'today-actions' },
      h('button', { class: 'btn', onclick: () => app.goWarmup() }, icon('flame'), t('Warm up', 'Aufwärmen')),
      piece && h('button', { class: 'btn', onclick: () => app.goSong(piece.id) }, icon('music'), tr(piece.title)),
    ),
  )
}
