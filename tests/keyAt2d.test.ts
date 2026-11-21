import { describe, expect, it } from 'vitest'
import { isBlack } from '../src/core/pitch'
import { keyAt2D, type KeyLayout2D } from '../src/render/hit2d'

/** C4–B4 laid out like Highway2D does: 7 white keys, 70 px each. */
function layout(): KeyLayout2D {
  const whiteW = 70
  const keys: { x: number; width: number }[] = []
  let before = 0
  for (let p = 60; p <= 71; p++) {
    keys.push(isBlack(p) ? { x: before * whiteW, width: whiteW * 0.56 } : { x: (before + 0.5) * whiteW, width: whiteW })
    if (!isBlack(p)) before++
  }
  return { w: 7 * whiteW, hitY: 300, keyH: 200, whiteW, lo: 60, keys }
}

describe('keyAt2D', () => {
  const l = layout()
  // Points at the hit line (no perspective spread) and further down the keys.
  it('finds a white key', () => expect(keyAt2D(35, 450, l)).toBe(60))
  it('finds a black key over the white keys around it', () => expect(keyAt2D(70, 320, l)).toBe(61))
  it('gives the white key below where a black key ends', () => {
    expect(keyAt2D(50, 320, l)).toBe(61)
    expect(keyAt2D(50, 450, l)).toBe(60)
  })
  it('finds the last white key', () => expect(keyAt2D(480, 450, l)).toBe(71))
  it('is nothing above the keyboard or below it', () => {
    expect(keyAt2D(35, 299, l)).toBeNull()
    expect(keyAt2D(35, 501, l)).toBeNull()
  })
  it('is nothing off either end', () => {
    expect(keyAt2D(-5, 310, l)).toBeNull()
    expect(keyAt2D(l.w + 5, 310, l)).toBeNull()
  })
  it('follows the keys as they spread towards the front', () => {
    // At the front edge x spreads by 10% about the centre: E4's centre (175) moves to 175 - 0.1 * 70.
    expect(keyAt2D(175 - 7, 500, l)).toBe(64)
    // E ends at 210 at the hit line but at 206.5 at the front, so x = 208 is E above and F below.
    expect(keyAt2D(208, 301, l)).toBe(64)
    expect(keyAt2D(208, 500, l)).toBe(65)
  })
})
