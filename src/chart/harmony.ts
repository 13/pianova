import { noteIndex, noteSpan } from './window'
import type { Chart, ChordSpan, Hand } from '../core/types'
import { noteLetter } from '../i18n'

export type { ChordSpan }

const EPS = 1e-6

/**
 * Guesses the chord under each half bar (each bar in 3/4) from the notes sounding there.
 * Every major and minor triad is scored by how much of the music its notes cover, with
 * the bass counting extra and a bonus when the lowest note is the root. Empty stretches
 * keep the chord before them; repeats are merged.
 */
export function harmonize(chart: Chart): ChordSpan[] {
  const bpb = chart.beatsPerBar
  const step = bpb % 2 === 0 ? bpb / 2 : bpb
  const end = Math.max(chart.lengthBeats, step)
  const spans: ChordSpan[] = []
  const { order } = noteIndex(chart)
  const span = { lo: 0, hi: 0 }
  let prev: { root: number; minor: boolean } | null = null
  for (let start = 0; start < end - EPS; start += step) {
    const stop = start + step
    const weight = new Array<number>(12).fill(0)
    let lowest = Infinity
    // Only notes near this stretch can overlap it.
    const { lo, hi } = noteSpan(chart, start, stop, span)
    for (let k = lo; k < hi; k++) {
      const n = chart.notes[order[k]]
      const overlap = Math.min(stop, n.startBeat + n.durationBeats) - Math.max(start, n.startBeat)
      if (overlap <= EPS) continue
      // Notes struck in this stretch matter more than ones ringing on into it.
      const struck = n.startBeat >= start - EPS ? 1 : 0.5
      weight[n.pitch % 12] += overlap * struck * (n.hand === 'L' ? 1.5 : 1)
      lowest = Math.min(lowest, n.pitch)
    }
    const total = weight.reduce((a, b) => a + b, 0)
    let best: { root: number; minor: boolean } | null = prev
    if (total > EPS) {
      let bestScore = -Infinity
      for (let root = 0; root < 12; root++) {
        for (const minor of [false, true]) {
          const third = (root + (minor ? 3 : 4)) % 12
          const fifth = (root + 7) % 12
          const covered = weight[root] + weight[third] * 0.9 + weight[fifth] * 0.8
          let score = covered - (total - weight[root] - weight[third] - weight[fifth]) * 0.6
          if (lowest % 12 === root) score += total * 0.25
          // Ties go to major chords, and to staying on the chord before.
          if (minor) score -= total * 0.02
          if (prev && prev.root === root && prev.minor === minor) score += total * 0.05
          if (score > bestScore + EPS) {
            bestScore = score
            best = { root, minor }
          }
        }
      }
    }
    if (!best) continue
    const last = spans[spans.length - 1]
    if (last && last.root === best.root && last.minor === best.minor && Math.abs(last.startBeat + last.durationBeats - start) < EPS) {
      last.durationBeats += Math.min(step, end - start)
    } else {
      spans.push({ startBeat: start, durationBeats: Math.min(step, end - start), ...best })
    }
    prev = best
  }
  return spans
}

const LETTERS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

/** 'C', 'Am', 'F#'… */
export function chordLabel(c: { root: number; minor: boolean }): string {
  return LETTERS[c.root] + (c.minor ? 'm' : '')
}

/**
 * The chords of the whole song: worked out from your notes and from everything that plays
 * along (the notes a level leaves out, an imported file's other instruments), so a
 * simplified part still shows, and the band still plays, the song's real harmony.
 * Drums are left out; a bass line counts as the left hand, where it weighs most.
 */
export function songHarmony(chart: Chart): ChordSpan[] {
  if (chart.chords) return chart.chords
  const extra = (chart.backing ?? [])
    .filter((n) => n.voice !== 'drums')
    .map((n) => ({ pitch: n.pitch, startBeat: n.startBeat, durationBeats: n.durationBeats, hand: (n.voice === 'bass' || n.pitch < 60 ? 'L' : 'R') as Hand }))
  if (!extra.length) return harmonize(chart)
  return harmonize({ ...chart, notes: [...chart.notes, ...extra].sort((a, b) => a.startBeat - b.startBeat || a.pitch - b.pitch) })
}

/** Where each chord of the song starts and its name in the current language ('B' / 'H'). */
export function chordMarks(chart: Chart): { name: string; startBeat: number }[] {
  return songHarmony(chart).map((s) => ({ name: noteLetter(s.root) + (s.minor ? 'm' : ''), startBeat: s.startBeat }))
}

/** Index of the chord sounding at `beat` (the last to start by then), or -1 before the first. */
export function chordAt(chords: { startBeat: number }[], beat: number): number {
  let lo = 0
  let hi = chords.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (chords[mid].startBeat <= beat + 1e-6) lo = mid + 1
    else hi = mid
  }
  return lo - 1
}

/**
 * Plain chords for practice music: one per bar, chosen from the key's three main chords
 * (I, IV, V, its seventh counting half) by how many of the bar's notes they hold, with a bonus when the bar starts on
 * the chord's root. Ties go to I, then V, then IV, and to staying put; the last bar comes
 * home to I. Simpler than `harmonize`, and always in the key, which suits scales and
 * exercises better than a guess at every half bar.
 */
export function primaryHarmony(chart: Chart, tonic: number): ChordSpan[] {
  const bpb = chart.beatsPerBar
  const bars = Math.max(1, Math.ceil(chart.lengthBeats / bpb - EPS))
  // I, V(7), IV: [root offset, chord tones as offsets from the tonic, weight of each].
  const options: [number, Record<number, number>][] = [
    [0, { 0: 1, 4: 1, 7: 1 }],
    [7, { 7: 1, 11: 1, 2: 1, 5: 0.5 }],
    [5, { 5: 1, 9: 1, 0: 1 }],
  ]
  const spans: ChordSpan[] = []
  let prev = 0
  for (let bar = 0; bar < bars; bar++) {
    const start = bar * bpb
    const stop = start + bpb
    const inBar = chart.notes.filter((n) => n.startBeat >= start - EPS && n.startBeat < stop - EPS)
    const first = inBar.length ? Math.min(...inBar.map((n) => n.startBeat)) : -1
    let best = prev
    if (bar === bars - 1) best = 0
    else if (inBar.length) {
      let bestScore = -Infinity
      for (const [root, tones] of options) {
        let score = root === prev ? 0.1 : 0
        for (const n of inBar) {
          const pc = (((n.pitch - tonic) % 12) + 12) % 12
          score += (tones[pc] ?? 0) * Math.min(n.durationBeats, stop - n.startBeat)
          if (n.startBeat === first && pc === root) score += 0.5
        }
        if (score > bestScore + EPS) {
          bestScore = score
          best = root
        }
      }
    }
    const root = (tonic + best) % 12
    const last = spans[spans.length - 1]
    if (last && last.root === root) last.durationBeats += bpb
    else spans.push({ startBeat: start, durationBeats: bpb, root, minor: false })
    prev = best
  }
  return spans
}
