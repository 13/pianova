import type { MidiStatus } from '../input/hub'
import type { App } from './app'
import { h, type View } from './dom'

/** The small status pill that says whether a MIDI keyboard is connected. */
export function midiPill(app: App): View {
  const dot = h('span', { class: 'dot' })
  const text = h('span')
  const el = h('span', { class: 'pill' }, dot, text)
  const render = (s: MidiStatus) => {
    const connected = s.inputs.length > 0
    el.className = connected ? 'pill ok' : 'pill'
    text.textContent = connected ? 'MIDI connected' : 'Computer keys'
    el.title = connected ? s.inputs.map((i) => i.name).join(', ') : 'No MIDI keyboard found. Your computer keys play notes.'
  }
  render(app.input.status)
  return { el, destroy: app.input.onStatus(render) }
}
