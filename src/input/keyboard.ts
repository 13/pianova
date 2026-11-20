/** Physical key positions (layout-independent), in semitones above C3. */
const CODES = [
  'KeyZ', 'KeyS', 'KeyX', 'KeyD', 'KeyC', 'KeyV', 'KeyG', 'KeyB', 'KeyH', 'KeyN', 'KeyJ', 'KeyM', // C3–B3
  'KeyQ', 'Digit2', 'KeyW', 'Digit3', 'KeyE', 'KeyR', 'Digit5', 'KeyT', 'Digit6', 'KeyY', 'Digit7', 'KeyU', 'KeyI', // C4–C5
]
const BASE = 48
const OFFSET = new Map(CODES.map((code, i) => [code, i]))

/** The MIDI pitch a computer key plays, or null if it is not a piano key (or falls off the piano). */
export function pitchForCode(code: string, octaveShift: number): number | null {
  const offset = OFFSET.get(code)
  if (offset === undefined) return null
  const pitch = BASE + offset + octaveShift * 12
  return pitch >= 21 && pitch <= 108 ? pitch : null
}

/** The computer key that plays a pitch at no octave shift, as a short label ('Z', '2'), if any. */
export function labelForPitch(pitch: number): string | null {
  const code = CODES[pitch - BASE]
  return code ? code.replace(/^Key|^Digit/, '') : null
}

export type NoteCallback = (pitch: number, on: boolean, perfTime: number, velocity: number) => void

/** Plays notes from the computer keyboard. `[` and `]` shift by an octave. */
export class KeyboardInput {
  octaveShift = 0
  /** code → pitch it started, so a release after an octave shift ends the right note. */
  private down = new Map<string, number>()

  constructor(private emit: NoteCallback) {
    window.addEventListener('keydown', this.onDown)
    window.addEventListener('keyup', this.onUp)
    window.addEventListener('blur', this.releaseAll)
  }

  private onDown = (e: KeyboardEvent): void => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return
    if (e.code === 'BracketLeft' || e.code === 'BracketRight') {
      this.octaveShift = Math.max(-2, Math.min(3, this.octaveShift + (e.code === 'BracketLeft' ? -1 : 1)))
      return
    }
    const pitch = pitchForCode(e.code, this.octaveShift)
    if (pitch === null || this.down.has(e.code)) return
    e.preventDefault()
    this.down.set(e.code, pitch)
    this.emit(pitch, true, e.timeStamp, 0.75)
  }

  private onUp = (e: KeyboardEvent): void => {
    const pitch = this.down.get(e.code)
    if (pitch === undefined) return
    this.down.delete(e.code)
    this.emit(pitch, false, e.timeStamp, 0)
  }

  private releaseAll = (): void => {
    for (const pitch of this.down.values()) this.emit(pitch, false, performance.now(), 0)
    this.down.clear()
  }
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target instanceof HTMLInputElement) return !['range', 'checkbox', 'button', 'file'].includes(target.type)
  return target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.isContentEditable
}
