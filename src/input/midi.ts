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

  constructor(
    private emit: NoteCallback,
    private onSustain: (down: boolean) => void,
    private onStatus: (status: MidiStatus) => void,
  ) {}

  async init(preferredId: string | null): Promise<void> {
    this.status.activeId = preferredId
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
    this.status.activeId = id
    this.refresh()
  }

  private refresh(): void {
    if (!this.access) return
    const inputs: MidiStatus['inputs'] = []
    for (const input of this.access.inputs.values()) {
      // "Midi Through" is a kernel loopback, never a keyboard.
      const isReal = input.state === 'connected' && !/midi through/i.test(input.name ?? '')
      if (isReal) inputs.push({ id: input.id, name: input.name ?? 'MIDI device' })
      const { activeId } = this.status
      input.onmidimessage = isReal && (activeId === null || activeId === input.id) ? this.onMessage : null
    }
    this.status = { ...this.status, inputs, error: undefined }
    this.onStatus(this.status)
  }

  private onMessage = (e: MIDIMessageEvent): void => {
    const data = e.data
    if (!data || data.length < 3) return
    const command = data[0] & 0xf0
    if (command === 0x90 && data[2] > 0) this.emit(data[1], true, e.timeStamp, data[2] / 127)
    // A note-on with velocity 0 is how many keyboards send note-off.
    else if (command === 0x80 || command === 0x90) this.emit(data[1], false, e.timeStamp, 0)
    else if (command === 0xb0 && data[1] === 64) this.onSustain(data[2] >= 64)
  }
}
