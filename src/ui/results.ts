import { midiToName } from '../core/pitch'
import type { Summary } from '../judge/judge'
import { h, percent, stars } from './dom'

export interface ResultsOptions {
  title: string
  summary: Summary
  stars: number
  /** Whether timing was judged (false for right-notes-only runs). */
  timed: boolean
  /** Pass mark, when passing matters (lessons). */
  pass?: number
  /** A line under the score, e.g. why this run was not saved. */
  note?: string
  actions: { label: string; primary?: boolean; onclick: () => void }[]
}

/** The end-of-run card: score, stars, and what to work on. */
export function resultsCard(o: ResultsOptions): HTMLElement {
  const s = o.summary
  const passed = o.pass === undefined || s.accuracy >= o.pass
  const headline = !passed ? 'Not quite yet' : o.stars === 3 ? 'Outstanding' : o.stars === 2 ? 'Great playing' : 'Well done'

  const missed = Object.entries(s.missedPitches)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pitch]) => midiToName(Number(pitch)))

  const tips: string[] = []
  if (!passed && o.pass !== undefined) tips.push(`You need ${percent(o.pass)} to pass. Have another go, it gets easier every time.`)
  if (o.timed && s.perfect + s.good >= 4) {
    const ms = Math.round(Math.abs(s.meanOffsetMs))
    if (ms < 20) tips.push('Your timing sat right on the beat.')
    else if (s.meanOffsetMs > 0) tips.push(`You tend to play a little late (about ${ms} ms). Try to press just as the note touches the line.`)
    else tips.push(`You tend to play a little early (about ${ms} ms). Let the note reach the line before you press.`)
  }
  if (s.short > 0)
    tips.push(`You let go of ${s.short === 1 ? 'one long note' : `${s.short} long notes`} too soon. Keep the key down until the tail of the note has gone.`)
  if (missed.length) tips.push(`Notes to watch: ${missed.join(', ')}.`)
  if (s.wrong > 0 && !missed.length) tips.push('The only slips were extra key presses. Keep your fingers resting lightly on their keys.')

  const stat = (label: string, value: string | number, cls = '') =>
    h('div', { class: `stat ${cls}` }, h('span', { class: 'stat-value' }, String(value)), h('span', { class: 'eyebrow' }, label))

  return h(
    'div',
    { class: 'card results' },
    h('span', { class: 'eyebrow' }, o.title),
    h('h2', null, headline),
    stars(o.stars, 'huge'),
    h('div', { class: 'score' }, percent(s.accuracy)),
    o.note && h('p', { class: 'muted' }, o.note),
    h(
      'div',
      { class: 'stats' },
      o.timed ? [stat('Perfect', s.perfect, 'perfect'), stat('Good', s.good, 'good'), stat('Missed', s.miss)] : [stat('Right notes', s.perfect, 'good')],
      stat('Wrong keys', s.wrong, s.wrong ? 'wrong' : ''),
      stat('Best streak', s.bestStreak),
    ),
    tips.length > 0 && h('ul', { class: 'tips' }, tips.map((t) => h('li', null, t))),
    h(
      'div',
      { class: 'row' },
      o.actions.map((a) => h('button', { class: a.primary ? 'btn primary' : 'btn', onclick: a.onclick }, a.label)),
    ),
  )
}
