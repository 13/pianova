import { primaryHarmony } from '../chart/harmony'
import { compileChart } from '../chart/notation'
import type { Chart, Hand } from '../core/types'
import { both, type Text } from '../i18n'
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

/** Charts keep an English title; screens show the lesson's or piece's title in the current language. */
export function chart(id: string, title: Text, bpm: number, parts: { R?: string; L?: string }): Chart {
  return compileChart({ id, title: typeof title === 'string' ? title : title.en, bpm, R: autoFinger(parts.R, 'R'), L: autoFinger(parts.L, 'L') })
}

/** Every note with the pointer finger — for the very first lessons. */
export const pointer = (line: string): string => line.replace(/([A-G][#b]?\d)/g, '$1/2')

export function say(title: Text, text: Text, extra: { highlight?: string[]; pressToContinue?: string } = {}): Step {
  return { type: 'explain', title, text, ...extra }
}

/** The standard run-through of one chart: watch it, walk it, then play it for a score. */
export function play(c: Chart, judging: 'pitch' | 'timed', opts: { hands?: Hand[]; pass?: number } = {}): Step[] {
  return [
    { type: 'demo', title: both('Watch and listen', 'Anschauen und zuhören'), chart: c },
    { type: 'drill', title: both('Take your time', 'In Ruhe üben'), chart: c, hands: opts.hands },
    {
      type: 'perform',
      title: judging === 'timed' ? both('Play it in time', 'Im Takt spielen') : both('Play it through', 'Durchspielen'),
      chart: c,
      judging,
      ...opts,
    },
  ]
}

export function lesson(id: string, title: Text, summary: Text, steps: Step[]): Lesson {
  return { id, unit: Number(/^u(\d+)l/.exec(id)![1]), title, summary, steps }
}

/** Gives a chart written-out chords for the band: the key's I, IV and V, one per bar. */
export function banded(c: Chart, tonic = 0): Chart {
  return { ...c, chords: primaryHarmony(c, tonic) }
}

/** Timed lessons pass at 70%: landing every note merely "good" is a pass. */
export const TIMED = { pass: 0.7 }

/** The note that introduces the backing band, added to the first lesson of a practice unit. */
export const BAND = {
  en: '\n\nA band plays along in the demo and in the scored run. Turn it up or down with the mixer button on the play screen.',
  de: '\n\nIn der Vorführung und im Wertungsdurchlauf spielt eine Band mit. Mit dem Mixer-Knopf auf dem Spielbildschirm machst du sie lauter oder leiser.',
}
