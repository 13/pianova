import { isBlack } from '../core/pitch'
import type { InputHub, NoteSource } from '../input/hub'
import type { KeyboardModel } from '../input/instruments'
import { noteName, t } from '../i18n'
import { h } from './dom'

/** After playing, piano keys wait this long before they steer menus, so a last held note never clicks a button. */
const GRACE_MS = 1200

const FOCUSABLE = 'button, a[href], select, input, [tabindex]:not([tabindex="-1"])'

/** The four piano keys that steer menus: the lowest white keys of the player's instrument. */
export interface PianoKeys {
  back: number
  prev: number
  choose: number
  next: number
}

export function pianoKeys(keyboard: KeyboardModel): PianoKeys {
  const whites: number[] = []
  for (let p = keyboard.lo; whites.length < 4 && p <= keyboard.hi; p++) if (!isBlack(p)) whites.push(p)
  const [back, prev, choose, next] = whites
  return { back, prev, choose, next }
}

/**
 * Moving around without a mouse.
 *
 * Computer keys: arrows move focus to the nearest control in that direction, Enter or Space
 * presses it, Esc goes back. Piano: the four lowest white keys are back, previous, choose
 * and next, so a MIDI keyboard on a stand can run the whole app.
 *
 * Both stay out of the way while music is playing: there the keys are notes.
 */
export class Navigator {
  private legend = h('div', { class: 'nav-legend', hidden: true, 'aria-hidden': 'true' })
  private lastCapture = 0
  private cleanups: (() => void)[] = []

  constructor(
    private root: HTMLElement,
    private input: InputHub,
    private keyboard: () => KeyboardModel,
  ) {
    document.body.append(this.legend)
    // Lessons swap their own content (play, results, cards), so watch the screen for changes.
    let queued = false
    const observer = new MutationObserver(() => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        this.refresh()
      })
    })
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] })
    this.cleanups.push(() => observer.disconnect())
    const onKey = (e: KeyboardEvent) => this.onKey(e)
    const onPointer = () => document.documentElement.classList.remove('kbd-nav')
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer, true)
    this.cleanups.push(
      () => window.removeEventListener('keydown', onKey),
      () => window.removeEventListener('pointerdown', onPointer, true),
      input.onNote((pitch, on, _time, _velocity, source) => this.onNote(pitch, on, source)),
      input.onStatus(() => this.refresh()),
    )
  }

  destroy(): void {
    for (const off of this.cleanups) off()
    this.legend.remove()
  }

  /** Call after the screen changes: focuses its main button and updates the piano legend. */
  refresh(): void {
    const midi = this.input.status.inputs.length > 0
    const captured = this.captured()
    this.legend.hidden = !midi || captured
    if (midi) {
      const k = pianoKeys(this.keyboard())
      this.legend.replaceChildren(
        h('span', { class: 'nav-legend-title' }, t('Piano', 'Klavier')),
        ...(
          [
            [k.back, t('back', 'zurück')],
            [k.prev, '◀'],
            [k.choose, t('choose', 'wählen')],
            [k.next, '▶'],
          ] as [number, string][]
        ).map(([pitch, label]) => h('span', { class: 'nav-key' }, h('kbd', null, noteName(pitch)), label)),
      )
    }
    const active = document.activeElement
    // A button on a card that has just closed would keep Space from pausing the music.
    if (active instanceof HTMLElement && active !== document.body && (active.closest('[hidden]') || !this.root.contains(active))) active.blur()
    // Only a screen's main action is focused for you; never fall back to, say, the back button.
    if (!captured && !this.root.contains(document.activeElement)) this.primary(true)?.focus({ preventScroll: true })
  }

  /** Music is playing (or keys are being measured): keys are notes, not commands. */
  private captured(): boolean {
    // Measuring the keyboard: its lowest key is the answer, not "back".
    if (this.root.querySelector('.measure.listening')) return true
    const play = this.root.querySelector('.play')
    if (!play) return false
    // A paused game shows a card with buttons; arrows may move between them.
    return !this.layer()?.closest('.overlay')
  }

  /** The area controls are chosen from: an open card over the screen, or the whole screen. */
  private layer(): HTMLElement | null {
    const overlays = [...this.root.querySelectorAll<HTMLElement>('.overlay')].filter((o) => !o.hidden && o.offsetParent !== null)
    return overlays.at(-1) ?? this.root
  }

  private controls(): HTMLElement[] {
    const layer = this.layer()
    if (!layer) return []
    return [...layer.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => {
      if ((el as HTMLButtonElement).disabled || el.hidden || el.closest('[hidden]')) return false
      if (el instanceof HTMLInputElement && el.type === 'file') return false
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    })
  }

  private primary(strict = false): HTMLElement | undefined {
    const all = this.controls()
    const main = all.find((el) => el.matches('.btn.primary'))
    if (main || strict) return main
    return all.find((el) => !el.closest('.topbar')) ?? all[0]
  }

  private focus(el: HTMLElement | undefined): void {
    if (!el) return
    document.documentElement.classList.add('kbd-nav')
    el.focus({ preventScroll: true })
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  /** The back button at the top left of the screen, if there is one. */
  private back(): void {
    const overlay = this.layer()?.closest('.overlay')
    if (overlay) return
    this.root.querySelector<HTMLElement>('.topbar > button.btn.ghost:first-child')?.click()
  }

  private onKey(e: KeyboardEvent): void {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
    if (e.key === 'Tab') document.documentElement.classList.add('kbd-nav')
    const dir = ({ ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' } as const)[e.key as string]
    if (!dir && e.key !== 'Escape') return
    // While music plays the play screen owns Esc and Space; arrows have no job there.
    if (this.captured()) return
    if (e.key === 'Escape') {
      if (this.root.querySelector('.play')) return // the play screen's own pause card
      e.preventDefault()
      this.back()
      return
    }
    const active = document.activeElement
    // Sliders, number fields and lists use the arrows themselves.
    if (!dir || active instanceof HTMLSelectElement || (active instanceof HTMLInputElement && active.type !== 'checkbox')) return
    e.preventDefault()
    const all = this.controls()
    const from = active instanceof HTMLElement && all.includes(active) ? active : null
    this.focus(from ? nearest(from, all, dir) ?? from : this.primary())
  }

  private onNote(pitch: number, on: boolean, source: NoteSource): void {
    if (source !== 'midi') return
    const now = performance.now()
    if (this.captured()) {
      this.lastCapture = now
      return
    }
    if (!on || now - this.lastCapture < GRACE_MS) return
    const k = pianoKeys(this.keyboard())
    if (pitch === k.back) {
      this.back()
      return
    }
    if (pitch !== k.prev && pitch !== k.next && pitch !== k.choose) return
    const all = this.controls()
    const active = document.activeElement
    const at = active instanceof HTMLElement ? all.indexOf(active) : -1
    // The first press only shows where you are.
    if (at < 0) return this.focus(this.primary())
    if (pitch === k.choose) {
      document.documentElement.classList.add('kbd-nav')
      if (active instanceof HTMLInputElement && active.type === 'checkbox') active.click()
      else if (active instanceof HTMLSelectElement) {
        active.selectedIndex = (active.selectedIndex + 1) % active.options.length
        active.dispatchEvent(new Event('change', { bubbles: true }))
      } else (active as HTMLElement).click()
      return
    }
    const step = pitch === k.next ? 1 : -1
    this.focus(all[(at + step + all.length) % all.length])
  }
}

/** The control closest to `from` in a direction, preferring ones straight ahead. */
export function nearest(from: HTMLElement, all: HTMLElement[], dir: 'up' | 'down' | 'left' | 'right'): HTMLElement | undefined {
  const a = from.getBoundingClientRect()
  const ax = a.left + a.width / 2
  const ay = a.top + a.height / 2
  let best: HTMLElement | undefined
  let bestScore = Infinity
  for (const el of all) {
    if (el === from) continue
    const b = el.getBoundingClientRect()
    const bx = b.left + b.width / 2
    const by = b.top + b.height / 2
    const along = dir === 'right' ? b.left - a.right : dir === 'left' ? a.left - b.right : dir === 'down' ? b.top - a.bottom : a.top - b.bottom
    // Must lie in that direction (allowing a little overlap).
    if (along < -4) continue
    const across = dir === 'left' || dir === 'right' ? Math.abs(by - ay) : Math.abs(bx - ax)
    // Overlapping rows or columns count as straight ahead.
    const overlap =
      dir === 'left' || dir === 'right' ? Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) : Math.min(a.right, b.right) - Math.max(a.left, b.left)
    const score = Math.max(0, along) + (overlap > 0 ? 0 : across * 2) + across * 0.1
    if (score < bestScore) {
      bestScore = score
      best = el
    }
  }
  return best
}
