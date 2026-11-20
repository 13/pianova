import type { Chart, Hand } from '../core/types'
import type { Grade } from '../judge/judge'
import type { Frame, HighwayOptions, HighwayRenderer } from './common'
import { Highway2D } from './highway2d'
import { Highway3D } from './highway3d'

export { COLORS, type Frame } from './common'

/**
 * The note highway and keyboard. Draws in 3D with WebGL when the browser has it,
 * otherwise falls back to the flat 2D drawing.
 */
export class Highway implements HighwayRenderer {
  private impl: HighwayRenderer

  constructor(canvas: HTMLCanvasElement) {
    const gl = webglWorks() ? tryCreate3D(canvas) : null
    if (gl) {
      this.impl = gl
      return
    }
    if (canvas.dataset.gl) {
      // A canvas that has handed out a WebGL context can never give a 2D one.
      const fresh = canvas.cloneNode() as HTMLCanvasElement
      delete fresh.dataset.gl
      canvas.replaceWith(fresh)
      canvas = fresh
    }
    this.impl = new Highway2D(canvas)
  }

  setRange(chart: Chart | null): void {
    this.impl.setRange(chart)
  }
  setOptions(opts: HighwayOptions): void {
    this.impl.setOptions(opts)
  }
  setHeld(held: Set<number>): void {
    this.impl.setHeld(held)
  }
  flash(pitch: number, kind: Grade | 'wrong', hand?: Hand): void {
    this.impl.flash(pitch, kind, hand)
  }
  draw(frame: Frame): void {
    this.impl.draw(frame)
  }
  destroy(): void {
    this.impl.destroy()
  }
}

let webgl: boolean | null = null

/** Probed on a throwaway canvas, so a failure leaves the real one free for 2D. */
function webglWorks(): boolean {
  if (webgl === null) {
    try {
      const gl = document.createElement('canvas').getContext('webgl2')
      webgl = !!gl
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch {
      webgl = false
    }
  }
  return webgl
}

function tryCreate3D(canvas: HTMLCanvasElement): HighwayRenderer | null {
  try {
    return new Highway3D(canvas)
  } catch (err) {
    console.warn('Pianova: 3D highway unavailable, using 2D', err)
    webgl = false
    return null
  }
}
