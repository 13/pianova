import { both } from '../i18n'
import { chart, lesson, play, say, TIMED } from './build'
import type { Lesson } from './types'

const C_UP_R = 'C4/1 D4/2 E4/3 F4/1 | G4/2 A4/3 B4/4 C5/5'
const C_DOWN_R = 'C5/5 B4/4 A4/3 G4/2 | F4/1 E4/3 D4/2 C4/1'
const C_UP_L = 'C3/5 D3/4 E3/3 F3/2 | G3/1 A3/3 B3/2 C4/1'
const C_DOWN_L = 'C4/1 B3/2 A3/3 G3/1 | F3/2 E3/3 D3/4 C3/5'

export const unit7: Lesson[] = [
  lesson('u7l1', both('Thumb under', 'Daumenuntersatz'), both('Going past five fingers without lifting the hand.', 'Über fünf Finger hinaus, ohne die Hand abzuheben.'), [
    say(
      both('Five fingers are not enough', 'Fünf Finger reichen nicht'),
      both(
        'A scale has eight notes, but your hand has five fingers. The trick is to pass the thumb under the hand.\n\nPlay C D E with fingers 1 2 3. While finger 3 holds E, slide the thumb underneath to F. The hand follows, and you carry on with 2 3 on G and A.',
        'Eine Tonleiter hat acht Töne, deine Hand aber nur fünf Finger. Der Trick: Der Daumen geht unter der Hand hindurch.\n\nSpiel C D E mit den Fingern 1 2 3. Während Finger 3 das E hält, schiebst du den Daumen darunter auf das F. Die Hand folgt, und du spielst mit 2 3 auf G und A weiter.',
      ),
      { highlight: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'] },
    ),
    say(
      both('Keep it smooth', 'Schön gebunden'),
      both(
        'The thumb should already be moving while finger 3 plays, so there is no gap and no bump in the sound. Keep the wrist level; only the thumb travels.\n\nPress F with your thumb to carry on.',
        'Der Daumen sollte schon unterwegs sein, während Finger 3 spielt – so entsteht keine Lücke und kein Ruck im Klang. Halte das Handgelenk ruhig, nur der Daumen wandert.\n\nDrück F mit dem Daumen, um weiterzumachen.',
      ),
      { highlight: ['F4'], pressToContinue: 'F4' },
    ),
    ...play(chart('u7l1', 'Thumb under', 76, { R: 'C4/1 D4/2 E4/3 F4/1 | G4/2 A4/3:2 -:1 | C4/1 D4/2 E4/3 F4/1 | G4/2 A4/3 B4/4 -:1 | C5/5:4' }), 'pitch'),
  ]),
  lesson('u7l2', both('Crossing over', 'Übersetzen'), both('Coming back down: a finger over the thumb.', 'Abwärts: ein Finger über den Daumen.'), [
    say(
      both('The way back', 'Der Rückweg'),
      both(
        'Going down, it works the other way round. Play A G F with fingers 3 2 1, then lift finger 3 over the thumb onto E. From there, 2 and 1 take you home to D and C.\n\nThe thumb is the pivot: the hand turns around it like a door on its hinge.',
        'Abwärts geht es andersherum. Spiel A G F mit den Fingern 3 2 1 und führe dann Finger 3 über den Daumen auf das E. Von dort bringen dich 2 und 1 zurück nach D und C.\n\nDer Daumen ist der Drehpunkt: Die Hand dreht sich um ihn wie eine Tür um ihre Angel.',
      ),
      { highlight: ['A4', 'G4', 'F4', 'E4', 'D4', 'C4'] },
    ),
    ...play(
      chart('u7l2', 'Crossing over', 76, { R: 'A4/3 G4/2 F4/1 E4/3 | D4/2 C4/1:2 -:1 | C4/1 D4/2 E4/3 F4/1 | G4/2 A4/3 G4/2 F4/1 | E4/3 D4/2 C4/1:2' }),
      'pitch',
    ),
  ]),
  lesson('u7l3', both('C major scale, right hand', 'C-Dur-Tonleiter rechts'), both('Eight notes up and down, in time.', 'Acht Töne hinauf und hinab, im Takt.'), [
    say(
      both('Your first scale', 'Deine erste Tonleiter'),
      both(
        'A scale walks up every note of a key, from one C to the next. In C major that means every white key.\n\nFingering going up: 1 2 3, thumb under, 1 2 3 4 5. Coming down: 5 4 3 2 1, finger 3 over, 3 2 1. Pianists practise scales every day; they make every piece in that key easier.',
        'Eine Tonleiter läuft alle Töne einer Tonart hinauf, von einem C zum nächsten. In C-Dur sind das alle weißen Tasten.\n\nFingersatz aufwärts: 1 2 3, Daumen unter, 1 2 3 4 5. Abwärts: 5 4 3 2 1, Finger 3 über, 3 2 1. Pianisten üben Tonleitern jeden Tag – sie machen jedes Stück in dieser Tonart leichter.',
      ),
      { highlight: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'] },
    ),
    ...play(chart('u7l3', 'C major scale, right hand', 72, { R: `${C_UP_R} | ${C_DOWN_R} | ${C_UP_R} | ${C_DOWN_R}` }), 'timed', TIMED),
  ]),
  lesson('u7l4', both('C major scale, left hand', 'C-Dur-Tonleiter links'), both('The same scale, mirrored.', 'Dieselbe Tonleiter, gespiegelt.'), [
    say(
      both('Mirror fingering', 'Gespiegelter Fingersatz'),
      both(
        'In the left hand the crossings come in other places. Going up: 5 4 3 2 1 from C to G, then finger 3 crosses over the thumb onto A, and 2 1 finish on B and C.\n\nComing down: 1 2 3 on C B A, the thumb passes under onto G, and 2 3 4 5 bring you home.',
        'In der linken Hand liegen die Übergänge an anderen Stellen. Aufwärts: 5 4 3 2 1 von C bis G, dann setzt Finger 3 über den Daumen auf das A, und 2 1 enden auf H und C.\n\nAbwärts: 1 2 3 auf C H A, der Daumen geht unter auf das G, und 2 3 4 5 bringen dich nach Hause.',
      ),
      { highlight: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'] },
    ),
    ...play(chart('u7l4', 'C major scale, left hand', 69, { L: `${C_UP_L} | ${C_DOWN_L} | ${C_UP_L} | ${C_DOWN_L}` }), 'timed', TIMED),
  ]),
  lesson('u7l5', both('Scale, hands together', 'Tonleiter beidhändig'), both('The C major scale with both hands at once.', 'Die C-Dur-Tonleiter mit beiden Händen zugleich.'), [
    say(
      both('Different fingers, same notes', 'Verschiedene Finger, gleiche Töne'),
      both(
        'Both hands play the same notes an octave apart, but their crossings come at different moments: the right thumb passes under on F, the left finger 3 crosses over on A.\n\nThe music waits for you here, so put each crossing in its place before thinking about speed.',
        'Beide Hände spielen dieselben Töne im Abstand einer Oktave, aber die Übergänge kommen zu verschiedenen Zeitpunkten: Der rechte Daumen geht beim F unter, der linke Finger 3 setzt beim A über.\n\nDie Musik wartet hier auf dich – bring erst jeden Übergang an seinen Platz, bevor du an Tempo denkst.',
      ),
    ),
    ...play(chart('u7l5', 'Scale, hands together', 60, { R: `${C_UP_R} | ${C_DOWN_R}`, L: `${C_UP_L} | ${C_DOWN_L}` }), 'pitch'),
  ]),
  lesson('u7l6', both('G major', 'G-Dur'), both('A scale with one black key.', 'Eine Tonleiter mit einer schwarzen Taste.'), [
    say(
      both('F sharp', 'Fis'),
      both(
        'G major starts on G and uses every white key except F. In its place you play the black key just above it: F sharp.\n\nThe fingering is the same as in C major. In the right hand, F sharp falls to finger 4 on the way up, and the thumb passes under after B.\n\nPress F sharp to carry on.',
        'G-Dur beginnt auf G und nutzt alle weißen Tasten außer F. Stattdessen spielst du die schwarze Taste direkt darüber: Fis.\n\nDer Fingersatz ist derselbe wie in C-Dur. In der rechten Hand fällt das Fis aufwärts auf Finger 4, und der Daumen geht nach dem H unter.\n\nDrück Fis, um weiterzumachen.',
      ),
      { highlight: ['F#4', 'F#5'], pressToContinue: 'F#4' },
    ),
    ...play(
      chart('u7l6', 'G major', 72, {
        R: 'G4/1 A4/2 B4/3 C5/1 | D5/2 E5/3 F#5/4 G5/5 | G5/5 F#5/4 E5/3 D5/2 | C5/1 B4/3 A4/2 G4/1 | G4/1 A4/2 B4/3 C5/1 | D5/2 E5/3 F#5/4 G5/5 | F#5/4 E5/3 D5/2 C5/1 | B4/3 A4/2 G4/1:2',
      }),
      'timed',
      TIMED,
    ),
  ]),
]
