import type { NoteCallback } from './keyboard'

/** Which key (MIDI pitch) is under a point, in CSS px from the element's top left. */
export type KeyAt = (x: number, y: number) => number | null

/** How hard a click plays. The mouse has no velocity, so every click is a steady mezzo-forte. */
const VELOCITY = 0.75

/** The part of the element's events this needs (a real `HTMLElement`, or a stand-in in tests). */
export interface PointerTarget {
  addEventListener(type: string, cb: (e: PointerEvent) => void): void
  removeEventListener(type: string, cb: (e: PointerEvent) => void): void
  getBoundingClientRect(): { left: number; top: number }
}

/**
 * Plays the keys drawn on screen with a mouse, pen or finger. Each pointer holds one note;
 * dragging slides from key to key, and several fingers play a chord on a touchscreen.
 * Only presses that land on the keyboard drawing (`.stage-canvas`) count, so buttons and
 * cards over the stage keep working.
 */
export class PointerKeys {
  /** pointerId → the pitch it holds, or null while it is pressed but off the keys. */
  private down = new Map<number, number | null>()

  constructor(
    private el: PointerTarget,
    private keyAt: KeyAt,
    private emit: NoteCallback,
  ) {
    el.addEventListener('pointerdown', this.onDown)
    el.addEventListener('pointermove', this.onMove)
    el.addEventListener('pointerup', this.onUp)
    el.addEventListener('pointercancel', this.onUp)
    el.addEventListener('lostpointercapture', this.onUp)
  }

  private at(e: PointerEvent): number | null {
    const r = this.el.getBoundingClientRect()
    return this.keyAt(e.clientX - r.left, e.clientY - r.top)
  }

  private onDown = (e: PointerEvent): void => {
    if (e.button !== 0 || !onKeyboard(e.target)) return
    const pitch = this.at(e)
    if (pitch === null) return
    e.preventDefault()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    this.release(e.pointerId, e.timeStamp)
    this.down.set(e.pointerId, pitch)
    this.emit(pitch, true, e.timeStamp, VELOCITY)
  }

  private onMove = (e: PointerEvent): void => {
    if (!this.down.has(e.pointerId)) return
    const pitch = this.at(e)
    if (pitch === this.down.get(e.pointerId)) return
    this.release(e.pointerId, e.timeStamp)
    this.down.set(e.pointerId, pitch)
    if (pitch !== null) this.emit(pitch, true, e.timeStamp, VELOCITY)
  }

  private onUp = (e: PointerEvent): void => {
    this.release(e.pointerId, e.timeStamp)
    this.down.delete(e.pointerId)
  }

  /** Ends the note a pointer holds, if any; the pointer stays pressed. */
  private release(id: number, time: number): void {
    const pitch = this.down.get(id)
    if (pitch === undefined || pitch === null) return
    this.down.set(id, null)
    this.emit(pitch, false, time, 0)
  }

  /** Lets go of every held note and stops listening. */
  destroy(): void {
    for (const id of [...this.down.keys()]) this.release(id, performance.now())
    this.down.clear()
    this.el.removeEventListener('pointerdown', this.onDown)
    this.el.removeEventListener('pointermove', this.onMove)
    this.el.removeEventListener('pointerup', this.onUp)
    this.el.removeEventListener('pointercancel', this.onUp)
    this.el.removeEventListener('lostpointercapture', this.onUp)
  }
}

function onKeyboard(target: EventTarget | null): boolean {
  return !!(target as Element | null)?.classList?.contains('stage-canvas')
}
