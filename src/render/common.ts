import type { Chart, Hand } from '../core/types'
import type { Grade } from '../judge/judge'

export const COLORS = {
  L: '#35dfe8',
  R: '#ffb340',
  miss: '#56607f',
  wrong: '#ff4d6d',
  /** A key held that no note asked for. */
  neutral: '#aab2ff',
  /** "Find this key" in explanations. */
  hint: '#ffd76a',
}

/** How many beats of music are visible on the highway. */
export const LOOKAHEAD = 8

export const FONT = 'ui-sans-serif, system-ui, "Segoe UI", sans-serif'

export interface Frame {
  beat: number
  chart?: Chart
  noteState?: ('pending' | Grade)[]
  /** Per note: let go of too soon (the rest of it is drawn faded). */
  cut?: boolean[]
  /** Per note: true if the player plays it (false = auto-played, drawn fainter). */
  active?: boolean[]
  /** Keys to mark as "play this" (explanations, and the note being waited for). */
  highlight?: Map<number, Hand | 'hint'>
  /** For held keys: which hand's colour to light them in. Others glow neutral. */
  keyHands?: Map<number, Hand>
  /** Notes hit in a row; the hit line burns brighter as it grows. */
  streak?: number
}

/** How a judged note was timed, for the word that floats up from its key. */
export interface FlashTiming {
  offsetMs: number
  /** False when the music waits for the player, so timing is not judged. */
  timed: boolean
}

export interface HighwayOptions {
  labels: boolean
  keyHints: boolean
  hintShift?: number
}

/** What both renderers (WebGL and the 2D fallback) offer the screens. */
export interface HighwayRenderer {
  setRange(chart: Chart | null): void
  setOptions(opts: HighwayOptions): void
  setHeld(held: Set<number>): void
  flash(pitch: number, kind: Grade | 'wrong', hand?: Hand, timing?: FlashTiming): void
  draw(frame: Frame): void
  destroy(): void
}

/**
 * Covers C3–C5 plus whatever the chart needs, then a few keys either side so the
 * keyboard runs off both edges of the screen like a real one.
 */
export function keyRange(chart: Chart | null): { lo: number; hi: number } {
  let lo = 48
  let hi = 72
  for (const n of chart?.notes ?? []) {
    lo = Math.min(lo, n.pitch - (n.pitch % 12))
    // Top key is a C when the music ends on one, otherwise the B above.
    hi = Math.max(hi, n.pitch % 12 === 0 ? n.pitch : n.pitch - (n.pitch % 12) + 11)
  }
  // A fourth below a C, and a fourth above a C or B, are both white keys.
  return { lo: Math.max(21, lo - 5), hi: Math.min(108, hi + 5) }
}

export function rgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = rgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Mixes a hex colour towards white: 0 leaves it alone, 1 gives white. */
export function lighten(hex: string, amount: number): string {
  const [r, g, b] = rgb(hex).map((c) => Math.round(c + (255 - c) * amount))
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}
