import { both } from '../i18n'
import { chart, lesson, play, say, TIMED } from './build'
import type { Lesson } from './types'

const BROKEN = 'C4/1 E4/3 G4/5 E4/3 | C4/1 F4/3 A4/5 F4/3 | B3/1 D4/2 G4/5 D4/2 | C4/1 E4/3 G4/5 E4/3'
/** The left hand plays its bass, then crosses over the right hand for a high note. */
const CROSSING_L = 'C3/5:2 C5/2:2 | F2/5:2 C5/2:2 | G2/5:2 B4/2:2 | C3/5:2 C5/2:2'

export const unit8: Lesson[] = [
  lesson('u8l1', both('Broken chords', 'Gebrochene Akkorde'), both('A chord played one note at a time.', 'Ein Akkord, Ton für Ton gespielt.'), [
    say(
      both('Opening up a chord', 'Einen Akkord auffächern'),
      both(
        'Instead of striking C, E and G together, play them one after another: C E G E. This is a broken chord, and it turns a block of sound into movement.\n\nThe left hand holds the bass underneath. Keep the right-hand fingers over their keys, as if you were holding the chord the whole time.',
        'Statt C, E und G gemeinsam anzuschlagen, spielst du sie nacheinander: C E G E. Das ist ein gebrochener Akkord – aus einem Klangblock wird Bewegung.\n\nDie linke Hand hält darunter den Bass. Lass die Finger der rechten Hand über ihren Tasten, als würdest du den Akkord die ganze Zeit greifen.',
      ),
      { highlight: ['C4', 'E4', 'G4'] },
    ),
    ...play(chart('u8l1', 'Broken chords', 76, { R: `${BROKEN} | ${BROKEN}`, L: 'C3:4 | F3:4 | G3:4 | C3:4 | C3:4 | F3:4 | G3:4 | C3:4' }), 'timed', TIMED),
  ]),
  lesson('u8l2', both('Hand over hand', 'Übergreifen'), both('The left hand crosses over the right.', 'Die linke Hand greift über die rechte.'), [
    say(
      both('Crossing the hands', 'Hände kreuzen'),
      both(
        'Some music reaches further than one hand can. Then the hands leapfrog: the left hand plays its bass note, then crosses over the right hand to play a note high above it.\n\nAlways cross over the top, never underneath, and let the right hand stay low and steady while the left hand passes.',
        'Manche Musik reicht weiter, als eine Hand greifen kann. Dann springen die Hände übereinander: Die linke Hand spielt ihren Basston und greift dann über die rechte, um einen Ton weit darüber zu spielen.\n\nGreif immer oben drüber, nie darunter, und lass die rechte Hand ruhig und tief liegen, während die linke vorbeizieht.',
      ),
      { highlight: ['C3', 'C4', 'E4', 'G4', 'C5'] },
    ),
    ...play(chart('u8l2', 'Hand over hand', 60, { R: `${BROKEN} | ${BROKEN}`, L: `${CROSSING_L} | ${CROSSING_L}` }), 'timed', TIMED),
  ]),
  lesson('u8l3', both('Arpeggios', 'Arpeggien'), both('A chord spread over two octaves.', 'Ein Akkord über zwei Oktaven.'), [
    say(
      both('Climbing the chord', 'Den Akkord hinaufklettern'),
      both(
        'An arpeggio is a broken chord that keeps climbing: C E G, then the thumb passes under to the next C, and on up.\n\nIt is the same thumb-under move as in the scale, only the gaps are wider. Let the arm glide sideways so the thumb arrives in time.',
        'Ein Arpeggio ist ein gebrochener Akkord, der immer weiter steigt: C E G, dann geht der Daumen unter zum nächsten C, und weiter hinauf.\n\nEs ist derselbe Daumenuntersatz wie in der Tonleiter, nur die Abstände sind größer. Lass den Arm seitlich mitgleiten, damit der Daumen rechtzeitig ankommt.',
      ),
      { highlight: ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6'] },
    ),
    ...play(
      chart('u8l3', 'Arpeggios', 69, {
        R: 'C4/1 E4/2 G4/3 C5/1 | E5/2 G5/3 C6/5:2 | C6/5 G5/3 E5/2 C5/1 | G4/3 E4/2 C4/1:2 | C4/1 E4/2 G4/3 C5/1 | E5/2 G5/3 C6/5:2 | C6/5 G5/3 E5/2 C5/1 | G4/3 E4/2 C4/1:2',
      }),
      'timed',
      TIMED,
    ),
  ]),
  lesson('u8l4', both('Chord inversions', 'Akkordumkehrungen'), both('The same chord, stacked three ways.', 'Derselbe Akkord, dreimal anders geschichtet.'), [
    say(
      both('Same notes, new order', 'Gleiche Töne, neue Reihenfolge'),
      both(
        'A C chord does not have to start on C. Move the bottom note up an octave and you get E G C, the first inversion. Do it again for G C E, the second inversion.\n\nInversions let the hand reach the next chord without jumping. The chord names on the highway show the bass note after a slash, like C/E.',
        'Ein C-Dur-Akkord muss nicht auf C beginnen. Leg den untersten Ton eine Oktave höher und du erhältst E G C, die erste Umkehrung. Noch einmal, und es entsteht G C E, die zweite Umkehrung.\n\nMit Umkehrungen erreicht die Hand den nächsten Akkord, ohne zu springen. Die Akkordnamen auf der Notenbahn zeigen den Basston hinter einem Schrägstrich, etwa C/E.',
      ),
      { highlight: ['C4', 'E4', 'G4', 'C5', 'E5'] },
    ),
    ...play(
      chart('u8l4', 'Chord inversions', 66, {
        R:
          '[C4/1 E4/3 G4/5]:2 [E4/1 G4/2 C5/5]:2 | [G4/1 C5/3 E5/5]:4 | [G4/1 C5/3 E5/5]:2 [E4/1 G4/2 C5/5]:2 | [C4/1 E4/3 G4/5]:4 | ' +
          '[C4/1 F4/3 A4/5]:2 [B3/1 D4/2 G4/5]:2 | [C4/1 E4/3 G4/5]:4',
        L: 'C3:4 | C3:4 | C3:4 | C3:4 | F3:2 G3:2 | C3:4',
      }),
      'timed',
      TIMED,
    ),
  ]),
]
