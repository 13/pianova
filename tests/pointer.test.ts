import { describe, expect, it } from 'vitest'
import { PointerKeys, type PointerTarget } from '../src/input/pointer'

/** A stage whose keys are 10 px wide from x = 0, pitch 60 upwards; nothing above y = 100. */
function setup() {
  const listeners = new Map<string, (e: PointerEvent) => void>()
  const el: PointerTarget = {
    addEventListener: (type, cb) => listeners.set(type, cb),
    removeEventListener: (type) => listeners.delete(type),
    getBoundingClientRect: () => ({ left: 100, top: 50 }),
  }
  const heard: string[] = []
  const keys = new PointerKeys(el, (x, y) => (y < 100 ? null : 60 + Math.floor(x / 10)), (pitch, on) => heard.push(`${on ? 'on' : 'off'}${pitch}`))
  const canvas = { classList: { contains: (c: string) => c === 'stage-canvas' }, setPointerCapture() {} }
  const fire = (type: string, x: number, y: number, opts: { id?: number; button?: number; target?: unknown } = {}) =>
    listeners.get(type)?.({ clientX: 100 + x, clientY: 50 + y, pointerId: opts.id ?? 1, button: opts.button ?? 0, target: opts.target ?? canvas, timeStamp: 0, preventDefault() {} } as unknown as PointerEvent)
  return { keys, heard, fire, listeners }
}

describe('PointerKeys', () => {
  it('plays a key while it is pressed', () => {
    const { heard, fire } = setup()
    fire('pointerdown', 25, 120)
    fire('pointerup', 25, 120)
    expect(heard).toEqual(['on62', 'off62'])
  })

  it('slides from key to key while dragging, and lets go off the keyboard', () => {
    const { heard, fire } = setup()
    fire('pointerdown', 5, 120)
    fire('pointermove', 8, 130) // same key
    fire('pointermove', 15, 130)
    fire('pointermove', 15, 20) // above the keys
    fire('pointermove', 25, 130) // back on with the button still down
    fire('pointerup', 25, 130)
    fire('pointermove', 35, 130) // released: moving plays nothing
    expect(heard).toEqual(['on60', 'off60', 'on61', 'off61', 'on62', 'off62'])
  })

  it('holds one note per finger', () => {
    const { heard, fire } = setup()
    fire('pointerdown', 5, 120, { id: 1 })
    fire('pointerdown', 45, 120, { id: 2 })
    fire('pointerup', 5, 120, { id: 1 })
    fire('pointercancel', 45, 120, { id: 2 })
    expect(heard).toEqual(['on60', 'on64', 'off60', 'off64'])
  })

  it('ignores presses off the keys, on cards over the stage, and with other buttons', () => {
    const { heard, fire } = setup()
    fire('pointerdown', 5, 20)
    fire('pointerdown', 5, 120, { target: { classList: { contains: () => false } } })
    fire('pointerdown', 5, 120, { button: 2 })
    expect(heard).toEqual([])
  })

  it('lets go of held notes and stops listening when destroyed', () => {
    const { keys, heard, fire, listeners } = setup()
    fire('pointerdown', 5, 120)
    keys.destroy()
    expect(heard).toEqual(['on60', 'off60'])
    expect(listeners.size).toBe(0)
  })
})
