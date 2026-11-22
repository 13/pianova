import type { Hand } from '../core/types'

/**
 * Which hand plays each note of a one-track piano part, the way a player would share it
 * out rather than by a fixed split at middle C. A left hand that plays a bass note and then
 * a chord up to F4 keeps the chord, and a melody that dips below middle C stays in the right
 * hand.
 *
 * Works through the notes one chord (notes struck together) at a time and keeps the best few
 * ways of sharing out so far. A way costs more when:
 * - a hand plays beyond its reach: the left hand reaches about an octave up from where its
 *   bass has been, the right hand about a fifth down from where its top has been,
 * - a hand stretches over more than about an octave,
 * - a hand plays more notes at once than it has been playing (the melody hand plays
 *   single notes, the accompanying hand plays chords),
 * - a hand plays far into the other's half of the keyboard,
 * - the hands crowd within a few keys of each other in one chord.
 *
 * Then a chord that comes back is shared out the way it was where that was clearest.
 *
 * `start` is in beats. Returns one hand per note, in the order given.
 */
export function splitHands(notes: readonly { pitch: number; start: number }[]): Hand[] {
  const order = notes.map((_, i) => i).sort((a, b) => notes[a].start - notes[b].start || notes[a].pitch - notes[b].pitch)
  // Chords: notes struck within a 32nd of a beat of the first.
  const chords: number[][] = []
  for (const i of order) {
    const last = chords[chords.length - 1]
    if (last && notes[i].start - notes[last[0]].start < CHORD_BEATS) last.push(i)
    else chords.push([i])
  }
  for (const chord of chords) chord.sort((a, b) => notes[a].pitch - notes[b].pitch)

  interface Way extends Hands {
    cost: number
    /** The number of the chord's notes, lowest first, the left hand took; and the way before. */
    left: number
    prev: Way | null
  }
  let ways: Way[] = [{ cost: 0, pos: { L: 48, R: 76 }, size: { L: 1, R: 1 }, left: 0, prev: null }]
  const pitchesOf = (chord: number[]) => chord.map((i) => notes[i].pitch)
  for (const chord of chords) {
    const pitches = pitchesOf(chord)
    const next: Way[] = []
    for (const way of ways)
      for (let k = 0; k <= pitches.length; k++) {
        const step = share(way, pitches, k)
        next.push({ ...step.hands, cost: way.cost + step.cost, left: k, prev: way })
      }
    next.sort((a, b) => a.cost - b.cost)
    ways = next.slice(0, BEAM)
  }

  // The best way, chord by chord, with the hands as they were before each.
  const left: number[] = new Array(chords.length)
  const before: Hands[] = new Array(chords.length)
  let way: Way | null = ways[0]
  for (let c = chords.length - 1; c >= 0 && way; c--, way = way.prev) {
    left[c] = way.left
    before[c] = way.prev!
  }

  // Music repeats. A chord shared out one way where that is clear (the tune busy above it, say)
  // is shared out the same way where it is a close call (the tune resting).
  const sure = new Map<string, { margin: number; left: number }>()
  const margins = chords.map((chord, c) => {
    const pitches = pitchesOf(chord)
    const mine = share(before[c], pitches, left[c]).cost
    let margin = Infinity
    for (let k = 0; k <= pitches.length; k++) if (k !== left[c]) margin = Math.min(margin, share(before[c], pitches, k).cost - mine)
    const key = pitches.join(',')
    if (pitches.length > 0 && margin > (sure.get(key)?.margin ?? -Infinity)) sure.set(key, { margin, left: left[c] })
    return margin
  })
  chords.forEach((chord, c) => {
    const best = sure.get(pitchesOf(chord).join(','))
    if (best && best.margin >= SURE && margins[c] < SURE) left[c] = best.left
  })

  const hands: Hand[] = new Array(notes.length)
  // The lowest `left` notes of each chord are the left hand's.
  chords.forEach((chord, c) => chord.forEach((i, j) => (hands[i] = j < left[c] ? 'L' : 'R')))
  return hands
}

/** Where the hands are. */
interface Hands {
  /** Where the left hand's bass and the right hand's top have been. */
  pos: Record<Hand, number>
  /** How many notes at once each hand has been playing. */
  size: Record<Hand, number>
}

/** What it costs to play a chord (pitches low to high) with its lowest `k` notes in the left hand, and where the hands are then. */
function share(at: Hands, pitches: number[], k: number): { cost: number; hands: Hands } {
  const parts: Record<Hand, number[]> = { L: pitches.slice(0, k), R: pitches.slice(k) }
  let cost = 0
  const pos = { ...at.pos }
  const size = { ...at.size }
  for (const hand of ['L', 'R'] as const) {
    const ps = parts[hand]
    if (!ps.length) continue
    const low = ps[0]
    const high = ps[ps.length - 1]
    // The left hand reaches up from its bass (a fifth easily, an octave at a stretch), the right a fifth down from its top.
    const edge = hand === 'L' ? low : high
    const [from, to] = hand === 'L' ? [at.pos.L - SLACK, at.pos.L + REACH] : [at.pos.R - MELODY_REACH, at.pos.R + SLACK]
    cost += Math.max(0, from - low) + Math.max(0, high - to) + Math.abs(edge - at.pos[hand]) * DRIFT
    if (hand === 'L') cost += Math.max(0, high - at.pos.L - MELODY_REACH) * REACHING
    cost += Math.max(0, high - low - MAX_SPAN) * STRETCH
    // Playing more notes at once than usual costs; fewer is easy.
    cost += Math.max(0, ps.length - at.size[hand]) * TEXTURE
    for (const p of ps) cost += Math.max(0, hand === 'L' ? p - LEFT_TOP : RIGHT_BOTTOM - p) * TRESPASS
    pos[hand] += (edge - pos[hand]) * FOLLOW
    // A hand that has just played chords is ready for more; one that plays a tune is not.
    size[hand] = Math.max(ps.length, size[hand] * FORGET)
  }
  // Hands rarely play within a few keys of each other at the same moment.
  if (parts.L.length && parts.R.length) cost += Math.max(0, MIN_GAP - (parts.R[0] - parts.L[parts.L.length - 1])) * CROWD
  return { cost, hands: { pos, size } }
}

/** A chord shared out with a lead this large over any other way is a clear case. */
const SURE = 4
const CHORD_BEATS = 1 / 32
/**
 * How far the left hand reaches up from its bass and the right hand down from its top
 * without moving (the right hand plays the tune, so its reach is about a fifth), and how far
 * either reaches the other way.
 */
const REACH = 12
const MELODY_REACH = 7
const SLACK = 3
/** Moving within reach still costs this much a semitone. */
const DRIFT = 0.1
/** The left hand reaching more than a fifth above its bass costs this much a semitone. */
const REACHING = 0.5
const BEAM = 24
/** How quickly a hand's place follows what it plays (0..1). */
const FOLLOW = 0.4
/** How quickly a hand forgets the size of the chords it played, per chord. */
const FORGET = 0.95
/** A hand spans about an octave comfortably; each semitone beyond costs this much. */
const MAX_SPAN = 12
const STRETCH = 6
/** Each note more than the hand has been playing at once. */
const TEXTURE = 10
/** The left hand above A4, or the right hand below E3, costs this much a semitone. */
const LEFT_TOP = 69
const RIGHT_BOTTOM = 52
const TRESPASS = 2
/** Hands closer than this many semitones in one chord cost this much a semitone. */
const MIN_GAP = 5
const CROWD = 4
