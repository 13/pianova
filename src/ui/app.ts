import { Synth } from '../audio/synth'
import { LESSONS, PIECES, type Lesson } from '../curriculum'
import { dayNumber, warmupChart } from '../practice/warmup'
import { songView } from './song'
import { withFingering } from '../chart/fingering'
import { fitToRange } from '../chart/fit'
import type { Chart } from '../core/types'
import { InputHub } from '../input/hub'
import { chooseKeyboard, detectKeyboard, type KeyboardModel } from '../input/instruments'
import { loadKeyboardLayout } from '../input/keyboard'
import { ProgressStore, type KV } from '../progress/store'
import { h, icon, type View } from './dom'
import { weakNotes, weakSpotChart } from '../practice/weakSpots'
import { freePlayView, playChart } from './freeplay'
import { LessonView } from './lesson'
import { Navigator } from './nav'
import { pathView } from './path'
import { measureView } from './measure'
import { setupView } from './setup'
import { settingsView } from './settings'
import { skillCheckView } from './skillCheck'
import { noteName, resolveLang, setLang, t, tr } from '../i18n'

/** Owns the long-lived pieces (sound, input, progress) and swaps screens. */
export class App {
  /** Created on the first click: browsers will not start audio before one. */
  synth!: Synth
  readonly input = new InputHub()
  readonly progress = new ProgressStore(
    safeStorage(),
    LESSONS.map((l) => l.id),
    LESSONS.map((l) => l.unit),
  )
  private current: View | null = null
  private nav: Navigator

  constructor(private root: HTMLElement) {
    setLang(resolveLang(this.progress.settings.language))
    this.nav = new Navigator(root, this.input, () => this.keyboard)
    this.show(this.welcome())
  }

  show(view: View): void {
    this.current?.destroy?.()
    this.synth?.allOff()
    this.root.replaceChildren(view.el)
    this.current = view
    this.nav?.refresh()
  }

  goPath(): void {
    this.show(pathView(this))
  }

  goLesson(lesson: Lesson): void {
    this.show(new LessonView(this, lesson))
  }

  goFreePlay(): void {
    this.show(freePlayView(this))
  }

  /** A short exercise on the notes missed most lately (does nothing until there are some). */
  goPractice(): void {
    const weak = weakNotes(this.progress.stats())
    const chart = weakSpotChart(weak)
    if (!chart) return
    this.show(
      playChart(this, chart, {
        saveAs: null,
        title: t('Weak spots', 'Schwachstellen'),
        label: `${t('Practice', 'Übung')} • ${weak.map((w) => noteName(w.pitch)).join(', ')}`,
        unsaved: t('Practice scores are not saved, but every note you play updates your weak spots.', 'Übungsergebnisse werden nicht gespeichert, aber jede gespielte Note aktualisiert deine Schwachstellen.'),
        backLabel: t('Lessons', 'Lektionen'),
        back: () => this.goPath(),
        another: t('Back to lessons', 'Zurück zu den Lektionen'),
      }),
    )
  }

  /** Today's warm-up: a scale and chords in the key of the day. */
  goWarmup(): void {
    const { chart, key } = warmupChart(dayNumber())
    this.show(
      playChart(this, chart, {
        saveAs: null,
        title: t(`Warm-up in ${key} major`, `Aufwärmen in ${key}-Dur`),
        label: t('Scale, then chords: I – IV – V – I', 'Tonleiter, dann Akkorde: I – IV – V – I'),
        unsaved: t('Warm-ups are not scored, but every minute counts towards your daily goal.', 'Aufwärmen wird nicht bewertet, aber jede Minute zählt für dein Tagesziel.'),
        backLabel: t('Lessons', 'Lektionen'),
        back: () => this.goPath(),
        another: t('Back to lessons', 'Zurück zu den Lektionen'),
      }),
    )
  }

  /** A built-in song's page, opened from home. */
  goSong(pieceId: string): void {
    const piece = PIECES.find((p) => p.id === pieceId)
    if (!piece) return
    this.show(
      songView(this, { id: piece.id, title: tr(piece.title), composer: tr(piece.composer), chart: piece.chart, pieceId: piece.id }, () => this.goPath()),
    )
  }

  /** The placement test: on first start, and again whenever asked for. */
  goSkillCheck(): void {
    this.show(skillCheckView(this, () => this.goPath()))
  }

  goSettings(): void {
    this.show(settingsView(this))
  }

  /** First start: allow MIDI, then say which piano. `done` continues to the app. */
  goSetup(done: () => void): void {
    this.show(setupView(this, done))
  }

  /** Press the lowest and highest key, so Pianova knows the keyboard's size. */
  goMeasure(back: () => void = () => this.goSettings()): void {
    this.show(measureView(this, back))
  }

  /**
   * A MIDI keyboard is connected whose size Pianova cannot tell from its name, and it has
   * not been measured: worth asking the player to measure it.
   */
  get keyboardUnknown(): boolean {
    const { keyboard, measuredKeys } = this.progress.settings
    const names = this.input.status.inputs.map((i) => i.name)
    return names.length > 0 && keyboard === 'auto' && !measuredKeys && !detectKeyboard(names)
  }

  /** The instrument being played: chosen in settings, or recognised from its USB name. */
  get keyboard(): KeyboardModel {
    const { keyboard, measuredKeys } = this.progress.settings
    return chooseKeyboard(keyboard, this.input.status.inputs.map((i) => i.name), measuredKeys)
  }

  /**
   * Whether Pianova should sound the keys you play. A digital piano with its own speakers
   * (like a Piaggero) already does, and playing them twice sounds doubled and late.
   */
  get soundsKeys(): boolean {
    const { soundKeys } = this.progress.settings
    if (soundKeys !== 'auto') return soundKeys === 'on'
    return this.usingComputerKeys || !this.keyboard.speakers
  }

  /** A chart made ready to play here: moved onto the player's keys, every note fingered. */
  prepare(chart: Chart): Chart {
    const { lo, hi } = this.keyboard
    return withFingering(fitToRange(chart, lo, hi))
  }

  /** True when no MIDI keyboard is connected, so we show which computer keys to press. */
  get usingComputerKeys(): boolean {
    return this.input.status.inputs.length === 0
  }

  private welcome(): View {
    let started = false
    const error = h('p', { class: 'error', role: 'alert', hidden: true })
    const begin = async () => {
      if (started) return
      started = true
      try {
        this.synth ??= new Synth()
      } catch (err) {
        // No Web Audio at all: say so, and let the button be tried again.
        started = false
        error.textContent = t(
          `Sound could not be started in this browser (${err instanceof Error ? err.message : err}). Try an up-to-date Chrome, Edge, Firefox or Safari.`,
          `Der Ton ließ sich in diesem Browser nicht starten (${err instanceof Error ? err.message : err}). Versuch es mit einem aktuellen Chrome, Edge, Firefox oder Safari.`,
        )
        error.hidden = false
        return
      }
      this.synth.setVolume(this.progress.settings.volume)
      this.synth.setMix(this.progress.settings.mix)
      this.input.onNote((pitch, on, _time, velocity, source) => {
        // A click on the screen makes no sound of its own, whatever the keyboard does.
        if (on && source !== 'pointer' && !this.soundsKeys) return
        if (on) this.synth.noteOn(pitch, velocity)
        else this.synth.noteOff(pitch)
      })
      this.input.onSustain((down) => this.synth.setSustain(down))
      // A refused resume (autoplay rules) is not fatal: the next click or key press tries again.
      await this.synth.resume().catch((err: unknown) => console.warn('Pianova: audio did not start yet', err))
      if (!this.synth.running) {
        const retry = () => void this.synth.resume().catch(() => {})
        document.addEventListener('pointerdown', retry, { once: true })
        document.addEventListener('keydown', retry, { once: true })
      }
      void loadKeyboardLayout()
      const next = () => (this.progress.skill === null ? this.goSkillCheck() : this.goPath())
      // Someone who has used Pianova before (skill check taken) is not new: no setup for them.
      if (!this.progress.settings.setupDone && this.progress.skill === null) {
        this.goSetup(() => {
          this.progress.setSettings({ setupDone: true })
          next()
        })
        return
      }
      void this.input.init(this.progress.settings.midiInputId)
      next()
    }
    return {
      el: h(
        'div',
        { class: 'welcome' },
        h('div', { class: 'welcome-mark' }, icon('nova')),
        h('h1', { class: 'wordmark big' }, 'Pianova'),
        h('p', { class: 'lede' }, t('Learn piano from your very first note.', 'Klavier lernen, vom allerersten Ton an.')),
        h('button', { class: 'btn primary large', onclick: begin, autofocus: true }, t('Start', 'Los geht’s')),
        error,
        h('p', { class: 'muted' }, t('Plug in a MIDI keyboard, or play along on your computer keys.', 'Schließ ein MIDI-Keyboard an oder spiel auf deinen Computertasten mit.')),
      ),
    }
  }
}

function safeStorage(): KV | null {
  try {
    const storage = window.localStorage
    storage.getItem('pianova.probe')
    return storage
  } catch {
    return null
  }
}
