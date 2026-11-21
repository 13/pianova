import type { MidiStatus } from '../input/hub'
import type { App } from './app'
import { h, type View } from './dom'
import { t } from '../i18n'

/** The small status pill that says whether a MIDI keyboard is connected. */
export function midiPill(app: App): View {
  const dot = h('span', { class: 'dot' })
  const text = h('span')
  const el = h('span', { class: 'pill' }, dot, text)
  const render = (s: MidiStatus) => {
    const connected = s.inputs.length > 0
    el.className = connected ? 'pill ok' : 'pill'
    text.textContent = connected ? t('MIDI connected', 'MIDI verbunden') : t('Computer keys', 'Computertasten')
    el.title = connected ? s.inputs.map((i) => i.name).join(', ') : t('No MIDI keyboard found. Your computer keys play notes.', 'Kein MIDI-Keyboard gefunden. Deine Computertasten spielen Töne.')
  }
  render(app.input.status)
  return { el, destroy: app.input.onStatus(render) }
}
