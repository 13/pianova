import { both } from '../i18n'
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
  lesson('u6l1', both('The C chord', 'Der C-Dur-Akkord'), both('Three notes at once.', 'Drei Töne auf einmal.'), [
    say(
      both('What a chord is', 'Was ein Akkord ist'),
      both(
        'A chord is several notes played together. The C chord is C, E and G: every other key, played with fingers 1, 3 and 5.\n\nFirst play the three notes one at a time, then drop all three fingers together. Aim for one sound, not three.',
        'Ein Akkord sind mehrere Töne, die zusammen erklingen. Der C-Dur-Akkord besteht aus C, E und G: jede zweite Taste, gespielt mit den Fingern 1, 3 und 5.\n\nSpiel die drei Töne zuerst einzeln, dann lass alle drei Finger zusammen fallen. Ziel ist ein Klang, nicht drei.',
      ),
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
  lesson('u6l2', both('F and G chords', 'F- und G-Dur-Akkord'), both('Three chords that play thousands of songs.', 'Drei Akkorde für Tausende Lieder.'), [
    say(
      both('Two new shapes', 'Zwei neue Griffe'),
      both(
        'With C, F and G you can accompany a huge number of songs. To keep your hand from jumping around, play F and G in close shapes.\n\nF chord: keep finger 5 on C, and play F with finger 2 and A with your thumb. The thumb stretches up one key.',
        'Mit C, F und G kannst du eine riesige Zahl von Liedern begleiten. Damit deine Hand nicht herumspringt, spielst du F und G in engen Griffen.\n\nF-Dur: Finger 5 bleibt auf C, F spielst du mit Finger 2 und A mit dem Daumen. Der Daumen streckt sich eine Taste nach oben.',
      ),
      { highlight: ['C3', 'F3', 'A3'] },
    ),
    say(
      both('The G chord', 'Der G-Dur-Akkord'),
      both(
        'G chord: move the whole hand up one key. Finger 5 plays D, finger 2 plays G and the thumb plays B.\n\nChange chords by moving the hand as one shape. In the gaps between chords, get the next shape ready over the keys before you need it.',
        'G-Dur: Rück die ganze Hand eine Taste nach oben. Finger 5 spielt D, Finger 2 spielt G und der Daumen spielt H.\n\nWechsle Akkorde, indem du die Hand als Ganzes bewegst. Bereite in den Lücken zwischen den Akkorden den nächsten Griff über den Tasten vor, bevor du ihn brauchst.',
      ),
      { highlight: ['D3', 'G3', 'B3'] },
    ),
    ...play(chart('u6l2', 'F and G chords', 60, { L: `${C}:4 | ${F}:4 | ${C}:4 | ${G}:4 | ${C}:2 ${F}:2 | ${C}:2 ${G}:2 | ${C}:4` }), 'timed', TIMED),
  ]),
  lesson('u6l3', both('Twinkle, Twinkle', 'Morgen kommt der Weihnachtsmann'), both('A melody with chords underneath.', 'Eine Melodie mit Akkorden darunter.'), [
    say(
      both('Melody plus chords', 'Melodie und Akkorde'),
      both(
        'This is how most songs are played: the tune in the right hand and chords in the left.\n\nThe melody goes one key above C position. Stretch your little finger up to A, then bring it back to G. The left hand uses all three of your chords.',
        'So werden die meisten Lieder gespielt: die Melodie in der rechten Hand, Akkorde in der linken.\n\nDie Melodie geht eine Taste über die C-Lage hinaus. Streck den kleinen Finger zum A und bring ihn dann zurück zum G. Die linke Hand nutzt alle drei Akkorde.',
      ),
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
  lesson('u6l4', 'Jingle Bells', both('A full song with both hands.', 'Ein ganzes Lied mit beiden Händen.'), [
    say(
      both('Everything you have learned', 'Alles, was du gelernt hast'),
      both(
        'Sixteen bars, three chords, both hands. The right hand stays in C position the whole time, and the left hand changes chord only once a bar.\n\nIf it feels like a lot, practise each hand alone first. When you can play this, you can play the piano. Next, the hands start to travel: scales, crossings and the whole keyboard.',
        'Sechzehn Takte, drei Akkorde, beide Hände. Die rechte Hand bleibt die ganze Zeit in der C-Lage, die linke wechselt den Akkord nur einmal pro Takt.\n\nWenn es dir viel vorkommt, übe zuerst jede Hand allein. Wenn du das spielen kannst, kannst du Klavier spielen. Danach gehen die Hände auf Reisen: Tonleitern, Über- und Untersetzen und die ganze Tastatur.',
      ),
    ),
    ...play(chart('u6l4', 'Jingle Bells', 92, { R: JINGLE_R, L: JINGLE_L }), 'timed', TIMED),
  ]),
]
