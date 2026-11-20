import { chart, lesson, play, say, TIMED } from './build'
import type { Lesson } from './types'

/** Left-hand chord shapes that stay close together, so the hand barely moves. */
export const C = '[C3/5 E3/3 G3/1]'
export const F = '[C3/5 F3/2 A3/1]'
export const G = '[D3/5 G3/2 B3/1]'

export const TWINKLE_A = 'C4/1 C4/1 G4/5 G4/5 | A4/5 A4/5 G4/5:2 | F4 F4 E4 E4 | D4 D4 C4:2'
export const JINGLE_R =
  'E4 E4 E4:2 | E4 E4 E4:2 | E4 G4 C4 D4 | E4:4 | F4 F4 F4 F4 | F4 E4 E4 E4 | E4 D4 D4 E4 | D4:2 G4:2 | ' +
  'E4 E4 E4:2 | E4 E4 E4:2 | E4 G4 C4 D4 | E4:4 | F4 F4 F4 F4 | F4 E4 E4 E4 | G4 G4 F4 D4 | C4:4'
export const JINGLE_L = [C, C, C, C, F, C, G, G, C, C, C, C, F, C, G, C].map((c) => `${c}:4`).join(' | ')

export const unit6: Lesson[] = [
  lesson('u6l1', 'The C chord', 'Three notes at once.', [
    say(
      'What a chord is',
      'A chord is several notes played together. The C chord is C, E and G: every other key, played with fingers 1, 3 and 5.\n\nFirst play the three notes one at a time, then drop all three fingers together. Aim for one sound, not three.',
      { highlight: ['C4', 'E4', 'G4'] },
    ),
    ...play(
      chart('u6l1', 'The C chord', 66, {
        R: 'C4 E4 G4:2 | [C4 E4 G4]:4 | -:4 | -:4 | [C4 E4 G4]:2 [C4 E4 G4]:2 | -:4',
        L: '-:4 | -:4 | C3 E3 G3:2 | [C3 E3 G3]:4 | -:4 | [C3 E3 G3]:2 [C3 E3 G3]:2',
      }),
      'timed',
      TIMED,
    ),
  ]),
  lesson('u6l2', 'F and G chords', 'Three chords that play thousands of songs.', [
    say(
      'Two new shapes',
      'With C, F and G you can accompany a huge number of songs. To keep your hand from jumping around, play F and G in close shapes.\n\nF chord: keep finger 5 on C, and play F with finger 2 and A with your thumb. The thumb stretches up one key.',
      { highlight: ['C3', 'F3', 'A3'] },
    ),
    say(
      'The G chord',
      'G chord: move the whole hand up one key. Finger 5 plays D, finger 2 plays G and the thumb plays B.\n\nChange chords by moving the hand as one shape. In the gaps between chords, get the next shape ready over the keys before you need it.',
      { highlight: ['D3', 'G3', 'B3'] },
    ),
    ...play(chart('u6l2', 'F and G chords', 60, { L: `${C}:4 | ${F}:4 | ${C}:4 | ${G}:4 | ${C}:2 ${F}:2 | ${C}:2 ${G}:2 | ${C}:4` }), 'timed', TIMED),
  ]),
  lesson('u6l3', 'Twinkle, Twinkle', 'A melody with chords underneath.', [
    say(
      'Melody plus chords',
      'This is how most songs are played: the tune in the right hand and chords in the left.\n\nThe melody goes one key above C position. Stretch your little finger up to A, then bring it back to G. The left hand uses all three of your chords.',
      { highlight: ['A4', 'C3', 'F3', 'G3'] },
    ),
    ...play(
      chart('u6l3', 'Twinkle, Twinkle', 76, {
        R: `${TWINKLE_A} | ${TWINKLE_A}`,
        L: `${C}:4 | ${F}:2 ${C}:2 | ${F}:2 ${C}:2 | ${G}:2 ${C}:2 | ${C}:4 | ${F}:2 ${C}:2 | ${F}:2 ${C}:2 | ${G}:2 ${C}:2`,
      }),
      'timed',
      TIMED,
    ),
  ]),
  lesson('u6l4', 'Jingle Bells', 'The finale: a full song with both hands.', [
    say(
      'Everything you have learned',
      'Sixteen bars, three chords, both hands. The right hand stays in C position the whole time, and the left hand changes chord only once a bar.\n\nIf it feels like a lot, practise each hand alone first. When you can play this, you can play the piano. Everything after this is more of the same, one small step at a time.',
    ),
    ...play(chart('u6l4', 'Jingle Bells', 92, { R: JINGLE_R, L: JINGLE_L }), 'timed', TIMED),
  ]),
]
