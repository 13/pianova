import { chart, lesson, play, pointer, say } from './build'
import type { Lesson } from './types'

export const unit1: Lesson[] = [
  lesson('u1l1', 'Twos and threes', 'How the black keys map the whole keyboard.', [
    say(
      'Welcome to the keyboard',
      'A piano looks like a long row of identical keys, but it has a pattern. Look at the black keys: they come in groups of two, then three, then two, then three.\n\nThose groups are your landmarks. Once you can spot them, you can find any note without counting.',
      { highlight: ['C#4', 'D#4', 'F#4', 'G#4', 'A#4'] },
    ),
    say(
      'How the highway works',
      'Notes slide down towards the keyboard. When a note reaches the bright line, press the key it lands on.\n\nIn this lesson the notes wait for you, so there is no rush. Use the pointer finger of your right hand.\n\nPress the glowing black key to carry on.',
      { highlight: ['C#4'], pressToContinue: 'C#4' },
    ),
    ...play(chart('u1l1', 'Twos and threes', 80, { R: pointer('C#4 D#4 C#4 D#4 | F#4 G#4 A#4 -:1 | F#4 G#4 A#4 -:1 | C#4 D#4 F#4:2') }), 'pitch'),
  ]),
  lesson('u1l2', 'Finding C', 'The most important key on the piano.', [
    say(
      'C lives left of the twos',
      'Find a group of two black keys. The white key just to the left of the group is always C.\n\nEvery C on the keyboard sits in that same spot. The one near the middle of the piano is called middle C, and it will be your home base.\n\nPress middle C to carry on.',
      { highlight: ['C3', 'C4', 'C5'], pressToContinue: 'C4' },
    ),
    ...play(chart('u1l2', 'Finding C', 80, { R: pointer('C4 C4 C5 C5 | C4 C4 C3 C3 | C4 C5 C4 C3 | C4:4') }), 'pitch'),
  ]),
  lesson('u1l3', 'C, D, E', 'The three white keys around the two black keys.', [
    say(
      'Neighbours of C',
      'White keys are named with letters, going up to the right. After C comes D, then E.\n\nD is easy to spot: it sits between the two black keys. E is just to the right of the group.',
      { highlight: ['C4', 'D4', 'E4'] },
    ),
    say(
      'Three fingers',
      'Rest your right thumb on middle C, your pointer finger on D and your middle finger on E. Keep your fingers curved, as if holding a ball.\n\nThe small numbers on the notes tell you which finger to use: thumb is 1, pointer is 2, middle is 3.\n\nPress D to carry on.',
      { highlight: ['D4'], pressToContinue: 'D4' },
    ),
    ...play(chart('u1l3', 'C, D, E', 80, { R: 'C4 D4 E4:2 | E4 D4 C4:2 | C4 E4 D4 E4 | C4 D4 C4:2' }), 'pitch'),
  ]),
  lesson('u1l4', 'The whole alphabet', 'F, G, A and B complete the set of seven.', [
    say(
      'Seven letters, then round again',
      'Music uses only seven letters: A B C D E F G. After G it starts again at A.\n\nF sits just left of the group of three black keys. G and A are tucked inside that group, and B is just right of it. Then comes the next C.',
      { highlight: ['F4', 'G4', 'A4', 'B4'] },
    ),
    say(
      'Walk up the keys',
      'Use your pointer finger for this one and walk up the white keys from C to the next C, saying the letters aloud as you go. Saying them is what makes them stick.\n\nPress F to carry on.',
      { highlight: ['F4'], pressToContinue: 'F4' },
    ),
    ...play(chart('u1l4', 'The whole alphabet', 80, { R: pointer('C4 D4 E4 F4 | G4 A4 B4 C5 | C5 B4 A4 G4 | F4 E4 D4 C4 | F4 A4 G4 B4 | C5:2 C4:2') }), 'pitch'),
  ]),
]
