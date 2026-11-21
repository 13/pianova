import { both } from '../i18n'
import { chart } from './build'
import type { Lesson, Piece, Unit } from './types'
import { unit1 } from './unit1'
import { unit2 } from './unit2'
import { unit3 } from './unit3'
import { unit4 } from './unit4'
import { unit5 } from './unit5'
import { C, F, G, JINGLE_L, JINGLE_R, TWINKLE_A, unit6 } from './unit6'
import { unit7 } from './unit7'
import { unit8 } from './unit8'

export type { Lesson, Piece, Step, Unit } from './types'

export const UNITS: Unit[] = [
  { n: 1, title: both('Meet the keyboard', 'Die Tastatur kennenlernen'), blurb: both('Find your way around the keys.', 'Finde dich auf den Tasten zurecht.') },
  { n: 2, title: both('Right hand', 'Rechte Hand'), blurb: both('Five fingers and your first tunes.', 'Fünf Finger und deine ersten Melodien.') },
  { n: 3, title: both('Rhythm', 'Rhythmus'), blurb: both('Play in time with the beat.', 'Im Takt mit dem Grundschlag spielen.') },
  { n: 4, title: both('Left hand', 'Linke Hand'), blurb: both('Bring in the other half.', 'Die andere Hälfte kommt dazu.') },
  { n: 5, title: both('Hands together', 'Beide Hände'), blurb: both('Two hands, one piece of music.', 'Zwei Hände, ein Musikstück.') },
  { n: 6, title: both('Chords and songs', 'Akkorde und Lieder'), blurb: both('Three chords and real songs.', 'Drei Akkorde und echte Lieder.') },
  { n: 7, title: both('Scales', 'Tonleitern'), blurb: both('Thumb under, crossing over, and your first scales.', 'Daumenuntersatz, Übersetzen und deine ersten Tonleitern.') },
  {
    n: 8,
    title: both('Across the keyboard', 'Über die ganze Tastatur'),
    blurb: both('Broken chords, hand over hand, arpeggios and inversions.', 'Gebrochene Akkorde, Übergreifen, Arpeggien und Umkehrungen.'),
  },
]

/** All lessons in path order. */
export const LESSONS: Lesson[] = [...unit1, ...unit2, ...unit3, ...unit4, ...unit5, ...unit6, ...unit7, ...unit8]

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
    composer: both('Traditional', 'Volksweise'),
    chart: chart('hot-cross-buns', 'Hot Cross Buns', 96, {
      R: 'E4:2 D4:2 | C4:4 | E4:2 D4:2 | C4:4 | C4 C4 C4 C4 | D4 D4 D4 D4 | E4:2 D4:2 | C4:4',
      L: 'C3:4 | C3:4 | C3:4 | C3:4 | C3:4 | G3:4 | C3:2 G3:2 | C3:4',
    }),
  },
  {
    id: 'mary',
    title: both('Mary Had a Little Lamb', 'Mary hatte ein kleines Lamm'),
    composer: both('Traditional', 'Volksweise'),
    chart: chart('mary', 'Mary Had a Little Lamb', 100, {
      R: 'E4 D4 C4 D4 | E4 E4 E4:2 | D4 D4 D4:2 | E4 G4 G4:2 | E4 D4 C4 D4 | E4 E4 E4 E4 | D4 D4 E4 D4 | C4:4',
      L: 'C3:4 | C3:4 | G3:4 | C3:4 | C3:4 | C3:4 | G3:4 | C3:4',
    }),
  },
  {
    id: 'ode-to-joy',
    title: both('Ode to Joy', 'Ode an die Freude'),
    composer: 'Ludwig van Beethoven',
    chart: chart('ode-to-joy', 'Ode to Joy', 100, {
      R: `${ODE_A} | ${ODE_A2} | ${ODE_B} | ${ODE_A2}`,
      L: 'C3:4 | G3:4 | C3:4 | G3:4 | C3:4 | G3:4 | C3:4 | G3:2 C3:2 | G3:4 | C3:4 | G3:4 | C3:4 | C3:4 | G3:4 | C3:4 | G3:2 C3:2',
    }),
  },
  {
    id: 'twinkle',
    title: both('Twinkle, Twinkle, Little Star', 'Morgen kommt der Weihnachtsmann'),
    composer: both('Traditional', 'Volksweise'),
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
    title: both('Frère Jacques', 'Bruder Jakob'),
    composer: both('Traditional', 'Volksweise'),
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
