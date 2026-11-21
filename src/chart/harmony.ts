import type { Chart } from '../core/types'

/** A chord the music implies over a stretch of beats. */
export interface ChordSpan {
  startBeat: number
  durationBeats: number
  /** Pitch class of the root, 0 = C. */
  root: number
  minor: boolean
}

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
  let prev: { root: number; minor: boolean } | null = null
  for (let start = 0; start < end - EPS; start += step) {
    const stop = start + step
    const weight = new Array<number>(12).fill(0)
    let lowest = Infinity
    for (const n of chart.notes) {
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
