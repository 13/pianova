import { chart, lesson, play, say, TIMED } from './build'
import type { Lesson } from './types'

export const unit4: Lesson[] = [
  lesson('u4l1', 'Left hand home', 'C position, one octave down.', [
    say(
      'A mirror image',
      'Your left hand gets its own C position, on the C below middle C. This time the little finger (5) goes on C and the thumb (1) on G.\n\nIt is a mirror of your right hand: going up the keys, the fingers count down, 5 4 3 2 1.\n\nLeft-hand notes have their own colour on the highway. Press the low C with your left little finger to carry on.',
      { highlight: ['C3', 'D3', 'E3', 'F3', 'G3'], pressToContinue: 'C3' },
    ),
    ...play(chart('u4l1', 'Left hand home', 66, { L: 'C3 D3 E3 F3 | G3:4 | G3 F3 E3 D3 | C3:4 | C3 D3 E3 F3 | G3 F3 E3 D3 | C3:4' }), 'timed', TIMED),
  ]),
  lesson('u4l2', 'Left-hand steps and skips', 'Getting the weaker fingers moving.', [
    say(
      'Waking up fingers 4 and 5',
      'For most people the left ring and little fingers are the weakest. That is normal, and it improves quickly.\n\nKeep the hand relaxed and let each finger drop into its key. Skips here use fingers 5, 3 and 1.',
      { highlight: ['C3', 'E3', 'G3'] },
    ),
    ...play(chart('u4l2', 'Left-hand steps and skips', 69, { L: 'C3 E3 G3:2 | G3 E3 C3:2 | C3 D3 E3 C3 | E3 F3 G3:2 | G3 E3 G3 E3 | F3 D3 F3 D3 | E3 D3 C3:2' }), 'timed', TIMED),
  ]),
  lesson('u4l3', 'Mary, left-handed', 'A tune you know, in the other hand.', [
    say(
      'Same tune, new hand',
      'Playing a tune you already know with the other hand is one of the fastest ways to train it. Your ear knows where the melody goes, so your fingers only have to follow.\n\nIt starts on E, which is finger 3 in this hand too.',
      { highlight: ['C3', 'D3', 'E3', 'G3'] },
    ),
    ...play(chart('u4l3', 'Mary, left-handed', 80, { L: 'E3 D3 C3 D3 | E3 E3 E3:2 | D3 D3 D3:2 | E3 G3 G3:2 | E3 D3 C3 D3 | E3 E3 E3 E3 | D3 D3 E3 D3 | C3:4' }), 'timed', TIMED),
  ]),
  lesson('u4l4', 'Bass notes', 'The long low notes that hold a song up.', [
    say(
      'The job of the left hand',
      'In most piano music the right hand sings the tune and the left hand supports it with long, low notes called bass notes.\n\nThree of them do most of the work in the key of C: C (finger 5), F (finger 2) and G (finger 1). Play them firmly and hold each one for its full length.',
      { highlight: ['C3', 'F3', 'G3'] },
    ),
    ...play(chart('u4l4', 'Bass notes', 72, { L: 'C3:4 | G3:4 | C3:2 G3:2 | C3:4 | C3:2 F3:2 | G3:4 | F3:2 G3:2 | C3:4' }), 'timed', TIMED),
  ]),
]
