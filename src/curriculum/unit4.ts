import { both } from '../i18n'
import { chart, lesson, play, say, TIMED } from './build'
import type { Lesson } from './types'

export const unit4: Lesson[] = [
  lesson('u4l1', both('Left hand home', 'Grundstellung links'), both('C position, one octave down.', 'C-Lage, eine Oktave tiefer.'), [
    say(
      both('A mirror image', 'Ein Spiegelbild'),
      both(
        'Your left hand gets its own C position, on the C below middle C. This time the little finger (5) goes on C and the thumb (1) on G.\n\nIt is a mirror of your right hand: going up the keys, the fingers count down, 5 4 3 2 1.\n\nLeft-hand notes have their own colour on the highway. Press the low C with your left little finger to carry on.',
        'Deine linke Hand bekommt ihre eigene C-Lage, auf dem C unterhalb des mittleren C. Diesmal liegt der kleine Finger (5) auf C und der Daumen (1) auf G.\n\nSie ist ein Spiegelbild der rechten Hand: Nach oben hin zählen die Finger rückwärts, 5 4 3 2 1.\n\nNoten der linken Hand haben auf der Notenbahn ihre eigene Farbe. Drück das tiefe C mit dem linken kleinen Finger, um weiterzumachen.',
      ),
      { highlight: ['C3', 'D3', 'E3', 'F3', 'G3'], pressToContinue: 'C3' },
    ),
    ...play(chart('u4l1', 'Left hand home', 66, { L: 'C3 D3 E3 F3 | G3:4 | G3 F3 E3 D3 | C3:4 | C3 D3 E3 F3 | G3 F3 E3 D3 | C3:4' }), 'timed', TIMED),
  ]),
  lesson('u4l2', both('Left-hand steps and skips', 'Schritte und Sprünge links'), both('Getting the weaker fingers moving.', 'Die schwächeren Finger in Bewegung bringen.'), [
    say(
      both('Waking up fingers 4 and 5', 'Finger 4 und 5 aufwecken'),
      both(
        'For most people the left ring and little fingers are the weakest. That is normal, and it improves quickly.\n\nKeep the hand relaxed and let each finger drop into its key. Skips here use fingers 5, 3 and 1.',
        'Bei den meisten Menschen sind Ring- und kleiner Finger der linken Hand die schwächsten. Das ist normal und wird schnell besser.\n\nHalte die Hand locker und lass jeden Finger in seine Taste fallen. Die Sprünge hier nehmen die Finger 5, 3 und 1.',
      ),
      { highlight: ['C3', 'E3', 'G3'] },
    ),
    ...play(chart('u4l2', 'Left-hand steps and skips', 69, { L: 'C3 E3 G3:2 | G3 E3 C3:2 | C3 D3 E3 C3 | E3 F3 G3:2 | G3 E3 G3 E3 | F3 D3 F3 D3 | E3 D3 C3:2' }), 'timed', TIMED),
  ]),
  lesson('u4l3', both('Mary, left-handed', 'Mary mit links'), both('A tune you know, in the other hand.', 'Eine bekannte Melodie in der anderen Hand.'), [
    say(
      both('Same tune, new hand', 'Gleiche Melodie, neue Hand'),
      both(
        'Playing a tune you already know with the other hand is one of the fastest ways to train it. Your ear knows where the melody goes, so your fingers only have to follow.\n\nIt starts on E, which is finger 3 in this hand too.',
        'Eine bekannte Melodie mit der anderen Hand zu spielen, ist eine der schnellsten Arten, diese Hand zu trainieren. Dein Ohr weiß, wohin die Melodie geht, die Finger müssen nur folgen.\n\nSie beginnt auf E – auch in dieser Hand Finger 3.',
      ),
      { highlight: ['C3', 'D3', 'E3', 'G3'] },
    ),
    ...play(chart('u4l3', 'Mary, left-handed', 80, { L: 'E3 D3 C3 D3 | E3 E3 E3:2 | D3 D3 D3:2 | E3 G3 G3:2 | E3 D3 C3 D3 | E3 E3 E3 E3 | D3 D3 E3 D3 | C3:4' }), 'timed', TIMED),
  ]),
  lesson('u4l4', both('Bass notes', 'Basstöne'), both('The long low notes that hold a song up.', 'Die langen tiefen Töne, die ein Lied tragen.'), [
    say(
      both('The job of the left hand', 'Die Aufgabe der linken Hand'),
      both(
        'In most piano music the right hand sings the tune and the left hand supports it with long, low notes called bass notes.\n\nThree of them do most of the work in the key of C: C (finger 5), F (finger 2) and G (finger 1). Play them firmly and hold each one for its full length.',
        'In den meisten Klavierstücken singt die rechte Hand die Melodie, und die linke stützt sie mit langen, tiefen Tönen, den Basstönen.\n\nIn C-Dur erledigen drei davon die meiste Arbeit: C (Finger 5), F (Finger 2) und G (Finger 1). Spiel sie kräftig und halte jeden für seine volle Länge.',
      ),
      { highlight: ['C3', 'F3', 'G3'] },
    ),
    ...play(chart('u4l4', 'Bass notes', 72, { L: 'C3:4 | G3:4 | C3:2 G3:2 | C3:4 | C3:2 F3:2 | G3:4 | F3:2 G3:2 | C3:4' }), 'timed', TIMED),
  ]),
]
