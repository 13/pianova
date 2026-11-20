import { Synth } from '../audio/synth'
import { LESSONS, type Lesson } from '../curriculum'
import { InputHub } from '../input/hub'
import { ProgressStore, type KV } from '../progress/store'
import { h, icon, type View } from './dom'
import { freePlayView } from './freeplay'
import { LessonView } from './lesson'
import { pathView } from './path'
import { settingsView } from './settings'

/** Owns the long-lived pieces (sound, input, progress) and swaps screens. */
export class App {
  /** Created on the first click: browsers will not start audio before one. */
  synth!: Synth
  readonly input = new InputHub()
  readonly progress = new ProgressStore(safeStorage(), LESSONS.map((l) => l.id))
  private current: View | null = null

  constructor(private root: HTMLElement) {
    this.show(this.welcome())
  }

  show(view: View): void {
    this.current?.destroy?.()
    this.synth?.allOff()
    this.root.replaceChildren(view.el)
    this.current = view
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

  goSettings(): void {
    this.show(settingsView(this))
  }

  /** True when no MIDI keyboard is connected, so we show which computer keys to press. */
  get usingComputerKeys(): boolean {
    return this.input.status.inputs.length === 0
  }

  private welcome(): View {
    const begin = async () => {
      this.synth = new Synth()
      this.synth.setVolume(this.progress.settings.volume)
      this.input.onNote((pitch, on, _time, velocity) => (on ? this.synth.noteOn(pitch, velocity) : this.synth.noteOff(pitch)))
      this.input.onSustain((down) => this.synth.setSustain(down))
      await this.synth.resume()
      void this.input.init(this.progress.settings.midiInputId)
      this.goPath()
    }
    return {
      el: h(
        'div',
        { class: 'welcome' },
        h('div', { class: 'welcome-mark' }, icon('nova')),
        h('h1', { class: 'wordmark big' }, 'Pianova'),
        h('p', { class: 'lede' }, 'Learn piano from your very first note.'),
        h('button', { class: 'btn primary large', onclick: begin, autofocus: true }, 'Start'),
        h('p', { class: 'muted' }, 'Plug in a MIDI keyboard, or play along on your computer keys.'),
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
