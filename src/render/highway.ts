import { isBlack, midiToLetter } from '../core/pitch'
import type { Chart, Hand } from '../core/types'
import { labelForPitch } from '../input/keyboard'
import type { Grade } from '../judge/judge'

export const COLORS = {
  R: '#3fe0c5',
  L: '#ff9d5c',
  perfect: '#ffd76a',
  good: '#3fe0c5',
  miss: '#5b6079',
  wrong: '#ff4d6d',
}

/** How many beats of music are visible on the highway. */
const LOOKAHEAD = 8
/** Strength of the perspective squeeze towards the horizon. */
const DEPTH = 1.6
/** Width of the far end of the highway relative to the keyboard. */
const FAR_SCALE = 0.32
const FLASH_MS = 420

interface Flash {
  pitch: number
  color: string
  at: number
}

export interface Frame {
  beat: number
  chart?: Chart
  noteState?: ('pending' | Grade)[]
  /** Per note: true if the player plays it (false = auto-played, drawn fainter). */
  active?: boolean[]
  /** Keys to light up as "play this" (explanations, and the note being waited for). */
  highlight?: Map<number, Hand | 'hint'>
}

/** Draws the note highway and the keyboard beneath it onto one canvas. */
export class Highway {
  private g: CanvasRenderingContext2D
  private lo = 48
  private hi = 72
  private labels = true
  private keyHints = false
  private held = new Set<number>()
  private flashes: Flash[] = []
  private w = 0
  private h = 0
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

  /** Shows at least C3–C5, widened to whole octaves around whatever the chart needs. */
  setRange(chart: Chart | null): void {
    let lo = 48
    let hi = 72
    for (const n of chart?.notes ?? []) {
      lo = Math.min(lo, n.pitch - (n.pitch % 12))
      // Top key is a C when the music ends on one, otherwise the B above.
      hi = Math.max(hi, n.pitch % 12 === 0 ? n.pitch : n.pitch - (n.pitch % 12) + 11)
    }
    this.lo = Math.max(21, lo)
    this.hi = Math.min(108, hi)
  }

  setOptions(opts: { labels: boolean; keyHints: boolean }): void {
    this.labels = opts.labels
    this.keyHints = opts.keyHints
  }

  setHeld(held: Set<number>): void {
    this.held = held
  }

  flash(pitch: number, kind: Grade | 'wrong'): void {
    this.flashes.push({ pitch, color: COLORS[kind], at: performance.now() })
  }

  resize(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    this.w = this.canvas.clientWidth
    this.h = this.canvas.clientHeight
    this.canvas.width = Math.max(1, Math.round(this.w * dpr))
    this.canvas.height = Math.max(1, Math.round(this.h * dpr))
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  // ---- geometry -------------------------------------------------------------

  private get whiteCount(): number {
    let count = 0
    for (let p = this.lo; p <= this.hi; p++) if (!isBlack(p)) count++
    return count
  }

  private get layout() {
    const kbW = Math.min(this.w - 32, 1500)
    const whiteW = kbW / this.whiteCount
    const keyH = Math.max(90, Math.min(this.h * 0.24, whiteW * 4.6))
    return { kbW, whiteW, keyH, left: (this.w - kbW) / 2, hitY: this.h - keyH - 10, horizon: Math.max(24, this.h * 0.07) }
  }

  /** Centre x and width of a key at the keyboard. */
  private key(pitch: number): { x: number; width: number } {
    const { whiteW, left } = this.layout
    let whites = 0
    for (let p = this.lo; p < pitch; p++) if (!isBlack(p)) whites++
    return isBlack(pitch)
      ? { x: left + whites * whiteW, width: whiteW * 0.58 }
      : { x: left + (whites + 0.5) * whiteW, width: whiteW }
  }

  /** 1 at the hit line, falling to 0 at the horizon, for a note `beats` ahead. */
  private depth(beats: number): number {
    const d = Math.max(0, Math.min(1, beats / LOOKAHEAD))
    return (1 - d) / (1 + DEPTH * d)
  }

  private project(x: number, p: number): { x: number; y: number; scale: number } {
    const { hitY, horizon } = this.layout
    const scale = FAR_SCALE + (1 - FAR_SCALE) * p
    return { x: this.w / 2 + (x - this.w / 2) * scale, y: horizon + (hitY - horizon) * p, scale }
  }

  // ---- drawing --------------------------------------------------------------

  draw(frame: Frame): void {
    const g = this.g
    if (this.w === 0 || this.h === 0) return
    g.clearRect(0, 0, this.w, this.h)
    this.drawRoad(frame)
    if (frame.chart) this.drawNotes(frame, frame.chart)
    this.drawHitLine()
    this.drawKeyboard(frame)
    this.drawFlashes()
  }

  private drawRoad(frame: Frame): void {
    const g = this.g
    const { left, kbW, hitY, horizon } = this.layout
    const nearL = this.project(left, 1)
    const nearR = this.project(left + kbW, 1)
    const farL = this.project(left, 0)
    const farR = this.project(left + kbW, 0)

    // The "nova": a soft glow at the vanishing point.
    const glow = g.createRadialGradient(this.w / 2, horizon, 0, this.w / 2, horizon, this.w * 0.45)
    glow.addColorStop(0, 'rgba(140, 150, 255, 0.28)')
    glow.addColorStop(0.4, 'rgba(90, 80, 200, 0.08)')
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    g.fillStyle = glow
    g.fillRect(0, 0, this.w, hitY)

    const road = g.createLinearGradient(0, horizon, 0, hitY)
    road.addColorStop(0, 'rgba(22, 24, 52, 0.2)')
    road.addColorStop(1, 'rgba(22, 24, 52, 0.95)')
    g.fillStyle = road
    g.beginPath()
    g.moveTo(farL.x, farL.y)
    g.lineTo(farR.x, farR.y)
    g.lineTo(nearR.x, nearR.y)
    g.lineTo(nearL.x, nearL.y)
    g.closePath()
    g.fill()

    // Lanes: black keys get a darker strip; each C gets a brighter divider.
    for (let p = this.lo; p <= this.hi; p++) {
      const k = this.key(p)
      if (isBlack(p)) {
        const a = this.project(k.x - k.width / 2, 0)
        const b = this.project(k.x + k.width / 2, 0)
        const c = this.project(k.x + k.width / 2, 1)
        const d = this.project(k.x - k.width / 2, 1)
        g.fillStyle = 'rgba(5, 6, 18, 0.45)'
        g.beginPath()
        g.moveTo(a.x, a.y)
        g.lineTo(b.x, b.y)
        g.lineTo(c.x, c.y)
        g.lineTo(d.x, d.y)
        g.closePath()
        g.fill()
      } else {
        const edge = k.x - k.width / 2
        const top = this.project(edge, 0)
        const bottom = this.project(edge, 1)
        g.strokeStyle = p % 12 === 0 ? 'rgba(150, 160, 255, 0.35)' : 'rgba(150, 160, 255, 0.09)'
        g.lineWidth = 1
        g.beginPath()
        g.moveTo(top.x, top.y)
        g.lineTo(bottom.x, bottom.y)
        g.stroke()
      }
    }

    // Beat lines roll towards the player; bar lines are brighter.
    const bpb = frame.chart?.beatsPerBar ?? 4
    if (frame.chart) {
      for (let b = Math.ceil(frame.beat); b < frame.beat + LOOKAHEAD; b++) {
        const p = this.depth(b - frame.beat)
        const l = this.project(left, p)
        const r = this.project(left + kbW, p)
        const isBar = ((b % bpb) + bpb) % bpb === 0
        g.strokeStyle = `rgba(170, 180, 255, ${(isBar ? 0.4 : 0.12) * Math.min(1, p * 4 + 0.15)})`
        g.lineWidth = isBar ? 1.5 : 1
        g.beginPath()
        g.moveTo(l.x, l.y)
        g.lineTo(r.x, r.y)
        g.stroke()
      }
    }
  }

  private drawNotes(frame: Frame, chart: Chart): void {
    const g = this.g
    // Far notes first so nearer ones overlap them.
    for (let i = chart.notes.length - 1; i >= 0; i--) {
      const n = chart.notes[i]
      const ahead = n.startBeat - frame.beat
      const tail = ahead + n.durationBeats
      if (ahead > LOOKAHEAD || tail < 0) continue
      const state = frame.noteState?.[i] ?? 'pending'
      const active = frame.active?.[i] ?? true
      const hit = state === 'perfect' || state === 'good'
      // A played note is consumed at the line; others slide past and vanish.
      const near = this.depth(Math.max(0, ahead))
      const far = this.depth(Math.min(LOOKAHEAD, Math.max(0.12, tail)))
      const k = this.key(n.pitch)
      const half = (isBlack(n.pitch) ? k.width : k.width * 0.62) / 2
      const a = this.project(k.x - half, far)
      const b = this.project(k.x + half, far)
      const c = this.project(k.x + half, near)
      const d = this.project(k.x - half, near)

      const color = state === 'miss' ? COLORS.miss : COLORS[n.hand]
      g.globalAlpha = (state === 'miss' ? 0.5 : active ? 1 : 0.4) * Math.min(1, far * 6 + 0.25)
      const fill = g.createLinearGradient(0, a.y, 0, d.y)
      fill.addColorStop(0, shade(color, 0.55))
      fill.addColorStop(1, hit ? '#ffffff' : color)
      g.fillStyle = fill
      if (hit || (active && state === 'pending' && ahead < 0.6)) {
        g.shadowColor = color
        g.shadowBlur = hit ? 24 : 12
      }
      const r = Math.min(6 * c.scale, (d.y - a.y) / 2)
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

      // Finger number (or note name) rides on the leading edge once it is readable.
      const label = n.finger ? String(n.finger) : this.labels ? midiToLetter(n.pitch) : ''
      const size = 15 * c.scale
      if (label && active && ahead > -0.05 && size >= 9 && state === 'pending') {
        const cx = (c.x + d.x) / 2
        const cy = d.y - size * 0.95
        if (cy - size * 0.7 > a.y) {
          g.fillStyle = 'rgba(8, 10, 28, 0.78)'
          g.beginPath()
          g.arc(cx, cy, size * 0.72, 0, Math.PI * 2)
          g.fill()
          g.fillStyle = '#ffffff'
          g.font = `700 ${size}px ${FONT}`
          g.textAlign = 'center'
          g.textBaseline = 'middle'
          g.fillText(label, cx, cy + 0.5)
        }
      }
      g.globalAlpha = 1
    }
  }

  private drawHitLine(): void {
    const g = this.g
    const { left, kbW, hitY } = this.layout
    const line = g.createLinearGradient(left, 0, left + kbW, 0)
    line.addColorStop(0, 'rgba(255, 255, 255, 0)')
    line.addColorStop(0.08, 'rgba(255, 255, 255, 0.9)')
    line.addColorStop(0.92, 'rgba(255, 255, 255, 0.9)')
    line.addColorStop(1, 'rgba(255, 255, 255, 0)')
    g.shadowColor = '#9aa4ff'
    g.shadowBlur = 16
    g.fillStyle = line
    g.fillRect(left, hitY - 1.5, kbW, 3)
    g.shadowBlur = 0
  }

  private drawKeyboard(frame: Frame): void {
    const g = this.g
    const { whiteW, keyH, hitY } = this.layout
    const top = hitY + 8
    const blackH = keyH * 0.62
    const tint = (pitch: number): string | null => {
      const mark = frame.highlight?.get(pitch)
      return mark ? (mark === 'hint' ? COLORS.perfect : COLORS[mark]) : null
    }

    for (let p = this.lo; p <= this.hi; p++) {
      if (isBlack(p)) continue
      const k = this.key(p)
      const x = k.x - k.width / 2
      const held = this.held.has(p)
      const mark = tint(p)
      const face = g.createLinearGradient(0, top, 0, top + keyH)
      face.addColorStop(0, held ? '#cfd6ff' : '#f4f5fb')
      face.addColorStop(1, held ? '#9aa4ff' : '#d7d9e8')
      g.fillStyle = face
      roundRect(g, x + 1, top, k.width - 2, keyH, 5)
      g.fill()
      if (mark) {
        g.fillStyle = withAlpha(mark, held ? 0.75 : 0.5)
        roundRect(g, x + 1, top, k.width - 2, keyH, 5)
        g.fill()
      }
      const showName = this.labels && (whiteW >= 26 || p % 12 === 0)
      g.textAlign = 'center'
      g.textBaseline = 'alphabetic'
      if (showName) {
        g.fillStyle = p % 12 === 0 ? '#2a2f5a' : '#7a7f9c'
        g.font = `${p % 12 === 0 ? 700 : 500} ${Math.min(15, whiteW * 0.42)}px ${FONT}`
        g.fillText(midiToLetter(p) + (p % 12 === 0 ? String(Math.floor(p / 12) - 1) : ''), k.x, top + keyH - 10)
      }
      const hint = this.keyHints ? labelForPitch(p) : null
      if (hint && whiteW >= 26) {
        g.fillStyle = 'rgba(42, 47, 90, 0.45)'
        g.font = `600 ${Math.min(12, whiteW * 0.32)}px ${FONT}`
        g.fillText(hint, k.x, top + keyH - 30)
      }
    }
    for (let p = this.lo; p <= this.hi; p++) {
      if (!isBlack(p)) continue
      const k = this.key(p)
      const held = this.held.has(p)
      const mark = tint(p)
      g.fillStyle = mark ? shade(mark, held ? 1 : 0.7) : held ? '#6f78d8' : '#14162b'
      roundRect(g, k.x - k.width / 2, top, k.width, blackH, 4)
      g.fill()
      const hint = this.keyHints ? labelForPitch(p) : null
      if (hint && whiteW >= 26) {
        g.fillStyle = 'rgba(255, 255, 255, 0.5)'
        g.font = `600 ${Math.min(11, whiteW * 0.28)}px ${FONT}`
        g.textAlign = 'center'
        g.fillText(hint, k.x, top + blackH - 8)
      }
    }
  }

  private drawFlashes(): void {
    const g = this.g
    const now = performance.now()
    const { hitY } = this.layout
    this.flashes = this.flashes.filter((f) => now - f.at < FLASH_MS)
    for (const f of this.flashes) {
      if (f.pitch < this.lo || f.pitch > this.hi) continue
      const t = (now - f.at) / FLASH_MS
      const k = this.key(f.pitch)
      g.globalAlpha = (1 - t) ** 2
      g.strokeStyle = f.color
      g.lineWidth = 3
      g.shadowColor = f.color
      g.shadowBlur = 18
      g.beginPath()
      g.ellipse(k.x, hitY, k.width * (0.4 + t * 0.9), k.width * (0.16 + t * 0.4), 0, 0, Math.PI * 2)
      g.stroke()
      g.shadowBlur = 0
    }
    g.globalAlpha = 1
  }
}

const FONT = 'ui-sans-serif, system-ui, "Segoe UI", sans-serif'

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath()
  g.moveTo(x, y)
  g.lineTo(x + w, y)
  g.lineTo(x + w, y + h - r)
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  g.lineTo(x + r, y + h)
  g.quadraticCurveTo(x, y + h, x, y + h - r)
  g.closePath()
}

function rgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

/** Darkens a hex colour: 1 leaves it alone, 0 gives black. */
function shade(hex: string, amount: number): string {
  const [r, g, b] = rgb(hex)
  return `rgb(${Math.round(r * amount)}, ${Math.round(g * amount)}, ${Math.round(b * amount)})`
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = rgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
