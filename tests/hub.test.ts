import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => vi.unstubAllGlobals())

describe('InputHub', () => {
  it('keeps a key sounding while either the MIDI keyboard or the computer key still holds it', async () => {
    const listeners: Record<string, ((e: unknown) => void)[]> = {}
    vi.stubGlobal('window', { addEventListener: (type: string, cb: (e: unknown) => void) => (listeners[type] ??= []).push(cb) })
    vi.stubGlobal('HTMLElement', class {})
    let onMessage: ((e: { data: Uint8Array; timeStamp: number }) => void) | null = null
    const input = { id: 'a', name: 'Keys', state: 'connected', set onmidimessage(cb: typeof onMessage) { onMessage = cb }, get onmidimessage() { return onMessage } }
    vi.stubGlobal('navigator', { requestMIDIAccess: async () => ({ inputs: new Map([['a', input]]), onstatechange: null }) })
    const { InputHub } = await import('../src/input/hub')
    const hub = new InputHub()
    await hub.init(null)
    const heard: string[] = []
    hub.onNote((pitch, on, _t, _v, source) => heard.push(`${source}:${on ? 'on' : 'off'}${pitch}`))
    const key = (type: string, code: string) =>
      listeners[type].forEach((cb) => cb({ code, repeat: false, target: null, timeStamp: 0, ctrlKey: false, metaKey: false, altKey: false, preventDefault() {} }))
    const midi = (...bytes: number[]) => onMessage!({ data: new Uint8Array(bytes), timeStamp: 0 })

    midi(0x90, 60, 100)
    key('keydown', 'KeyQ') // C4 on the computer keys: already sounding
    midi(0x80, 60, 0)
    expect(hub.held.has(60)).toBe(true) // the computer key still holds it
    key('keyup', 'KeyQ')
    expect(hub.held.has(60)).toBe(false)
    expect(heard).toEqual(['midi:on60', 'keys:off60'])
  })
})
