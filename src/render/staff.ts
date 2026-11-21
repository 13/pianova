import { isBlack } from '../core/pitch'
import type { Chart, Hand } from '../core/types'
import { noteLetter } from '../i18n'
import type { Grade } from '../judge/judge'
import { COLORS, FONT } from './common'

/** Position of each pitch class on the staff, counted in white keys from C. */
const STEP = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]
/** Staff steps (lines and spaces) of the bottom treble line (E4) and top bass line (A3). */
const E4 = 4 * 7 + 2
const A3 = 3 * 7 + 5
const EPS = 1e-6

export interface SheetFrame {
  beat: number
  chart: Chart
  noteState?: ('pending' | Grade)[]
  active?: boolean[]
  sections?: { name: string; startBeat: number }[]
  /** Note names under the heads. */
  labels?: boolean
}

const step = (pitch: number) => (Math.floor(pitch / 12) - 1) * 7 + STEP[((pitch % 12) + 12) % 12]

/**
 * The music as a grand staff that scrolls past a fixed cursor: right hand on the treble
 * staff, left hand on the bass staff. Heads are coloured like the highway (by hand, then
 * green or red once played) and a faint bar behind each shows how long it lasts, so the
 * two views read the same way while the eye learns real notation.
 */
export class SheetView {
  private ctx: CanvasRenderingContext2D

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No 2D canvas')
    this.ctx = ctx
  }

  draw(f: SheetFrame): void {
    const { canvas, ctx: g } = this
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = canvas.clientWidth
    const hgt = canvas.clientHeight
    if (!w || !hgt) return
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hgt * dpr)) {
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(hgt * dpr)
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, w, hgt)

    const sp = Math.max(5, Math.min(16, hgt / 19))
    const top = (hgt - 12 * sp) / 2
    const trebleBottom = top + 4 * sp
    const bassTop = top + 8 * sp
    const yOf = (pitch: number, hand: Hand) =>
      hand === 'R' ? trebleBottom - ((step(pitch) - E4) * sp) / 2 : bassTop - ((step(pitch) - A3) * sp) / 2

    const clefW = sp * 4.2
    const cursor = Math.max(clefW + sp * 3, w * 0.24)
    const perBeat = Math.max(sp * 5, Math.min(sp * 11, (w - cursor) / 9))
    const xOf = (beat: number) => cursor + (beat - f.beat) * perBeat
    const from = f.beat - (cursor - clefW) / perBeat - 1
    const to = f.beat + (w - cursor) / perBeat + 1
    const { chart } = f

    // Staff lines.
    g.strokeStyle = 'rgba(214, 220, 255, 0.5)'
    g.lineWidth = 1
    for (const y0 of [top, bassTop])
      for (let i = 0; i < 5; i++) {
        g.beginPath()
        g.moveTo(0, Math.round(y0 + i * sp) + 0.5)
        g.lineTo(w, Math.round(y0 + i * sp) + 0.5)
        g.stroke()
      }

    // Bar lines, numbers and part names.
    const bpb = chart.beatsPerBar
    g.font = `600 ${Math.round(sp * 0.95)}px ${FONT}`
    g.textAlign = 'left'
    g.textBaseline = 'bottom'
    for (let bar = Math.max(0, Math.floor(from / bpb)); bar * bpb <= Math.min(to, chart.lengthBeats + EPS); bar++) {
      const x = Math.round(xOf(bar * bpb)) + 0.5
      g.strokeStyle = 'rgba(214, 220, 255, 0.55)'
      g.beginPath()
      g.moveTo(x, top)
      g.lineTo(x, bassTop + 4 * sp)
      g.stroke()
      g.fillStyle = 'rgba(214, 220, 255, 0.55)'
      g.fillText(String(bar + 1), x + 3, top - sp * 0.4)
    }
    g.fillStyle = '#ffd76a'
    for (const s of f.sections ?? []) {
      if (s.startBeat < from || s.startBeat > to) continue
      g.fillText(s.name, xOf(s.startBeat) + 3, top - sp * 1.6)
    }

    // Notes, a chord at a time so it shares one stem.
    const groups = new Map<string, number[]>()
    chart.notes.forEach((n, i) => {
      if (n.startBeat + n.durationBeats < from || n.startBeat > to) return
      const key = `${n.hand}@${Math.round(n.startBeat * 1e4)}`
      const list = groups.get(key)
      if (list) list.push(i)
      else groups.set(key, [i])
    })
    const rx = sp * 0.62
    const ry = sp * 0.44
    for (const idx of groups.values()) {
      const first = chart.notes[idx[0]]
      const hand = first.hand
      const x = xOf(first.startBeat)
      const colour = (i: number) => {
        const state = f.noteState?.[i] ?? 'pending'
        const mine = f.active ? f.active[i] : true
        if (!mine) return 'rgba(170, 178, 215, 0.55)'
        if (state === 'miss') return COLORS.wrong
        if (state !== 'pending') return '#4ade80'
        return COLORS[hand]
      }
      // How long each note lasts, as a faint bar behind it.
      for (const i of idx) {
        const n = chart.notes[i]
        const y = yOf(n.pitch, hand)
        g.fillStyle = colour(i)
        g.globalAlpha = 0.22
        g.fillRect(x, y - ry * 0.55, Math.max(0, n.durationBeats * perBeat - rx), ry * 1.1)
        g.globalAlpha = 1
      }
      // Ledger lines for notes off the staff.
      g.strokeStyle = 'rgba(214, 220, 255, 0.7)'
      for (const i of idx) {
        const n = chart.notes[i]
        const s = step(n.pitch)
        const [lo, hi, base] = hand === 'R' ? [E4, E4 + 8, trebleBottom] : [A3 - 8, A3, bassTop]
        const ref = hand === 'R' ? E4 : A3
        const lines: number[] = []
        for (let k = lo - 2; k >= s; k -= 2) lines.push(k)
        for (let k = hi + 2; k <= s; k += 2) lines.push(k)
        for (const k of lines) {
          const y = Math.round(base - ((k - ref) * sp) / 2) + 0.5
          g.beginPath()
          g.moveTo(x - rx * 1.6, y)
          g.lineTo(x + rx * 1.6, y)
          g.stroke()
        }
      }
      // Stem from the outermost head, up when the chord sits low on its staff.
      const ys = idx.map((i) => yOf(chart.notes[i].pitch, hand))
      const middle = hand === 'R' ? trebleBottom - 2 * sp : bassTop + 2 * sp
      const up = (Math.min(...ys) + Math.max(...ys)) / 2 >= middle
      const beats = Math.min(...idx.map((i) => chart.notes[i].durationBeats))
      if (beats < 4 - EPS) {
        const sx = up ? x + rx * 0.92 : x - rx * 0.92
        const from = up ? Math.max(...ys) : Math.min(...ys)
        const tip = up ? Math.min(...ys) - sp * 3.3 : Math.max(...ys) + sp * 3.3
        g.strokeStyle = colour(idx[0])
        g.lineWidth = Math.max(1.2, sp * 0.12)
        g.beginPath()
        g.moveTo(sx, from)
        g.lineTo(sx, tip)
        // A flag for each halving below a quarter note.
        const flags = beats <= 0.25 + EPS ? 2 : beats <= 0.5 + EPS ? 1 : 0
        for (let k = 0; k < flags; k++) {
          const fy = tip + (up ? 1 : -1) * k * sp * 0.8
          g.moveTo(sx, fy)
          g.quadraticCurveTo(sx + sp * 1.1, fy + (up ? 1 : -1) * sp * 1.1, sx + sp * 0.7, fy + (up ? 1 : -1) * sp * 2.2)
        }
        g.stroke()
        g.lineWidth = 1
      }
      // Heads, sharps, fingers and names.
      for (const i of idx) {
        const n = chart.notes[i]
        const y = yOf(n.pitch, hand)
        const hollow = n.durationBeats >= 2 - EPS
        g.beginPath()
        g.ellipse(x, y, rx, ry, -0.35, 0, Math.PI * 2)
        if (hollow) {
          g.strokeStyle = colour(i)
          g.lineWidth = Math.max(1.5, sp * 0.2)
          g.stroke()
          g.lineWidth = 1
        } else {
          g.fillStyle = colour(i)
          g.fill()
        }
        g.fillStyle = colour(i)
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        if (isBlack(n.pitch)) {
          g.font = `700 ${Math.round(sp * 1.5)}px ${FONT}`
          g.fillText('♯', x - rx * 2.1, y)
        }
        if (n.finger) {
          g.font = `700 ${Math.round(sp * 0.95)}px ${FONT}`
          const fy = hand === 'R' ? Math.min(...ys) - sp * (up ? 4.2 : 1.3) : Math.max(...ys) + sp * (up ? 1.3 : 4.2)
          const order = [...idx].sort((a, b) => chart.notes[b].pitch - chart.notes[a].pitch).indexOf(i)
          g.fillText(String(n.finger), x, fy + (hand === 'R' ? -order : order) * sp * 1.05)
        }
        if (f.labels) {
          g.font = `600 ${Math.round(sp * 0.7)}px ${FONT}`
          g.fillStyle = 'rgba(12, 14, 34, 0.9)'
          if (!hollow) g.fillText(noteLetter(n.pitch).slice(0, 1), x, y + 0.5)
        }
      }
    }

    // The clefs sit on a panel the music scrolls under.
    const fade = g.createLinearGradient(clefW, 0, clefW + sp * 2, 0)
    fade.addColorStop(0, 'rgba(10, 13, 34, 0.96)')
    fade.addColorStop(1, 'rgba(10, 13, 34, 0)')
    g.fillStyle = 'rgba(10, 13, 34, 0.96)'
    g.fillRect(0, 0, clefW, hgt)
    g.fillStyle = fade
    g.fillRect(clefW, 0, sp * 2, hgt)
    g.strokeStyle = 'rgba(214, 220, 255, 0.5)'
    for (const y0 of [top, bassTop])
      for (let i = 0; i < 5; i++) {
        g.beginPath()
        g.moveTo(sp * 0.6, Math.round(y0 + i * sp) + 0.5)
        g.lineTo(clefW, Math.round(y0 + i * sp) + 0.5)
        g.stroke()
      }
    g.strokeStyle = 'rgba(214, 220, 255, 0.8)'
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(sp * 0.6, top)
    g.lineTo(sp * 0.6, bassTop + 4 * sp)
    g.stroke()
    trebleClef(g, sp * 2.2, trebleBottom - sp, sp)
    bassClef(g, sp * 1.9, bassTop + sp, sp)

    // The cursor: notes are played as they cross it.
    const glow = g.createLinearGradient(cursor - sp, 0, cursor + sp, 0)
    glow.addColorStop(0, 'rgba(255, 255, 255, 0)')
    glow.addColorStop(0.5, 'rgba(255, 255, 255, 0.16)')
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
    g.fillStyle = glow
    g.fillRect(cursor - sp, top - sp * 2, sp * 2, 16 * sp)
    g.fillStyle = '#ffffff'
    g.fillRect(cursor - 1, top - sp * 2, 2, 16 * sp)
  }

  destroy(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }
}

/** A treble clef drawn as strokes around the G line at `y`. */
function trebleClef(g: CanvasRenderingContext2D, cx: number, y: number, sp: number): void {
  g.save()
  g.strokeStyle = '#eef0ff'
  g.fillStyle = '#eef0ff'
  g.lineWidth = Math.max(1.6, sp * 0.18)
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.beginPath()
  g.moveTo(cx + 0.1 * sp, y + 0.1 * sp)
  g.bezierCurveTo(cx + 0.7 * sp, y - 0.6 * sp, cx - 0.5 * sp, y - 0.95 * sp, cx - 0.75 * sp, y)
  g.bezierCurveTo(cx - 1.0 * sp, y + 1.2 * sp, cx + 1.15 * sp, y + 1.25 * sp, cx + 1.05 * sp, y - 0.05 * sp)
  g.bezierCurveTo(cx + 0.95 * sp, y - 1.3 * sp, cx - 0.65 * sp, y - 2.0 * sp, cx - 0.15 * sp, y - 3.3 * sp)
  g.bezierCurveTo(cx + 0.35 * sp, y - 4.5 * sp, cx + 0.95 * sp, y - 5.1 * sp, cx + 0.5 * sp, y - 5.6 * sp)
  g.bezierCurveTo(cx + 0.05 * sp, y - 5.95 * sp, cx - 0.45 * sp, y - 4.6 * sp, cx - 0.2 * sp, y - 3.1 * sp)
  g.lineTo(cx + 0.3 * sp, y + 2.4 * sp)
  g.bezierCurveTo(cx + 0.4 * sp, y + 3.25 * sp, cx - 0.65 * sp, y + 3.35 * sp, cx - 0.55 * sp, y + 2.7 * sp)
  g.stroke()
  g.beginPath()
  g.arc(cx - 0.35 * sp, y + 2.65 * sp, 0.32 * sp, 0, Math.PI * 2)
  g.fill()
  g.restore()
}

/** A bass clef curling from the F line at `y`, with its two dots. */
function bassClef(g: CanvasRenderingContext2D, cx: number, y: number, sp: number): void {
  g.save()
  g.strokeStyle = '#eef0ff'
  g.fillStyle = '#eef0ff'
  g.lineWidth = Math.max(1.6, sp * 0.22)
  g.lineCap = 'round'
  g.beginPath()
  g.arc(cx - 0.55 * sp, y, 0.36 * sp, 0, Math.PI * 2)
  g.fill()
  g.beginPath()
  g.moveTo(cx - 0.55 * sp, y)
  g.bezierCurveTo(cx - 0.55 * sp, y - 1.35 * sp, cx + 1.15 * sp, y - 1.35 * sp, cx + 1.05 * sp, y + 0.25 * sp)
  g.bezierCurveTo(cx + 0.95 * sp, y + 1.65 * sp, cx + 0.05 * sp, y + 2.55 * sp, cx - 0.85 * sp, y + 3.0 * sp)
  g.stroke()
  for (const dy of [-0.5, 0.5]) {
    g.beginPath()
    g.arc(cx + 1.55 * sp, y + dy * sp, 0.17 * sp, 0, Math.PI * 2)
    g.fill()
  }
  g.restore()
}
