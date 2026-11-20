import type { NoteCallback } from './keyboard'

export interface MidiStatus {
  /** False when the browser has no Web MIDI at all. */
  supported: boolean
  inputs: { id: string; name: string }[]
  /** The one device being listened to, or null for all of them. */
  activeId: string | null
  /** Set when access was refused or failed. */
  error?: string
}

/** Listens to MIDI keyboards: note on/off and the sustain pedal. Hot-plug aware. */
export class MidiInput {
  status: MidiStatus = { supported: 'requestMIDIAccess' in navigator, inputs: [], activeId: null }
  private access: MIDIAccess | null = null
  /** The device the user asked for; ignored while it is not connected. */
  private wantedId: string | null = null
  /** Per listened-to device: keys and pedal currently down, so they can be released if it goes away. */
  private down = new Map<string, { keys: Set<number>; pedal: boolean }>()

  constructor(
    private emit: NoteCallback,
    private onSustain: (down: boolean) => void,
    private onStatus: (status: MidiStatus) => void,
  ) {}

  async init(preferredId: string | null): Promise<void> {
    this.wantedId = preferredId
    if (!this.status.supported) {
      this.onStatus(this.status)
      return
    }
    try {
      this.access = await navigator.requestMIDIAccess()
      this.access.onstatechange = () => this.refresh()
      this.refresh()
    } catch (err) {
      this.status = { ...this.status, error: err instanceof Error ? err.message : 'MIDI access was refused' }
      this.onStatus(this.status)
    }
  }

  select(id: string | null): void {
    this.wantedId = id
    this.refresh()
  }

  private refresh(): void {
    if (!this.access) return
    const all = [...this.access.inputs.values()]
    // "Midi Through" is a kernel loopback, never a keyboard.
    const real = all.filter((input) => input.state === 'connected' && !/midi through/i.test(input.name ?? ''))
    // A chosen device that is not plugged in must not silence the ones that are.
    const activeId = real.some((input) => input.id === this.wantedId) ? this.wantedId : null

    for (const input of all) {
      const listen = real.includes(input) && (activeId === null || activeId === input.id)
      if (listen) {
        if (!this.down.has(input.id)) this.down.set(input.id, { keys: new Set(), pedal: false })
        input.onmidimessage = (e) => this.onMessage(input.id, e)
      } else {
        input.onmidimessage = null
        this.release(input.id)
      }
    }
    this.status = { ...this.status, inputs: real.map((i) => ({ id: i.id, name: i.name ?? 'MIDI device' })), activeId, error: undefined }
    this.onStatus(this.status)
  }

  /** A device we stop hearing can never send its note-offs, so send them for it. */
  private release(inputId: string): void {
    const state = this.down.get(inputId)
    if (!state) return
    this.down.delete(inputId)
    for (const pitch of state.keys) this.emit(pitch, false, performance.now(), 0)
    if (state.pedal) this.onSustain(false)
  }

  private onMessage(inputId: string, e: MIDIMessageEvent): void {
    const data = e.data
    const state = this.down.get(inputId)
    if (!data || data.length < 3 || !state) return
    const command = data[0] & 0xf0
    if (command === 0x90 && data[2] > 0) {
      state.keys.add(data[1])
      this.emit(data[1], true, e.timeStamp, data[2] / 127)
    } else if (command === 0x80 || command === 0x90) {
      // A note-on with velocity 0 is how many keyboards send note-off.
      state.keys.delete(data[1])
      this.emit(data[1], false, e.timeStamp, 0)
    } else if (command === 0xb0 && data[1] === 64) {
      state.pedal = data[2] >= 64
      this.onSustain(state.pedal)
    }
  }
}
