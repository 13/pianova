import type { Summary } from '../judge/judge'
import { h, percent, stars } from './dom'
import { noteName, t } from '../i18n'

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
  const headline = !passed
    ? t('Not quite yet', 'Noch nicht ganz')
    : o.stars === 3
      ? t('Outstanding', 'Hervorragend')
      : o.stars === 2
        ? t('Great playing', 'Toll gespielt')
        : o.stars === 0 && s.accuracy < 0.6
          ? t('Keep at it', 'Dranbleiben')
          : t('Well done', 'Gut gemacht')

  const missed = Object.entries(s.missedPitches)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pitch]) => noteName(Number(pitch)))

  const tips: string[] = []
  if (!passed && o.pass !== undefined) tips.push(t(`You need ${percent(o.pass)} to pass. Have another go, it gets easier every time.`, `Zum Bestehen brauchst du ${percent(o.pass)}. Versuch es nochmal, es wird jedes Mal leichter.`))
  if (o.timed && s.perfect + s.good >= 4) {
    const ms = Math.round(Math.abs(s.meanOffsetMs))
    if (ms < 20) tips.push(t('Your timing sat right on the beat.', 'Dein Timing lag genau auf dem Schlag.'))
    else if (s.meanOffsetMs > 0) tips.push(t(`You tend to play a little late (about ${ms} ms). Try to press just as the note touches the line.`, `Du spielst meist etwas zu spät (etwa ${ms} ms). Drück genau dann, wenn die Note die Linie berührt.`))
    else tips.push(t(`You tend to play a little early (about ${ms} ms). Let the note reach the line before you press.`, `Du spielst meist etwas zu früh (etwa ${ms} ms). Lass die Note erst die Linie erreichen.`))
  }
  if (s.short > 0)
    tips.push(
      t(
        `You let go of ${s.short === 1 ? 'one long note' : `${s.short} long notes`} too soon. Keep the key down until the tail of the note has gone.`,
        `Du hast ${s.short === 1 ? 'eine lange Note' : `${s.short} lange Noten`} zu früh losgelassen. Halte die Taste, bis das Ende der Note verschwunden ist.`,
      ),
    )
  if (missed.length) tips.push(`${t('Notes to watch', 'Achte auf diese Töne')}: ${missed.join(', ')}.`)
  if (s.wrong > 0 && !missed.length) tips.push(t('The only slips were extra key presses. Keep your fingers resting lightly on their keys.', 'Die einzigen Patzer waren zusätzliche Tastendrücke. Lass die Finger leicht auf ihren Tasten ruhen.'))

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
      o.timed ? [stat(t('Perfect', 'Perfekt'), s.perfect, 'perfect'), stat(t('Good', 'Gut'), s.good, 'good'), stat(t('Missed', 'Verpasst'), s.miss)] : [stat(t('Right notes', 'Richtige Töne'), s.perfect, 'good')],
      stat(t('Wrong keys', 'Falsche Tasten'), s.wrong, s.wrong ? 'wrong' : ''),
      stat(t('Best streak', 'Beste Serie'), s.bestStreak),
    ),
    tips.length > 0 && h('ul', { class: 'tips' }, tips.map((tip) => h('li', null, tip))),
    h(
      'div',
      { class: 'row' },
      o.actions.map((a) => h('button', { class: a.primary ? 'btn primary' : 'btn', onclick: a.onclick }, a.label)),
    ),
  )
}
