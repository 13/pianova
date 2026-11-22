import { both } from '../i18n'
import { BAND, banded, lesson, chart, play, say, TIMED } from './build'
import type { Lesson } from './types'

const C_POS = ['C3', 'D3', 'E3', 'F3', 'G3', 'C4', 'D4', 'E4', 'F4', 'G4']
const R_POS = ['C4', 'D4', 'E4', 'F4', 'G4']
const L_POS = ['C3', 'D3', 'E3', 'F3', 'G3']
/** Text that ends by pointing out the backing band (said once, in each unit's first lesson). */
const withBand = (en: string, de: string) => both(en + BAND.en, de + BAND.de)

/** A line moved down an octave, for the left hand: 'C4' → 'C3'. */
const down = (line: string) => line.replace(/([A-G][#b]?)(\d)/g, (_, n: string, o: string) => `${n}${Number(o) - 1}`)

// ── Basics in C position ─────────────────────────────────────────────────────

const FIVE = 'C4 D4 E4 F4 | G4 F4 E4 D4 | C4 D4 E4 F4 | G4:4 | G4 F4 E4 D4 | C4 D4 E4 F4 | G4 F4 E4 D4 | C4:4'
const SKIPS_R = 'C4 E4 D4 F4 | E4 G4 E4 C4 | C4 E4 G4 E4 | D4 F4 D4:2 | E4 G4 F4 D4 | C4 E4 D4 F4 | E4 D4 G4 D4 | C4:4'
const SKIPS_L = 'C3 E3 G3 E3 | D3 F3 D3:2 | E3 G3 E3 C3 | G3:4 | C3 E3 D3 F3 | E3 G3 F3 D3 | E3 D3 G3 D3 | C3:4'
const PARALLEL = 'C4 D4 E4 F4 | G4 F4 E4 D4 | C4 E4 D4 F4 | E4 D4 C4:2 | C4 C4 G4 G4 | F4 E4 D4:2 | E4 F4 G4 E4 | C4:4'

const ODE_A = 'E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4:1.5 D4:0.5 D4:2'
const ODE_A2 = 'E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:1.5 C4:0.5 C4:2'
const ODE_B = 'D4 D4 E4 C4 | D4 E4:0.5 F4:0.5 E4 C4 | D4 E4:0.5 F4:0.5 E4 D4 | C4 D4 G3/1:2'
const ODE_L =
  'C3:2 E3:2 | G3:2 D3:2 | C3:2 E3:2 | G3:2 D3:2 | C3:2 E3:2 | G3:2 D3:2 | C3:2 E3:2 | D3:2 C3:2 | ' +
  'G3:2 D3:2 | G3:2 C3:2 | G3:2 D3:2 | C3:2 E3:2 | C3:2 E3:2 | G3:2 D3:2 | C3:2 E3:2 | D3:2 C3:2'

export const unit11: Lesson[] = [
  lesson('u11l1', both('Five fingers, right hand', 'Fünf Finger rechts'), both('Up and down the C position, one finger per key.', 'Durch die C-Lage hinauf und hinab, ein Finger pro Taste.'), [
    say(
      both('C position', 'Die C-Lage'),
      withBand(
        'Put your right thumb on middle C and let the other fingers fall on D, E, F and G. That is C position: one finger for each key, and the hand never has to move.\n\nKeep the fingers curved and play from the knuckles, with an even sound on every note.',
        'Leg den rechten Daumen auf das mittlere C und lass die anderen Finger auf D, E, F und G fallen. Das ist die C-Lage: ein Finger pro Taste, und die Hand muss sich nicht bewegen.\n\nHalte die Finger gewölbt, spiel aus den Fingergelenken und gib jedem Ton den gleichen Klang.',
      ),
      { highlight: R_POS },
    ),
    ...play(banded(chart('u11l1', 'Five fingers, right hand', 84, { R: FIVE })), 'timed', TIMED),
  ]),
  lesson('u11l2', both('Skips, right hand', 'Sprünge rechts'), both('Thirds: every other finger.', 'Terzen: jeder zweite Finger.'), [
    say(
      both('Jumping over a key', 'Über eine Taste springen'),
      both(
        'A skip leaves one key out: C to E, D to F, E to G. The hand stays where it is; only the finger changes.\n\nSay the finger numbers quietly as you play: 1 3, 2 4, 3 5.',
        'Ein Sprung lässt eine Taste aus: C nach E, D nach F, E nach G. Die Hand bleibt, wo sie ist; nur der Finger wechselt.\n\nSprich beim Spielen leise die Fingernummern mit: 1 3, 2 4, 3 5.',
      ),
      { highlight: ['C4', 'E4', 'G4'] },
    ),
    ...play(banded(chart('u11l2', 'Skips, right hand', 80, { R: SKIPS_R })), 'timed', TIMED),
  ]),
  lesson('u11l3', both('Five fingers, left hand', 'Fünf Finger links'), both('The same five keys, an octave lower.', 'Dieselben fünf Töne, eine Oktave tiefer.'), [
    say(
      both('Little finger on C', 'Kleiner Finger auf C'),
      both(
        'In the left hand the numbers run the other way: little finger 5 on the C below middle C, then 4, 3 and 2, and the thumb on G.\n\nGoing up the keys, the numbers go down. It feels backwards for a while; that is normal.',
        'In der linken Hand laufen die Zahlen andersherum: kleiner Finger 5 auf das C unter dem mittleren C, dann 4, 3 und 2, und der Daumen auf G.\n\nWenn es die Tasten hinaufgeht, werden die Zahlen kleiner. Das fühlt sich eine Weile verkehrt an – das ist normal.',
      ),
      { highlight: L_POS },
    ),
    ...play(banded(chart('u11l3', 'Five fingers, left hand', 80, { L: down(FIVE) })), 'timed', TIMED),
  ]),
  lesson('u11l4', both('Skips, left hand', 'Sprünge links'), both('Thirds and fifths in the left hand.', 'Terzen und Quinten in der linken Hand.'), [
    say(
      both('Bass steps', 'Bassschritte'),
      both(
        'The left hand often plays the bass: C, E and G, the notes of the C chord, one after another.\n\nKeep the thumb light on G and let the little finger sink into C. Those two are the anchors of the left hand.',
        'Die linke Hand spielt oft den Bass: C, E und G, die Töne des C-Dur-Akkords, nacheinander.\n\nHalte den Daumen leicht auf dem G und lass den kleinen Finger ins C sinken. Diese beiden sind die Anker der linken Hand.',
      ),
      { highlight: ['C3', 'E3', 'G3'] },
    ),
    ...play(banded(chart('u11l4', 'Skips, left hand', 76, { L: SKIPS_L })), 'timed', TIMED),
  ]),
  lesson('u11l5', both('Both hands, same direction', 'Beide Hände gleichlaufend'), both('The same tune in both hands, an octave apart.', 'Dieselbe Melodie in beiden Händen, eine Oktave auseinander.'), [
    say(
      both('Parallel motion', 'Parallelbewegung'),
      both(
        'Both hands play the same notes at the same time, an octave apart. The keys move the same way, but the fingers do not: when the right hand plays thumb, the left plays little finger.\n\nStart slowly. It is fine to use the practice run to play each hand alone first.',
        'Beide Hände spielen dieselben Töne gleichzeitig, eine Oktave auseinander. Die Tasten laufen in dieselbe Richtung, die Finger aber nicht: Spielt rechts der Daumen, spielt links der kleine Finger.\n\nFang langsam an. Du kannst im Übungsdurchlauf zuerst jede Hand allein spielen.',
      ),
      { highlight: C_POS },
    ),
    ...play(banded(chart('u11l5', 'Both hands, same direction', 72, { R: PARALLEL, L: down(PARALLEL) })), 'timed', TIMED),
  ]),
  lesson('u11l6', both('Both hands, mirrored', 'Beide Hände gespiegelt'), both('Contrary motion: the same fingers, opposite directions.', 'Gegenbewegung: dieselben Finger, entgegengesetzte Richtungen.'), [
    say(
      both('Contrary motion', 'Gegenbewegung'),
      both(
        'Now the hands move away from each other and back. The right hand starts with the thumb on C and goes up; the left hand starts with the thumb on G and goes down.\n\nThe good news: both hands use the same finger at the same moment, 1 with 1, 2 with 2. Many players find this easier than parallel motion.',
        'Jetzt bewegen sich die Hände voneinander weg und wieder zueinander. Die rechte Hand beginnt mit dem Daumen auf C und geht hinauf, die linke beginnt mit dem Daumen auf G und geht hinab.\n\nDas Gute daran: Beide Hände nehmen im selben Moment denselben Finger, 1 mit 1, 2 mit 2. Vielen fällt das leichter als die Parallelbewegung.',
      ),
      { highlight: ['C4', 'G3'] },
    ),
    ...play(
      banded(
        chart('u11l6', 'Both hands, mirrored', 72, {
          R: 'C4 D4 E4 F4 | G4 F4 E4 D4 | C4 E4 D4 F4 | E4 G4:3 | G4 F4 E4 D4 | C4 D4 E4 F4 | E4 D4 E4 D4 | C4:4',
          L: 'G3 F3 E3 D3 | C3 D3 E3 F3 | G3 E3 F3 D3 | E3 C3:3 | C3 D3 E3 F3 | G3 F3 E3 D3 | E3 F3 E3 F3 | G3:4',
        }),
      ),
      'timed',
      TIMED,
    ),
  ]),
  lesson('u11l7', both('Ode to Joy', 'Ode an die Freude'), both('The whole tune, both hands, in C position.', 'Die ganze Melodie, beide Hände, in der C-Lage.'), [
    say(
      both('Everything together', 'Alles zusammen'),
      both(
        "All sixteen bars of Beethoven's tune. The right hand stays in C position except once: at the end of the middle part the thumb reaches down to the G below middle C.\n\nThe left hand walks between C, D, E and G in half notes. Watch the dotted rhythm at the end of each line: a long note and a short one.",
        'Alle sechzehn Takte von Beethovens Melodie. Die rechte Hand bleibt in der C-Lage, bis auf einmal: Am Ende des Mittelteils greift der Daumen hinunter zum G unter dem mittleren C.\n\nDie linke Hand wandert in halben Noten zwischen C, D, E und G. Achte auf den punktierten Rhythmus am Ende jeder Zeile: ein langer Ton und ein kurzer.',
      ),
      { highlight: [...C_POS, 'G3'] },
    ),
    ...play(banded(chart('u11l7', 'Ode to Joy', 92, { R: `${ODE_A} | ${ODE_A2} | ${ODE_B} | ${ODE_A2}`, L: ODE_L })), 'timed', TIMED),
  ]),
]

// ── Melodies with two hands ──────────────────────────────────────────────────

const HAENSCHEN =
  'G4 E4 E4:2 | F4 D4 D4:2 | C4 D4 E4 F4 | G4 G4 G4:2 | G4 E4 E4:2 | F4 D4 D4:2 | C4 E4 G4 G4 | C4:4 | ' +
  'D4 D4 D4 D4 | D4 E4 F4:2 | E4 E4 E4 E4 | E4 F4 G4:2 | G4 E4 E4:2 | F4 D4 D4:2 | C4 E4 G4 G4 | C4:4'
const ENTCHEN_R = 'C4 D4 E4 F4 | G4:2 G4:2 | A4/5 A4/5 A4/5 A4/5 | G4:4 | A4/5 A4/5 A4/5 A4/5 | G4:4 | F4 F4 F4 F4 | E4:2 E4:2 | D4 D4 D4 D4 | C4:4'
// The left hand reaches A with the thumb, one key past G.
const ENTCHEN_L = 'C3 D3 E3 F3 | G3:2 G3:2 | A3/1 A3/1 A3/1 A3/1 | G3:4 | A3/1 A3/1 A3/1 A3/1 | G3:4 | F3 F3 F3 F3 | E3:2 E3:2 | D3 D3 D3 D3 | C3:4'

export const unit12: Lesson[] = [
  lesson('u12l1', both('Hänschen klein, left hand', 'Hänschen klein links'), both('A folk song, first in the left hand.', 'Ein Volkslied, zuerst in der linken Hand.'), [
    say(
      both('The tune in the bass', 'Die Melodie im Bass'),
      withBand(
        'Every tune in this unit is learned three times: left hand, right hand, then both together. Starting with the weaker hand gives it the most practice.\n\nThis folk song fits exactly under five fingers. Left little finger on C, thumb on G.',
        'Jede Melodie in dieser Einheit lernst du dreimal: linke Hand, rechte Hand, dann beide zusammen. Wer mit der schwächeren Hand beginnt, gibt ihr die meiste Übung.\n\nDieses Volkslied passt genau unter fünf Finger. Linker kleiner Finger auf C, Daumen auf G.',
      ),
      { highlight: L_POS },
    ),
    ...play(banded(chart('u12l1', 'Hänschen klein, left hand', 88, { L: down(HAENSCHEN) })), 'timed', TIMED),
  ]),
  lesson('u12l2', both('Hänschen klein, right hand', 'Hänschen klein rechts'), both('The same song, an octave higher.', 'Dasselbe Lied, eine Oktave höher.'), [
    say(
      both('Now the right hand', 'Jetzt die rechte Hand'),
      both(
        'Same notes, same rhythm, other hand: thumb on middle C, little finger on G. The song starts on G, so begin with finger 5.',
        'Gleiche Töne, gleicher Rhythmus, andere Hand: Daumen auf dem mittleren C, kleiner Finger auf G. Das Lied beginnt auf G, also fang mit Finger 5 an.',
      ),
      { highlight: R_POS },
    ),
    ...play(banded(chart('u12l2', 'Hänschen klein, right hand', 92, { R: HAENSCHEN })), 'timed', TIMED),
  ]),
  lesson('u12l3', both('Hänschen klein, both hands', 'Hänschen klein beidhändig'), both('The melody in both hands at once.', 'Die Melodie in beiden Händen zugleich.'), [
    say(
      both('Two hands, one tune', 'Zwei Hände, eine Melodie'),
      both(
        'Now both hands play the melody together, an octave apart. Listen for one sound, not two: the hands should land at exactly the same moment.',
        'Jetzt spielen beide Hände die Melodie zusammen, eine Oktave auseinander. Hör auf einen Klang, nicht auf zwei: Die Hände sollen genau im selben Moment landen.',
      ),
      { highlight: C_POS },
    ),
    ...play(banded(chart('u12l3', 'Hänschen klein, both hands', 84, { R: HAENSCHEN, L: down(HAENSCHEN) })), 'timed', TIMED),
  ]),
  lesson('u12l4', both('All my little ducklings, left hand', 'Alle meine Entchen links'), both('One key past the five-finger position.', 'Eine Taste über die Fünffingerlage hinaus.'), [
    say(
      both('Reaching for A', 'Nach dem A greifen'),
      both(
        'This song climbs one key higher than G, to A. In the left hand the thumb stretches up to A and comes back to G; the rest of the hand stays put.',
        'Dieses Lied steigt eine Taste über das G hinaus, bis zum A. In der linken Hand streckt sich der Daumen zum A und kehrt zum G zurück; der Rest der Hand bleibt liegen.',
      ),
      { highlight: [...L_POS, 'A3'] },
    ),
    ...play(banded(chart('u12l4', 'All my little ducklings, left hand', 88, { L: ENTCHEN_L })), 'timed', TIMED),
  ]),
  lesson('u12l5', both('All my little ducklings, right hand', 'Alle meine Entchen rechts'), both('The little finger stretches to A.', 'Der kleine Finger streckt sich zum A.'), [
    say(
      both('The little finger reaches', 'Der kleine Finger greift weiter'),
      both(
        'In the right hand it is the little finger that stretches: it plays both G and A. Open the hand a little rather than moving it.',
        'In der rechten Hand streckt sich der kleine Finger: Er spielt G und A. Öffne die Hand ein wenig, statt sie zu verschieben.',
      ),
      { highlight: [...R_POS, 'A4'] },
    ),
    ...play(banded(chart('u12l5', 'All my little ducklings, right hand', 92, { R: ENTCHEN_R })), 'timed', TIMED),
  ]),
  lesson('u12l6', both('All my little ducklings, both hands', 'Alle meine Entchen beidhändig'), both('Both hands reach for A together.', 'Beide Hände greifen zusammen zum A.'), [
    say(
      both('Thumb and little finger', 'Daumen und kleiner Finger'),
      both(
        'Both hands together: when the tune reaches A, the right little finger and the left thumb stretch at the same moment.',
        'Beide Hände zusammen: Wenn die Melodie das A erreicht, strecken sich der rechte kleine Finger und der linke Daumen im selben Moment.',
      ),
      { highlight: [...C_POS, 'A3', 'A4'] },
    ),
    ...play(banded(chart('u12l6', 'All my little ducklings, both hands', 84, { R: ENTCHEN_R, L: ENTCHEN_L })), 'timed', TIMED),
  ]),
]

// ── Harmonic intervals ───────────────────────────────────────────────────────

const FROM_C = '[C4 D4]:2 [C4 E4]:2 | [C4 F4]:2 [C4 G4]:2 | [C4 G4]:2 [C4 F4]:2 | [C4 E4]:2 [C4 D4]:2 | [C4 E4] [C4 E4] [C4 G4]:2 | [C4 F4] [C4 E4] [C4 D4]:2 | [C4 E4]:2 [C4 G4]:2 | [C4 E4]:4'
const THIRDS = '[C4 E4] [D4 F4] [E4 G4]:2 | [D4 F4] [C4 E4] [D4 F4]:2 | [E4 G4] [D4 F4] [C4 E4] [D4 F4] | [E4 G4]:4 | [E4 G4] [D4 F4] [C4 E4]:2 | [D4 F4] [E4 G4] [D4 F4]:2 | [C4 E4] [D4 F4] [E4 G4] [D4 F4] | [C4 E4]:4'
// Left hand measured from its thumb on G, down to the other fingers.
const FROM_G = '[F3 G3]:2 [E3 G3]:2 | [D3 G3]:2 [C3 G3]:2 | [C3 G3]:2 [D3 G3]:2 | [E3 G3]:2 [F3 G3]:2 | [E3 G3] [E3 G3] [C3 G3]:2 | [D3 G3] [E3 G3] [F3 G3]:2 | [E3 G3]:2 [C3 G3]:2 | [C3 E3]:4'

export const unit13: Lesson[] = [
  lesson('u13l1', both('Intervals from C, right hand', 'Intervalle von C aus, rechts'), both('Second, third, fourth and fifth.', 'Sekunde, Terz, Quarte und Quinte.'), [
    say(
      both('Two notes at once', 'Zwei Töne zugleich'),
      withBand(
        'An interval is the distance between two notes. Played together, it is a harmonic interval.\n\nKeep the thumb on C and add one more finger: 2 on D is a second, 3 on E a third, 4 on F a fourth and 5 on G a fifth. Listen to each one: the second rubs, the third sounds sweet, the fifth sounds open.',
        'Ein Intervall ist der Abstand zwischen zwei Tönen. Klingen beide zugleich, ist es ein harmonisches Intervall.\n\nLass den Daumen auf C und nimm einen Finger dazu: 2 auf D ist eine Sekunde, 3 auf E eine Terz, 4 auf F eine Quarte und 5 auf G eine Quinte. Hör dir jedes an: Die Sekunde reibt, die Terz klingt süß, die Quinte klingt offen.',
      ),
      { highlight: R_POS },
    ),
    ...play(banded(chart('u13l1', 'Intervals from C, right hand', 72, { R: FROM_C })), 'timed', TIMED),
  ]),
  lesson('u13l2', both('Thirds, right hand', 'Terzen rechts'), both('Thirds moving up and down the hand.', 'Terzen, die durch die Hand wandern.'), [
    say(
      both('Walking thirds', 'Wandernde Terzen'),
      both(
        'Thirds can move: 1 and 3 on C and E, then 2 and 4 on D and F, then 3 and 5 on E and G. Both fingers go down together and come up together.\n\nLet the two notes sound as one; neither should come early.',
        'Terzen können wandern: 1 und 3 auf C und E, dann 2 und 4 auf D und F, dann 3 und 5 auf E und G. Beide Finger gehen zusammen hinunter und zusammen hinauf.\n\nLass die zwei Töne wie einer klingen; keiner soll zu früh kommen.',
      ),
      { highlight: ['C4', 'E4'] },
    ),
    ...play(banded(chart('u13l2', 'Thirds, right hand', 72, { R: THIRDS })), 'timed', TIMED),
  ]),
  lesson('u13l3', both('Intervals from G, left hand', 'Intervalle von G aus, links'), both('The left thumb holds G while the other fingers reach down.', 'Der linke Daumen hält G, die anderen Finger greifen nach unten.'), [
    say(
      both('Measured from the thumb', 'Vom Daumen aus gemessen'),
      both(
        'In the left hand the thumb is the top of the hand, so measure from G downwards: 2 on F is a second, 3 on E a third, 4 on D a fourth and 5 on C a fifth.\n\nThe fifth C and G is the most common sound in the left hand. You will hear it under thousands of songs.',
        'In der linken Hand ist der Daumen oben, also misst du von G aus nach unten: 2 auf F ist eine Sekunde, 3 auf E eine Terz, 4 auf D eine Quarte und 5 auf C eine Quinte.\n\nDie Quinte C und G ist der häufigste Klang der linken Hand. Du hörst sie unter Tausenden Liedern.',
      ),
      { highlight: L_POS },
    ),
    ...play(banded(chart('u13l3', 'Intervals from G, left hand', 72, { L: FROM_G })), 'timed', TIMED),
  ]),
  lesson('u13l4', both('Thirds, left hand', 'Terzen links'), both('The walking thirds in the left hand.', 'Die wandernden Terzen in der linken Hand.'), [
    say(
      both('Thirds in the bass', 'Terzen im Bass'),
      both(
        'The same thirds an octave lower: 5 and 3 on C and E, 4 and 2 on D and F, 3 and 1 on E and G.',
        'Dieselben Terzen eine Oktave tiefer: 5 und 3 auf C und E, 4 und 2 auf D und F, 3 und 1 auf E und G.',
      ),
      { highlight: ['C3', 'E3'] },
    ),
    ...play(banded(chart('u13l4', 'Thirds, left hand', 72, { L: down(THIRDS) })), 'timed', TIMED),
  ]),
  lesson('u13l5', both('Fifths under thirds', 'Quinten unter Terzen'), both('The left hand holds a fifth while the right hand moves in thirds.', 'Die linke Hand hält eine Quinte, die rechte bewegt sich in Terzen.'), [
    say(
      both('Both hands, two notes each', 'Beide Hände, je zwei Töne'),
      both(
        'Now both hands play intervals. The left hand holds the open fifth C and G, or D and G under the dominant; the right hand walks in thirds above it.\n\nTogether that is four notes at once: real harmony.',
        'Jetzt spielen beide Hände Intervalle. Die linke hält die leere Quinte C und G, oder D und G über der Dominante; die rechte wandert darüber in Terzen.\n\nZusammen sind das vier Töne zugleich: echte Harmonie.',
      ),
      { highlight: ['C3', 'G3', 'C4', 'E4'] },
    ),
    ...play(
      banded(
        chart('u13l5', 'Fifths under thirds', 66, {
          R: '[C4 E4] [D4 F4] [E4 G4]:2 | [D4 F4] [C4 E4] [D4 F4]:2 | [E4 G4] [D4 F4] [C4 E4] [D4 F4] | [C4 E4]:4 | [E4 G4]:2 [D4 F4]:2 | [C4 E4]:2 [D4 F4]:2 | [E4 G4] [D4 F4] [D4 F4]:2 | [C4 E4]:4',
          L: '[C3 G3]:4 | [D3 G3]:4 | [C3 G3]:4 | [C3 G3]:4 | [C3 G3]:4 | [C3 G3]:2 [D3 G3]:2 | [D3 G3]:4 | [C3 G3]:4',
        }),
      ),
      'timed',
      TIMED,
    ),
  ]),
  lesson('u13l6', both('Thirds in both hands', 'Terzen in beiden Händen'), both('Parallel thirds, an octave apart.', 'Parallele Terzen, eine Oktave auseinander.'), [
    say(
      both('Four fingers at once', 'Vier Finger zugleich'),
      both(
        'Both hands play the walking thirds together, an octave apart. That is four fingers landing at the same moment.\n\nTake the practice run slowly and keep both wrists loose.',
        'Beide Hände spielen die wandernden Terzen zusammen, eine Oktave auseinander. Das sind vier Finger, die im selben Moment landen.\n\nNimm dir im Übungsdurchlauf Zeit und lass beide Handgelenke locker.',
      ),
      { highlight: ['C3', 'E3', 'C4', 'E4'] },
    ),
    ...play(banded(chart('u13l6', 'Thirds in both hands', 66, { R: THIRDS, L: down(THIRDS) })), 'timed', TIMED),
  ]),
]
