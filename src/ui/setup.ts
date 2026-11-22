import type { MidiStatus } from '../input/hub'
import { detectKeyboard, KEYBOARDS } from '../input/instruments'
import { t } from '../i18n'
import type { App } from './app'
import { h, icon, type View } from './dom'

/**
 * First start: ask for MIDI access (the browser shows its prompt), then which piano
 * it is, so every song fits its keys from the first lesson. Both can be skipped.
 */
export function setupView(app: App, done: () => void): View {
  const { input, progress } = app

  const status = h('p', { class: 'muted', 'aria-live': 'polite' })
  const allow = h(
    'button',
    {
      class: 'btn primary large',
      onclick: async () => {
        allow.disabled = true
        await input.init(progress.settings.midiInputId)
        allow.disabled = false
        render(input.status)
      },
    },
    icon('music'),
    t('Allow MIDI', 'MIDI erlauben'),
  )
  const skip = h('button', { class: 'btn ghost', onclick: () => done() }, t('Use my computer keys instead', 'Lieber die Computertasten nutzen'))
  const midiActions = h('div', { class: 'row' }, allow, skip)
  const syncActions = () => (midiActions.hidden = allow.hidden && skip.hidden)

  // ---- which piano ----
  const keyboard = h('select', {
    'aria-label': t('Your piano', 'Dein Klavier'),
    onchange: () => progress.setSettings({ keyboard: keyboard.value }),
  })
  const measure = h('button', { class: 'btn', onclick: () => app.goMeasure(() => app.goSetup(done)) }, icon('target'), t('Measure it', 'Ausmessen'))
  const pianoNote = h('p', { class: 'muted' })
  const finish = h('button', { class: 'btn primary large', onclick: () => done() }, icon('check'), t('Continue', 'Weiter'))
  const piano = h(
    'section',
    { class: 'setting', hidden: true },
    h('span', { class: 'eyebrow' }, t('Step 2', 'Schritt 2')),
    h('h2', null, t('Which piano is it?', 'Welches Klavier ist es?')),
    h('div', { class: 'row' }, keyboard, measure),
    pianoNote,
    h('div', { class: 'row' }, finish),
  )

  const renderPiano = (s: MidiStatus) => {
    const names = s.inputs.map((i) => i.name)
    const found = detectKeyboard(names)
    const { keyboard: chosen, measuredKeys } = progress.settings
    keyboard.replaceChildren(
      h('option', { value: 'auto', selected: chosen === 'auto' }, found ? t(`Recognised: ${found.name}`, `Erkannt: ${found.name}`) : t('Recognise it automatically', 'Automatisch erkennen')),
      ...(measuredKeys ? [h('option', { value: 'measured', selected: chosen === 'measured' }, t(`As measured: ${measuredKeys.hi - measuredKeys.lo + 1} keys`, `Wie gemessen: ${measuredKeys.hi - measuredKeys.lo + 1} Tasten`))] : []),
      ...KEYBOARDS.map((k) => h('option', { value: k.id, selected: chosen === k.id }, k.name)),
    )
    pianoNote.textContent =
      chosen === 'auto' && !found
        ? t(`Pianova cannot tell the size of “${names.join(', ')}” from its name. Pick it from the list, or measure it by pressing its lowest and highest key.`, `Pianova erkennt die Größe von „${names.join(', ')}“ nicht am Namen. Wähl es aus der Liste oder miss es aus, indem du die tiefste und höchste Taste drückst.`)
        : t('Every song is fitted to these keys. You can change this later in Settings.', 'Jedes Lied wird an diese Tasten angepasst. Du kannst das später in den Einstellungen ändern.')
  }

  const render = (s: MidiStatus) => {
    const connected = s.inputs.length > 0
    allow.hidden = !s.supported || (input.midiAsked && !s.error)
    // Once a keyboard is there, step 2's Continue is the way on.
    skip.hidden = connected
    status.textContent = s.insecure
      ? t('MIDI keyboards only work on a secure page. Open Pianova over https, or at localhost on this computer.', 'MIDI-Keyboards funktionieren nur auf einer sicheren Seite. Öffne Pianova über https oder unter localhost auf diesem Computer.')
      : !s.supported
        ? t('This browser cannot talk to MIDI keyboards. Open Pianova in Chrome or Chromium to use one.', 'Dieser Browser kann nicht mit MIDI-Keyboards sprechen. Öffne Pianova in Chrome oder Chromium, um eines zu nutzen.')
        : s.error
          ? t('MIDI access was blocked. Allow MIDI for this page in the address bar, then try again.', 'Der MIDI-Zugriff wurde blockiert. Erlaube MIDI für diese Seite in der Adressleiste und versuch es nochmal.')
          : !input.midiAsked
            ? t('Plug your keyboard in by USB and switch it on. Then allow Pianova to hear it: your browser will ask.', 'Schließ dein Keyboard per USB an und schalte es ein. Dann erlaube Pianova, es zu hören: Dein Browser fragt nach.')
            : connected
              ? t(`Connected: ${s.inputs.map((i) => i.name).join(', ')}`, `Verbunden: ${s.inputs.map((i) => i.name).join(', ')}`)
              : t('No keyboard found yet. Plug it in by USB and switch it on; it appears here by itself.', 'Noch kein Keyboard gefunden. Steck es per USB an und schalte es ein; es erscheint dann von selbst.')
    syncActions()
    piano.hidden = !connected
    if (connected) renderPiano(s)
  }
  render(input.status)
  const offStatus = input.onStatus(render)

  const el = h(
    'div',
    { class: 'screen' },
    h(
      'main',
      { class: 'path narrow setup' },
      h('h1', null, t('Set up your piano', 'Richte dein Klavier ein')),
      h(
        'section',
        { class: 'setting' },
        h('span', { class: 'eyebrow' }, t('Step 1', 'Schritt 1')),
        h('h2', null, t('Let Pianova hear your keyboard', 'Lass Pianova dein Keyboard hören')),
        status,
        midiActions,
      ),
      piano,
    ),
  )
  return { el, destroy: offStatus }
}
