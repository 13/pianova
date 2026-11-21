import { isBlack } from '../core/pitch'

/** How much wider the 2D keyboard is at its front edge than at the hit line. */
export const KEY_SPREAD = 1.1
/** Black keys reach this far down the white keys (as a fraction of the key length). */
export const BLACK_LENGTH = 0.6

export interface KeyLayout2D {
  /** Canvas width in CSS px. */
  w: number
  hitY: number
  keyH: number
  whiteW: number
  lo: number
  /** Centre x (at the hit line) and width of each key from `lo` up. */
  keys: { x: number; width: number }[]
}

/**
 * The key under a point on the flat 2D keyboard, undoing its slight perspective spread.
 * Black keys sit on top, so they win where they overlap a white key.
 */
export function keyAt2D(px: number, py: number, layout: KeyLayout2D): number | null {
  const { w, hitY, keyH, whiteW, lo, keys } = layout
  const f = (py - hitY) / keyH
  if (!(f >= 0 && f <= 1)) return null
  const x = w / 2 + (px - w / 2) / (1 + (KEY_SPREAD - 1) * f)
  let white: number | null = null
  for (let i = 0; i < keys.length; i++) {
    const pitch = lo + i
    const k = keys[i]
    if (isBlack(pitch)) {
      if (f <= BLACK_LENGTH && Math.abs(x - k.x) <= k.width / 2) return pitch
    } else if (Math.abs(x - k.x) <= whiteW / 2) {
      white = pitch
    }
  }
  return white
}
