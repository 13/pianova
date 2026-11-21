import { arrangement, ARRANGEMENTS, type ArrangementId } from '../chart/arrangements'
import { arrange, mastery, MAX_LEVEL, shareFor } from '../chart/difficulty'
import { withFingering } from '../chart/fingering'
import { placeNotes, songSections, type Section } from '../chart/sections'
import type { Chart, Hand } from '../core/types'
import { placement } from '../curriculum/skill'
import { starsFor, type Summary } from '../judge/judge'
import { afterPass, levelsAfterRun, startDrill, type DrillEvent, type DrillState } from '../practice/trainer'
import type { SongProgress } from '../progress/store'
import type { App } from './app'
import { h, icon, percent, type View } from './dom'
import { playChart } from './freeplay'
import { midiPill } from './midiPill'
import { PlayView, type PlayResult } from './play'
import { resultsCard } from './results'
import { t, tr } from '../i18n'

export interface SongInfo {
  /** Where its progress is saved. */
  id: string
  title: string
  composer: string
  chart: Chart
  /** Built-in pieces also keep a best score and stars for Free play. */
  pieceId: string | null
}

/** A finished part's join with the one before must be this clean to move on. */
const JOIN_CLEAN = 0.85

/** Notes hit (perfect or good) out of every note and wrong press. Timing nuance aside, did it go right? */
export function hitRate(s: Summary): number {
  return (s.perfect + s.good) / Math.max(1, s.total + s.wrong)
}

/** One song with its parts, the level of each, and what has been mastered. */
class Song {
  readonly chart: Chart
  readonly sections: Section[]
  readonly names: string[]
  readonly hands: Hand[]
  readonly tiers: number[]
  /** Where this arrangement's levels and mastery are kept. */
  readonly progressId: string
  progress: SongProgress

  constructor(
    private app: App,
    readonly info: SongInfo,
    readonly arrangementId: ArrangementId = 'full',
  ) {
    // Fitted and fingered once, so every simplified version shares the same notes.
    const arranged = arrangement(app.prepare(info.chart), arrangementId)
    this.chart = withFingering(arranged.chart)
    this.sections = songSections(this.chart)
    this.names = this.sections.map((s) => s.name)
    this.tiers = arranged.tiers
    this.hands = arranged.hands
    this.progressId = arrangementId === 'full' ? info.id : `${info.id}@${arrangementId}`
    const start = placement(app.progress.skill).songLevel
    this.progress = app.progress.song(this.progressId, this.sections.length) ?? {
      levels: this.sections.map(() => start),
      shares: this.sections.map(() => 0),
      mastery: 0,
    }
  }

  /** The song with every part at its current level. */
  arranged(): Chart {
    return arrange(this.chart, this.sections, this.progress.levels, this.tiers).chart
  }

  get mastery(): number {
    return mastery(this.sections, this.progress.shares)
  }

  /** The distinct parts, in the order they first come. */
  get parts(): string[] {
    return [...new Set(this.names)]
  }

  first(name: string): number {
    return this.names.indexOf(name)
  }

  level(name: string): number {
    return this.progress.levels[this.first(name)]
  }

  /** Sets a part's level everywhere it comes back. */
  setLevel(name: string, level: number): void {
    this.names.forEach((n, k) => {
      if (n === name) this.progress.levels[k] = level
    })
  }

  /** Records a pass of a part played at its current level with this accuracy. */
  credit(name: string, accuracy: number): void {
    this.names.forEach((n, k) => {
      if (n !== name) return
      const share = shareFor(this.sections[k], this.progress.levels[k], accuracy, this.tiers)
      this.progress.shares[k] = Math.max(this.progress.shares[k], share)
    })
  }

  save(): void {
    this.progress.mastery = this.mastery
    this.app.progress.saveSong(this.progressId, this.progress)
  }
}

/** A song's home: mastery, the level of each part, and the ways in. */
/** The arrangement last chosen for each song in this visit. */
const chosen = new Map<string, ArrangementId>()

export function songView(app: App, info: SongInfo, back: () => void): View {
  const arr = chosen.get(info.id) ?? 'full'
  if (info.pieceId) app.progress.setLastSong(info.pieceId)
  const song = new Song(app, info, arr)
  const best = app.progress.song(song.progressId, song.sections.length)?.mastery ?? 0
  const again = () => app.show(songView(app, info, back))
  const open = (step: Step) => app.show(new SongLessonView(app, song, step, again))
  const tabs = h(
    'div',
    { class: 'arr-tabs', role: 'radiogroup', 'aria-label': t('Arrangement', 'Arrangement') },
    ARRANGEMENTS.map((a) => {
      const m = app.progress.songMastery(a.id === 'full' ? info.id : `${info.id}@${a.id}`)
      return h(
        'button',
        {
          class: a.id === arr ? 'arr-tab on' : 'arr-tab',
          role: 'radio',
          'aria-checked': String(a.id === arr),
          title: tr(a.blurb),
          onclick: () => {
            chosen.set(info.id, a.id)
            again()
          },
        },
        h('strong', null, tr(a.name)),
        h('span', { class: 'muted' }, m !== undefined ? percent(m) : '–'),
      )
    }),
  )

  const parts = song.sections.map((s) =>
    h(
      'li',
      { class: 'part-row' },
      h('strong', { class: 'part-name' }, `${t('Part', 'Teil')} ${s.name}`),
      h('span', { class: 'muted' }, s.fromBar === s.toBar ? `${t('Bar', 'Takt')} ${s.fromBar}` : `${t('Bars', 'Takte')} ${s.fromBar}–${s.toBar}`),
      levelPips(song.progress.levels[song.sections.indexOf(s)]),
    ),
  )
  const pill = midiPill(app)
  const el = h(
    'div',
    { class: 'screen' },
    h(
      'header',
      { class: 'topbar' },
      h('button', { class: 'btn ghost', onclick: back }, icon('back'), t('Songs', 'Lieder')),
      h('strong', null, info.title),
      h('span', { class: 'spacer' }),
      pill.el,
    ),
    h(
      'main',
      { class: 'centered' },
      h(
        'div',
        { class: 'card song-card' },
        h('span', { class: 'eyebrow' }, info.composer),
        h('h2', null, info.title),
        tabs,
        h('p', { class: 'muted arr-blurb' }, tr(ARRANGEMENTS.find((a) => a.id === arr)!.blurb)),
        h(
          'div',
          { class: 'mastery' },
          h('span', { class: 'mastery-value' }, percent(Math.max(best, song.mastery))),
          h('span', { class: 'eyebrow' }, t('Mastered', 'Gemeistert')),
          h('div', { class: 'mastery-bar' }, h('div', { style: `width: ${Math.max(best, song.mastery) * 100}%` })),
        ),
        h(
          'p',
          { class: 'muted' },
          t('Each part starts simple and gains notes as you play it well, up to the full arrangement at level 5.', 'Jeder Teil beginnt einfach und bekommt mehr Noten, wenn du ihn gut spielst – bis zum vollen Satz auf Stufe 5.'),
        ),
        h('ol', { class: 'parts' }, parts),
        h(
          'div',
          { class: 'row' },
          h('button', { class: 'btn primary', onclick: () => open('listen') }, song.mastery > 0 ? t('Continue the lesson', 'Lektion fortsetzen') : t('Start the lesson', 'Lektion starten')),
          h('button', { class: 'btn', onclick: () => open('learn') }, t('Learn the parts', 'Teile lernen')),
          h('button', { class: 'btn', onclick: () => open('perform') }, t('Perform', 'Vorspielen')),
          h(
            'button',
            {
              class: 'btn ghost',
              title: t('The full song with every practice tool: tempo, loop, one hand at a time', 'Das ganze Lied mit allen Übungswerkzeugen: Tempo, Schleife, eine Hand allein'),
              onclick: () =>
                app.show(
                  playChart(app, song.chart, {
                    title: info.title,
                    hands: song.hands,
                    band: true,
                    saveAs: info.pieceId,
                    label: `${t('Free play', 'Frei spielen')} • ${info.composer}`,
                    unsaved: info.pieceId === null ? t('Scores for imported files are not saved.', 'Ergebnisse importierter Dateien werden nicht gespeichert.') : undefined,
                    backLabel: info.title,
                    back: again,
                    another: t('Back to the song', 'Zurück zum Lied'),
                  }),
                ),
            },
            t('Play freely', 'Frei spielen'),
          ),
        ),
      ),
    ),
  )
  return { el, destroy: () => pill.destroy?.() }
}

function levelPips(level: number): HTMLElement {
  return h(
    'span',
    { class: 'pips', title: t(`Level ${level} of ${MAX_LEVEL}`, `Stufe ${level} von ${MAX_LEVEL}`), 'aria-label': t(`Level ${level} of ${MAX_LEVEL}`, `Stufe ${level} von ${MAX_LEVEL}`) },
    Array.from({ length: MAX_LEVEL }, (_, i) => h('span', { class: i < level ? 'pip on' : 'pip' })),
  )
}

type Step = 'listen' | 'learn' | 'perform'
const steps = (): [Step, string][] => [
  ['listen', t('Listen', 'Anhören')],
  ['learn', t('Learn the parts', 'Teile lernen')],
  ['perform', t('Perform', 'Vorspielen')],
]

/** Listen to the song, learn it part by part, then perform it. */
class SongLessonView implements View {
  readonly el: HTMLElement
  private body = h('div', { class: 'lesson-body' })
  private dots = h('ol', { class: 'steps' })
  private current: View | null = null
  private pill: View
  private timer = 0

  constructor(
    private app: App,
    private song: Song,
    step: Step,
    private home: () => void,
  ) {
    this.pill = midiPill(app)
    this.el = h(
      'div',
      { class: 'screen lesson' },
      h(
        'header',
        { class: 'topbar' },
        h('button', { class: 'btn ghost', onclick: home }, icon('back'), song.info.title),
        h('div', { class: 'lesson-title' }, h('span', { class: 'eyebrow' }, t('Song lesson', 'Liedlektion')), h('strong', null, song.info.title)),
        h('span', { class: 'spacer' }),
        this.dots,
        this.pill.el,
      ),
      this.body,
    )
    if (step === 'listen') this.listen()
    else if (step === 'learn') this.learnFromStart()
    else this.perform()
  }

  destroy(): void {
    clearTimeout(this.timer)
    this.current?.destroy?.()
    this.pill.destroy?.()
  }

  private mount(view: View, step: Step): void {
    clearTimeout(this.timer)
    this.current?.destroy?.()
    this.app.synth.allOff()
    this.current = view
    this.body.replaceChildren(view.el)
    const all = steps()
    const at = all.findIndex(([s]) => s === step)
    this.dots.replaceChildren(
      ...all.map(([, name], i) =>
        h('li', { class: i === at ? 'current' : i < at ? 'done' : '', 'aria-current': i === at ? 'step' : undefined }, name),
      ),
    )
  }

  private card(title: string, text: string, actions: { label: string; primary?: boolean; onclick: () => void }[]): void {
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

  // ---- listen --------------------------------------------------------------

  private listen(): void {
    const { song } = this
    this.mount(
      new PlayView(this.app, {
        chart: song.chart,
        sections: song.sections,
        sectionLevels: [...song.progress.levels],
        band: true,
        title: song.info.title,
        mode: 'demo',
        tools: false,
        metronome: true,
        scored: false,
        label: t('Listen • the full song', 'Anhören • das ganze Lied'),
        onSkip: () => this.learnFromStart(),
        onExit: this.home,
        onFinish: () =>
          this.card(t('Now learn it', 'Jetzt lernst du es'), t('You will learn the song one part at a time, starting simple. Every clean pass speeds it up or adds notes.', 'Du lernst das Lied Teil für Teil, einfach beginnend. Jeder saubere Durchgang macht es schneller oder bringt mehr Noten.'), [
            { label: t('Start learning', 'Lernen starten'), primary: true, onclick: () => this.learnFromStart() },
            { label: t('Listen again', 'Nochmal anhören'), onclick: () => this.listen() },
          ]),
      }),
      'listen',
    )
  }

  // ---- learn: section practice ---------------------------------------------

  /** Practises part `k` of the song (by first appearance) until it is learned. */
  private learn(k: number): void {
    const { song } = this
    const parts = song.parts
    if (k >= parts.length) return this.perform()
    const name = parts[k]
    const section = song.sections[song.first(name)]
    let drill: DrillState = startDrill(song.level(name))

    const status = () =>
      `${t('Part', 'Teil')} ${name} ${t('of', 'von')} ${parts.join(' ')} · ${t('Level', 'Stufe')} ${drill.level}/${MAX_LEVEL} · ${t('speed', 'Tempo')} ${percent(drill.tempo)}`
    const next = () => (k > 0 ? this.join(k) : this.learn(k + 1))

    const view: PlayView = new PlayView(this.app, {
      chart: song.arranged(),
      sections: song.sections,
      sectionLevels: [...song.progress.levels],
      band: true,
      title: song.info.title,
      mode: 'timed',
      hands: song.hands,
      practice: { mode: 'timed', hands: song.hands, tempo: drill.tempo, loop: { fromBar: section.fromBar, toBar: section.toBar } },
      tools: false,
      scored: true,
      label: `${t('Learn', 'Lernen')} • ${t('Part', 'Teil')} ${name}`,
      onSkip: next,
      onExit: this.home,
      onFinish: () => undefined,
      onPass: (pass) => {
        const accuracy = hitRate(pass)
        song.credit(name, accuracy)
        const r = afterPass(drill, accuracy)
        drill = r.state
        song.setLevel(name, drill.level)
        song.save()
        this.react(view, r.event, drill, name, accuracy)
        view.setStatus(status())
        if (r.event === 'learned') {
          this.timer = window.setTimeout(next, 1800)
        }
      },
    })
    view.setStatus(status())
    this.mount(view, 'learn')
  }

  /** Learning picks up at the first part not yet at the top level (or the first, if all are). */
  private learnFromStart(): void {
    const k = this.song.parts.findIndex((p) => this.song.level(p) < MAX_LEVEL)
    this.learn(Math.max(0, k))
  }

  /** Tells the player what just changed, and applies it to the loop. */
  private react(view: PlayView, event: DrillEvent, drill: DrillState, name: string, accuracy: number): void {
    const speed = `${t('speed', 'Tempo')} ${percent(drill.tempo)}`
    switch (event) {
      case 'faster':
        view.banner(t('Clean!', 'Sauber!'), `${t('Faster', 'Schneller')}: ${speed}`, 'ok')
        view.reconfigure({ tempo: drill.tempo })
        break
      case 'level-up':
        view.banner(`${t('Level', 'Stufe')} ${drill.level}`, drill.level === MAX_LEVEL ? t('The full arrangement: every note', 'Der volle Satz: jede Note') : t('More notes coming in', 'Mehr Noten kommen dazu'), 'gold')
        view.reconfigure({ chart: this.song.arranged(), tempo: drill.tempo, sectionLevels: [...this.song.progress.levels] })
        break
      case 'learned':
        view.banner(t(`Part ${name} learned`, `Teil ${name} gelernt`), `${t('Full speed, every note', 'Volles Tempo, jede Note')}: ${percent(accuracy)}`, 'gold')
        break
      case 'slower':
        view.banner(t('Easing off', 'Etwas ruhiger'), `${t('Slower until it settles', 'Langsamer, bis es sitzt')}: ${speed}`, 'warn')
        view.reconfigure({ tempo: drill.tempo })
        break
      case 'level-down':
        view.banner(t(`Back to level ${drill.level}`, `Zurück auf Stufe ${drill.level}`), t('Fewer notes for now; they come back as it gets cleaner', 'Vorerst weniger Noten; sie kommen zurück, wenn es sauberer wird'), 'warn')
        view.reconfigure({ chart: this.song.arranged(), tempo: drill.tempo, sectionLevels: [...this.song.progress.levels] })
        break
      default:
        break
    }
  }

  /** Links part `k` to the part learned before it: both in a row, until one clean pass. */
  private join(k: number): void {
    const { song } = this
    const parts = song.parts
    const a = song.sections[song.first(parts[k - 1])]
    const b = song.sections[song.first(parts[k])]
    const fromBar = Math.min(a.fromBar, b.fromBar)
    const toBar = Math.max(a.toBar, b.toBar)
    const view: PlayView = new PlayView(this.app, {
      chart: song.arranged(),
      sections: song.sections,
      sectionLevels: [...song.progress.levels],
      band: true,
      title: song.info.title,
      mode: 'timed',
      hands: song.hands,
      practice: { mode: 'timed', hands: song.hands, tempo: 1, loop: { fromBar, toBar } },
      tools: false,
      scored: true,
      label: `${t('Join', 'Verbinden')} • ${t(`Parts ${parts[k - 1]} and ${parts[k]}`, `Teile ${parts[k - 1]} und ${parts[k]}`)}`,
      onSkip: () => this.learn(k + 1),
      onExit: this.home,
      onFinish: () => undefined,
      onPass: (pass) => {
        if (hitRate(pass) < JOIN_CLEAN) return
        view.banner(t('Joined up', 'Verbunden'), t(`Parts ${parts[k - 1]} and ${parts[k]} in one go`, `Teile ${parts[k - 1]} und ${parts[k]} in einem Zug`), 'gold')
        this.timer = window.setTimeout(() => this.learn(k + 1), 1800)
      },
    })
    view.setStatus(t(`Bars ${fromBar}–${toBar} at full speed, until one clean pass`, `Takte ${fromBar}–${toBar} im vollen Tempo, bis ein Durchgang sauber ist`))
    this.mount(view, 'learn')
  }

  // ---- perform -------------------------------------------------------------

  private perform(): void {
    const { song } = this
    const levels = [...song.progress.levels]
    const full = levels.every((l) => l >= MAX_LEVEL)
    const chart = song.arranged()
    const view = new PlayView(this.app, {
      chart,
      sections: song.sections,
      sectionLevels: [...song.progress.levels],
      band: true,
      title: song.info.title,
      mode: 'timed',
      hands: song.hands,
      tools: false,
      scored: true,
      label: full ? t('Perform • the full arrangement', 'Vorspielen • der volle Satz') : t('Perform • each part at its level', 'Vorspielen • jeder Teil auf seiner Stufe'),
      onExit: this.home,
      onFinish: (result) => this.finish(result, chart, levels, full),
    })
    view.setStatus(song.parts.map((p) => `${p} ${song.level(p)}/${MAX_LEVEL}`).join(' · '))
    this.mount(view, 'perform')
  }

  private finish(result: PlayResult, chart: Chart, levels: number[], full: boolean): void {
    const { song } = this
    const before = song.mastery
    // How each part went, then credit it and move its level.
    const placed = placeNotes(song.sections, chart)
    const accuracies = placed.map((s) => {
      const mine = s.notes.filter((i) => result.active[i] && result.noteState[i] !== 'pending')
      return mine.length ? mine.filter((i) => result.noteState[i] !== 'miss').length / mine.length : null
    })
    accuracies.forEach((acc, k) => {
      if (acc !== null) song.progress.shares[k] = Math.max(song.progress.shares[k], shareFor(song.sections[k], levels[k], acc, song.tiers))
    })
    song.progress.levels = levelsAfterRun(song.names, levels, accuracies)
    song.save()
    this.app.progress.addStats(result.events.map((e) => ({ ...e, id: song.info.id })))
    const accuracy = result.summary.accuracy
    const earned = full ? starsFor(accuracy) : 0
    if (full && song.info.pieceId && song.arrangementId === 'full') this.app.progress.recordPiece(song.info.pieceId, accuracy, earned)

    const changes = song.parts
      .map((p) => {
        const k = song.first(p)
        const was = levels[k]
        const now = song.progress.levels[k]
        return now > was
          ? t(`Part ${p} up to level ${now}`, `Teil ${p} auf Stufe ${now}`)
          : now < was
            ? t(`Part ${p} back to level ${now}`, `Teil ${p} zurück auf Stufe ${now}`)
            : null
      })
      .filter(Boolean)
    const gained = Math.round((song.mastery - before) * 100)
    const note = [
      `${t('Mastery', 'Beherrschung')} ${percent(song.mastery)}${gained > 0 ? ` (+${gained})` : ''}.`,
      changes.length ? `${changes.join(', ')}.` : t('Levels stay as they are.', 'Die Stufen bleiben, wie sie sind.'),
      full ? '' : t('Stars come with the full arrangement, every part at level 5.', 'Sterne gibt es mit dem vollen Satz, jeder Teil auf Stufe 5.'),
    ]
      .filter(Boolean)
      .join(' ')

    this.mount(
      {
        el: h(
          'div',
          { class: 'centered' },
          resultsCard({
            title: song.info.title,
            summary: result.summary,
            stars: earned,
            timed: true,
            note,
            actions: [
              { label: t('Perform again', 'Nochmal vorspielen'), primary: true, onclick: () => this.perform() },
              { label: t('Learn the parts', 'Teile lernen'), onclick: () => this.learnFromStart() },
              { label: t('Back to the song', 'Zurück zum Lied'), onclick: this.home },
            ],
          }),
        ),
      },
      'perform',
    )
  }
}
