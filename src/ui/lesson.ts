import { nameToMidi } from '../core/pitch'
import type { Hand } from '../core/types'
import { LESSONS, UNITS, type Lesson, type Step } from '../curriculum'
import { starsFor } from '../judge/judge'
import { Highway } from '../render/highway'
import type { App } from './app'
import { h, icon, type View } from './dom'
import { midiPill } from './midiPill'
import { PlayView, type PlayResult, type Practice } from './play'
import { resultsCard } from './results'
import { t, tr } from '../i18n'

const stepName = (type: Step['type']): string =>
  ({
    explain: t('Learn', 'Lernen'),
    demo: t('Watch', 'Ansehen'),
    drill: t('Practise', 'Üben'),
    perform: t('Perform', 'Vorspielen'),
  })[type]
/** The "slow it down" retry: three-quarter speed, worth at most one star. */
const SLOW_TEMPO = 0.75

/** Runs a lesson's steps in order: explain, demo, drill, perform, results. */
export class LessonView implements View {
  readonly el: HTMLElement
  private body = h('div', { class: 'lesson-body' })
  private dots = h('ol', { class: 'steps' })
  private stepView: View | null = null
  private pill: View
  private index = 0

  constructor(
    private app: App,
    private lesson: Lesson,
  ) {
    const unit = UNITS.find((u) => u.n === lesson.unit)!
    this.pill = midiPill(app)
    this.el = h(
      'div',
      { class: 'screen lesson' },
      h(
        'header',
        { class: 'topbar' },
        h('button', { class: 'btn ghost', onclick: () => app.goPath() }, icon('back'), t('Lessons', 'Lektionen')),
        h('div', { class: 'lesson-title' }, h('span', { class: 'eyebrow' }, `${t('Unit', 'Einheit')} ${unit.n} · ${tr(unit.title)}`), h('strong', null, tr(lesson.title))),
        h('span', { class: 'spacer' }),
        this.dots,
        this.pill.el,
      ),
      this.body,
    )
    this.go(0)
  }

  destroy(): void {
    this.stepView?.destroy?.()
    this.pill.destroy?.()
  }

  private mount(view: View): void {
    this.stepView?.destroy?.()
    this.app.synth.allOff()
    this.stepView = view
    this.body.replaceChildren(view.el)
  }

  private go(index: number, slow = false, practice?: Practice): void {
    this.index = index
    const step = this.lesson.steps[index]
    // Once a lesson is passed, any step can be jumped to (say, straight to the scored run).
    const passed = (this.app.progress.lessonResult(this.lesson.id)?.stars ?? 0) > 0
    this.dots.classList.toggle('jump', passed)
    this.dots.replaceChildren(
      ...this.lesson.steps.map((s, i) => {
        const cls = i === index ? 'current' : i < index ? 'done' : ''
        const name = stepName(s.type)
        return h(
          'li',
          { class: cls, 'aria-current': i === index ? 'step' : undefined },
          passed && i !== index ? h('button', { class: 'step-jump', title: `${t('Go to', 'Gehe zu')}: ${tr(s.title)}`, onclick: () => this.go(i) }, name) : name,
        )
      }),
    )
    const next = () => this.go(index + 1)
    // Lessons that end in a timed run get a metronome in the demo too, so the beat is heard first.
    const timedLesson = this.lesson.steps.some((s) => s.type === 'perform' && s.judging === 'timed')

    if (step.type === 'explain') {
      this.mount(explainView(this.app, step, next))
      return
    }
    const play = (overrides: { onFinish(r: PlayResult): void }) =>
      new PlayView(this.app, {
        chart: step.chart,
        title: tr(this.lesson.title),
        mode: step.type === 'demo' ? 'demo' : step.type === 'drill' || step.judging === 'pitch' ? 'wait' : 'timed',
        hands: step.type === 'demo' ? undefined : step.hands,
        tempoScale: slow ? SLOW_TEMPO : 1,
        practice: step.type === 'drill' ? practice : undefined,
        tools: step.type === 'drill',
        metronome: timedLesson,
        scored: step.type === 'perform',
        label: `${t('Lesson', 'Lektion')} ${String(LESSONS.indexOf(this.lesson) + 1).padStart(2, '0')} • ${stepName(step.type)}${slow ? t(', slower', ', langsamer') : ''}`,
        onSkip: step.type === 'perform' ? undefined : next,
        onExit: () => this.app.goPath(),
        ...overrides,
      })

    if (step.type === 'demo') {
      this.mount(
        play({
          onFinish: () =>
            this.between(t('Your turn', 'Du bist dran'), t('Next you will play it yourself. The music waits for you, so take all the time you need.', 'Jetzt spielst du selbst. Die Musik wartet auf dich, nimm dir also alle Zeit, die du brauchst.'), [
              { label: t('I am ready', 'Ich bin bereit'), primary: true, onclick: next },
              { label: t('Watch again', 'Nochmal ansehen'), onclick: () => this.go(index) },
            ]),
        }),
      )
    } else if (step.type === 'drill') {
      this.mount(
        play({
          onFinish: (result) =>
            this.between(t('That is the idea', 'So geht das'), t('Run it again as often as you like. When it feels comfortable, play it for a score.', 'Wiederhole es, so oft du magst. Wenn es sich gut anfühlt, spiel es für eine Wertung.'), [
              { label: t('Play for a score', 'Für Wertung spielen'), primary: true, onclick: next },
              // Same tempo, hands and loop as the run just played.
              { label: t('Practise again', 'Nochmal üben'), onclick: () => this.go(index, false, result.practice) },
            ]),
        }),
      )
    } else {
      this.mount(play({ onFinish: (result) => this.finishPerform(step, result, slow) }))
    }
  }

  /** A card over the stage between steps. */
  private between(title: string, text: string, actions: { label: string; primary?: boolean; onclick: () => void }[]): void {
    this.body.append(
      h(
        'div',
        { class: 'overlay' },
        h(
          'div',
          { class: 'card' },
          h('h2', null, title),
          h('p', null, text),
          h('div', { class: 'row' }, actions.map((a) => h('button', { class: a.primary ? 'btn primary' : 'btn', onclick: a.onclick }, a.label))),
        ),
      ),
    )
  }

  private finishPerform(step: Extract<Step, { type: 'perform' }>, result: PlayResult, slow: boolean): void {
    const pass = step.pass ?? 0.8
    const { accuracy } = result.summary
    const earned = slow ? Math.min(1, starsFor(accuracy, pass)) : starsFor(accuracy, pass)
    const isLastStep = this.index === this.lesson.steps.length - 1
    if (isLastStep) this.app.progress.recordLesson(this.lesson.id, accuracy, earned)
    this.app.progress.addStats(result.events.map((e) => ({ ...e, id: this.lesson.id })))

    const nextLesson = LESSONS[LESSONS.indexOf(this.lesson) + 1]
    const passed = earned > 0
    // Retrying keeps the tempo you chose; the other tempo is always one click away.
    const retry = { label: passed ? t('Play again', 'Nochmal spielen') : t('Try again', 'Nochmal versuchen'), primary: !passed, onclick: () => this.go(this.index, slow) }
    const otherTempo = slow
      ? { label: t('Full speed', 'Volles Tempo'), onclick: () => this.go(this.index) }
      : { label: t('Slow it down', 'Langsamer'), onclick: () => this.go(this.index, true) }
    const onward = !isLastStep
      ? { label: t('Continue', 'Weiter'), primary: true, onclick: () => this.go(this.index + 1) }
      : nextLesson
        ? { label: t('Next lesson', 'Nächste Lektion'), primary: true, onclick: () => this.app.goLesson(nextLesson) }
        : { label: t('Finish the course', 'Kurs abschließen'), primary: true, onclick: () => this.app.goPath() }

    this.mount({
      el: h(
        'div',
        { class: 'centered' },
        resultsCard({
          title: tr(this.lesson.title),
          summary: result.summary,
          stars: earned,
          timed: step.judging === 'timed',
          pass,
          note: slow && passed ? t('Passed at a slower tempo, which earns one star. Play it at full speed for more.', 'Im langsameren Tempo bestanden, das gibt einen Stern. Spiel im vollen Tempo für mehr.') : undefined,
          actions: [
            ...(passed ? [onward] : []),
            retry,
            ...(step.judging === 'timed' && (slow || earned < 2) ? [otherTempo] : []),
            { label: t('Back to lessons', 'Zurück zu den Lektionen'), onclick: () => this.app.goPath() },
          ],
        }),
      ),
    })
  }
}

/** Text beside a live keyboard, with keys lit up; optionally waits for a key press. */
function explainView(app: App, step: Extract<Step, { type: 'explain' }>, next: () => void): View {
  const canvas = h('canvas', { class: 'stage-canvas' })
  const stage = h('div', { class: 'stage' }, canvas)
  const target = step.pressToContinue ? nameToMidi(step.pressToContinue) : null
  let found = target === null
  const button = h('button', { class: 'btn primary', disabled: !found, onclick: next }, t('Continue', 'Weiter'))
  const prompt = h('p', { class: 'prompt', hidden: found }, t('Find the glowing key and press it.', 'Finde die leuchtende Taste und drück sie.'))

  const el = h(
    'div',
    { class: 'explain' },
    stage,
    h(
      'div',
      { class: 'card explain-card' },
      h('h2', null, tr(step.title)),
      tr(step.text).split('\n\n').map((para) => h('p', null, para)),
      prompt,
      h('div', { class: 'row' }, button),
    ),
  )

  const highway = new Highway(canvas)
  const offPointer = app.input.attachPointer(stage, (x, y) => highway.keyAt(x, y))
  highway.setRange(null)
  const highlight = new Map<number, Hand | 'hint'>((step.highlight ?? []).map((name) => [nameToMidi(name), 'hint']))
  const setOptions = () =>
    highway.setOptions({ labels: app.progress.settings.labels, keyHints: app.usingComputerKeys, hintShift: app.input.octaveShift, keys: app.keyboard })
  setOptions()

  let raf = 0
  const frame = () => {
    raf = requestAnimationFrame(frame)
    highway.setHeld(app.input.held)
    highway.draw({ beat: 0, highlight })
  }
  frame()

  const offStatus = app.input.onStatus(setOptions)
  const offNote = app.input.onNote((pitch, on) => {
    if (!on || found || pitch !== target) return
    found = true
    highway.flash(pitch, 'perfect')
    button.disabled = false
    prompt.textContent = t('That is the one.', 'Genau die.')
    button.focus()
  })
  const onKey = (e: KeyboardEvent) => {
    // Enter carries on from anywhere, unless another control has focus and wants the Enter itself.
    const free = !document.activeElement || document.activeElement === document.body
    if (e.code === 'Enter' && found && free) next()
  }
  window.addEventListener('keydown', onKey)

  return {
    el,
    destroy() {
      cancelAnimationFrame(raf)
      offStatus()
      offNote()
      offPointer()
      window.removeEventListener('keydown', onKey)
      highway.destroy()
    },
  }
}
