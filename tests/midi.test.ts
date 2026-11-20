import { afterEach, describe, expect, it, vi } from 'vitest'
import { MidiInput, type MidiStatus } from '../src/input/midi'

type Handler = ((e: { data: Uint8Array; timeStamp: number }) => void) | null
interface FakeInput { id: string; name: string; state: string; onmidimessage: Handler }

function setup(names: Record<string, string>) {
  const inputs = new Map<string, FakeInput>(
    Object.entries(names).map(([id, name]) => [id, { id, name, state: 'connected', onmidimessage: null }]),
  )
  const access = { inputs, onstatechange: null as null | (() => void) }
  vi.stubGlobal('navigator', { requestMIDIAccess: async () => access })
  const notes: string[] = []
  const sustain: boolean[] = []
  let status!: MidiStatus
  const midi = new MidiInput(
    (pitch, on) => notes.push(`${on ? 'on' : 'off'}${pitch}`),
    (down) => sustain.push(down),
    (s) => (status = s),
  )
  const send = (id: string, ...bytes: number[]) => inputs.get(id)!.onmidimessage?.({ data: new Uint8Array(bytes), timeStamp: 0 })
  const unplug = (id: string) => {
    inputs.get(id)!.state = 'disconnected'
    access.onstatechange?.()
  }
  return { midi, notes, sustain, send, unplug, status: () => status }
}

afterEach(() => vi.unstubAllGlobals())

describe('MidiInput', () => {
  it('hears note on, note off, and velocity-0 note on as off', async () => {
    const t = setup({ a: 'Keys' })
    await t.midi.init(null)
    t.send('a', 0x90, 60, 100)
    t.send('a', 0x90, 60, 0)
    t.send('a', 0x91, 62, 90)
    t.send('a', 0x81, 62, 0)
    expect(t.notes).toEqual(['on60', 'off60', 'on62', 'off62'])
  })
  it('never lists the kernel loopback port as a keyboard', async () => {
    const t = setup({ a: 'Midi Through Port-0', b: 'Keys' })
    await t.midi.init(null)
    expect(t.status().inputs).toEqual([{ id: 'b', name: 'Keys' }])
  })
  it('falls back to every keyboard when the chosen one is not there', async () => {
    const t = setup({ b: 'Other keys' })
    await t.midi.init('gone')
    expect(t.status().activeId).toBeNull()
    t.send('b', 0x90, 60, 100)
    expect(t.notes).toEqual(['on60'])
  })
  it('listens only to the chosen keyboard, and to all again once it is unplugged', async () => {
    const t = setup({ a: 'A', b: 'B' })
    await t.midi.init('a')
    t.send('b', 0x90, 60, 100)
    expect(t.notes).toEqual([])
    expect(t.status().activeId).toBe('a')
    t.unplug('a')
    expect(t.status().activeId).toBeNull()
    t.send('b', 0x90, 60, 100)
    expect(t.notes).toEqual(['on60'])
  })
  it('releases held keys and the pedal when a keyboard is unplugged', async () => {
    const t = setup({ a: 'A' })
    await t.midi.init(null)
    t.send('a', 0x90, 60, 100)
    t.send('a', 0x90, 64, 100)
    t.send('a', 0xb0, 64, 127)
    t.unplug('a')
    expect(t.notes).toEqual(['on60', 'on64', 'off60', 'off64'])
    expect(t.sustain).toEqual([true, false])
  })
  it('releases held keys when another keyboard is selected', async () => {
    const t = setup({ a: 'A', b: 'B' })
    await t.midi.init(null)
    t.send('a', 0x90, 60, 100)
    t.midi.select('b')
    expect(t.notes).toEqual(['on60', 'off60'])
  })
})
