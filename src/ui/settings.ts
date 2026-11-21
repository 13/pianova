import type { MidiStatus } from '../input/hub'
import { detectKeyboard, KEYBOARDS } from '../input/instruments'
import type { App } from './app'
import { h, icon, type View } from './dom'
import { LANGUAGES, noteName, resolveLang, setLang, t } from '../i18n'

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
      h('option', { value: '' }, t('All connected keyboards', 'Alle angeschlossenen Keyboards')),
      ...s.inputs.map((i) => h('option', { value: i.id }, i.name)),
    )
    // Show what is actually being listened to, not just what was last chosen.
    device.value = s.activeId ?? ''
    deviceNote.textContent = !s.supported
      ? t('This browser has no MIDI support. Use Chrome or Chromium to connect a keyboard.', 'Dieser Browser unterstützt kein MIDI. Nutze Chrome oder Chromium, um ein Keyboard anzuschließen.')
      : s.error
        ? t('MIDI access is blocked for this page. Allow it in the address bar and reload.', 'MIDI ist für diese Seite blockiert. Erlaube es in der Adressleiste und lade neu.')
        : s.inputs.length
          ? t(`${s.inputs.length} keyboard${s.inputs.length > 1 ? 's' : ''} connected.`, `${s.inputs.length} Keyboard${s.inputs.length > 1 ? 's' : ''} verbunden.`)
          : t('No MIDI keyboard found. Plug one in and it will appear here.', 'Kein MIDI-Keyboard gefunden. Steck eines an, dann erscheint es hier.')
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
    'aria-label': t('Timing offset', 'Timing-Ausgleich'),
    oninput: () => {
      latencyValue.textContent = `${latency.value} ms`
      progress.setSettings({ latencyMs: Number(latency.value) })
    },
  })
  const calibrateNote = h('p', { class: 'muted' }, t('If you are judged late even when you feel on the beat, calibrate: you will hear clicks, then tap any key along with them.', 'Wenn du als zu spät gewertet wirst, obwohl du dich im Takt fühlst, kalibriere: Du hörst Klicks und tippst dazu auf eine beliebige Taste.'))
  let stopCalibration = () => {}
  const calibrate = h('button', {
    class: 'btn',
    onclick: () => {
      calibrate.disabled = true
      const start = synth.now() + synth.lead + 0.3
      const clicks = Array.from({ length: CLICKS }, (_, i) => start + i * INTERVAL_S)
      clicks.forEach((at, i) => synth.click(i % 4 === 0, at))
      const taps: number[] = []
      const offNote = input.onNote((_pitch, on, perfTime) => on && taps.push(synth.fromPerf(perfTime)))
      calibrateNote.textContent = t('Listen to four clicks, then tap any key on each of the next eight.', 'Hör vier Klicks zu und tippe dann bei jedem der nächsten acht auf eine Taste.')
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
          calibrateNote.textContent = t('Not enough taps to measure. Try again and tap along with the last eight clicks.', 'Zu wenige Anschläge zum Messen. Versuch es nochmal und tippe bei den letzten acht Klicks mit.')
          return
        }
        const median = offsets[Math.floor(offsets.length / 2)]
        const ms = Math.max(-50, Math.min(300, Math.round((median * 1000) / 5) * 5))
        progress.setSettings({ latencyMs: ms })
        latency.value = String(ms)
        latencyValue.textContent = `${ms} ms`
        calibrateNote.textContent = t(`Measured from ${offsets.length} taps and set to ${ms} ms.`, `Aus ${offsets.length} Anschlägen gemessen und auf ${ms} ms gesetzt.`)
      }, (CLICKS * INTERVAL_S + 0.6) * 1000)
      stopCalibration = () => {
        clearTimeout(timer)
        offNote()
        calibrate.disabled = false
        stopCalibration = () => {}
      }
    },
  }, t('Calibrate', 'Kalibrieren'))

  // ---- sound and display ----
  const volume = h('input', {
    type: 'range',
    min: '0',
    max: '100',
    value: String(Math.round(settings.volume * 100)),
    'aria-label': t('Volume', 'Lautstärke'),
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

  // ---- your instrument ----
  const keyboardNote = h('p', { class: 'muted' })
  const renderKeyboardNote = () => {
    const found = detectKeyboard(input.status.inputs.map((i) => i.name))
    const k = app.keyboard
    keyboardNote.textContent =
      (progress.settings.keyboard === 'auto'
        ? found
          ? `${t('Recognised', 'Erkannt')}: ${found.name}. `
          : progress.settings.measuredKeys
            ? t('Using the keys you measured. ', 'Die gemessenen Tasten werden verwendet. ')
            : t('Not recognised from its USB name, so a full 88-key piano is shown. Measure it, or choose yours above. ', 'Am USB-Namen nicht erkannt, daher wird ein volles Klavier mit 88 Tasten gezeigt. Miss es aus oder wähle oben dein Modell. ')
        : progress.settings.keyboard === 'measured'
          ? `${t('Measured', 'Gemessen')}: ${noteName(k.lo)} – ${noteName(k.hi)}. `
          : '') + t(
          `Showing ${k.hi - k.lo + 1} keys; music outside them is moved by octaves to fit.`,
          `${k.hi - k.lo + 1} Tasten werden gezeigt; Musik außerhalb wird oktavweise verschoben.`,
        )
  }
  const keyboard = h(
    'select',
    {
      'aria-label': t('Your keyboard', 'Dein Keyboard'),
      onchange: () => {
        progress.setSettings({ keyboard: keyboard.value })
        renderKeyboardNote()
      },
    },
    h('option', { value: 'auto', selected: settings.keyboard === 'auto' }, t('Recognise it automatically', 'Automatisch erkennen')),
    settings.measuredKeys &&
      h(
        'option',
        { value: 'measured', selected: settings.keyboard === 'measured' },
        t(`As measured: ${settings.measuredKeys.hi - settings.measuredKeys.lo + 1} keys`, `Wie gemessen: ${settings.measuredKeys.hi - settings.measuredKeys.lo + 1} Tasten`),
      ),
    KEYBOARDS.map((k) => h('option', { value: k.id, selected: settings.keyboard === k.id }, k.name)),
  )
  const measure = h('button', { class: 'btn', onclick: () => app.goMeasure() }, icon('target'), t('Measure my keyboard', 'Mein Keyboard ausmessen'))
  renderKeyboardNote()
  const offKeyboard = input.onStatus(renderKeyboardNote)
  const soundKeys = h(
    'select',
    {
      'aria-label': t('Sound of your keys', 'Klang deiner Tasten'),
      onchange: () => progress.setSettings({ soundKeys: soundKeys.value as 'auto' | 'on' | 'off' }),
    },
    h('option', { value: 'auto', selected: settings.soundKeys === 'auto' }, t('Automatic: not when the keyboard has its own speakers', 'Automatisch: nicht, wenn das Keyboard eigene Lautsprecher hat')),
    h('option', { value: 'on', selected: settings.soundKeys === 'on' }, t('Always play my keys through Pianova', 'Meine Tasten immer über Pianova spielen')),
    h('option', { value: 'off', selected: settings.soundKeys === 'off' }, t('Never: my keyboard makes its own sound', 'Nie: Mein Keyboard klingt selbst')),
  )

  // ---- language ----
  const language = h(
    'select',
    {
      'aria-label': 'Language / Sprache',
      onchange: () => {
        const value = language.value as 'auto' | 'en' | 'de'
        progress.setSettings({ language: value })
        setLang(resolveLang(value))
        app.goSettings()
      },
    },
    h('option', { value: 'auto', selected: settings.language === 'auto' }, t('Same as the browser', 'Wie im Browser')),
    LANGUAGES.map((l) => h('option', { value: l.id, selected: settings.language === l.id }, l.name)),
  )

  // ---- daily goal ----
  const goal = h(
    'select',
    {
      'aria-label': t('Daily goal', 'Tagesziel'),
      onchange: () => progress.setSettings({ dailyGoalMin: Number(goal.value) }),
    },
    [5, 10, 15, 20, 30, 45].map((m) => h('option', { value: String(m), selected: settings.dailyGoalMin === m }, t(`${m} minutes a day`, `${m} Minuten am Tag`))),
  )

  const row = (title: string, ...content: (HTMLElement | string)[]) =>
    h('section', { class: 'setting' }, h('h2', null, title), h('div', { class: 'setting-body' }, content))

  const el = h(
    'div',
    { class: 'screen' },
    h('header', { class: 'topbar' }, h('button', { class: 'btn ghost', onclick: () => app.goPath() }, icon('back'), t('Lessons', 'Lektionen')), h('strong', null, t('Settings', 'Einstellungen'))),
    h(
      'main',
      { class: 'path narrow' },
      row(t('Language', 'Sprache'), language),
      row(t('MIDI keyboard', 'MIDI-Keyboard'), device, deviceNote),
      row(t('Your keyboard', 'Dein Keyboard'), h('div', { class: 'row' }, keyboard, measure), keyboardNote),
      row(
        t('Sound of your keys', 'Klang deiner Tasten'),
        soundKeys,
        h('p', { class: 'muted' }, t('A digital piano such as a Piaggero plays its own sound, so Pianova stays quiet for your keys and plays only the music around you.', 'Ein Digitalpiano wie das Piaggero klingt selbst, deshalb bleibt Pianova bei deinen Tasten still und spielt nur die Musik um dich herum.')),
      ),
      row(
        t('Skill check', 'Einstufung'),
        h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => app.goSkillCheck() }, t('Take the skill check again', 'Einstufung wiederholen'))),
        h('p', { class: 'muted' }, t('Opens the lessons that fit what you can already play, and sets where songs start.', 'Öffnet die Lektionen, die zu deinem Können passen, und legt fest, wo Lieder beginnen.')),
      ),
      row(
        t('Daily goal', 'Tagesziel'),
        goal,
        h('p', { class: 'muted' }, t('Playing time that keeps your streak going. Listening does not count; playing along does.', 'Spielzeit, die deine Serie am Leben hält. Zuhören zählt nicht, Mitspielen schon.')),
      ),
      row(t('Timing offset', 'Timing-Ausgleich'), h('div', { class: 'row' }, latency, latencyValue, calibrate), calibrateNote),
      row(t('Volume', 'Lautstärke'), volume),
      row(t('Display', 'Anzeige'), h('label', { class: 'check' }, labels, t('Show note names on the keys and notes', 'Notennamen auf Tasten und Noten zeigen'))),
      row(
        t('Computer keys', 'Computertasten'),
        h(
          'p',
          { class: 'muted' },
          t('Without a MIDI keyboard, the bottom letter rows play the lower octave (Z is C) and the top rows play the upper octave (Q is middle C). The [ and ] keys shift by an octave. Some computer keyboards cannot register certain three-key chords at once; a MIDI keyboard has no such limit.', 'Ohne MIDI-Keyboard spielen die unteren Buchstabenreihen die tiefere Oktave (Y bzw. Z ist C) und die oberen Reihen die höhere (Q ist das mittlere C). Die Tasten [ und ] verschieben um eine Oktave. Manche Computertastaturen erkennen bestimmte Dreiklänge nicht gleichzeitig; ein MIDI-Keyboard hat diese Grenze nicht.'),
        ),
      ),
    ),
  )
  return {
    el,
    destroy() {
      offStatus()
      offKeyboard()
      stopCalibration()
    },
  }
}
