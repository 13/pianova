import { chart, lesson, play, say } from './build'
import type { Lesson } from './types'

export const unit2: Lesson[] = [
  lesson('u2l1', 'Five fingers, five keys', 'Your right hand finds its home position.', [
    say(
      'Finger numbers',
      'Pianists number their fingers. On both hands the thumb is 1, the pointer is 2, the middle is 3, the ring finger is 4 and the little finger is 5.',
    ),
    say(
      'C position',
      'Put your right thumb on middle C and let each finger rest on the next white key: C D E F G. This is called C position.\n\nYour hand stays put. Each finger owns one key, so you never need to look down to find a note.\n\nPress G with your little finger to carry on.',
      { highlight: ['C4', 'D4', 'E4', 'F4', 'G4'], pressToContinue: 'G4' },
    ),
    ...play(chart('u2l1', 'Five fingers, five keys', 80, { R: 'C4 D4 E4 F4 | G4:4 | G4 F4 E4 D4 | C4:4 | C4 D4 E4 F4 | G4 F4 E4 D4 | C4:4' }), 'pitch'),
  ]),
  lesson('u2l2', 'Steps and skips', 'The two ways a melody moves.', [
    say(
      'Next door, or one over',
      'Moving to the very next key is a step: C to D, D to E.\n\nJumping over one key is a skip: C to E, E to G. Skips use every other finger: 1, 3, 5.\n\nAlmost every tune is built from steps and skips.',
      { highlight: ['C4', 'E4', 'G4'] },
    ),
    ...play(chart('u2l2', 'Steps and skips', 80, { R: 'C4 D4 E4:2 | C4 E4 G4:2 | G4 F4 E4:2 | G4 E4 C4:2 | C4 E4 D4 F4 | E4 G4 E4 C4 | D4 F4 E4 D4 | C4:4' }), 'pitch'),
  ]),
  lesson('u2l3', 'Hot Cross Buns', 'Your first tune, with just three notes.', [
    say(
      'A real tune',
      'Hot Cross Buns uses only E, D and C, fingers 3, 2 and 1.\n\nListen to the demo first and hum along. Knowing how a tune goes makes it far easier to play.',
      { highlight: ['C4', 'D4', 'E4'] },
    ),
    ...play(chart('u2l3', 'Hot Cross Buns', 90, { R: 'E4:2 D4:2 | C4:4 | E4:2 D4:2 | C4:4 | C4 C4 C4 C4 | D4 D4 D4 D4 | E4:2 D4:2 | C4:4' }), 'pitch'),
  ]),
  lesson('u2l4', 'Mary Had a Little Lamb', 'A longer tune that reaches up to G.', [
    say(
      'Adding the little finger',
      'This tune is mostly E, D and C again, with one reach up to G for your little finger.\n\nNotice how often a note repeats. When it does, lift the finger slightly and play again without moving your hand.',
      { highlight: ['C4', 'D4', 'E4', 'G4'] },
    ),
    ...play(chart('u2l4', 'Mary Had a Little Lamb', 96, { R: 'E4 D4 C4 D4 | E4 E4 E4:2 | D4 D4 D4:2 | E4 G4 G4:2 | E4 D4 C4 D4 | E4 E4 E4 E4 | D4 D4 E4 D4 | C4:4' }), 'pitch'),
  ]),
]
