import { both } from '../i18n'
import { chart, lesson, play, pointer, say } from './build'
import type { Lesson } from './types'

export const unit1: Lesson[] = [
  lesson('u1l2', both('Finding C', 'Das C finden'), both('The most important key on the piano.', 'Die wichtigste Taste am Klavier.'), [
    say(
      both('Welcome to the keyboard', 'Willkommen an der Tastatur'),
      both(
        'A piano looks like a long row of identical keys, but it has a pattern. Look at the black keys: they come in groups of two, then three, then two, then three.\n\nThose groups are your landmarks. Once you can spot them, you can find any note without counting.',
        'Ein Klavier sieht aus wie eine lange Reihe gleicher Tasten, doch es hat ein Muster. Sieh dir die schwarzen Tasten an: Sie kommen in Gruppen zu zweit, dann zu dritt, dann wieder zu zweit und zu dritt.\n\nDiese Gruppen sind deine Orientierungspunkte. Wenn du sie erkennst, findest du jeden Ton, ohne zu zählen.',
      ),
      { highlight: ['C#4', 'D#4', 'F#4', 'G#4', 'A#4'] },
    ),
    say(
      both('How the highway works', 'So funktioniert die Notenbahn'),
      both(
        'Notes slide down towards the keyboard. When a note reaches the bright line, press the key it lands on.\n\nIn these first lessons the notes wait for you, so there is no rush. Use the pointer finger of your right hand.\n\nWhen Pianova plays a piece to you first, a small band plays along. Turn it up or down with the mixer button on the play screen.',
        'Die Noten gleiten auf die Tastatur zu. Wenn eine Note die helle Linie erreicht, drückst du die Taste, auf der sie landet.\n\nIn den ersten Lektionen warten die Noten auf dich, du hast also keine Eile. Spiel mit dem Zeigefinger der rechten Hand.\n\nWenn Pianova dir ein Stück zuerst vorspielt, spielt eine kleine Band mit. Mit dem Mixer-Knopf auf dem Spielbildschirm machst du sie lauter oder leiser.',
      ),
    ),
    say(
      both('C lives left of the twos', 'Das C wohnt links der Zweiergruppe'),
      both(
        'Find a group of two black keys. The white key just to the left of the group is always C.\n\nEvery C on the keyboard sits in that same spot. The one near the middle of the piano is called middle C, and it will be your home base.\n\nPress middle C to carry on.',
        'Such dir eine Gruppe aus zwei schwarzen Tasten. Die weiße Taste direkt links davon ist immer ein C.\n\nJedes C auf der Tastatur sitzt an genau dieser Stelle. Das C in der Mitte des Klaviers heißt mittleres C – es ist dein Ausgangspunkt.\n\nDrück das mittlere C, um weiterzumachen.',
      ),
      { highlight: ['C3', 'C4', 'C5'], pressToContinue: 'C4' },
    ),
    ...play(chart('u1l2', 'Finding C', 80, { R: pointer('C4 C4 C5 C5 | C4 C4 C3 C3 | C4 C5 C4 C3 | C4:4') }), 'pitch'),
  ]),
  lesson('u1l3', 'C, D, E', both('The three white keys around the two black keys.', 'Die drei weißen Tasten rund um die zwei schwarzen.'), [
    say(
      both('Neighbours of C', 'Die Nachbarn von C'),
      both(
        'White keys are named with letters, going up to the right. After C comes D, then E.\n\nD is easy to spot: it sits between the two black keys. E is just to the right of the group.',
        'Die weißen Tasten tragen Buchstaben, aufsteigend nach rechts. Nach C kommt D, dann E.\n\nDas D ist leicht zu finden: Es liegt zwischen den beiden schwarzen Tasten. Das E liegt direkt rechts von der Gruppe.',
      ),
      { highlight: ['C4', 'D4', 'E4'] },
    ),
    say(
      both('Three fingers', 'Drei Finger'),
      both(
        'Rest your right thumb on middle C, your pointer finger on D and your middle finger on E. Keep your fingers curved, as if holding a ball.\n\nThe small numbers on the notes tell you which finger to use: thumb is 1, pointer is 2, middle is 3.\n\nPress D to carry on.',
        'Leg den rechten Daumen auf das mittlere C, den Zeigefinger auf D und den Mittelfinger auf E. Halte die Finger gewölbt, als hieltest du einen Ball.\n\nDie kleinen Zahlen auf den Noten sagen dir, welcher Finger dran ist: Daumen ist 1, Zeigefinger 2, Mittelfinger 3.\n\nDrück D, um weiterzumachen.',
      ),
      { highlight: ['D4'], pressToContinue: 'D4' },
    ),
    ...play(chart('u1l3', 'C, D, E', 80, { R: 'C4 D4 E4:2 | E4 D4 C4:2 | C4 E4 D4 E4 | C4 D4 C4:2' }), 'pitch'),
  ]),
  lesson('u1l4', both('The whole alphabet', 'Alle sieben Töne'), both('F, G, A and B complete the set of seven.', 'F, G, A und H machen die sieben komplett.'), [
    say(
      both('Seven letters, then round again', 'Sieben Namen, dann von vorn'),
      both(
        'Music uses only seven letters: A B C D E F G. After G it starts again at A.\n\nF sits just left of the group of three black keys. G and A are tucked inside that group, and B is just right of it. Then comes the next C.',
        'Die Musik kommt mit sieben Tonnamen aus: C D E F G A H. Nach dem H beginnt es wieder mit C.\n\nDas F liegt direkt links von der Dreiergruppe schwarzer Tasten. G und A liegen innerhalb dieser Gruppe, das H direkt rechts davon. Dann kommt das nächste C.',
      ),
      { highlight: ['F4', 'G4', 'A4', 'B4'] },
    ),
    say(
      both('Walk up the keys', 'Die Tasten hinaufwandern'),
      both(
        'Use your pointer finger for this one and walk up the white keys from C to the next C, saying the letters aloud as you go. Saying them is what makes them stick.\n\nPress F to carry on.',
        'Nimm für diese Übung den Zeigefinger und wandere die weißen Tasten von C bis zum nächsten C hinauf. Sag die Tonnamen dabei laut – so bleiben sie hängen.\n\nDrück F, um weiterzumachen.',
      ),
      { highlight: ['F4'], pressToContinue: 'F4' },
    ),
    ...play(chart('u1l4', 'The whole alphabet', 80, { R: pointer('C4 D4 E4 F4 | G4 A4 B4 C5 | C5 B4 A4 G4 | F4 E4 D4 C4 | F4 A4 G4 B4 | C5:2 C4:2') }), 'pitch'),
  ]),
]
