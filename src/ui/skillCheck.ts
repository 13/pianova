import { placement, SKILL_PASS, SKILL_TESTS } from '../curriculum/skill'
import { UNITS } from '../curriculum'
import { MAX_LEVEL } from '../chart/difficulty'
import type { App } from './app'
import { h, icon, percent, type View } from './dom'
import { midiPill } from './midiPill'
import { PlayView } from './play'
import { hitRate } from './song'
import { t, tr } from '../i18n'

/**
 * A few short tests, each harder than the last, that stop at the first one that doesn't
 * go well. How far you get decides which lessons open and where songs start.
 */
export function skillCheckView(app: App, done: () => void): View {
  const body = h('div', { class: 'lesson-body' })
  const pill = midiPill(app)
  let current: View | null = null
  let passed = 0

  const mount = (view: View) => {
    current?.destroy?.()
    app.synth.allOff()
    current = view
    body.replaceChildren(view.el)
  }
  const card = (...children: (HTMLElement | string | false)[]) => mount({ el: h('div', { class: 'centered' }, h('div', { class: 'card skill-card' }, children)) })

  const finish = (skill: number) => {
    app.progress.setSkill(skill)
    const place = placement(skill)
    const unit = UNITS.find((u) => u.n === place.openUnit)!
    card(
      h('span', { class: 'eyebrow' }, t('Skill check', 'Einstufung')),
      h('h2', null, tr(place.label)),
      h(
        'ul',
        { class: 'tips' },
        h('li', null, skill === 0 ? t('Lessons start at the very beginning, Unit 1.', 'Die Lektionen beginnen ganz am Anfang, bei Einheit 1.') : t(
                `Lessons are open up to Unit ${unit.n}, ${tr(unit.title)}. Earlier ones stay open to revisit.`,
                `Die Lektionen sind bis Einheit ${unit.n}, ${tr(unit.title)}, offen. Frühere bleiben zum Wiederholen offen.`,
              )),
        h('li', null, t(
            `Songs start at level ${place.songLevel} of ${MAX_LEVEL} and fill in as you play them well.`,
            `Lieder beginnen auf Stufe ${place.songLevel} von ${MAX_LEVEL} und füllen sich, wenn du sie gut spielst.`,
          )),
      ),
      h('p', { class: 'muted' }, t('You can take the check again any time from Settings.', 'Du kannst die Einstufung jederzeit in den Einstellungen wiederholen.')),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: done }, t('Continue', 'Weiter'))),
    )
  }

  const intro = (i: number) => {
    const test = SKILL_TESTS[i]
    card(
      h('span', { class: 'eyebrow' }, `${t(t('Skill check', 'Einstufung'), 'Einstufung')} · ${t(`${i + 1} of ${SKILL_TESTS.length}`, `${i + 1} von ${SKILL_TESTS.length}`)}`),
      h('h2', null, tr(test.title)),
      h('p', null, tr(test.text)),
      h(
        'div',
        { class: 'row' },
        h('button', { class: 'btn primary', onclick: () => run(i) }, t('Play', 'Spielen')),
        h('button', { class: 'btn ghost', onclick: () => finish(passed) }, t('Stop here', 'Hier aufhören')),
      ),
    )
  }

  const run = (i: number) => {
    const test = SKILL_TESTS[i]
    mount(
      new PlayView(app, {
        chart: test.chart,
        mode: test.mode,
        hands: test.hands,
        tools: false,
        scored: true,
        metronome: test.mode === 'timed',
        title: tr(test.title),
        label: `${t(t('Skill check', 'Einstufung'), 'Einstufung')} • ${t(`${i + 1} of ${SKILL_TESTS.length}`, `${i + 1} von ${SKILL_TESTS.length}`)}`,
        onExit: () => finish(passed),
        onFinish: (result) => {
          const score = hitRate(result.summary)
          if (score < SKILL_PASS) {
            card(
              h('span', { class: 'eyebrow' }, tr(test.title)),
              h('h2', null, t(`${percent(score)}: that's where we'll start`, `${percent(score)}: hier fangen wir an`)),
              h('p', null, t('No problem at all. The lessons will pick it up from here.', 'Überhaupt kein Problem. Die Lektionen machen genau hier weiter.')),
              h(
                'div',
                { class: 'row' },
                h('button', { class: 'btn primary', onclick: () => finish(passed) }, t('See where you start', 'Zeig mir, wo ich anfange')),
                h('button', { class: 'btn', onclick: () => run(i) }, t('Try that one again', 'Das nochmal versuchen')),
              ),
            )
            return
          }
          passed = i + 1
          if (passed === SKILL_TESTS.length) finish(passed)
          else intro(i + 1)
        },
      }),
    )
  }

  card(
    h('span', { class: 'eyebrow' }, t('Welcome', 'Willkommen')),
    h('h2', null, t('Quick skill check', 'Kurze Einstufung')),
    h(
      'p',
      null,
      t('Four short pieces, each a little harder, to find where you should start. It stops as soon as one feels too hard, so it never takes long.', 'Vier kurze Stücke, jedes etwas schwerer, um herauszufinden, wo du anfangen solltest. Sobald eines zu schwer ist, hört es auf – es dauert also nie lange.'),
    ),
    h(
      'div',
      { class: 'row' },
      h('button', { class: 'btn primary', onclick: () => intro(0) }, t('Start the check', 'Einstufung starten')),
      h('button', { class: 'btn', onclick: () => finish(0) }, t("I'm new to piano", 'Ich bin neu am Klavier')),
    ),
  )

  const el = h(
    'div',
    { class: 'screen lesson' },
    h(
      'header',
      { class: 'topbar' },
      h('span', { class: 'wordmark' }, icon('nova'), 'Pianova'),
      h('span', { class: 'spacer' }),
      pill.el,
    ),
    body,
  )
  return {
    el,
    destroy() {
      current?.destroy?.()
      pill.destroy?.()
    },
  }
}
