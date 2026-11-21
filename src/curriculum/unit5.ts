import { both } from '../i18n'
import { chart, lesson, play, say, TIMED } from './build'
import type { Lesson } from './types'

export const unit5: Lesson[] = [
  lesson('u5l1', both('Taking turns', 'Abwechselnd'), both('Both hands ready, one playing at a time.', 'Beide Hände bereit, immer eine spielt.'), [
    say(
      both('Call and answer', 'Ruf und Antwort'),
      both(
        'Place both hands in C position: right thumb on middle C, left little finger on the C below.\n\nThe right hand plays a short phrase and the left hand answers it. Keep the resting hand on its keys so it is ready when its turn comes.',
        'Leg beide Hände in die C-Lage: rechter Daumen auf das mittlere C, linker kleiner Finger auf das C darunter.\n\nDie rechte Hand spielt eine kurze Phrase, die linke antwortet. Lass die ruhende Hand auf ihren Tasten liegen, damit sie bereit ist, wenn sie dran ist.',
      ),
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
  lesson('u5l2', both('Together', 'Zusammen'), both('Both hands playing the same notes at once.', 'Beide Hände spielen gleichzeitig dieselben Töne.'), [
    say(
      both('Two hands, one sound', 'Zwei Hände, ein Klang'),
      both(
        'Now both hands play at the same moment, the same letters an octave apart. The notes line up side by side on the highway.\n\nThe fingers do not match: when your right thumb plays C, your left little finger does. Go slowly and let the two hands land as one sound.',
        'Jetzt spielen beide Hände im selben Moment, dieselben Töne im Abstand einer Oktave. Die Noten liegen auf der Notenbahn nebeneinander.\n\nDie Finger stimmen nicht überein: Wenn dein rechter Daumen C spielt, spielt es links der kleine Finger. Lass dir Zeit und lass beide Hände wie ein Klang landen.',
      ),
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
  lesson('u5l3', both('Melody over bass', 'Melodie über dem Bass'), both('The left hand holds while the right hand moves.', 'Die linke Hand hält, die rechte bewegt sich.'), [
    say(
      both('Doing two different things', 'Zwei verschiedene Dinge tun'),
      both(
        'This is the heart of piano playing: the left hand holds one long bass note while the right hand plays a melody above it.\n\nIt feels strange at first. Use the tools on the play screen to practise one hand at a time, then put them together.',
        'Das ist das Herz des Klavierspiels: Die linke Hand hält einen langen Basston, während die rechte darüber eine Melodie spielt.\n\nAm Anfang fühlt sich das seltsam an. Übe mit den Werkzeugen auf dem Spielbildschirm zuerst jede Hand allein und setz sie dann zusammen.',
      ),
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
  lesson('u5l4', both('Ode to Joy', 'Ode an die Freude'), both('Beethoven, with both hands.', 'Beethoven, mit beiden Händen.'), [
    say(
      both('Your first two-handed piece', 'Dein erstes Stück für beide Hände'),
      both(
        "Ode to Joy is the big tune from Beethoven's ninth symphony, and it fits perfectly under five fingers.\n\nThe right hand moves almost entirely by step. The left hand swaps between just two bass notes, C and G, one per bar.",
        'Die Ode an die Freude ist die große Melodie aus Beethovens neunter Sinfonie, und sie passt perfekt unter fünf Finger.\n\nDie rechte Hand bewegt sich fast nur in Schritten. Die linke wechselt zwischen nur zwei Basstönen, C und G, einer pro Takt.',
      ),
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
