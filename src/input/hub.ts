import { KeyboardInput, type NoteCallback } from './keyboard'
import { MidiInput, type MidiStatus } from './midi'
import { PointerKeys, type KeyAt, type PointerTarget } from './pointer'

export type { MidiStatus } from './midi'

/** Where a note came from: a MIDI instrument, the computer keyboard, or a click on the keys drawn on screen. */
export type NoteSource = 'midi' | 'keys' | 'pointer'
export type HubNoteCallback = (pitch: number, on: boolean, perfTime: number, velocity: number, source: NoteSource) => void

/** One place to hear every note the player presses, from MIDI or the computer keyboard. */
export class InputHub {
  /** Pitches currently held down. */
  readonly held = new Set<number>()
  status: MidiStatus = { supported: true, inputs: [], activeId: null }
  private noteListeners = new Set<HubNoteCallback>()
  private statusListeners = new Set<(s: MidiStatus) => void>()
  private sustainListeners = new Set<(down: boolean) => void>()
  private midi: MidiInput
  private keyboard: KeyboardInput
  private emitFrom: (source: NoteSource) => NoteCallback

  /** Which sources hold each held pitch: the same key can be down on MIDI and the computer keys. */
  private holders = new Map<number, Set<NoteSource>>()

  constructor() {
    const emitFrom = (this.emitFrom =
      (source: NoteSource): NoteCallback =>
      (pitch, on, perfTime, velocity) => {
        let by = this.holders.get(pitch)
        if (on === !!by?.has(source)) return // duplicate press or stray release
        if (on) {
          if (!by) this.holders.set(pitch, (by = new Set()))
          by.add(source)
          // Already sounding from the other source: one key, one note.
          if (by.size > 1) return
          this.held.add(pitch)
        } else {
          by!.delete(source)
          // Still held on the other source: the note goes on.
          if (by!.size > 0) return
          this.holders.delete(pitch)
          this.held.delete(pitch)
        }
        for (const cb of [...this.noteListeners]) cb(pitch, on, perfTime, velocity, source)
      })
    this.keyboard = new KeyboardInput(emitFrom('keys'))
    this.midi = new MidiInput(
      emitFrom('midi'),
      (down) => this.sustainListeners.forEach((cb) => cb(down)),
      (status) => {
        this.status = status
        for (const cb of [...this.statusListeners]) cb(status)
      },
    )
    this.status = this.midi.status
  }

  init(preferredId: string | null): Promise<void> {
    return this.midi.init(preferredId)
  }

  selectInput(id: string | null): void {
    this.midi.select(id)
  }

  /** How many octaves the computer keys are shifted (always 0 unless shifting is allowed). */
  get octaveShift(): number {
    return this.keyboard.octaveShift
  }

  /** Allow or forbid the [ and ] octave-shift keys; forbidding also resets the shift. */
  allowOctaveShift(allowed: boolean): void {
    this.keyboard.shiftEnabled = allowed
    if (!allowed) this.keyboard.octaveShift = 0
  }

  /** Lets the keys drawn in `el` be played by clicking or touching them. Returns a function that stops it. */
  attachPointer(el: PointerTarget, keyAt: KeyAt): () => void {
    const pointer = new PointerKeys(el, keyAt, this.emitFrom('pointer'))
    return () => pointer.destroy()
  }

  /** Each returns a function that removes the listener. */
  onNote(cb: HubNoteCallback): () => void {
    this.noteListeners.add(cb)
    return () => this.noteListeners.delete(cb)
  }

  onStatus(cb: (s: MidiStatus) => void): () => void {
    this.statusListeners.add(cb)
    return () => this.statusListeners.delete(cb)
  }

  onSustain(cb: (down: boolean) => void): () => void {
    this.sustainListeners.add(cb)
    return () => this.sustainListeners.delete(cb)
  }
}
