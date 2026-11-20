import { nameToMidi } from '../core/pitch'
import type { Hand } from '../core/types'
import { LESSONS, UNITS, type Lesson, type Step } from '../curriculum'
import { starsFor } from '../judge/judge'
import { Highway } from '../render/highway'
import type { App } from './app'
import { h, icon, type View } from './dom'
import { PlayView, type PlayResult } from './play'
import { resultsCard } from './results'

const STEP_NAMES: Record<Step['type'], string> = { explain: 'Learn', demo: 'Watch', drill: 'Practise', perform: 'Perform' }
/** The "slow it down" retry: three-quarter speed, worth at most one star. */
const SLOW_TEMPO = 0.75

/** Runs a lesson's steps in order: explain, demo, drill, perform, results. */
export class LessonView implements View {
  readonly el: HTMLElement
  private body = h('div', { class: 'lesson-body' })
  private dots = h('ol', { class: 'steps' })
  private stepView: View | null = null
  private index = 0

  constructor(
    private app: App,
    private lesson: Lesson,
  ) {
    const unit = UNITS.find((u) => u.n === lesson.unit)!
    this.el = h(
      'div',
      { class: 'screen lesson' },
      h(
        'header',
        { class: 'topbar' },
        h('button', { class: 'btn ghost', onclick: () => app.goPath() }, icon('back'), 'Lessons'),
        h('div', { class: 'lesson-title' }, h('span', { class: 'eyebrow' }, `Unit ${unit.n} · ${unit.title}`), h('strong', null, lesson.title)),
        h('span', { class: 'spacer' }),
        this.dots,
      ),
      this.body,
    )
    this.go(0)
  }

  destroy(): void {
    this.stepView?.destroy?.()
  }

  private mount(view: View): void {
    this.stepView?.destroy?.()
    this.app.synth.allOff()
    this.stepView = view
    this.body.replaceChildren(view.el)
  }

  private go(index: number, slow = false): void {
    this.index = index
    const step = this.lesson.steps[index]
    this.dots.replaceChildren(
      ...this.lesson.steps.map((s, i) =>
        h('li', { class: i === index ? 'current' : i < index ? 'done' : '', 'aria-current': i === index ? 'step' : undefined }, STEP_NAMES[s.type]),
      ),
    )
    const next = () => this.go(index + 1)

    if (step.type === 'explain') {
      this.mount(explainView(this.app, step, next))
      return
    }
    const play = (overrides: { onFinish(r: PlayResult): void }) =>
      new PlayView(this.app, {
        chart: step.chart,
        mode: step.type === 'demo' ? 'demo' : step.type === 'drill' || step.judging === 'pitch' ? 'wait' : 'timed',
        hands: step.type === 'demo' ? undefined : step.hands,
        tempoScale: slow ? SLOW_TEMPO : 1,
        tools: step.type === 'drill',
        scored: step.type === 'perform',
        label: slow ? `${STEP_NAMES[step.type]} · slower` : STEP_NAMES[step.type],
        onSkip: step.type === 'perform' ? undefined : next,
        onExit: () => this.app.goPath(),
        ...overrides,
      })

    if (step.type === 'demo') {
      this.mount(
        play({
          onFinish: () =>
            this.between('Your turn', 'Next you will play it yourself. The music waits for you, so take all the time you need.', [
              { label: 'I am ready', primary: true, onclick: next },
              { label: 'Watch again', onclick: () => this.go(index) },
            ]),
        }),
      )
    } else if (step.type === 'drill') {
      this.mount(
        play({
          onFinish: () =>
            this.between('That is the idea', 'Run it again as often as you like. When it feels comfortable, play it for a score.', [
              { label: 'Play for a score', primary: true, onclick: next },
              { label: 'Practise again', onclick: () => this.go(index) },
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
    const retry = { label: passed ? 'Play again' : 'Try again', primary: !passed, onclick: () => this.go(this.index) }
    const slower = { label: 'Slow it down', onclick: () => this.go(this.index, true) }
    const onward = !isLastStep
      ? { label: 'Continue', primary: true, onclick: () => this.go(this.index + 1) }
      : nextLesson
        ? { label: 'Next lesson', primary: true, onclick: () => this.app.goLesson(nextLesson) }
        : { label: 'Finish the course', primary: true, onclick: () => this.app.goPath() }

    this.mount({
      el: h(
        'div',
        { class: 'centered' },
        resultsCard({
          title: this.lesson.title,
          summary: result.summary,
          stars: earned,
          timed: step.judging === 'timed',
          pass,
          note: slow && passed ? 'Passed at a slower tempo, which earns one star. Play it at full speed for more.' : undefined,
          actions: [
            ...(passed ? [onward] : []),
            retry,
            ...(step.judging === 'timed' && !slow && earned < 2 ? [slower] : []),
            { label: 'Back to lessons', onclick: () => this.app.goPath() },
          ],
        }),
      ),
    })
  }
}

/** Text beside a live keyboard, with keys lit up; optionally waits for a key press. */
function explainView(app: App, step: Extract<Step, { type: 'explain' }>, next: () => void): View {
  const canvas = h('canvas', { class: 'stage-canvas' })
  const target = step.pressToContinue ? nameToMidi(step.pressToContinue) : null
  let found = target === null
  const button = h('button', { class: 'btn primary', disabled: !found, onclick: next }, 'Continue')
  const prompt = h('p', { class: 'prompt', hidden: found }, 'Find the glowing key and press it.')

  const el = h(
    'div',
    { class: 'explain' },
    h('div', { class: 'stage' }, canvas),
    h(
      'div',
      { class: 'card explain-card' },
      h('h2', null, step.title),
      step.text.split('\n\n').map((para) => h('p', null, para)),
      prompt,
      h('div', { class: 'row' }, button),
    ),
  )

  const highway = new Highway(canvas)
  highway.setRange(null)
  const highlight = new Map<number, Hand | 'hint'>((step.highlight ?? []).map((name) => [nameToMidi(name), 'hint']))
  const setOptions = () => highway.setOptions({ labels: app.progress.settings.labels, keyHints: app.usingComputerKeys })
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
    prompt.textContent = 'That is the one.'
    button.focus()
  })
  const onKey = (e: KeyboardEvent) => {
    if (e.code === 'Enter' && found && document.activeElement !== button) next()
  }
  window.addEventListener('keydown', onKey)

  return {
    el,
    destroy() {
      cancelAnimationFrame(raf)
      offStatus()
      offNote()
      window.removeEventListener('keydown', onKey)
      highway.destroy()
    },
  }
}
