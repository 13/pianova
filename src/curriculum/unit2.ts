import { both } from '../i18n'
import { chart, lesson, play, say } from './build'
import type { Lesson } from './types'

export const unit2: Lesson[] = [
  lesson('u2l1', both('Five fingers, five keys', 'Fünf Finger, fünf Tasten'), both('Your right hand finds its home position.', 'Deine rechte Hand findet ihre Grundstellung.'), [
    say(
      both('Finger numbers', 'Fingernummern'),
      both(
        'Pianists number their fingers. On both hands the thumb is 1, the pointer is 2, the middle is 3, the ring finger is 4 and the little finger is 5.',
        'Pianisten nummerieren ihre Finger. An beiden Händen ist der Daumen 1, der Zeigefinger 2, der Mittelfinger 3, der Ringfinger 4 und der kleine Finger 5.',
      ),
    ),
    say(
      both('C position', 'C-Lage'),
      both(
        'Put your right thumb on middle C and let each finger rest on the next white key: C D E F G. This is called C position.\n\nYour hand stays put. Each finger owns one key, so you never need to look down to find a note.\n\nPress G with your little finger to carry on.',
        'Leg den rechten Daumen auf das mittlere C und lass jeden Finger auf der nächsten weißen Taste ruhen: C D E F G. Das nennt man die C-Lage.\n\nDeine Hand bleibt, wo sie ist. Jeder Finger hat seine eigene Taste, du musst also nie hinschauen, um einen Ton zu finden.\n\nDrück G mit dem kleinen Finger, um weiterzumachen.',
      ),
      { highlight: ['C4', 'D4', 'E4', 'F4', 'G4'], pressToContinue: 'G4' },
    ),
    ...play(chart('u2l1', 'Five fingers, five keys', 80, { R: 'C4 D4 E4 F4 | G4:4 | G4 F4 E4 D4 | C4:4 | C4 D4 E4 F4 | G4 F4 E4 D4 | C4:4' }), 'pitch'),
  ]),
  lesson('u2l2', both('Steps and skips', 'Schritte und Sprünge'), both('The two ways a melody moves.', 'Die zwei Arten, wie sich eine Melodie bewegt.'), [
    say(
      both('Next door, or one over', 'Nebenan oder eine weiter'),
      both(
        'Moving to the very next key is a step: C to D, D to E.\n\nJumping over one key is a skip: C to E, E to G. Skips use every other finger: 1, 3, 5.\n\nAlmost every tune is built from steps and skips.',
        'Zur direkt benachbarten Taste zu gehen ist ein Schritt: C nach D, D nach E.\n\nEine Taste zu überspringen ist ein Sprung: C nach E, E nach G. Sprünge nehmen jeden zweiten Finger: 1, 3, 5.\n\nFast jede Melodie besteht aus Schritten und Sprüngen.',
      ),
      { highlight: ['C4', 'E4', 'G4'] },
    ),
    ...play(chart('u2l2', 'Steps and skips', 80, { R: 'C4 D4 E4:2 | C4 E4 G4:2 | G4 F4 E4:2 | G4 E4 C4:2 | C4 E4 D4 F4 | E4 G4 E4 C4 | D4 F4 E4 D4 | C4:4' }), 'pitch'),
  ]),
  lesson('u2l3', 'Hot Cross Buns', both('Your first tune, with just three notes.', 'Deine erste Melodie, mit nur drei Tönen.'), [
    say(
      both('A real tune', 'Eine echte Melodie'),
      both(
        'Hot Cross Buns uses only E, D and C, fingers 3, 2 and 1.\n\nListen to the demo first and hum along. Knowing how a tune goes makes it far easier to play.',
        'Hot Cross Buns kommt mit E, D und C aus, den Fingern 3, 2 und 1.\n\nHör dir zuerst die Vorführung an und summ mit. Wer weiß, wie eine Melodie klingt, spielt sie viel leichter.',
      ),
      { highlight: ['C4', 'D4', 'E4'] },
    ),
    ...play(chart('u2l3', 'Hot Cross Buns', 90, { R: 'E4:2 D4:2 | C4:4 | E4:2 D4:2 | C4:4 | C4 C4 C4 C4 | D4 D4 D4 D4 | E4:2 D4:2 | C4:4' }), 'pitch'),
  ]),
  lesson('u2l4', both('Mary Had a Little Lamb', 'Mary hatte ein kleines Lamm'), both('A longer tune that reaches up to G.', 'Eine längere Melodie, die bis zum G reicht.'), [
    say(
      both('Adding the little finger', 'Der kleine Finger kommt dazu'),
      both(
        'This tune is mostly E, D and C again, with one reach up to G for your little finger.\n\nNotice how often a note repeats. When it does, lift the finger slightly and play again without moving your hand.',
        'Diese Melodie besteht wieder hauptsächlich aus E, D und C, mit einem Griff hinauf zum G für den kleinen Finger.\n\nAchte darauf, wie oft sich ein Ton wiederholt. Heb den Finger dann leicht an und spiel erneut, ohne die Hand zu bewegen.',
      ),
      { highlight: ['C4', 'D4', 'E4', 'G4'] },
    ),
    ...play(chart('u2l4', 'Mary Had a Little Lamb', 96, { R: 'E4 D4 C4 D4 | E4 E4 E4:2 | D4 D4 D4:2 | E4 G4 G4:2 | E4 D4 C4 D4 | E4 E4 E4 E4 | D4 D4 E4 D4 | C4:4' }), 'pitch'),
  ]),
]
