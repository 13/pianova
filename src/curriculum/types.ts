import type { Chart, Hand } from '../core/types'

export type Step =
  /** Text beside the keyboard. `highlight` lights keys; `pressToContinue` makes the learner find one. */
  | { type: 'explain'; title: string; text: string; highlight?: string[]; pressToContinue?: string }
  /** The chart plays itself. */
  | { type: 'demo'; title: string; chart: Chart }
  /** The highway waits for each note. Cannot be failed. */
  | { type: 'drill'; title: string; chart: Chart; hands?: Hand[] }
  /** Scored. 'pitch' = right notes in order, untimed; 'timed' = in time with the metronome. */
  | { type: 'perform'; title: string; chart: Chart; judging: 'pitch' | 'timed'; pass?: number; hands?: Hand[] }

export interface Lesson {
  id: string
  unit: number
  title: string
  summary: string
  steps: Step[]
}

export interface Unit {
  n: number
  title: string
  blurb: string
}

export interface Piece {
  id: string
  title: string
  composer: string
  chart: Chart
}
