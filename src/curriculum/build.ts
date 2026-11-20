import { compileChart } from '../chart/notation'
import type { Chart, Hand } from '../core/types'
import type { Lesson, Step } from './types'

/** Home-position fingering: right thumb on middle C, left pinky on the C below. */
const HOME: Record<Hand, Record<string, number>> = {
  R: { C4: 1, D4: 2, E4: 3, F4: 4, G4: 5 },
  L: { C3: 5, D3: 4, E3: 3, F3: 2, G3: 1 },
}

/** Adds home-position finger numbers to notes that don't already carry one. */
function autoFinger(line: string | undefined, hand: Hand): string | undefined {
  return line?.replace(/([A-G][#b]?\d)(\/[1-5])?/g, (all, name: string, finger?: string) =>
    finger || !HOME[hand][name] ? all : `${name}/${HOME[hand][name]}`,
  )
}

export function chart(id: string, title: string, bpm: number, parts: { R?: string; L?: string }): Chart {
  return compileChart({ id, title, bpm, R: autoFinger(parts.R, 'R'), L: autoFinger(parts.L, 'L') })
}

/** Every note with the pointer finger — for the very first lessons. */
export const pointer = (line: string): string => line.replace(/([A-G][#b]?\d)/g, '$1/2')

export function say(title: string, text: string, extra: { highlight?: string[]; pressToContinue?: string } = {}): Step {
  return { type: 'explain', title, text, ...extra }
}

/** The standard run-through of one chart: watch it, walk it, then play it for a score. */
export function play(c: Chart, judging: 'pitch' | 'timed', opts: { hands?: Hand[]; pass?: number } = {}): Step[] {
  return [
    { type: 'demo', title: 'Watch and listen', chart: c },
    { type: 'drill', title: 'Take your time', chart: c, hands: opts.hands },
    { type: 'perform', title: judging === 'timed' ? 'Play it in time' : 'Play it through', chart: c, judging, ...opts },
  ]
}

export function lesson(id: string, title: string, summary: string, steps: Step[]): Lesson {
  return { id, unit: Number(id[1]), title, summary, steps }
}

/** Timed lessons pass at 70%: landing every note merely "good" is a pass. */
export const TIMED = { pass: 0.7 }
