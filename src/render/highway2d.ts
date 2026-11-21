import { isBlack } from '../core/pitch'
import type { Chart, Hand } from '../core/types'
import { COLORS, FONT, LOOKAHEAD, keyRange, lighten, rgba, type Frame, type HighwayOptions, type HighwayRenderer } from './common'
import { keyLabelsVersion, labelForPitch } from '../input/keyboard'
import type { Grade } from '../judge/judge'
import { noteLetter } from '../i18n'

/** Strength of the perspective squeeze towards the horizon. */
const DEPTH = 1.9
/** Width of the far end of the highway relative to the keyboard. */
const FAR_SCALE = 0.2
/** How much wider the keyboard is at its front edge than at the hit line. */
const KEY_SPREAD = 1.1
/** Black keys reach this far down the white keys. */
const BLACK_LENGTH = 0.6
const SPARK_LIFE_MS = 650
const MAX_SPARKS = 400

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  born: number
  color: string
  size: number
}

/** Draws the note highway and the keyboard beneath it onto one canvas. */
export class Highway2D implements HighwayRenderer {
  private g: CanvasRenderingContext2D
  private lo = 43
  private hi = 77
  private labels = true
  private keyHints = false
  private hintShift = 0
  private held = new Set<number>()
  private sparks: Spark[] = []
  private lastSustainSpark = 0
  private w = 0
  private h = 0
  private dpr = 1
  private cache: { key: string; white: HTMLCanvasElement; black: HTMLCanvasElement } | null = null
  private observer: ResizeObserver

  constructor(private canvas: HTMLCanvasElement) {
    this.g = canvas.getContext('2d')!
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas)
    this.resize()
  }

  destroy(): void {
    this.observer.disconnect()
  }

  setRange(chart: Chart | null): void {
    const { lo, hi } = keyRange(chart)
    this.lo = lo
    this.hi = hi
  }

  setOptions(opts: HighwayOptions): void {
    this.labels = opts.labels
    this.keyHints = opts.keyHints
    this.hintShift = opts.hintShift ?? 0
  }

  setHeld(held: Set<number>): void {
    this.held = held
  }

  /** A burst of sparks where a key met the line. */
  flash(pitch: number, kind: Grade | 'wrong', hand?: Hand): void {
    if (kind === 'miss') return
    const color = kind === 'wrong' ? COLORS.wrong : hand ? COLORS[hand] : COLORS.neutral
    this.burst(pitch, color, kind === 'perfect' ? 16 : kind === 'wrong' ? 6 : 9)
  }

  resize(): void {
    const dpr = (this.dpr = Math.min(2, window.devicePixelRatio || 1))
    this.w = this.canvas.clientWidth
    this.h = this.canvas.clientHeight
    this.canvas.width = Math.max(1, Math.round(this.w * dpr))
    this.canvas.height = Math.max(1, Math.round(this.h * dpr))
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  // ---- geometry -------------------------------------------------------------

  private get layout() {
    let whites = 0
    for (let p = this.lo; p <= this.hi; p++) if (!isBlack(p)) whites++
    const whiteW = this.w / whites
    const keyH = Math.max(110, Math.min(this.h * 0.3, whiteW * 4.2))
    return { whiteW, keyH, hitY: this.h - keyH, horizon: -this.h * 0.04 }
  }

  /** Centre x and width of a key where it meets the hit line. */
  private key(pitch: number): { x: number; width: number } {
    const { whiteW } = this.layout
    let whites = 0
    for (let p = this.lo; p < pitch; p++) if (!isBlack(p)) whites++
    return isBlack(pitch) ? { x: whites * whiteW, width: whiteW * 0.56 } : { x: (whites + 0.5) * whiteW, width: whiteW }
  }

  /** 1 at the hit line, falling to 0 at the horizon, for a note `beats` ahead. */
  private depth(beats: number): number {
    const d = Math.max(0, Math.min(1, beats / LOOKAHEAD))
    return (1 - d) / (1 + DEPTH * d)
  }

  /** A point on the highway: x as it is at the hit line, p from `depth()`. */
  private project(x: number, p: number): { x: number; y: number; scale: number } {
    const { hitY, horizon } = this.layout
    const scale = FAR_SCALE + (1 - FAR_SCALE) * p
    return { x: this.w / 2 + (x - this.w / 2) * scale, y: horizon + (hitY - horizon) * p, scale }
  }

  /** A point on the keyboard: x as at the hit line, f from 0 (back) to 1 (front edge). */
  private onKeys(x: number, f: number): { x: number; y: number } {
    const { hitY, keyH } = this.layout
    return { x: this.w / 2 + (x - this.w / 2) * (1 + (KEY_SPREAD - 1) * f), y: hitY + keyH * f }
  }

  // ---- drawing --------------------------------------------------------------

  draw(frame: Frame): void {
    if (this.w === 0 || this.h === 0) return
    this.g.clearRect(0, 0, this.w, this.h)
    this.drawLanes(frame)
    if (frame.chart) this.drawNotes(frame, frame.chart)
    this.drawKeyboard(frame)
    this.drawHitLine()
    this.drawSparks()
  }

  private drawLanes(frame: Frame): void {
    const g = this.g
    const { hitY } = this.layout

    // A soft glow rising from the keyboard into the dark.
    const haze = g.createLinearGradient(0, hitY - this.h * 0.45, 0, hitY)
    haze.addColorStop(0, 'rgba(60, 80, 190, 0)')
    haze.addColorStop(1, 'rgba(60, 80, 190, 0.16)')
    g.fillStyle = haze
    g.fillRect(0, 0, this.w, hitY)

    // Thin guide lines at every C and F: the edges of the black-key groups.
    g.lineWidth = 1
    for (let p = this.lo; p <= this.hi; p++) {
      if (p % 12 !== 0 && p % 12 !== 5) continue
      const edge = this.key(p).x - this.key(p).width / 2
      const far = this.project(edge, 0)
      const near = this.project(edge, 1)
      const line = g.createLinearGradient(0, far.y, 0, near.y)
      line.addColorStop(0, 'rgba(150, 170, 255, 0)')
      line.addColorStop(0.25, 'rgba(150, 170, 255, 0.1)')
      line.addColorStop(1, p % 12 === 0 ? 'rgba(150, 170, 255, 0.26)' : 'rgba(150, 170, 255, 0.14)')
      g.strokeStyle = line
      g.beginPath()
      g.moveTo(far.x, far.y)
      g.lineTo(near.x, near.y)
      g.stroke()
    }

    // Faint bar lines keep the sense of motion and pulse.
    if (frame.chart) {
      const bpb = frame.chart.beatsPerBar
      for (let b = Math.ceil(frame.beat / bpb) * bpb; b < frame.beat + LOOKAHEAD; b += bpb) {
        const p = this.depth(b - frame.beat)
        const l = this.project(0, p)
        const r = this.project(this.w, p)
        g.strokeStyle = `rgba(150, 170, 255, ${0.13 * Math.min(1, p * 5 + 0.1)})`
        g.beginPath()
        g.moveTo(l.x, l.y)
        g.lineTo(r.x, r.y)
        g.stroke()
      }
    }
  }

  private drawNotes(frame: Frame, chart: Chart): void {
    const g = this.g
    const now = performance.now()
    const spawnSustain = now - this.lastSustainSpark > 45
    // Far notes first so nearer ones overlap them.
    for (let i = chart.notes.length - 1; i >= 0; i--) {
      const n = chart.notes[i]
      const ahead = n.startBeat - frame.beat
      const tail = ahead + n.durationBeats
      if (ahead > LOOKAHEAD || tail < 0) continue
      const state = frame.noteState?.[i] ?? 'pending'
      const active = frame.active?.[i] ?? true
      const hit = state === 'perfect' || state === 'good'
      const cut = !!frame.cut?.[i]
      // Being played right now: by the player (hit) or by the app (auto-played).
      const sounding = ahead <= 0 && !cut && (hit || !active || !frame.active)

      // The note is swallowed by the line as it is played.
      const near = this.depth(Math.max(0, ahead))
      const far = this.depth(Math.min(LOOKAHEAD, Math.max(0.1, tail)))
      const k = this.key(n.pitch)
      const half = (isBlack(n.pitch) ? k.width * 1.05 : k.width * 0.68) / 2
      const a = this.project(k.x - half, far)
      const b = this.project(k.x + half, far)
      const c = this.project(k.x + half, near)
      const d = this.project(k.x - half, near)

      const color = state === 'miss' ? COLORS.miss : COLORS[n.hand]
      const fade = Math.min(1, far * 7 + 0.2)
      g.globalAlpha = (state === 'miss' ? 0.45 : cut ? 0.3 : active ? 1 : 0.5) * fade

      // Glass: translucent body, brighter towards the player, lit rim.
      const body = g.createLinearGradient(0, a.y, 0, d.y)
      body.addColorStop(0, rgba(color, 0.42))
      body.addColorStop(1, rgba(sounding ? lighten(color, 0.55) : color, sounding ? 1 : 0.9))
      g.fillStyle = body
      g.shadowColor = color
      g.shadowBlur = state === 'miss' ? 0 : sounding ? 34 : 8 + 16 * near
      const r = Math.max(1, Math.min(7 * c.scale, (d.y - a.y) / 2, (c.x - d.x) / 2))
      g.beginPath()
      g.moveTo(a.x + r, a.y)
      g.lineTo(b.x - r, b.y)
      g.quadraticCurveTo(b.x, b.y, b.x, b.y + r)
      g.lineTo(c.x, c.y - r)
      g.quadraticCurveTo(c.x, c.y, c.x - r, c.y)
      g.lineTo(d.x + r, d.y)
      g.quadraticCurveTo(d.x, d.y, d.x, d.y - r)
      g.lineTo(a.x, a.y + r)
      g.quadraticCurveTo(a.x, a.y, a.x + r, a.y)
      g.closePath()
      g.fill()
      g.shadowBlur = 0
      g.strokeStyle = rgba(lighten(color, 0.5), state === 'miss' ? 0.3 : 0.85)
      g.lineWidth = Math.max(0.75, 1.5 * c.scale)
      g.stroke()

      // Finger number (or note name) sits on the leading end once it is readable.
      const label = n.finger ? String(n.finger) : this.labels ? noteLetter(n.pitch) : ''
      const size = 17 * c.scale
      if (label && active && state === 'pending' && ahead > -0.05 && size >= 9 && d.y - a.y > size * 1.5) {
        g.fillStyle = 'rgba(6, 10, 30, 0.82)'
        g.font = `800 ${size}px ${FONT}`
        g.textAlign = 'center'
        g.textBaseline = 'alphabetic'
        g.fillText(label, (c.x + d.x) / 2, d.y - size * 0.45)
      }
      g.globalAlpha = 1

      if (sounding && spawnSustain && tail > 0.05 && state !== 'miss') this.burst(n.pitch, COLORS[n.hand], 1)
    }
    if (spawnSustain) this.lastSustainSpark = now
  }

  private drawHitLine(): void {
    const g = this.g
    const { hitY } = this.layout
    const line = g.createLinearGradient(0, 0, this.w, 0)
    line.addColorStop(0, 'rgba(255, 255, 255, 0.35)')
    line.addColorStop(0.5, 'rgba(255, 255, 255, 1)')
    line.addColorStop(1, 'rgba(255, 255, 255, 0.35)')
    g.shadowColor = '#b8c4ff'
    g.shadowBlur = 18
    g.fillStyle = line
    g.fillRect(0, hitY - 1.5, this.w, 3)
    g.shadowBlur = 0
  }

  /** The colour a key is lit in right now, or null if it is at rest. */
  private litColor(pitch: number, frame: Frame): string | null {
    if (!this.held.has(pitch)) return null
    const hand = frame.keyHands?.get(pitch)
    return hand ? COLORS[hand] : COLORS.neutral
  }

  /** Traces a four-sided patch of the keyboard between hit-line x positions and depths. */
  private quad(x0: number, x1: number, f0: number, f1: number): void {
    const g = this.g
    const a = this.onKeys(x0, f0)
    const b = this.onKeys(x1, f0)
    const c = this.onKeys(x1, f1)
    const d = this.onKeys(x0, f1)
    g.beginPath()
    g.moveTo(a.x, a.y)
    g.lineTo(b.x, b.y)
    g.lineTo(c.x, c.y)
    g.lineTo(d.x, d.y)
    g.closePath()
  }

  private drawKeyboard(frame: Frame): void {
    const g = this.g
    const { keyH, hitY } = this.layout
    const hintColor = (pitch: number): string | null => {
      const mark = frame.highlight?.get(pitch)
      return mark ? (mark === 'hint' ? COLORS.hint : COLORS[mark]) : null
    }
    const { white, black } = this.keyboardCache()

    // The keys at rest come from the cache; only lit and marked keys are drawn each frame.
    g.drawImage(white, 0, hitY, this.w, keyH)
    for (let p = this.lo; p <= this.hi; p++) {
      if (isBlack(p)) continue
      const lit = this.litColor(p, frame)
      const hint = hintColor(p)
      if (lit || hint) this.paintWhite(p, lit, hint)
    }
    g.drawImage(black, 0, hitY, this.w, keyH)
    for (let p = this.lo; p <= this.hi; p++) {
      if (!isBlack(p)) continue
      const lit = this.litColor(p, frame)
      const hint = hintColor(p)
      if (lit || hint) this.paintBlack(p, lit, hint)
    }
  }

  /** Offscreen drawings of the white and black keys at rest, redrawn only when they would change. */
  private keyboardCache(): { white: HTMLCanvasElement; black: HTMLCanvasElement } {
    const { keyH, hitY } = this.layout
    const key = [this.w, this.h, this.dpr, this.lo, this.hi, this.labels, this.keyHints, this.hintShift, keyLabelsVersion()].join('|')
    if (this.cache?.key === key) return this.cache
    const layer = (paint: () => void) => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(this.w * this.dpr))
      canvas.height = Math.max(1, Math.round(keyH * this.dpr))
      const main = this.g
      this.g = canvas.getContext('2d')!
      this.g.setTransform(this.dpr, 0, 0, this.dpr, 0, -hitY * this.dpr)
      paint()
      this.g = main
      return canvas
    }
    const white = layer(() => {
      for (let p = this.lo; p <= this.hi; p++) if (!isBlack(p)) this.paintWhite(p, null, null)
    })
    const black = layer(() => {
      for (let p = this.lo; p <= this.hi; p++) if (isBlack(p)) this.paintBlack(p, null, null)
    })
    this.cache = { key, white, black }
    return this.cache
  }

  /** One white key: ivory, or lit by a press, or washed with a "play this" colour. */
  private paintWhite(p: number, lit: string | null, hint: string | null): void {
    const g = this.g
    const { whiteW, keyH, hitY } = this.layout
    const k = this.key(p)
    const x0 = k.x - k.width / 2
    const x1 = k.x + k.width / 2

    if (lit) {
      const glow = g.createLinearGradient(0, hitY, 0, hitY + keyH)
      glow.addColorStop(0, rgba(lit, 0.75))
      glow.addColorStop(0.75, rgba(lighten(lit, 0.35), 0.95))
      glow.addColorStop(1, rgba(lit, 0.9))
      g.fillStyle = glow
      g.shadowColor = lit
      g.shadowBlur = 26
      this.quad(x0, x1, 0, 1)
      g.fill()
      g.shadowBlur = 0
    } else if (hint) {
      // "Play this next": a wash of colour, clearly softer than a lit key.
      const wash = g.createLinearGradient(0, hitY, 0, hitY + keyH)
      wash.addColorStop(0, rgba(hint, 0.6))
      wash.addColorStop(1, rgba(hint, 0.25))
      g.fillStyle = wash
      this.quad(x0, x1, 0, 1)
      g.fill()
    } else {
      const ivory = g.createLinearGradient(0, hitY, 0, hitY + keyH)
      ivory.addColorStop(0, '#cfcbc2')
      ivory.addColorStop(0.12, '#f1ede4')
      ivory.addColorStop(0.9, '#e7e2d7')
      ivory.addColorStop(1, '#bdb8ad')
      g.fillStyle = ivory
      this.quad(x0, x1, 0, 1)
      g.fill()
    }

    // The seams either side of this key.
    g.strokeStyle = 'rgba(40, 36, 30, 0.6)'
    g.lineWidth = 1.2
    for (const x of [x0, x1]) {
      const top = this.onKeys(x, 0)
      const bottom = this.onKeys(x, 1)
      g.beginPath()
      g.moveTo(top.x, top.y)
      g.lineTo(bottom.x, bottom.y)
      g.stroke()
    }

    const isC = p % 12 === 0
    const at = this.onKeys(k.x, 0.86)
    g.textAlign = 'center'
    g.textBaseline = 'alphabetic'
    if (isC || (this.labels && whiteW >= 30)) {
      g.fillStyle = lit ? 'rgba(10, 20, 40, 0.7)' : isC ? 'rgba(70, 66, 60, 0.85)' : 'rgba(70, 66, 60, 0.42)'
      g.font = `${isC ? 'italic 600' : '500'} ${Math.min(isC ? 19 : 14, whiteW * 0.34)}px ${FONT}`
      g.fillText(noteLetter(p) + (isC ? String(Math.floor(p / 12) - 1) : ''), at.x, at.y)
    }
    const keyHint = this.keyHints ? labelForPitch(p, this.hintShift) : null
    if (keyHint && whiteW >= 30) {
      const up = this.onKeys(k.x, 0.7)
      g.fillStyle = 'rgba(70, 66, 60, 0.5)'
      g.font = `700 ${Math.min(12, whiteW * 0.22)}px ${FONT}`
      g.fillText(keyHint, up.x, up.y)
    }

    // Shade where the key runs back under the line.
    const back = g.createLinearGradient(0, hitY, 0, hitY + keyH * 0.14)
    back.addColorStop(0, 'rgba(8, 10, 26, 0.5)')
    back.addColorStop(1, 'rgba(8, 10, 26, 0)')
    g.fillStyle = back
    this.quad(x0, x1, 0, 0.14)
    g.fill()
  }

  /** One black key: body, a top face (lit, marked, or at rest), and its computer-key label. */
  private paintBlack(p: number, lit: string | null, hint: string | null): void {
    const g = this.g
    const { whiteW, keyH, hitY } = this.layout
    const k = this.key(p)
    const x0 = k.x - k.width / 2
    const x1 = k.x + k.width / 2

    // Drop shadow onto the white keys, then the body (sides and front face).
    if (!lit && !hint) {
      g.fillStyle = 'rgba(0, 0, 0, 0.2)'
      this.quad(x0 + k.width * 0.1, x1 + k.width * 0.14, 0, BLACK_LENGTH + 0.02)
      g.fill()
    }
    g.fillStyle = '#08080b'
    this.quad(x0, x1, 0, BLACK_LENGTH)
    g.fill()

    // The top face sits inset and stops short, leaving a front face that reads as height.
    const inset = k.width * 0.13
    const face = g.createLinearGradient(0, hitY, 0, hitY + keyH * BLACK_LENGTH)
    const color = lit ?? hint
    if (color) {
      face.addColorStop(0, rgba(color, lit ? 0.75 : 0.7))
      face.addColorStop(1, rgba(lighten(color, 0.3), lit ? 1 : 0.9))
      if (lit) {
        g.shadowColor = color
        g.shadowBlur = 22
      }
    } else {
      face.addColorStop(0, '#1b1b21')
      face.addColorStop(0.7, '#34343c')
      face.addColorStop(1, '#4a4a54')
    }
    g.fillStyle = face
    this.quad(x0 + inset, x1 - inset, 0, BLACK_LENGTH * 0.87)
    g.fill()
    g.shadowBlur = 0

    // A sliver of light along the left edge of the top face.
    const hiTop = this.onKeys(x0 + inset, 0.02)
    const hiBottom = this.onKeys(x0 + inset, BLACK_LENGTH * 0.86)
    g.strokeStyle = 'rgba(255, 255, 255, 0.16)'
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(hiTop.x, hiTop.y)
    g.lineTo(hiBottom.x, hiBottom.y)
    g.stroke()

    const keyHint = this.keyHints ? labelForPitch(p, this.hintShift) : null
    if (keyHint && whiteW >= 30) {
      const at = this.onKeys(k.x, BLACK_LENGTH * 0.72)
      g.fillStyle = color ? 'rgba(10, 20, 40, 0.8)' : 'rgba(255, 255, 255, 0.5)'
      g.font = `700 ${Math.min(11, whiteW * 0.2)}px ${FONT}`
      g.textAlign = 'center'
      g.textBaseline = 'alphabetic'
      g.fillText(keyHint, at.x, at.y)
    }
  }

  // ---- sparks ---------------------------------------------------------------

  private burst(pitch: number, color: string, count: number): void {
    if (pitch < this.lo || pitch > this.hi) return
    const { hitY } = this.layout
    const k = this.key(pitch)
    const now = performance.now()
    for (let i = 0; i < count; i++) {
      this.sparks.push({
        x: k.x + (Math.random() - 0.5) * k.width * 1.1,
        y: hitY - Math.random() * 4,
        vx: (Math.random() - 0.5) * 70,
        vy: -(30 + Math.random() * 110),
        born: now,
        color,
        size: 0.8 + Math.random() * 1.6,
      })
    }
    if (this.sparks.length > MAX_SPARKS) this.sparks.splice(0, this.sparks.length - MAX_SPARKS)
  }

  private drawSparks(): void {
    const g = this.g
    const now = performance.now()
    this.sparks = this.sparks.filter((s) => now - s.born < SPARK_LIFE_MS)
    g.globalCompositeOperation = 'lighter'
    for (const s of this.sparks) {
      const age = (now - s.born) / 1000
      const life = 1 - (now - s.born) / SPARK_LIFE_MS
      g.globalAlpha = life * life
      g.fillStyle = s.color
      g.shadowColor = s.color
      g.shadowBlur = 8
      g.beginPath()
      // Rise fast, then slow, like embers.
      g.arc(s.x + s.vx * age, s.y + s.vy * age * (1 - age * 0.6), s.size, 0, Math.PI * 2)
      g.fill()
    }
    g.shadowBlur = 0
    g.globalAlpha = 1
    g.globalCompositeOperation = 'source-over'
  }
}
