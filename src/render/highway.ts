import type { Chart, Hand } from '../core/types'
import type { Grade } from '../judge/judge'
import type { FlashTiming, Frame, HighwayOptions, HighwayRenderer, KeyAnchor } from './common'
import { Highway2D } from './highway2d'

export { COLORS, type Frame } from './common'

type Renderer3D = new (canvas: HTMLCanvasElement) => HighwayRenderer

/** The WebGL renderer (and three.js with it) is a separate download, fetched once at start-up. */
let Highway3D: Renderer3D | null = null
let loading: Promise<Renderer3D | null> | null = null

/** Starts fetching the 3D renderer; screens that open before it arrives catch up when it does. */
export function preloadHighway3D(): Promise<Renderer3D | null> {
  loading ??= webglWorks()
    ? import('./highway3d').then(
        (m) => (Highway3D = m.Highway3D),
        (err: unknown) => {
          console.warn('Pianova: 3D highway could not be loaded, using 2D', err)
          webgl = false
          return null
        },
      )
    : Promise.resolve(null)
  return loading
}

/**
 * The note highway and keyboard. Draws in 3D with WebGL when the browser has it,
 * otherwise falls back to the flat 2D drawing.
 */
export class Highway implements HighwayRenderer {
  private impl: HighwayRenderer | null = null
  private destroyed = false
  // Kept so a renderer that arrives late starts in the same state.
  private range: Chart | null = null
  private options: HighwayOptions | null = null
  private held = new Set<number>()

  constructor(private canvas: HTMLCanvasElement) {
    if (!webglWorks()) {
      this.impl = new Highway2D(canvas)
      return
    }
    if (Highway3D) {
      this.impl = this.create(Highway3D)
      return
    }
    // Still downloading (a screen opened in the first moments): draw nothing until it lands.
    void preloadHighway3D().then((ctor) => {
      if (this.destroyed) return
      this.impl = ctor ? this.create(ctor) : this.create2D()
      this.impl.setRange(this.range)
      if (this.options) this.impl.setOptions(this.options)
      this.impl.setHeld(this.held)
    })
  }

  private create(ctor: Renderer3D): HighwayRenderer {
    try {
      return new ctor(this.canvas)
    } catch (err) {
      console.warn('Pianova: 3D highway unavailable, using 2D', err)
      webgl = false
      return this.create2D()
    }
  }

  private create2D(): HighwayRenderer {
    let canvas = this.canvas
    if (canvas.dataset.gl && canvas.isConnected) {
      // A canvas that has handed out a WebGL context can never give a 2D one.
      const fresh = canvas.cloneNode() as HTMLCanvasElement
      delete fresh.dataset.gl
      canvas.replaceWith(fresh)
      canvas = this.canvas = fresh
    }
    return new Highway2D(canvas)
  }

  setRange(chart: Chart | null): void {
    this.range = chart
    this.impl?.setRange(chart)
  }
  setOptions(opts: HighwayOptions): void {
    this.options = opts
    this.impl?.setOptions(opts)
  }
  setHeld(held: Set<number>): void {
    this.held = held
    this.impl?.setHeld(held)
  }
  flash(pitch: number, kind: Grade | 'wrong', hand?: Hand, timing?: FlashTiming): void {
    this.impl?.flash(pitch, kind, hand, timing)
  }
  draw(frame: Frame): void {
    this.impl?.draw(frame)
  }
  keyAnchor(pitch: number): KeyAnchor | null {
    return this.impl?.keyAnchor?.(pitch) ?? null
  }
  destroy(): void {
    this.destroyed = true
    this.impl?.destroy()
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
