import { MAX_LEVEL } from '../chart/difficulty'

/**
 * Section practice: one part loops, and after every pass the trainer decides what comes
 * next. Clean passes speed it up to full tempo, then add notes (the next level) and drop
 * back a little in speed; at full tempo on the top level the part is learned. Two rough
 * passes in a row slow it down, and at the slowest tempo take a level away.
 */
export interface DrillState {
  level: number
  tempo: number
  /** Rough passes in a row. */
  rough: number
}

export type DrillEvent = 'faster' | 'level-up' | 'learned' | 'slower' | 'level-down' | null

/** A pass at least this accurate is clean; below ROUGH it is rough. */
export const CLEAN = 0.9
export const ROUGH = 0.6
export const START_TEMPO = 0.7
/** Tempo after a level up: the new notes come in a little slower. */
export const LEVEL_TEMPO = 0.8
export const MIN_TEMPO = 0.5
const STEP = 0.1
const EPS = 1e-6

export function startDrill(level: number): DrillState {
  return { level, tempo: START_TEMPO, rough: 0 }
}

export function afterPass(s: DrillState, accuracy: number): { state: DrillState; event: DrillEvent } {
  if (accuracy >= CLEAN) {
    if (s.tempo < 1 - EPS) return { state: { ...s, rough: 0, tempo: round(Math.min(1, s.tempo + STEP)) }, event: 'faster' }
    if (s.level < MAX_LEVEL) return { state: { level: s.level + 1, tempo: LEVEL_TEMPO, rough: 0 }, event: 'level-up' }
    return { state: { ...s, rough: 0 }, event: 'learned' }
  }
  if (accuracy >= ROUGH) return { state: { ...s, rough: 0 }, event: null }
  const rough = s.rough + 1
  if (rough < 2) return { state: { ...s, rough }, event: null }
  if (s.tempo > MIN_TEMPO + EPS) return { state: { ...s, rough: 0, tempo: round(Math.max(MIN_TEMPO, s.tempo - STEP)) }, event: 'slower' }
  if (s.level > 1) return { state: { level: s.level - 1, tempo: LEVEL_TEMPO, rough: 0 }, event: 'level-down' }
  return { state: { ...s, rough: 0 }, event: null }
}

/**
 * After a full run of the song: each part that went cleanly gains a level, each that
 * fell apart loses one. Parts with the same name are the same music and move together.
 */
export function levelsAfterRun(names: string[], levels: number[], accuracies: (number | null)[]): number[] {
  const byName = new Map<string, number[]>()
  names.forEach((name, k) => {
    const acc = accuracies[k]
    if (acc !== null) byName.set(name, [...(byName.get(name) ?? []), acc])
  })
  return levels.map((level, k) => {
    const accs = byName.get(names[k])
    if (!accs) return level
    const acc = accs.reduce((a, b) => a + b, 0) / accs.length
    if (acc >= CLEAN) return Math.min(MAX_LEVEL, level + 1)
    if (acc < 0.5) return Math.max(1, level - 1)
    return level
  })
}

function round(t: number): number {
  return Math.round(t * 100) / 100
}
