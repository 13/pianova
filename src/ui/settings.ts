import type { MidiStatus } from '../input/hub'
import type { App } from './app'
import { h, icon, type View } from './dom'

const CLICKS = 12
const LEAD_IN = 4
const INTERVAL_S = 0.5

/** Settings: MIDI device, timing offset with a tap-along calibration, volume, labels. */
export function settingsView(app: App): View {
  const { progress, input, synth } = app
  const settings = progress.settings

  // ---- MIDI device ----
  const device = h('select', {
    onchange: () => {
      const id = device.value || null
      progress.setSettings({ midiInputId: id })
      input.selectInput(id)
    },
  })
  const deviceNote = h('p', { class: 'muted' })
  const renderDevices = (s: MidiStatus) => {
    device.replaceChildren(
      h('option', { value: '' }, 'All connected keyboards'),
      ...s.inputs.map((i) => h('option', { value: i.id }, i.name)),
    )
    // Show what is actually being listened to, not just what was last chosen.
    device.value = s.activeId ?? ''
    deviceNote.textContent = !s.supported
      ? 'This browser has no MIDI support. Use Chrome or Chromium to connect a keyboard.'
      : s.error
        ? 'MIDI access is blocked for this page. Allow it in the address bar and reload.'
        : s.inputs.length
          ? `${s.inputs.length} keyboard${s.inputs.length > 1 ? 's' : ''} connected.`
          : 'No MIDI keyboard found. Plug one in and it will appear here.'
  }
  renderDevices(input.status)
  const offStatus = input.onStatus(renderDevices)

  // ---- timing offset ----
  const latencyValue = h('output', null, `${settings.latencyMs} ms`)
  const latency = h('input', {
    type: 'range',
    min: '-50',
    max: '300',
    step: '5',
    value: String(settings.latencyMs),
    'aria-label': 'Timing offset',
    oninput: () => {
      latencyValue.textContent = `${latency.value} ms`
      progress.setSettings({ latencyMs: Number(latency.value) })
    },
  })
  const calibrateNote = h('p', { class: 'muted' }, 'If you are judged late even when you feel on the beat, calibrate: you will hear clicks, then tap any key along with them.')
  let stopCalibration = () => {}
  const calibrate = h('button', {
    class: 'btn',
    onclick: () => {
      calibrate.disabled = true
      const start = synth.now() + 0.4
      const clicks = Array.from({ length: CLICKS }, (_, i) => start + i * INTERVAL_S)
      clicks.forEach((t, i) => synth.click(i % 4 === 0, t))
      const taps: number[] = []
      const offNote = input.onNote((_pitch, on, perfTime) => on && taps.push(synth.fromPerf(perfTime)))
      calibrateNote.textContent = 'Listen to four clicks, then tap any key on each of the next eight.'
      const timer = window.setTimeout(() => {
        stopCalibration()
        // Each tap's distance from the nearest click after the lead-in.
        const offsets = taps
          .map((tap) => {
            const i = Math.round((tap - start) / INTERVAL_S)
            return i >= LEAD_IN && i < CLICKS ? tap - clicks[i] : NaN
          })
          .filter((o) => Math.abs(o) < INTERVAL_S / 2)
          .sort((a, b) => a - b)
        if (offsets.length < 4) {
          calibrateNote.textContent = 'Not enough taps to measure. Try again and tap along with the last eight clicks.'
          return
        }
        const median = offsets[Math.floor(offsets.length / 2)]
        const ms = Math.max(-50, Math.min(300, Math.round((median * 1000) / 5) * 5))
        progress.setSettings({ latencyMs: ms })
        latency.value = String(ms)
        latencyValue.textContent = `${ms} ms`
        calibrateNote.textContent = `Measured from ${offsets.length} taps and set to ${ms} ms.`
      }, (CLICKS * INTERVAL_S + 0.6) * 1000)
      stopCalibration = () => {
        clearTimeout(timer)
        offNote()
        calibrate.disabled = false
        stopCalibration = () => {}
      }
    },
  }, 'Calibrate')

  // ---- sound and display ----
  const volume = h('input', {
    type: 'range',
    min: '0',
    max: '100',
    value: String(Math.round(settings.volume * 100)),
    'aria-label': 'Volume',
    oninput: () => {
      const v = Number(volume.value) / 100
      synth.setVolume(v)
      progress.setSettings({ volume: v })
    },
    onchange: () => {
      synth.noteOn(60, 0.7)
      setTimeout(() => synth.noteOff(60), 400)
    },
  })
  const labels = h('input', { type: 'checkbox', checked: settings.labels, onchange: () => progress.setSettings({ labels: labels.checked }) })

  const row = (title: string, ...content: (HTMLElement | string)[]) =>
    h('section', { class: 'setting' }, h('h2', null, title), h('div', { class: 'setting-body' }, content))

  const el = h(
    'div',
    { class: 'screen' },
    h('header', { class: 'topbar' }, h('button', { class: 'btn ghost', onclick: () => app.goPath() }, icon('back'), 'Lessons'), h('strong', null, 'Settings')),
    h(
      'main',
      { class: 'path narrow' },
      row('MIDI keyboard', device, deviceNote),
      row('Timing offset', h('div', { class: 'row' }, latency, latencyValue, calibrate), calibrateNote),
      row('Volume', volume),
      row('Display', h('label', { class: 'check' }, labels, 'Show note names on the keys and notes')),
      row(
        'Computer keys',
        h(
          'p',
          { class: 'muted' },
          'Without a MIDI keyboard, the bottom letter rows play the lower octave (Z is C) and the top rows play the upper octave (Q is middle C). The [ and ] keys shift by an octave. Some computer keyboards cannot register certain three-key chords at once; a MIDI keyboard has no such limit.',
        ),
      ),
    ),
  )
  return {
    el,
    destroy() {
      offStatus()
      stopCalibration()
    },
  }
}
