import { chordAt } from '../chart/harmony'
import { h } from './dom'

/** How far apart chords sit on the strip. */
const PX_PER_BEAT = 30

/**
 * A line of chords sliding past a "now" mark, like a lead sheet scrolling by. The chord
 * sounding stands by the mark; those still to come slide towards it.
 */
export class ChordStrip {
  private track = h('div', { class: 'chord-track' })
  private cur = h('strong', { class: 'chord-cur' })
  readonly el = h('div', { class: 'chord-strip', hidden: true, 'aria-hidden': 'true' }, this.cur, this.track, h('i', { class: 'chord-now' }))
  private chords: { name: string; startBeat: number }[] = []
  private shown = -2

  set(chords: { name: string; startBeat: number }[] | undefined): void {
    this.chords = chords ?? []
    this.shown = -2
    this.track.replaceChildren(...this.chords.map((c) => h('span', { class: 'chord-name', style: `left: ${c.startBeat * PX_PER_BEAT}px` }, c.name)))
  }

  /** Call every frame; `visible` false hides it. */
  update(beat: number, visible: boolean): void {
    this.el.hidden = !visible || !this.chords.length
    if (this.el.hidden) return
    this.track.style.transform = `translateX(${(-Math.max(-4, beat) * PX_PER_BEAT).toFixed(1)}px)`
    const cur = chordAt(this.chords, beat)
    if (cur === this.shown) return
    const items = this.track.children
    for (let i = 0; i < items.length; i++) {
      items[i].classList.toggle('past', i <= cur)
      items[i].classList.toggle('next', i === cur + 1)
    }
    this.cur.textContent = this.chords[cur]?.name ?? ''
    this.shown = cur
  }
}
