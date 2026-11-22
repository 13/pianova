import type { Chart, Hand } from '../core/types'
import type { Text } from '../i18n'

export type Step =
  /** Text beside the keyboard. `highlight` lights keys; `pressToContinue` makes the learner find one. */
  | { type: 'explain'; title: Text; text: Text; highlight?: string[]; pressToContinue?: string }
  /** The chart plays itself. */
  | { type: 'demo'; title: Text; chart: Chart }
  /** The highway waits for each note. Cannot be failed. */
  | { type: 'drill'; title: Text; chart: Chart; hands?: Hand[] }
  /** Scored. 'pitch' = right notes in order, untimed; 'timed' = in time with the metronome. */
  | { type: 'perform'; title: Text; chart: Chart; judging: 'pitch' | 'timed'; pass?: number; hands?: Hand[] }

export interface Lesson {
  id: string
  unit: number
  title: Text
  summary: Text
  steps: Step[]
}

export interface Unit {
  n: number
  title: Text
  blurb: Text
  /** Practice units: every lesson is open from the start, in any order. */
  open?: boolean
}

export interface Piece {
  id: string
  title: Text
  composer: Text
  chart: Chart
}
