import { IdleGate } from './idle'
import { chordAt } from '../chart/harmony'
import type { Hand } from '../core/types'
import { noteLetter, t, tr } from '../i18n'
import { chordTones, fits, jamBand, jamChart, jamChords, jamLength, progression, PROGRESSIONS, scaleOf, type ProgressionId } from '../practice/jam'
import { Highway } from '../render/highway'
import { Session } from '../session/session'
import type { App } from './app'
import { ChordStrip } from './chordStrip'
import { h, icon, percent, type View } from './dom'
import { midiPill } from './midiPill'

const TEMPOS = [70, 80, 90, 100, 110, 120, 140]

/** Chosen in this visit, so coming back finds the same jam. */
let last: { key: number; prog: ProgressionId; bpm: number } = { key: 0, prog: 'pop', bpm: 100 }

/**
 * Jam with the band: it plays a chord progression round and round, you play anything
 * over it. The notes of the chord sounding now light up on the keys; the key's scale fits
 * too. Nothing is scored, but the panel says how much of what you played was in key.
 */
export function jamView(app: App): View {
  let { key, prog, bpm } = last
  let session: Session | null = null
  let playing = false
  let raf = 0
  let presses = 0
  let inKey = 0
  const { synth } = app

  const canvas = h('canvas', { class: 'stage-canvas' })
  const strip = new ChordStrip()
  const inKeyEl = h('span', { class: 'panel-value good' }, '–')
  const playedEl = h('span', { class: 'panel-value' }, '0')
  const scaleEl = h('p', { class: 'play-sub' })
  const playButton = h('button', { class: 'tbtn primary', onclick: () => setPlaying(!playing) })
  const highway = new Highway(canvas)
  const pill = midiPill(app)

  const keyName = (k: number) => noteLetter(k) + (progression(prog).minor ? 'm' : '')
  const select = <T extends string | number>(label: string, value: T, options: [T, string][], change: (v: T) => void) => {
    const el = h(
      'select',
      { class: 'chip', 'aria-label': label, onchange: () => change(options[Number(el.value)][0]) },
      options.map(([v, text], i) => h('option', { value: String(i), selected: v === value }, text)),
    )
    return el
  }
  const keySelect = () =>
    select(t('Key', 'Tonart'), key, Array.from({ length: 12 }, (_, k): [number, string] => [k, `${t('Key', 'Tonart')} ${keyName(k)}`]), (v) => {
      key = v
      restart()
    })
  let keyEl = keySelect()
  const progEl = select(t('Progression', 'Akkordfolge'), prog, PROGRESSIONS.map((p): [ProgressionId, string] => [p.id, tr(p.name)]), (v) => {
    prog = v
    // Minor and major keys are named differently: rebuild the key list.
    const fresh = keySelect()
    keyEl.replaceWith(fresh)
    keyEl = fresh
    restart()
  })
  const tempoEl = select(t('Tempo', 'Tempo'), bpm, TEMPOS.map((b): [number, string] => [b, `${b} BPM`]), (v) => {
    bpm = v
    restart()
  })

  // Twice round, so the strip already shows the top of the next time round near the end.
  const chordNames = () => {
    const length = jamLength(prog)
    const names = jamChords(key, prog).map((c) => ({ name: noteLetter(c.root) + (c.minor ? 'm' : ''), startBeat: c.startBeat }))
    return [...names, ...names.map((c) => ({ ...c, startBeat: c.startBeat + length }))]
  }

  function restart(): void {
    last = { key, prog, bpm }
    session?.stop(synth.now())
    session = null
    const chart = jamChart(prog, bpm)
    highway.setRange(chart)
    idle?.wake()
    strip.set(chordNames())
    const scale = [...scaleOf(key, prog)].sort((a, b) => ((a - key + 12) % 12) - ((b - key + 12) % 12))
    scaleEl.textContent = t(
      `Lit keys: the chord now. These fit all the way through: ${scale.map(noteLetter).join(' ')}`,
      `Leuchtende Tasten: der Akkord gerade. Diese passen immer: ${scale.map(noteLetter).join(' ')}`,
    )
    if (playing) start()
  }

  function start(): void {
    const chart = jamChart(prog, bpm)
    const band = jamBand(key, prog)
    const bars = jamLength(prog) / chart.beatsPerBar
    session = new Session(
      { chart, mode: 'demo', hands: [], loop: { fromBar: 1, toBar: bars }, extras: band },
      {
        extra: (i, at) => {
          const e = band[i]
          synth.band(e.sound, at, e.velocity, e.pitches, e.durationBeats * (60 / bpm))
        },
        cancel: (at) => synth.cancelAfter(at),
      },
    )
    session.start(synth.now())
    session.update(synth.now(), synth.lead)
  }

  function setPlaying(on: boolean): void {
    playing = on
    idle?.wake()
    playButton.replaceChildren(icon(on ? 'pause' : 'play'))
    playButton.setAttribute('aria-label', on ? t('Stop the band', 'Band anhalten') : t('Start the band', 'Band starten'))
    if (on) start()
    else {
      session?.stop(synth.now())
      session = null
    }
  }

  const syncHints = () =>
    highway.setOptions({ labels: app.progress.settings.labels, keyHints: app.usingComputerKeys, hintShift: app.input.octaveShift, keys: app.keyboard })

  const highlight = new Map<number, Hand | 'hint'>()
  const keyHands = new Map<number, Hand>()
  const held = new Set<number>()
  let hintShift = app.input.octaveShift
  let idle: IdleGate | null = null
  const chords = () => jamChords(key, prog)
  const frame = () => {
    raf = requestAnimationFrame(frame)
    if (app.input.octaveShift !== hintShift) {
      hintShift = app.input.octaveShift
      syncHints()
      idle?.wake()
    }
    // With the band stopped the picture is still: redraw only while something moves.
    if (!playing && idle && !idle.awake(app.input.held)) return
    const now = synth.now()
    session?.update(now, synth.lead)
    const beat = session?.beat ?? 0
    const spans = chords()
    const chord = playing ? spans[chordAt(spans, beat)] : undefined
    highlight.clear()
    if (chord) {
      const tones = chordTones(chord)
      const { lo, hi } = app.keyboard
      for (let p = lo; p <= hi; p++) if (tones.has(p % 12)) highlight.set(p, 'hint')
    }
    held.clear()
    keyHands.clear()
    const scale = scaleOf(key, prog)
    for (const p of app.input.held) {
      held.add(p)
      // Keys that fit glow warm; others in the plain colour.
      if (fits(p, chord, scale)) keyHands.set(p, 'R')
    }
    highway.setHeld(held)
    highway.draw({ beat, chart: jamChart(prog, bpm), highlight, keyHands })
    strip.update(beat, true)
  }

  const offNote = app.input.onNote((pitch, on) => {
    idle?.wake()
    if (!on) return
    const spans = chords()
    const chord = playing && session ? spans[chordAt(spans, session.beat)] : undefined
    presses++
    if (fits(pitch, chord, scaleOf(key, prog))) {
      inKey++
      highway.flash(pitch, 'good', 'R')
    }
    playedEl.textContent = String(presses)
    inKeyEl.textContent = percent(inKey / presses)
  })
  const offStatus = app.input.onStatus(() => syncHints())
  const onKey = (e: KeyboardEvent) => {
    const focused = e.target instanceof HTMLElement && e.target.closest('button, input, select, textarea')
    if (e.code === 'Escape' || (e.code === 'Space' && !focused && !e.repeat)) {
      e.preventDefault()
      setPlaying(!playing)
    }
  }
  const onHide = () => {
    if (document.hidden && playing) setPlaying(false)
  }
  window.addEventListener('keydown', onKey)
  document.addEventListener('visibilitychange', onHide)

  let stage!: HTMLElement
  const el = h(
    'div',
    { class: 'screen lesson' },
    h(
      'header',
      { class: 'topbar' },
      h('button', { class: 'btn ghost', onclick: () => app.goFreePlay() }, icon('back'), t('Songs', 'Lieder')),
      h('span', { class: 'spacer' }),
      pill.el,
    ),
    h(
      'div',
      { class: 'lesson-body' },
      h(
        'div',
        { class: 'play' },
        h('div', { class: 'play-head' }, h('h1', { class: 'play-title' }, t('Jam with the band', 'Mit der Band jammen')), scaleEl),
        (stage = h(
          'div',
          { class: 'stage' },
          canvas,
          strip.el,
          h(
            'div',
            { class: 'panel' },
            h('span', { class: 'panel-title' }, t('Jam', 'Jam')),
            h('div', { class: 'panel-row' }, icon('target'), h('span', null, t('In key', 'Passend')), inKeyEl),
            h('div', { class: 'panel-row' }, icon('music'), h('span', null, t('Notes', 'Noten')), playedEl),
          ),
        )),
        h('div', { class: 'transport' }, playButton, h('span', { class: 'divider' }), keyEl, progEl, tempoEl),
      ),
    ),
  )

  const offPointer = app.input.attachPointer(stage, (x, y) => highway.keyAt(x, y))
  idle = new IdleGate(stage)
  app.input.allowOctaveShift(true)
  syncHints()
  restart()
  setPlaying(true)
  frame()

  return {
    el,
    destroy() {
      cancelAnimationFrame(raf)
      idle?.destroy()
      session?.stop(synth.now())
      offNote()
      offStatus()
      offPointer()
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onHide)
      app.input.allowOctaveShift(false)
      highway.destroy()
      pill.destroy?.()
    },
  }
}
