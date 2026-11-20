import { describe, expect, it } from 'vitest'
import { pitchForCode } from '../src/input/keyboard'

describe('pitchForCode', () => {
  it('maps the lower rows to C3–B3 and the upper rows to C4–C5', () => {
    expect(pitchForCode('KeyZ', 0)).toBe(48)
    expect(pitchForCode('KeyS', 0)).toBe(49)
    expect(pitchForCode('KeyM', 0)).toBe(59)
    expect(pitchForCode('KeyQ', 0)).toBe(60)
    expect(pitchForCode('Digit2', 0)).toBe(61)
    expect(pitchForCode('KeyI', 0)).toBe(72)
  })
  it('covers every key from C3 to C5 exactly once', () => {
    const codes = ['KeyZ', 'KeyS', 'KeyX', 'KeyD', 'KeyC', 'KeyV', 'KeyG', 'KeyB', 'KeyH', 'KeyN', 'KeyJ', 'KeyM',
      'KeyQ', 'Digit2', 'KeyW', 'Digit3', 'KeyE', 'KeyR', 'Digit5', 'KeyT', 'Digit6', 'KeyY', 'Digit7', 'KeyU', 'KeyI']
    expect(codes.map((c) => pitchForCode(c, 0))).toEqual(Array.from({ length: 25 }, (_, i) => 48 + i))
  })
  it('shifts by octaves and stays on the piano', () => {
    expect(pitchForCode('KeyQ', 1)).toBe(72)
    expect(pitchForCode('KeyZ', -2)).toBe(24)
    expect(pitchForCode('KeyZ', -3)).toBeNull()
    expect(pitchForCode('KeyI', 4)).toBeNull()
  })
  it('ignores other keys', () => {
    expect(pitchForCode('Space', 0)).toBeNull()
    expect(pitchForCode('KeyA', 0)).toBeNull()
  })
})
