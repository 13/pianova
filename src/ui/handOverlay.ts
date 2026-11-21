import type { Chart, Hand } from '../core/types'
import type { Grade } from '../judge/judge'
import { handPose, type FingerState } from '../practice/handPose'
import { COLORS, type KeyAnchor } from '../render/common'

const SVG = 'http://www.w3.org/2000/svg'
/** Finger lengths (thumb first), in white-key widths. */
const LENGTH = [1.05, 1.6, 1.8, 1.65, 1.35]
/** How far a finger's base leans in towards the middle of the hand, 0..1. */
const LEAN = [0.42, 0.12, 0.04, 0.1, 0.18]
/** Opacity of a finger by what it is doing. */
const FINGER_ALPHA: Record<FingerState, number> = { '': 0.3, next: 0.62, now: 0.95, hold: 0.8 }
/** Seconds for the hand to glide most of the way to a new position. */
const GLIDE = 1 / 12
const FADE = 1 / 6

interface Finger {
  line: SVGLineElement
  tip: SVGCircleElement
  label: SVGTextElement
  state: FingerState | null
}

interface Shape {
  g: SVGGElement
  palm: SVGPathElement
  fingers: Finger[]
  /** Fingertips on screen (smoothed), thumb first; null until first placed. */
  tips: { x: number; y: number }[] | null
  w: number
  opacity: number
}

export interface OverlayInput {
  chart: Chart
  beat: number
  noteState?: ('pending' | Grade)[]
  active?: boolean[]
  keys: { lo: number; hi: number }
  anchor: (pitch: number) => KeyAnchor | null
  visible: boolean
}

/**
 * See-through hands over the keyboard. Each finger rests on the key it will play (the
 * free ones on the white keys beside it), the finger to use next lights up in the hand's
 * colour, and the hands glide along as the music moves. Drawn in SVG over the canvas, from
 * key positions the renderer reports, so it works over the 3D and the 2D highway alike.
 */
export class HandOverlay {
  readonly el: SVGSVGElement
  private shapes: Record<Hand, Shape>
  private last = 0

  constructor() {
    this.el = document.createElementNS(SVG, 'svg')
    this.el.setAttribute('class', 'hand-overlay')
    this.el.setAttribute('aria-hidden', 'true')
    this.shapes = { L: this.build('L'), R: this.build('R') }
  }

  private build(hand: Hand): Shape {
    const g = document.createElementNS(SVG, 'g')
    g.setAttribute('class', `oh ${hand}`)
    g.style.setProperty('--hand', COLORS[hand])
    g.setAttribute('opacity', '0')
    const palm = document.createElementNS(SVG, 'path')
    palm.setAttribute('class', 'oh-palm')
    g.append(palm)
    const fingers: Finger[] = []
    for (let f = 1; f <= 5; f++) {
      const line = document.createElementNS(SVG, 'line')
      line.setAttribute('class', 'oh-finger')
      const tip = document.createElementNS(SVG, 'circle')
      tip.setAttribute('class', 'oh-tip')
      const label = document.createElementNS(SVG, 'text')
      label.setAttribute('class', 'oh-num')
      label.textContent = String(f)
      g.append(line, tip, label)
      fingers.push({ line, tip, label, state: null })
    }
    this.el.append(g)
    return { g, palm, fingers, tips: null, w: 0, opacity: 0 }
  }

  update(input: OverlayInput): void {
    const now = performance.now()
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0
    this.last = now
    for (const hand of ['L', 'R'] as Hand[]) this.updateHand(hand, input, dt)
  }

  private updateHand(hand: Hand, input: OverlayInput, dt: number): void {
    const shape = this.shapes[hand]
    const pose = input.visible ? handPose(input.chart, hand, input.beat, input.noteState, input.active, input.keys) : null
    let target: { x: number; y: number }[] | null = null
    let w = shape.w
    if (pose) {
      const anchors = pose.pitches.map((p) => input.anchor(p))
      if (anchors.every((a) => a)) {
        target = anchors.map((a) => ({ x: a!.x, y: a!.y }))
        w = anchors.reduce((sum, a) => sum + a!.w, 0) / 5
        // A guessed finger between two placed ones goes between them, not onto their keys.
        for (let f = 0; f < 5; f++) {
          if (pose.source[f] !== 'guess') continue
          let a = f - 1
          while (a >= 0 && !pose.placed[a]) a--
          let b = f + 1
          while (b < 5 && !pose.placed[b]) b++
          if (a < 0 || b > 4) continue
          const k = (f - a) / (b - a)
          target[f] = { x: target[a].x + (target[b].x - target[a].x) * k, y: target[a].y + (target[b].y - target[a].y) * k }
        }
      }
    }

    // Fade in where the hand is needed; fade out, staying put, when it is not.
    const want = target ? 1 : 0
    shape.opacity += (want - shape.opacity) * (dt ? 1 - Math.exp(-dt / FADE) : 1)
    if (target) {
      if (!shape.tips || shape.opacity < 0.05) shape.tips = target.map((p) => ({ ...p }))
      else {
        const k = dt ? 1 - Math.exp(-dt / GLIDE) : 1
        shape.tips.forEach((p, f) => {
          p.x += (target![f].x - p.x) * k
          p.y += (target![f].y - p.y) * k
        })
      }
      shape.w = w
    }
    shape.g.setAttribute('opacity', shape.opacity.toFixed(3))
    if (!shape.tips || shape.opacity < 0.01) return
    this.draw(shape, pose?.states ?? null)
  }

  private draw(shape: Shape, states: FingerState[] | null): void {
    const { tips, w } = shape
    if (!tips) return
    const cx = tips.reduce((s, p) => s + p.x, 0) / 5
    const bases = tips.map((p, f) => ({ x: p.x + (cx - p.x) * LEAN[f], y: p.y + LENGTH[f] * w }))
    tips.forEach((p, f) => {
      const finger = shape.fingers[f]
      const base = bases[f]
      finger.line.setAttribute('x1', p.x.toFixed(1))
      finger.line.setAttribute('y1', p.y.toFixed(1))
      finger.line.setAttribute('x2', base.x.toFixed(1))
      finger.line.setAttribute('y2', base.y.toFixed(1))
      finger.line.setAttribute('stroke-width', (w * 0.6).toFixed(1))
      finger.tip.setAttribute('cx', p.x.toFixed(1))
      finger.tip.setAttribute('cy', p.y.toFixed(1))
      finger.tip.setAttribute('r', (w * 0.34).toFixed(1))
      finger.label.setAttribute('x', p.x.toFixed(1))
      finger.label.setAttribute('y', (p.y + w * 0.15).toFixed(1))
      finger.label.setAttribute('font-size', (w * 0.42).toFixed(1))
      const state = states ? states[f] : ''
      if (state !== finger.state) {
        finger.state = state
        finger.line.setAttribute('class', `oh-finger ${state}`)
        finger.tip.setAttribute('class', `oh-tip ${state}`)
        finger.label.setAttribute('class', `oh-num ${state}`)
        finger.line.setAttribute('opacity', String(FINGER_ALPHA[state]))
      }
    })
    // The palm: across the bases of the four fingers, round to the thumb, down to the wrist.
    const order = [1, 2, 3, 4].map((f) => bases[f])
    const thumb = bases[0]
    const wristY = Math.max(...order.map((b) => b.y)) + w * 1.9
    const pinkySide = bases[4]
    const path =
      `M${order.map((b) => `${b.x.toFixed(1)},${b.y.toFixed(1)}`).join('L')}` +
      `L${(pinkySide.x + (pinkySide.x - cx) * 0.1).toFixed(1)},${wristY.toFixed(1)}` +
      `L${(thumb.x + (cx - thumb.x) * 0.25).toFixed(1)},${(wristY + w * 0.2).toFixed(1)}` +
      `L${thumb.x.toFixed(1)},${thumb.y.toFixed(1)}Z`
    shape.palm.setAttribute('d', path)
    shape.palm.setAttribute('stroke-width', (w * 0.55).toFixed(1))
  }
}
