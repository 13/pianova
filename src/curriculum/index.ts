import { chart } from './build'
import type { Lesson, Piece, Unit } from './types'
import { unit1 } from './unit1'
import { unit2 } from './unit2'
import { unit3 } from './unit3'
import { unit4 } from './unit4'
import { unit5 } from './unit5'
import { C, F, G, JINGLE_L, JINGLE_R, TWINKLE_A, unit6 } from './unit6'

export type { Lesson, Piece, Step, Unit } from './types'

export const UNITS: Unit[] = [
  { n: 1, title: 'Meet the keyboard', blurb: 'Find your way around the keys.' },
  { n: 2, title: 'Right hand', blurb: 'Five fingers and your first tunes.' },
  { n: 3, title: 'Rhythm', blurb: 'Play in time with the beat.' },
  { n: 4, title: 'Left hand', blurb: 'Bring in the other half.' },
  { n: 5, title: 'Hands together', blurb: 'Two hands, one piece of music.' },
  { n: 6, title: 'Chords and songs', blurb: 'Three chords and real songs.' },
]

/** All lessons in path order. */
export const LESSONS: Lesson[] = [...unit1, ...unit2, ...unit3, ...unit4, ...unit5, ...unit6]

const ODE_A = 'E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4 D4 D4:2'
const ODE_A2 = 'E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4 C4 C4:2'
const ODE_B = 'D4 D4 E4 C4 | D4 E4/3:0.5 F4:0.5 E4 C4 | D4 E4/3:0.5 F4:0.5 E4 D4 | C4 D4 G3/1:2'
const TWINKLE_B = 'G4/5 G4/5 F4 F4 | E4 E4 D4:2 | G4/5 G4/5 F4 F4 | E4 E4 D4:2'
const FRERE =
  'C4 D4 E4 C4 | C4 D4 E4 C4 | E4 F4 G4:2 | E4 F4 G4:2 | ' +
  'G4:0.5 A4/5:0.5 G4/4:0.5 F4/3:0.5 E4/2 C4 | G4:0.5 A4/5:0.5 G4/4:0.5 F4/3:0.5 E4/2 C4 | C4 G3/1 C4:2 | C4 G3/1 C4:2'

/** Free-play pieces. All public domain. */
export const PIECES: Piece[] = [
  {
    id: 'hot-cross-buns',
    title: 'Hot Cross Buns',
    composer: 'Traditional',
    chart: chart('hot-cross-buns', 'Hot Cross Buns', 96, {
      R: 'E4:2 D4:2 | C4:4 | E4:2 D4:2 | C4:4 | C4 C4 C4 C4 | D4 D4 D4 D4 | E4:2 D4:2 | C4:4',
      L: 'C3:4 | C3:4 | C3:4 | C3:4 | C3:4 | G3:4 | C3:2 G3:2 | C3:4',
    }),
  },
  {
    id: 'mary',
    title: 'Mary Had a Little Lamb',
    composer: 'Traditional',
    chart: chart('mary', 'Mary Had a Little Lamb', 100, {
      R: 'E4 D4 C4 D4 | E4 E4 E4:2 | D4 D4 D4:2 | E4 G4 G4:2 | E4 D4 C4 D4 | E4 E4 E4 E4 | D4 D4 E4 D4 | C4:4',
      L: 'C3:4 | C3:4 | G3:4 | C3:4 | C3:4 | C3:4 | G3:4 | C3:4',
    }),
  },
  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    composer: 'Ludwig van Beethoven',
    chart: chart('ode-to-joy', 'Ode to Joy', 100, {
      R: `${ODE_A} | ${ODE_A2} | ${ODE_B} | ${ODE_A2}`,
      L: 'C3:4 | G3:4 | C3:4 | G3:4 | C3:4 | G3:4 | C3:4 | G3:2 C3:2 | G3:4 | C3:4 | G3:4 | C3:4 | C3:4 | G3:4 | C3:4 | G3:2 C3:2',
    }),
  },
  {
    id: 'twinkle',
    title: 'Twinkle, Twinkle, Little Star',
    composer: 'Traditional',
    chart: chart('twinkle', 'Twinkle, Twinkle, Little Star', 88, {
      R: `${TWINKLE_A} | ${TWINKLE_B} | ${TWINKLE_A}`,
      L:
        `${C}:4 | ${F}:2 ${C}:2 | ${F}:2 ${C}:2 | ${G}:2 ${C}:2 | ` +
        `${C}:2 ${F}:2 | ${C}:2 ${G}:2 | ${C}:2 ${F}:2 | ${C}:2 ${G}:2 | ` +
        `${C}:4 | ${F}:2 ${C}:2 | ${F}:2 ${C}:2 | ${G}:2 ${C}:2`,
    }),
  },
  {
    id: 'frere-jacques',
    title: 'Frère Jacques',
    composer: 'Traditional',
    chart: chart('frere-jacques', 'Frère Jacques', 96, {
      R: FRERE,
      L: Array(8).fill('C3:4').join(' | '),
    }),
  },
  {
    id: 'jingle-bells',
    title: 'Jingle Bells',
    composer: 'James Lord Pierpont',
    chart: chart('jingle-bells', 'Jingle Bells', 104, { R: JINGLE_R, L: JINGLE_L }),
  },
]
