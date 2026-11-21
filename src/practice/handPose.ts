import { noteIndex, noteSpan } from '../chart/window'
import { isBlack } from '../core/pitch'
import type { Chart, Hand } from '../core/types'
import type { Grade } from '../judge/judge'

/** How a finger is shown: resting, about to play, due now, or holding a note down. */
export type FingerState = '' | 'next' | 'now' | 'hold'

export interface HandPose {
  /** The key under each finger, thumb first (index 0 is finger 1). */
  pitches: number[]
  /**
   * Why each finger is where it is: it plays or holds a note now ('play'), it rests on the
   * key it plays next ('ahead'), or it is guessed from its neighbours ('guess').
   */
  source: ('play' | 'ahead' | 'guess')[]
  /** Which fingers rest where they are because the music puts them there (not guessed). */
  placed: boolean[]
  states: FingerState[]
}

/** A finger lights up for a note this close (in beats)... */
export const NEXT_BEATS = 1.6
/** ...and is due once the note is this close. */
export const NOW_BEATS = 0.25
/** The hand moves into place for notes up to this far ahead. */
export const LOOK_BEATS = 4
const EPS = 1e-6

/** The pitch classes a chart uses, when it uses enough of them to suggest a scale. */
const scales = new WeakMap<Chart, Set<number> | null>()
function scaleOf(chart: Chart): Set<number> | null {
  if (!scales.has(chart)) {
    const pcs = new Set(chart.notes.map((n) => n.pitch % 12))
    scales.set(chart, pcs.size >= 5 ? pcs : null)
  }
  return scales.get(chart)!
}

/** The next key a finger over: the next note of the music's scale, else the next white key. */
function step(pitch: number, dir: 1 | -1, lo: number, hi: number, scale: Set<number> | null): number {
  let p = pitch + dir
  const fits = (q: number) => (scale ? scale.has(q % 12) : !isBlack(q))
  for (let tries = 0; !fits(p) && tries < 3 && p > lo && p < hi; tries++) p += dir
  if (!fits(p)) {
    // No scale note within reach: fall back to the nearest white key.
    p = pitch + dir
    while (isBlack(p) && p > lo && p < hi) p += dir
  }
  return Math.max(lo, Math.min(hi, p))
}

/**
 * Where one hand should be: the fingers for the next note (or chord) on their keys, any
 * notes still held under theirs, and the other fingers on the white keys beside them, as in
 * a five-finger position. The right hand's thumb is its lowest finger, the left hand's its
 * highest. Null when the hand has nothing to play soon.
 */
export function handPose(
  chart: Chart,
  hand: Hand,
  beat: number,
  noteState?: ('pending' | Grade)[],
  active?: boolean[],
  keys: { lo: number; hi: number } = { lo: 21, hi: 108 },
): HandPose | null {
  const notes = chart.notes
  const { order } = noteIndex(chart)
  const { lo, hi } = noteSpan(chart, beat - 0.3, beat + LOOK_BEATS, SPAN)
  const mine = (i: number) => notes[i].hand === hand && !!notes[i].finger && (active?.[i] ?? true)
  const pending = (i: number) => (noteState?.[i] ?? 'pending') === 'pending'

  // The next note (or chord) still to play.
  let next = Infinity
  for (let k = lo; k < hi; k++) {
    const i = order[k]
    if (mine(i) && pending(i) && notes[i].startBeat - beat > -0.3) next = Math.min(next, notes[i].startBeat)
  }

  const pitches: (number | null)[] = [null, null, null, null, null]
  const states: FingerState[] = ['', '', '', '', '']
  let any = false
  for (let k = lo; k < hi; k++) {
    const i = order[k]
    if (!mine(i)) continue
    const n = notes[i]
    const f = n.finger! - 1
    const sounding = n.startBeat <= beat && beat < n.startBeat + n.durationBeats && !pending(i)
    if (sounding && states[f] === '') {
      pitches[f] = n.pitch
      states[f] = 'hold'
      any = true
    }
    if (pending(i) && Math.abs(n.startBeat - next) < EPS) {
      const ahead = n.startBeat - beat
      pitches[f] = n.pitch
      states[f] = ahead < NOW_BEATS ? 'now' : ahead < NEXT_BEATS ? 'next' : ''
      any = true
    }
  }
  if (!any) return null

  const source: HandPose['source'] = pitches.map((p) => (p !== null ? 'play' : 'guess'))
  // A free finger rests on the key it plays next, if it plays soon and that keeps the
  // fingers in order (the right hand's go up the keyboard, the left hand's down).
  const inOrder = (f: number, p: number) => {
    for (let g = 0; g < 5; g++) {
      if (g === f || pitches[g] === null) continue
      const higher = (g > f) === (hand === 'R')
      if (higher ? pitches[g]! <= p : pitches[g]! >= p) return false
    }
    return true
  }
  for (let k = lo; k < hi; k++) {
    const i = order[k]
    if (!mine(i) || !pending(i) || notes[i].startBeat <= next + EPS) continue
    const f = notes[i].finger! - 1
    if (pitches[f] === null && inOrder(f, notes[i].pitch)) {
      pitches[f] = notes[i].pitch
      source[f] = 'ahead'
    }
  }
  const placed = pitches.map((p) => p !== null)
  // Fill the free fingers from the nearest placed one, a scale step per finger. Going up
  // the fingers goes up the keyboard for the right hand and down it for the left.
  const scale = scaleOf(chart)
  for (let f = 0; f < 5; f++) {
    if (pitches[f] !== null) continue
    let from = -1
    for (let d = 1; d < 5 && from < 0; d++) {
      if (f - d >= 0 && placed[f - d]) from = f - d
      else if (f + d < 5 && placed[f + d]) from = f + d
    }
    let p = pitches[from]!
    const up = (f > from) === (hand === 'R')
    for (let s = 0; s < Math.abs(f - from); s++) p = step(p, up ? 1 : -1, keys.lo, keys.hi, scale)
    pitches[f] = p
  }
  return { pitches: pitches as number[], source, placed, states }
}

const SPAN = { lo: 0, hi: 0 }
