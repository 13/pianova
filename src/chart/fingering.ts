import type { Chart, ChartNote, Finger, Hand } from '../core/types'

/**
 * Suggests a finger for every note that doesn't have one, so imported music and notes
 * outside the lesson's home position get finger numbers too.
 *
 * The hand is modelled as sitting over five neighbouring white keys, one finger each
 * (a black key borrows the slot of a white neighbour). Each group of notes that starts
 * together must fit under the hand; the cheapest path through those positions, the one
 * that moves the hand least often and least far, gives the fingering. A scale up from C
 * comes out as 1 2 3, thumb under, 1 2 3 4 5. Fingers already written in the chart are
 * kept and steer the hand to match them.
 */
export function withFingering(chart: Chart): Chart {
  if (chart.notes.every((n) => n.finger)) return chart
  const notes = chart.notes.map((n) => ({ ...n }))
  for (const hand of ['L', 'R'] as Hand[]) fingerHand(notes, hand)
  return { ...chart, notes }
}

/** Position of each pitch class among the white keys of its octave (black keys: the white below). */
const WHITE_POS = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]
const BLACK = [false, true, false, true, false, false, true, false, true, false, true, false]

/** How much one move of the hand costs, and how much more for each white key it travels. */
const MOVE = 1
const MOVE_PER_KEY = 0.12
/** A rest this long gives time to reposition, so moving then costs less. */
const REST_BEATS = 2
const THUMB_ON_BLACK = 0.6
const PINKY_ON_BLACK = 0.3
const AWKWARD_CROSS = 1.5

interface Event {
  notes: number[]
  slots: number[]
  start: number
  end: number
}

function fingerHand(notes: ChartNote[], hand: Hand): void {
  const mine = notes.map((_, i) => i).filter((i) => notes[i].hand === hand)
  if (!mine.length || mine.every((i) => notes[i].finger)) return

  // A black key shares a slot with the white neighbour the music uses less: F# in D major
  // takes F's place, Eb in C minor takes E's.
  const count = new Array(12).fill(0)
  for (const i of mine) count[pc(notes[i].pitch)]++
  const slot = (p: number) => {
    const c = pc(p)
    const base = Math.floor(p / 12) * 7 + WHITE_POS[c]
    return BLACK[c] && count[(c + 11) % 12] > count[(c + 1) % 12] ? base + 1 : base
  }

  const events: Event[] = []
  for (const i of [...mine].sort((a, b) => notes[a].startBeat - notes[b].startBeat || notes[a].pitch - notes[b].pitch)) {
    const n = notes[i]
    const last = events[events.length - 1]
    if (last && Math.abs(last.start - n.startBeat) < 1e-6) {
      last.notes.push(i)
      last.slots.push(slot(n.pitch))
      last.end = Math.max(last.end, n.startBeat + n.durationBeats)
    } else {
      events.push({ notes: [i], slots: [slot(n.pitch)], start: n.startBeat, end: n.startBeat + n.durationBeats })
    }
  }

  // Anchor = the slot under finger 1 (right hand) or finger 5 (left hand): the lowest finger.
  const all = events.flatMap((e) => e.slots)
  const lo = Math.min(...all) - 4
  const hi = Math.max(...all)
  const size = hi - lo + 1
  const fingerAt = (s: number, anchor: number): Finger => (hand === 'R' ? s - anchor + 1 : 5 - (s - anchor)) as Finger

  /** Cost of playing the event with the hand at `anchor`, or Infinity if it doesn't fit. */
  const fit = (e: Event, anchor: number): number => {
    if (new Set(e.slots).size !== e.slots.length) return Infinity
    let cost = 0
    for (let k = 0; k < e.notes.length; k++) {
      const off = e.slots[k] - anchor
      if (off < 0 || off > 4) return Infinity
      const f = fingerAt(e.slots[k], anchor)
      const n = notes[e.notes[k]]
      if (n.finger && n.finger !== f) return Infinity
      if (BLACK[pc(n.pitch)]) cost += f === 1 ? THUMB_ON_BLACK : f === 5 ? PINKY_ON_BLACK : 0
    }
    return cost
  }

  // Events too wide for one hand position are stretched; the hand sits at their lowest note.
  const forced = events.map((e) => {
    for (let a = lo; a <= hi; a++) if (fit(e, a) < Infinity) return null
    return Math.min(...e.slots)
  })

  /**
   * Moving the hand in the middle of a run only works by passing the thumb under (going
   * towards the little finger) or a finger over the thumb (going back): 3 then 1 going up
   * a scale, 1 then 3 coming down. Anything else means lifting the hand off the keys.
   */
  const crossing = (k: number, was: number, now: number): number => {
    const p = events[k - 1]
    const e = events[k]
    if (p.notes.length !== 1 || e.notes.length !== 1 || forced[k - 1] !== null || forced[k] !== null) return 0
    const step = e.slots[0] - p.slots[0]
    if (step === 0 || Math.abs(step) > 2) return 0
    const fp = fingerAt(p.slots[0], was)
    const fn = fingerAt(e.slots[0], now)
    const towardPinky = hand === 'R' ? step > 0 : step < 0
    const ok = towardPinky ? fn === 1 && fp >= 2 && fp <= 4 : fp === 1 && fn >= 2 && fn <= 4
    return ok ? 0 : AWKWARD_CROSS
  }

  const cost: number[][] = []
  const from: number[][] = []
  for (let k = 0; k < events.length; k++) {
    const e = events[k]
    const row = new Array(size).fill(Infinity)
    const back = new Array(size).fill(-1)
    for (let a = 0; a < size; a++) {
      const anchor = a + lo
      const own = forced[k] !== null ? (anchor === forced[k] ? 0 : Infinity) : fit(e, anchor)
      if (own === Infinity) continue
      if (k === 0) {
        // Start with the notes under the middle of the hand.
        const mid = e.slots.reduce((s, v) => s + v, 0) / e.slots.length - anchor
        row[a] = own + 0.05 * Math.abs(mid - 2)
        continue
      }
      const rest = e.start - events[k - 1].end >= REST_BEATS ? 0.5 : 1
      const prev = cost[k - 1]
      for (let b = 0; b < size; b++) {
        if (prev[b] === Infinity) continue
        const move = a === b ? 0 : rest * (MOVE + MOVE_PER_KEY * Math.abs(a - b)) + (rest === 1 ? crossing(k, b + lo, anchor) : 0)
        const total = prev[b] + move + own
        if (total < row[a]) {
          row[a] = total
          back[a] = b
        }
      }
    }
    cost.push(row)
    from.push(back)
  }

  let a = cost[events.length - 1].indexOf(Math.min(...cost[events.length - 1]))
  for (let k = events.length - 1; k >= 0; k--) {
    const e = events[k]
    if (forced[k] !== null) stretch(e)
    else for (let j = 0; j < e.notes.length; j++) notes[e.notes[j]].finger ??= fingerAt(e.slots[j], a + lo)
    a = from[k][a]
  }

  /** Spreads a wide chord across the hand: outer notes on 1 and 5, the rest in between. */
  function stretch(e: Event): void {
    const order = e.notes.map((_, j) => j).sort((x, y) => e.slots[x] - e.slots[y] || notes[e.notes[x]].pitch - notes[e.notes[y]].pitch)
    const s0 = e.slots[order[0]]
    const span = Math.max(1, e.slots[order[order.length - 1]] - s0)
    let prev = 0
    order.forEach((j, rank) => {
      const left = order.length - 1 - rank
      let f = Math.round(1 + (4 * (e.slots[j] - s0)) / span)
      f = Math.min(5 - Math.min(left, 4), Math.max(Math.min(prev + 1, 5), f))
      prev = f
      const n = notes[e.notes[j]]
      n.finger ??= (hand === 'R' ? f : 6 - f) as Finger
    })
  }
}

function pc(p: number): number {
  return ((p % 12) + 12) % 12
}
