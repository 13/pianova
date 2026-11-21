import { getLang, t } from '../i18n'
type Child = Node | string | number | null | undefined | false
type Props = Record<string, unknown> | null

/** A screen or component: an element, plus optional cleanup when it is removed. */
export interface View {
  el: HTMLElement
  destroy?(): void
}

/**
 * Tiny element builder. `on*` props become listeners, `class` sets className,
 * and known DOM properties (value, checked, disabled…) are set directly.
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = null,
  ...children: (Child | Child[])[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === undefined || value === null || value === false) continue
    if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value as EventListener)
    else if (key === 'class') el.className = String(value)
    else if (key in el) (el as unknown as Record<string, unknown>)[key] = value
    else el.setAttribute(key, String(value))
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue
    el.append(child instanceof Node ? child : String(child))
  }
  return el
}

/** Inline SVG from trusted, hard-coded markup. */
export function icon(name: keyof typeof ICONS): HTMLElement {
  const span = h('span', { class: 'icon', 'aria-hidden': 'true' })
  span.innerHTML = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`
  return span
}

const ICONS = {
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  pause: '<rect x="6.500" y="5" width="4" height="14" rx="1.200" fill="currentColor" stroke="none"/><rect x="13.500" y="5" width="4" height="14" rx="1.200" fill="currentColor" stroke="none"/>',
  play: '<path d="M7 5l12 7-12 7z" fill="currentColor"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  nova: '<path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="currentColor" stroke="none"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  restart: '<path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v5h5"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.200 2-4.200.300 1.700 1 2.500 2 3 .200-3-.500-6 1-8.800z"/>',
  loop: '<path d="M17 3l3 3-3 3"/><path d="M4 11V9a3 3 0 0 1 3-3h13"/><path d="M7 21l-3-3 3-3"/><path d="M20 13v2a3 3 0 0 1-3 3H4"/>',
  pedal: '<path d="M4 15h16l-2-6H6z"/><path d="M3 15v3h18v-3"/>',
  checkCircle: '<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="M8 12.500l2.800 2.800L16 9.500" stroke="#06140d"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cross: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
  hourglass: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>',
}

/** Three stars, the first `count` lit. */
export function stars(count: number, cls = ''): HTMLElement {
  return h(
    'span',
    { class: `stars ${cls}`, 'aria-label': t(`${count} of 3 stars`, `${count} von 3 Sternen`) },
    [0, 1, 2].map((i) => h('span', { class: i < count ? 'star lit' : 'star' }, '★')),
  )
}

/** Whole percent, rounded down so 69.9% never reads as a passing 70%. */
export const percent = (fraction: number): string => {
  const n = Math.floor(fraction * 100 + 1e-6)
  return getLang() === 'de' ? `${n} %` : `${n}%`
}
