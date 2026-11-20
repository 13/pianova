import { chart, lesson, play, say, TIMED } from './build'
import type { Lesson } from './types'

export const unit3: Lesson[] = [
  lesson('u3l1', 'The beat', 'Playing exactly with the click.', [
    say(
      'Music has a pulse',
      'Until now the notes waited for you. Real music keeps moving, on a steady pulse called the beat.\n\nYou will hear a click on every beat. A note that lasts one beat is a quarter note. Count along: 1, 2, 3, 4.',
    ),
    say(
      'How timing is scored',
      'From now on the last step of each lesson runs in time. You get four clicks to count you in, then press each key just as its note touches the line.\n\nClose is good, spot on is perfect. If you miss one, keep going. Staying with the beat matters more than any single note.',
    ),
    ...play(chart('u3l1', 'The beat', 72, { R: 'C4 C4 C4 C4 | D4 D4 D4 D4 | E4 E4 E4 E4 | D4 D4 C4 C4 | C4 D4 E4 D4 | C4 D4 E4 D4 | C4 C4 E4 E4 | C4 C4 C4 C4' }), 'timed', TIMED),
  ]),
  lesson('u3l2', 'Long notes', 'Half notes and whole notes.', [
    say(
      'Holding on',
      'Longer bars on the highway are longer notes. A half note lasts two beats, a whole note lasts four.\n\nPress when the front of the bar reaches the line and hold the key down until the tail has gone. Keep counting through the long notes: 1, 2, 3, 4.',
    ),
    ...play(chart('u3l2', 'Long notes', 76, { R: 'C4:2 E4:2 | G4:4 | F4:2 D4:2 | C4:4 | C4 D4 E4:2 | E4 F4 G4:2 | G4:2 E4:2 | C4:4' }), 'timed', TIMED),
  ]),
  lesson('u3l3', 'Rests', 'Silence that keeps time.', [
    say(
      'Counting the gaps',
      'A gap on the highway is a rest: a beat where you play nothing. The beat carries on, so keep counting through the silence.\n\nLift your finger for the rest and let the click fill the space. Rushing through rests is the most common beginner habit, so let them last.',
    ),
    ...play(chart('u3l3', 'Rests', 76, { R: 'C4 -:1 E4 -:1 | G4 G4 -:2 | F4 -:1 D4 -:1 | C4:2 -:2 | E4 E4 -:1 E4 | G4 -:1 G4 -:1 | F4 D4 -:2 | C4:4' }), 'timed', TIMED),
  ]),
  lesson('u3l4', 'Hot Cross Buns, in time', 'A tune you know, now with a beat.', [
    say(
      'Putting it together',
      'You already know these notes. This time they come with a rhythm: half notes, a whole note, then a run of quick quarter notes.\n\nWatch the demo and count along before you play.',
      { highlight: ['C4', 'D4', 'E4'] },
    ),
    ...play(chart('u3l4', 'Hot Cross Buns, in time', 92, { R: 'E4:2 D4:2 | C4:4 | E4:2 D4:2 | C4:4 | C4 C4 C4 C4 | D4 D4 D4 D4 | E4:2 D4:2 | C4:4' }), 'timed', TIMED),
  ]),
]
