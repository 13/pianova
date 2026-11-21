import type { Chart, Hand } from '../core/types'
import type { Grade } from '../judge/judge'
import { COLORS } from '../render/common'
import { t } from '../i18n'

/** Fingers light up for notes this close (in beats). */
const NEXT_BEATS = 1.6
/** ...and turn fully lit when the note is due. */
const NOW_BEATS = 0.25

const SVG = 'http://www.w3.org/2000/svg'

/**
 * Finger shapes of a right hand seen from above, palm down: [finger, x, top, angle].
 * The thumb leans out from the palm; the left hand is the mirror image.
 */
const FINGERS: [number, number, number, number][] = [
  [1, 22, 44, -32],
  [2, 41, 12, 0],
  [3, 59, 4, 0],
  [4, 77, 10, 0],
  [5, 94, 26, 0],
]
const FINGER_W = 17
const FINGER_BASE = 74
const PIVOT_Y = 104

interface FingerEl {
  g: SVGGElement
  state: string
}

/**
 * Two small hands beside the highway. The fingers for the next notes light up in the
 * hand's colour, and fingers holding a note stay lit, so you can see which finger to use
 * without reading the numbers.
 */
export class HandGuide {
  readonly el: HTMLElement
  private fingers: Record<Hand, FingerEl[]>
  private hands: Record<Hand, HTMLElement>

  constructor(chartHands: Hand[]) {
    this.el = document.createElement('div')
    this.el.className = 'hand-guide'
    this.el.setAttribute('aria-hidden', 'true')
    const build = (hand: Hand) => {
      const wrap = document.createElement('div')
      wrap.className = 'hand'
      wrap.style.setProperty('--hand', COLORS[hand])
      const svg = document.createElementNS(SVG, 'svg')
      svg.setAttribute('viewBox', '-10 -2 134 116')
      const mirror = (x: number) => (hand === 'R' ? x : 114 - x)
      const fingers: FingerEl[] = []
      for (const [finger, x, top, angle] of FINGERS) {
        const g = document.createElementNS(SVG, 'g')
        g.setAttribute('class', 'f')
        const cx = mirror(x)
        const a = hand === 'R' ? angle : -angle
        const pivotX = mirror(x + 12)
        const shape = document.createElementNS(SVG, 'rect')
        shape.setAttribute('class', 'finger')
        shape.setAttribute('x', String(cx - FINGER_W / 2))
        shape.setAttribute('y', String(top))
        shape.setAttribute('width', String(FINGER_W))
        shape.setAttribute('height', String(finger === 1 ? PIVOT_Y - top : FINGER_BASE - top))
        shape.setAttribute('rx', String(FINGER_W / 2))
        if (a) shape.setAttribute('transform', `rotate(${a} ${pivotX} ${PIVOT_Y})`)
        // The fingertip badge, turned with the finger but kept upright.
        const [tx, ty] = rotate(cx, top + 9, pivotX, PIVOT_Y, a)
        const tip = document.createElementNS(SVG, 'circle')
        tip.setAttribute('class', 'tip')
        tip.setAttribute('cx', String(tx))
        tip.setAttribute('cy', String(ty))
        tip.setAttribute('r', '9.5')
        const num = document.createElementNS(SVG, 'text')
        num.setAttribute('class', 'num')
        num.setAttribute('x', String(tx))
        num.setAttribute('y', String(ty + 0.5))
        num.textContent = String(finger)
        g.append(shape, tip, num)
        fingers[finger - 1] = { g, state: '' }
        svg.append(g)
      }
      const palm = document.createElementNS(SVG, 'rect')
      palm.setAttribute('class', 'palm')
      palm.setAttribute('x', String(hand === 'R' ? 30 : 114 - 30 - 74))
      palm.setAttribute('y', '60')
      palm.setAttribute('width', '74')
      palm.setAttribute('height', '50')
      palm.setAttribute('rx', '18')
      svg.prepend(palm)
      const label = document.createElement('span')
      label.textContent = hand === 'L' ? t('Left', 'Links') : t('Right', 'Rechts')
      wrap.append(svg, label)
      wrap.hidden = !chartHands.includes(hand)
      return { wrap, fingers }
    }
    const left = build('L')
    const right = build('R')
    this.fingers = { L: left.fingers, R: right.fingers }
    this.hands = { L: left.wrap, R: right.wrap }
    this.el.append(left.wrap, right.wrap)
  }

  /** Dims a hand the app is playing for you. */
  setPlaying(hands: Hand[]): void {
    for (const hand of ['L', 'R'] as Hand[]) this.hands[hand].classList.toggle('off', !hands.includes(hand))
  }

  update(chart: Chart, beat: number, noteState?: ('pending' | Grade)[], active?: boolean[]): void {
    const states: Record<Hand, string[]> = { L: ['', '', '', '', ''], R: ['', '', '', '', ''] }
    const next: Record<Hand, number> = { L: Infinity, R: Infinity }
    const notes = chart.notes
    const pending = (i: number) => (noteState?.[i] ?? 'pending') === 'pending' && (active?.[i] ?? true)
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i]
      if (n.finger && pending(i) && n.startBeat - beat > -0.3) next[n.hand] = Math.min(next[n.hand], n.startBeat)
    }
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i]
      if (!n.finger) continue
      const ahead = n.startBeat - beat
      const f = n.finger - 1
      const state = noteState?.[i] ?? 'pending'
      const sounding = ahead <= 0 && ahead + n.durationBeats > 0 && (state === 'perfect' || state === 'good' || !(active?.[i] ?? true) || !active)
      if (sounding && !states[n.hand][f]) states[n.hand][f] = 'hold'
      if (pending(i) && Math.abs(n.startBeat - next[n.hand]) < 1e-6 && ahead < NEXT_BEATS) {
        states[n.hand][f] = ahead < NOW_BEATS ? 'now' : 'next'
      }
    }
    for (const hand of ['L', 'R'] as Hand[]) {
      this.fingers[hand].forEach((el, f) => {
        const s = states[hand][f]
        if (s === el.state) return
        el.state = s
        el.g.setAttribute('class', s ? `f ${s}` : 'f')
      })
    }
  }
}

function rotate(x: number, y: number, px: number, py: number, deg: number): [number, number] {
  const r = (deg * Math.PI) / 180
  const dx = x - px
  const dy = y - py
  return [px + dx * Math.cos(r) - dy * Math.sin(r), py + dx * Math.sin(r) + dy * Math.cos(r)]
}
