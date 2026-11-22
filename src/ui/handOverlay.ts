import type { Chart, Hand } from '../core/types'
import type { Grade } from '../judge/judge'
import { handPose, type FingerState } from '../practice/handPose'
import { COLORS, type KeyAnchor } from '../render/common'

/** Finger lengths (thumb first), in white-key widths. */
const LENGTH = [1.05, 1.6, 1.8, 1.65, 1.35]
/** How far a finger's base leans in towards the middle of the hand, 0..1. */
const LEAN = [0.42, 0.12, 0.04, 0.1, 0.18]
/** Opacity of a finger by what it is doing. */
const FINGER_ALPHA: Record<FingerState, number> = { '': 0.3, next: 0.62, now: 0.95, hold: 0.8 }
/** Seconds for the hand to glide most of the way to a new position. */
const GLIDE = 1 / 12
const FADE = 1 / 6
/** Seconds for a finger's opacity to follow a change of what it is doing. */
const FINGER_FADE = 0.05

interface Finger {
  state: FingerState
  alpha: number
}

interface Shape {
  fingers: Finger[]
  /** Fingertips on screen (smoothed), thumb first; null until first placed. */
  tips: { x: number; y: number }[] | null
  w: number
  opacity: number
  colors: HandColors
}

interface HandColors {
  hand: string
  palmFill: string
  palmStroke: string
  tipStroke: string
  tipNext: string
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
 * colour, and the hands glide along as the music moves. Drawn on a 2D canvas over the
 * highway, from key positions the renderer reports, so it works over the 3D and the 2D
 * highway alike.
 *
 * A canvas rather than SVG: the hands move nearly every frame, and changing SVG every
 * frame made the browser restyle, lay out and re-rasterise the page each time. The canvas
 * is only redrawn when what it shows has changed.
 */
export class HandOverlay {
  readonly el: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D | null
  private shapes: Record<Hand, Shape>
  private last = 0
  /** CSS size of the canvas, kept by a ResizeObserver so frames never read layout. */
  private cssW = 0
  private cssH = 0
  private observer: ResizeObserver
  /** What was last drawn, so an unchanged frame is skipped. */
  private drawn = ''

  constructor() {
    this.el = document.createElement('canvas')
    this.el.className = 'hand-overlay'
    this.el.setAttribute('aria-hidden', 'true')
    this.ctx = this.el.getContext('2d')
    this.shapes = { L: this.build('L'), R: this.build('R') }
    this.observer = new ResizeObserver((entries) => {
      const box = entries[entries.length - 1].contentRect
      this.cssW = box.width
      this.cssH = box.height
      this.drawn = ''
    })
    this.observer.observe(this.el)
  }

  destroy(): void {
    this.observer.disconnect()
  }

  private build(hand: Hand): Shape {
    const fingers: Finger[] = Array.from({ length: 5 }, () => ({ state: '' as FingerState, alpha: FINGER_ALPHA[''] }))
    return { fingers, tips: null, w: 0, opacity: 0, colors: handColors(COLORS[hand]) }
  }

  update(input: OverlayInput): void {
    const now = performance.now()
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0
    this.last = now
    for (const hand of ['L', 'R'] as Hand[]) this.updateHand(hand, input, dt)
    this.render()
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
    if (Math.abs(want - shape.opacity) < 0.002) shape.opacity = want
    if (target) {
      if (!shape.tips || shape.opacity < 0.05) shape.tips = target.map((p) => ({ ...p }))
      else {
        const k = dt ? 1 - Math.exp(-dt / GLIDE) : 1
        shape.tips.forEach((p, f) => {
          // Settle exactly once within a tenth of a pixel, so a still hand stops redrawing.
          p.x = Math.abs(target![f].x - p.x) < 0.1 ? target![f].x : p.x + (target![f].x - p.x) * k
          p.y = Math.abs(target![f].y - p.y) < 0.1 ? target![f].y : p.y + (target![f].y - p.y) * k
        })
      }
      shape.w = w
    }
    const states = pose?.states
    const kf = dt ? 1 - Math.exp(-dt / FINGER_FADE) : 1
    shape.fingers.forEach((finger, f) => {
      if (states) finger.state = states[f]
      const goal = FINGER_ALPHA[finger.state]
      finger.alpha = Math.abs(goal - finger.alpha) < 0.005 ? goal : finger.alpha + (goal - finger.alpha) * kf
    })
  }

  /** Draws both hands, unless nothing visible has changed since the last time. */
  private render(): void {
    const { ctx } = this
    if (!ctx || !this.cssW || !this.cssH) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const pw = Math.round(this.cssW * dpr)
    const ph = Math.round(this.cssH * dpr)
    let key = `${pw}x${ph}`
    for (const hand of ['L', 'R'] as Hand[]) {
      const s = this.shapes[hand]
      if (!s.tips || s.opacity < 0.01) continue
      key += `|${hand}${s.opacity.toFixed(3)},${s.w.toFixed(1)}`
      for (const p of s.tips) key += `,${p.x.toFixed(1)},${p.y.toFixed(1)}`
      for (const f of s.fingers) key += `,${f.state}${f.alpha.toFixed(3)}`
    }
    if (key === this.drawn) return
    this.drawn = key

    if (this.el.width !== pw || this.el.height !== ph) {
      this.el.width = pw
      this.el.height = ph
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, pw, ph)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    for (const hand of ['L', 'R'] as Hand[]) {
      const s = this.shapes[hand]
      if (s.tips && s.opacity >= 0.01) this.drawHand(ctx, s)
    }
  }

  private drawHand(ctx: CanvasRenderingContext2D, shape: Shape): void {
    const { tips, w, colors } = shape
    if (!tips) return
    const cx = tips.reduce((s, p) => s + p.x, 0) / 5
    const bases = tips.map((p, f) => ({ x: p.x + (cx - p.x) * LEAN[f], y: p.y + LENGTH[f] * w }))
    const alpha = shape.opacity
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // The palm: across the bases of the four fingers, round to the thumb, down to the wrist.
    const order = [1, 2, 3, 4].map((f) => bases[f])
    const thumb = bases[0]
    const wristY = Math.max(...order.map((b) => b.y)) + w * 1.9
    const pinkySide = bases[4]
    ctx.beginPath()
    order.forEach((b, i) => (i ? ctx.lineTo(b.x, b.y) : ctx.moveTo(b.x, b.y)))
    ctx.lineTo(pinkySide.x + (pinkySide.x - cx) * 0.1, wristY)
    ctx.lineTo(thumb.x + (cx - thumb.x) * 0.25, wristY + w * 0.2)
    ctx.lineTo(thumb.x, thumb.y)
    ctx.closePath()
    ctx.globalAlpha = alpha
    ctx.fillStyle = colors.palmFill
    ctx.fill()
    ctx.lineWidth = w * 0.55
    ctx.strokeStyle = colors.palmStroke
    ctx.stroke()

    ctx.font = `700 ${(w * 0.42).toFixed(1)}px ui-sans-serif, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    tips.forEach((p, f) => {
      const finger = shape.fingers[f]
      const base = bases[f]
      const state = finger.state
      const lit = state === 'now' || state === 'hold'

      ctx.globalAlpha = alpha * finger.alpha
      ctx.strokeStyle = colors.hand
      ctx.lineWidth = w * 0.6
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(base.x, base.y)
      ctx.stroke()

      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(0, w * 0.34), 0, Math.PI * 2)
      if (lit) {
        ctx.shadowColor = colors.hand
        ctx.shadowBlur = 12
        ctx.fillStyle = colors.hand
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.shadowColor = 'transparent'
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
      } else {
        ctx.fillStyle = state === 'next' ? colors.tipNext : 'rgba(10, 12, 30, 0.55)'
        ctx.fill()
        ctx.strokeStyle = state === 'next' ? colors.hand : colors.tipStroke
      }
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = lit ? '#0b0d1f' : state === 'next' ? '#fff' : 'rgba(255, 255, 255, 0.75)'
      ctx.fillText(String(f + 1), p.x, p.y + w * 0.15)
    })
    ctx.globalAlpha = 1
  }
}

/** The colours one hand is drawn in, worked out once from its hex colour. */
function handColors(hex: string): HandColors {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const rgba = (a: number) => `rgba(${r}, ${g}, ${b}, ${a})`
  // 45% of the hand's colour over a 60%-opaque navy, mixed the way CSS color-mix does (premultiplied).
  const a = 0.45 + 0.55 * 0.6
  const mix = (c: number, dark: number) => Math.round((0.45 * c + 0.55 * 0.6 * dark) / a)
  return {
    hand: hex,
    palmFill: rgba(0.16),
    palmStroke: rgba(0.22),
    tipStroke: rgba(0.6),
    tipNext: `rgba(${mix(r, 10)}, ${mix(g, 12)}, ${mix(b, 30)}, ${a.toFixed(2)})`,
  }
}
