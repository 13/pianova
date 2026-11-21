import { both } from '../i18n'
import { chart, lesson, play, say, TIMED } from './build'
import type { Lesson } from './types'

export const unit3: Lesson[] = [
  lesson('u3l1', both('The beat', 'Der Grundschlag'), both('Playing exactly with the click.', 'Genau mit dem Klick spielen.'), [
    say(
      both('Music has a pulse', 'Musik hat einen Puls'),
      both(
        'Until now the notes waited for you. Real music keeps moving, on a steady pulse called the beat.\n\nYou will hear a click on every beat. A note that lasts one beat is a quarter note. Count along: 1, 2, 3, 4.',
        'Bisher haben die Noten auf dich gewartet. Echte Musik läuft weiter, in einem gleichmäßigen Puls, dem Grundschlag.\n\nDu hörst auf jedem Schlag einen Klick. Eine Note, die einen Schlag dauert, ist eine Viertelnote. Zähl mit: 1, 2, 3, 4.',
      ),
    ),
    say(
      both('How timing is scored', 'So wird das Timing bewertet'),
      both(
        'From now on the last step of each lesson runs in time. You get four clicks to count you in, then press each key just as its note touches the line.\n\nClose is good, spot on is perfect. If you miss one, keep going. Staying with the beat matters more than any single note.',
        'Ab jetzt läuft der letzte Schritt jeder Lektion im Takt. Du bekommst vier Klicks zum Einzählen, dann drückst du jede Taste genau dann, wenn ihre Note die Linie berührt.\n\nKnapp daneben ist gut, genau drauf ist perfekt. Wenn du eine verpasst, spiel weiter. Im Takt zu bleiben ist wichtiger als jede einzelne Note.',
      ),
    ),
    ...play(chart('u3l1', 'The beat', 72, { R: 'C4 C4 C4 C4 | D4 D4 D4 D4 | E4 E4 E4 E4 | D4 D4 C4 C4 | C4 D4 E4 D4 | C4 D4 E4 D4 | C4 C4 E4 E4 | C4 C4 C4 C4' }), 'timed', TIMED),
  ]),
  lesson('u3l2', both('Long notes', 'Lange Noten'), both('Half notes and whole notes.', 'Halbe und ganze Noten.'), [
    say(
      both('Holding on', 'Aushalten'),
      both(
        'Longer bars on the highway are longer notes. A half note lasts two beats, a whole note lasts four.\n\nPress when the front of the bar reaches the line and hold the key down until the tail has gone. Keep counting through the long notes: 1, 2, 3, 4.',
        'Längere Balken auf der Notenbahn sind längere Noten. Eine halbe Note dauert zwei Schläge, eine ganze Note vier.\n\nDrück, wenn der Anfang des Balkens die Linie erreicht, und halte die Taste, bis das Ende verschwunden ist. Zähl bei langen Noten weiter: 1, 2, 3, 4.',
      ),
    ),
    ...play(chart('u3l2', 'Long notes', 76, { R: 'C4:2 E4:2 | G4:4 | F4:2 D4:2 | C4:4 | C4 D4 E4:2 | E4 F4 G4:2 | G4:2 E4:2 | C4:4' }), 'timed', TIMED),
  ]),
  lesson('u3l3', both('Rests', 'Pausen'), both('Silence that keeps time.', 'Stille, die im Takt bleibt.'), [
    say(
      both('Counting the gaps', 'Die Lücken zählen'),
      both(
        'A gap on the highway is a rest: a beat where you play nothing. The beat carries on, so keep counting through the silence.\n\nLift your finger for the rest and let the click fill the space. Rushing through rests is the most common beginner habit, so let them last.',
        'Eine Lücke auf der Notenbahn ist eine Pause: ein Schlag, in dem du nichts spielst. Der Grundschlag läuft weiter, also zähl auch in der Stille weiter.\n\nHeb den Finger für die Pause an und lass den Klick die Lücke füllen. Durch Pausen zu hetzen ist die häufigste Anfängergewohnheit – gönn ihnen ihre volle Länge.',
      ),
    ),
    ...play(chart('u3l3', 'Rests', 76, { R: 'C4 -:1 E4 -:1 | G4 G4 -:2 | F4 -:1 D4 -:1 | C4:2 -:2 | E4 E4 -:1 E4 | G4 -:1 G4 -:1 | F4 D4 -:2 | C4:4' }), 'timed', TIMED),
  ]),
  lesson('u3l4', both('Hot Cross Buns, in time', 'Hot Cross Buns im Takt'), both('A tune you know, now with a beat.', 'Eine bekannte Melodie, jetzt mit Grundschlag.'), [
    say(
      both('Putting it together', 'Alles zusammen'),
      both(
        'You already know these notes. This time they come with a rhythm: half notes, a whole note, then a run of quick quarter notes.\n\nWatch the demo and count along before you play.',
        'Diese Töne kennst du schon. Diesmal kommen sie mit einem Rhythmus: halbe Noten, eine ganze Note und dann eine Reihe schneller Viertel.\n\nSieh dir die Vorführung an und zähl mit, bevor du spielst.',
      ),
      { highlight: ['C4', 'D4', 'E4'] },
    ),
    ...play(chart('u3l4', 'Hot Cross Buns, in time', 92, { R: 'E4:2 D4:2 | C4:4 | E4:2 D4:2 | C4:4 | C4 C4 C4 C4 | D4 D4 D4 D4 | E4:2 D4:2 | C4:4' }), 'timed', TIMED),
  ]),
]
