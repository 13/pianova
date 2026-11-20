import { chart, lesson, play, say, TIMED } from './build'
import type { Lesson } from './types'

export const unit5: Lesson[] = [
  lesson('u5l1', 'Taking turns', 'Both hands ready, one playing at a time.', [
    say(
      'Call and answer',
      'Place both hands in C position: right thumb on middle C, left little finger on the C below.\n\nThe right hand plays a short phrase and the left hand answers it. Keep the resting hand on its keys so it is ready when its turn comes.',
      { highlight: ['C3', 'D3', 'E3', 'F3', 'G3', 'C4', 'D4', 'E4', 'F4', 'G4'] },
    ),
    ...play(
      chart('u5l1', 'Taking turns', 72, {
        R: 'C4 D4 E4:2 | -:4 | E4 F4 G4:2 | -:4 | G4 F4 E4 D4 | -:4 | C4:4',
        L: '-:4 | C3 D3 E3:2 | -:4 | E3 F3 G3:2 | -:4 | G3 F3 E3 D3 | C3:4',
      }),
      'timed',
      TIMED,
    ),
  ]),
  lesson('u5l2', 'Together', 'Both hands playing the same notes at once.', [
    say(
      'Two hands, one sound',
      'Now both hands play at the same moment, the same letters an octave apart. The notes line up side by side on the highway.\n\nThe fingers do not match: when your right thumb plays C, your left little finger does. Go slowly and let the two hands land as one sound.',
    ),
    ...play(
      chart('u5l2', 'Together', 66, {
        R: 'C4:2 D4:2 | E4:2 F4:2 | G4:4 | G4:2 F4:2 | E4:2 D4:2 | C4:4',
        L: 'C3:2 D3:2 | E3:2 F3:2 | G3:4 | G3:2 F3:2 | E3:2 D3:2 | C3:4',
      }),
      'timed',
      TIMED,
    ),
  ]),
  lesson('u5l3', 'Melody over bass', 'The left hand holds while the right hand moves.', [
    say(
      'Doing two different things',
      'This is the heart of piano playing: the left hand holds one long bass note while the right hand plays a melody above it.\n\nIt feels strange at first. Use the tools on the play screen to practise one hand at a time, then put them together.',
    ),
    ...play(
      chart('u5l3', 'Melody over bass', 72, {
        R: 'E4 D4 C4:2 | E4 D4 C4:2 | C4 D4 E4 F4 | G4:4 | G4 F4 E4 D4 | C4:2 E4:2 | D4 D4 E4 D4 | C4:4',
        L: 'C3:4 | C3:4 | C3:4 | G3:4 | G3:4 | C3:4 | G3:4 | C3:4',
      }),
      'timed',
      TIMED,
    ),
  ]),
  lesson('u5l4', 'Ode to Joy', 'Beethoven, with both hands.', [
    say(
      'Your first two-handed piece',
      'Ode to Joy is the big tune from Beethoven\'s ninth symphony, and it fits perfectly under five fingers.\n\nThe right hand moves almost entirely by step. The left hand swaps between just two bass notes, C and G, one per bar.',
      { highlight: ['C3', 'G3', 'C4', 'D4', 'E4', 'F4', 'G4'] },
    ),
    ...play(
      chart('u5l4', 'Ode to Joy', 84, {
        R: 'E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4 D4 D4:2 | E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4 C4 C4:2',
        L: 'C3:4 | G3:4 | C3:4 | G3:4 | C3:4 | G3:4 | C3:4 | G3:2 C3:2',
      }),
      'timed',
      TIMED,
    ),
  ]),
]
