import type { Chart, ChartNote } from '../core/types'

/**
 * A chart's notes in start order, so code that runs every frame can visit only the
 * notes near the playhead instead of the whole song.
 */
export interface NoteIndex {
  /** Note indexes (into `chart.notes`), sorted by start beat. */
  order: Int32Array
  /** `starts[k]` is the start beat of note `order[k]`. */
  starts: Float64Array
  /** The longest note, so a window can reach back to notes still sounding. */
  maxDuration: number
}

/** A range `[lo, hi)` of positions in `NoteIndex.order`. */
export interface Span {
  lo: number
  hi: number
}

const cache = new WeakMap<ChartNote[], NoteIndex>()

/** The (cached) start-order index of a chart's notes. Charts are treated as immutable. */
export function noteIndex(chart: Chart): NoteIndex {
  const notes = chart.notes
  const hit = cache.get(notes)
  if (hit && hit.order.length === notes.length) return hit
  const order = Int32Array.from(notes.keys())
  let sorted = true
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].startBeat < notes[i - 1].startBeat) {
      sorted = false
      break
    }
  }
  if (!sorted) order.sort((a, b) => notes[a].startBeat - notes[b].startBeat || a - b)
  const starts = Float64Array.from(order, (i) => notes[i].startBeat)
  let maxDuration = 0
  for (const n of notes) if (n.durationBeats > maxDuration) maxDuration = n.durationBeats
  const index = { order, starts, maxDuration }
  cache.set(notes, index)
  return index
}

/** First position whose start is >= `beat`. */
function lowerBound(starts: Float64Array, beat: number): number {
  let lo = 0
  let hi = starts.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (starts[mid] < beat) lo = mid + 1
    else hi = mid
  }
  return lo
}

/**
 * Positions (in `noteIndex(chart).order`) of every note that may overlap
 * `[fromBeat, toBeat]`: those starting by `toBeat`, reaching back far enough for the
 * longest note. Callers still test each note; the span only rules the rest out.
 * Fills and returns `out`, so a frame loop need not allocate.
 */
export function noteSpan(chart: Chart, fromBeat: number, toBeat: number, out: Span = { lo: 0, hi: 0 }): Span {
  const { starts, maxDuration } = noteIndex(chart)
  out.lo = lowerBound(starts, fromBeat - maxDuration - 1e-6)
  // Upper bound: first start strictly after toBeat.
  let lo = out.lo
  let hi = starts.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (starts[mid] <= toBeat) lo = mid + 1
    else hi = mid
  }
  out.hi = Math.max(out.lo, lo)
  return out
}
