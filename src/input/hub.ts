import { KeyboardInput, type NoteCallback } from './keyboard'
import { MidiInput, type MidiStatus } from './midi'

export type { MidiStatus } from './midi'

/** One place to hear every note the player presses, from MIDI or the computer keyboard. */
export class InputHub {
  /** Pitches currently held down. */
  readonly held = new Set<number>()
  status: MidiStatus = { supported: true, inputs: [], activeId: null }
  private noteListeners = new Set<NoteCallback>()
  private statusListeners = new Set<(s: MidiStatus) => void>()
  private sustainListeners = new Set<(down: boolean) => void>()
  private midi: MidiInput
  private keyboard: KeyboardInput

  constructor() {
    const emit: NoteCallback = (pitch, on, perfTime, velocity) => {
      if (on === this.held.has(pitch)) return // duplicate press or stray release
      if (on) this.held.add(pitch)
      else this.held.delete(pitch)
      for (const cb of [...this.noteListeners]) cb(pitch, on, perfTime, velocity)
    }
    this.keyboard = new KeyboardInput(emit)
    this.midi = new MidiInput(
      emit,
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

  /** Each returns a function that removes the listener. */
  onNote(cb: NoteCallback): () => void {
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
