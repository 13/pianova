import { MIN_KEYS, standardSize, type KeyRange } from '../input/instruments'
import { isBlack } from '../core/pitch'
import { noteName, t } from '../i18n'
import type { App } from './app'
import { h, icon, type View } from './dom'

type Step = 'lo' | 'hi' | 'done'

/** The full MIDI piano range the strip draws. */
const STRIP_LO = 21
const STRIP_HI = 108

/**
 * Measures the player's keyboard: press its lowest key, then its highest. Pianova then
 * draws exactly those keys and fits music to them. Only a MIDI keyboard counts here:
 * the computer keys are not the instrument being measured.
 */
export function measureView(app: App, back: () => void): View {
  let step: Step = 'lo'
  let lo: number | null = null
  let hi: number | null = null

  const title = h('h1', null)
  const lead = h('p', { class: 'lede' })
  const note = h('div', { class: 'measure-note', 'aria-live': 'polite' })
  const hint = h('p', { class: 'muted measure-hint' })
  const actions = h('div', { class: 'row' })
  const noDevice = h('p', { class: 'banner', hidden: true })

  // A full 88-key strip: the measured range lights up as it is found.
  const keys = new Map<number, HTMLElement>()
  const strip = h('div', { class: 'measure-strip', 'aria-hidden': 'true' })
  for (let p = STRIP_LO; p <= STRIP_HI; p++) {
    const key = h('span', { class: isBlack(p) ? 'mk black' : 'mk white' })
    keys.set(p, key)
    strip.append(key)
  }

  const render = () => {
    main.classList.toggle('listening', step !== 'done')
    for (const [p, key] of keys) {
      key.classList.toggle('in', lo !== null && hi !== null && p >= lo && p <= hi)
      key.classList.toggle('end', p === lo || p === hi)
    }
    const save = h('button', { class: 'btn primary large', onclick: () => finish() }, icon('check'), t('Use these keys', 'Diese Tasten verwenden'))
    const redo = h('button', { class: 'btn', onclick: () => restart() }, icon('restart'), t('Measure again', 'Neu messen'))
    if (step === 'lo') {
      title.textContent = t('Press the lowest key', 'Drück die tiefste Taste')
      lead.textContent = t('The key at the far left end of your keyboard.', 'Die Taste ganz links auf deinem Keyboard.')
      note.textContent = '…'
      actions.replaceChildren()
    } else if (step === 'hi') {
      title.textContent = t('Now the highest key', 'Jetzt die höchste Taste')
      lead.textContent = t('The key at the far right end.', 'Die Taste ganz rechts.')
      note.textContent = `${noteName(lo!)} – …`
      actions.replaceChildren(redo)
    } else {
      const range = { lo: lo!, hi: hi! }
      const size = standardSize(range)
      title.textContent = t(`Your keyboard has ${hi! - lo! + 1} keys`, `Dein Keyboard hat ${hi! - lo! + 1} Tasten`)
      lead.textContent = size
        ? t(`From ${noteName(lo!)} to ${noteName(hi!)}, the standard layout for ${hi! - lo! + 1} keys.`, `Von ${noteName(lo!)} bis ${noteName(hi!)}, die übliche Aufteilung für ${hi! - lo! + 1} Tasten.`)
        : t(`From ${noteName(lo!)} to ${noteName(hi!)}.`, `Von ${noteName(lo!)} bis ${noteName(hi!)}.`)
      note.textContent = `${noteName(lo!)} – ${noteName(hi!)}`
      actions.replaceChildren(save, redo)
      save.focus()
    }
  }

  const restart = () => {
    step = 'lo'
    lo = hi = null
    hint.textContent = ''
    render()
  }

  const finish = () => {
    if (lo === null || hi === null) return
    const measuredKeys: KeyRange = { lo, hi }
    app.progress.setSettings({ measuredKeys, keyboard: 'measured' })
    back()
  }

  const offNote = app.input.onNote((pitch, on, _time, _velocity, source) => {
    if (!on || source !== 'midi') return
    if (step === 'lo') {
      lo = pitch
      step = 'hi'
      hint.textContent = ''
      render()
    } else if (step === 'hi') {
      if (pitch === lo) return // the lowest key again
      if (pitch - lo! + 1 < MIN_KEYS) {
        hint.textContent =
          pitch < lo!
            ? t(`${noteName(pitch)} is below the first key. Measure again and start with the key at the far left.`, `${noteName(pitch)} liegt unter der ersten Taste. Miss neu und beginne mit der Taste ganz links.`)
            : t(`${noteName(pitch)} is too close: press the key at the far right end.`, `${noteName(pitch)} ist zu nah: Drück die Taste ganz rechts außen.`)
        return
      }
      hi = pitch
      step = 'done'
      hint.textContent = ''
      render()
    }
  })

  const main = h('main', { class: 'path narrow measure listening' }, noDevice, title, lead, note, strip, hint, actions)

  const renderDevice = () => {
    const { inputs, error, supported, insecure } = app.input.status
    noDevice.hidden = inputs.length > 0
    noDevice.textContent = insecure
      ? t('MIDI keyboards only work on a secure page. Open Pianova over https, or at localhost on this computer.', 'MIDI-Keyboards funktionieren nur auf einer sicheren Seite. Öffne Pianova über https oder unter localhost auf diesem Computer.')
      : !supported
      ? t('This browser cannot talk to MIDI keyboards. Open Pianova in Chrome or Chromium.', 'Dieser Browser kann nicht mit MIDI-Keyboards sprechen. Öffne Pianova in Chrome oder Chromium.')
      : error
        ? t('MIDI access was blocked. Allow MIDI for this page in the address bar, then reload.', 'Der MIDI-Zugriff wurde blockiert. Erlaube MIDI für diese Seite in der Adressleiste und lade neu.')
        : t('Connect your keyboard by USB first. It appears here as soon as it is plugged in.', 'Schließ zuerst dein Keyboard per USB an. Es erscheint hier, sobald es eingesteckt ist.')
  }
  renderDevice()
  const offStatus = app.input.onStatus(renderDevice)
  render()

  const el = h(
    'div',
    { class: 'screen' },
    h(
      'header',
      { class: 'topbar' },
      h('button', { class: 'btn ghost', onclick: back }, icon('back'), t('Back', 'Zurück')),
      h('strong', null, t('Measure your keyboard', 'Keyboard ausmessen')),
    ),
    main,
  )
  return {
    el,
    destroy: () => {
      offNote()
      offStatus()
    },
  }
}
