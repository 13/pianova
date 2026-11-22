import { midiToName, nameToMidi } from '../core/pitch'
import type { Hand } from '../core/types'
import { both, type Text } from '../i18n'
import { BAND, banded, lesson, chart, play, say, TIMED } from './build'
import type { Lesson } from './types'

/** A major key to practise: where its scale starts and which black keys it uses. */
interface Key {
  id: string
  en: string
  de: string
  /** Right-hand starting note for one octave; the left hand starts an octave lower. */
  one: string
  /** Right-hand starting note for two octaves (low enough that the top stays on a 49-key range). */
  two: string
  black: { en: string; de: string }[]
  /** Right-hand fingering up one octave; F major differs from the others. */
  rh: number[]
}

const STD_RH = [1, 2, 3, 1, 2, 3, 4, 5]
const STD_LH = [5, 4, 3, 2, 1, 3, 2, 1]
const FS = { en: 'F sharp', de: 'Fis' }
const CS = { en: 'C sharp', de: 'Cis' }
const GS = { en: 'G sharp', de: 'Gis' }
const DS = { en: 'D sharp', de: 'Dis' }

const KEYS: Key[] = [
  { id: 'c', en: 'C', de: 'C', one: 'C4', two: 'C4', black: [], rh: STD_RH },
  { id: 'g', en: 'G', de: 'G', one: 'G3', two: 'G3', black: [FS], rh: STD_RH },
  { id: 'd', en: 'D', de: 'D', one: 'D4', two: 'D3', black: [FS, CS], rh: STD_RH },
  { id: 'a', en: 'A', de: 'A', one: 'A3', two: 'A3', black: [CS, FS, GS], rh: STD_RH },
  { id: 'e', en: 'E', de: 'E', one: 'E4', two: 'E3', black: [FS, GS, CS, DS], rh: STD_RH },
  { id: 'f', en: 'F', de: 'F', one: 'F4', two: 'F3', black: [{ en: 'B flat', de: 'B' }], rh: [1, 2, 3, 4, 1, 2, 3, 4] },
]

const MAJOR = [0, 2, 4, 5, 7, 9, 11]

/** The notes of the scale going up `octaves` octaves from `tonic`. */
function scaleUp(tonic: number, octaves: number): number[] {
  return Array.from({ length: 7 * octaves + 1 }, (_, i) => tonic + 12 * Math.floor(i / 7) + MAJOR[i % 7])
}

/**
 * Fingering going up. Across two octaves the right hand's thumb passes under once more
 * on the middle tonic; in the left hand the thumb lands on it and finger 4 crosses over
 * to the next note.
 */
function fingersUp(key: Key, hand: Hand, octaves: number): number[] {
  if (octaves === 1) return hand === 'R' ? key.rh : STD_LH
  if (hand === 'L') return [...STD_LH, 4, 3, 2, 1, 3, 2, 1]
  // F major keeps finger 4 for B flat: 1 2 3 4 1 2 3 | 1 2 3 4 1 2 3 4.
  return key.id === 'f' ? [1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 4] : [1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 5]
}

/** Notation for one hand: up and back down, each note one beat, the last one held to fill the bar. */
function line(key: Key, hand: Hand, octaves: number): string {
  const tonic = nameToMidi(octaves === 1 ? key.one : key.two) - (hand === 'L' ? 12 : 0)
  const up = scaleUp(tonic, octaves)
  const fingers = fingersUp(key, hand, octaves)
  const notes = [...up.map((p, i) => [p, fingers[i]]), ...up.slice(0, -1).reverse().map((p, i, a) => [p, fingers[a.length - 1 - i]])]
  const run = notes.map(([p, f], i) => `${midiToName(p)}/${f}${i === notes.length - 1 ? `:${16 * octaves - notes.length + 1}` : ''}`)
  // One octave is short, so it goes round twice: both runs fill 32 beats.
  return (octaves === 1 ? [...run, ...run] : run).join(' ')
}

/** "1 2 3 – 1 2 3 4 5": a dash wherever the hand turns (thumb under or finger over). */
function fingering(fingers: number[]): string {
  return fingers.map((f, i) => (i > 0 && Math.abs(f - fingers[i - 1]) !== 1 ? `– ${f}` : String(f))).join(' ')
}

function blackKeys(key: Key): Text {
  const n = key.black.length
  if (!n) return both(`${key.en} major uses only the white keys.`, `${key.de}-Dur kommt ganz ohne schwarze Tasten aus.`)
  const list = (lang: 'en' | 'de') => {
    const names = key.black.map((b) => b[lang])
    const and = lang === 'en' ? 'and' : 'und'
    return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`
  }
  const count = ['', 'one', 'two', 'three', 'four'][n]
  const zahl = ['', 'eine', 'zwei', 'drei', 'vier'][n]
  return both(
    `${key.en} major has ${count} black key${n > 1 ? 's' : ''}: ${list('en')}. Look at the lit keys before you start, so your fingers know where the black keys are.`,
    `${key.de}-Dur hat ${zahl} schwarze Taste${n > 1 ? 'n' : ''}: ${list('de')}. Sieh dir die leuchtenden Tasten an, bevor du anfängst, damit deine Finger wissen, wo die schwarzen Tasten liegen.`,
  )
}

const HAND: Record<Hand | 'both', { en: string; de: string }> = {
  R: { en: 'right hand', de: 'rechts' },
  L: { en: 'left hand', de: 'links' },
  both: { en: 'hands together', de: 'beidhändig' },
}

function scaleLesson(id: string, key: Key, hands: Hand[], octaves: number, first: boolean): Lesson {
  const which = hands.length === 2 ? 'both' : hands[0]
  const span = octaves === 1 ? both('one octave', 'eine Oktave') : both('two octaves', 'zwei Oktaven')
  const spanText = (lang: 'en' | 'de') => (typeof span === 'string' ? span : span[lang])
  const titleEn = `${key.en} major, ${HAND[which].en}${octaves === 2 ? ', two octaves' : ''}`
  const title = both(titleEn, `${key.de}-Dur ${HAND[which].de}${octaves === 2 ? ', zwei Oktaven' : ''}`)

  const lines: { R?: string; L?: string } = {}
  for (const hand of hands) lines[hand] = line(key, hand, octaves)
  const tonic = nameToMidi(key.one) % 12
  const bpm = (octaves === 1 ? 76 : 84) - (hands.length === 2 ? 12 : 0)
  const c = banded(chart(id, titleEn, bpm, lines), tonic)

  const fingerText = (lang: 'en' | 'de') =>
    hands
      .map((hand) => {
        const f = fingering(fingersUp(key, hand, octaves))
        const who = lang === 'en' ? (hand === 'R' ? 'Right hand' : 'Left hand') : hand === 'R' ? 'Rechte Hand' : 'Linke Hand'
        return lang === 'en' ? `${who} going up: ${f}.` : `${who} aufwärts: ${f}.`
      })
      .join(' ')
  const how: Record<typeof which, Text> = {
    R: both(
      'At each dash the thumb passes under going up; coming down, the same fingers in reverse, with a finger crossing over the thumb.',
      'An jedem Strich geht der Daumen aufwärts unter der Hand durch; abwärts dieselben Finger rückwärts, wobei ein Finger über den Daumen setzt.',
    ),
    L: both(
      'At each dash a finger crosses over the thumb going up; coming down, the same fingers in reverse, with the thumb passing under.',
      'An jedem Strich setzt aufwärts ein Finger über den Daumen; abwärts dieselben Finger rückwärts, wobei der Daumen unter der Hand durchgeht.',
    ),
    both: both(
      'Both hands play the same notes an octave apart, but they turn at different moments. Practise each hand alone with the hand buttons first, then together, slowly.',
      'Beide Hände spielen dieselben Töne im Abstand einer Oktave, wenden aber an verschiedenen Stellen. Übe mit den Hand-Schaltern zuerst jede Hand allein, dann beide zusammen – langsam.',
    ),
  }
  const pick = (t: Text, lang: 'en' | 'de') => (typeof t === 'string' ? t : t[lang])
  const text = (lang: 'en' | 'de') =>
    `${pick(blackKeys(key), lang)}\n\n${fingerText(lang)} ${pick(how[which], lang)}${first ? BAND[lang] : ''}`

  const rh = nameToMidi(octaves === 1 ? key.one : key.two)
  const highlight = scaleUp(rh, 1).map(midiToName)
  return lesson(
    id,
    title,
    both(
      `${key.en} major up and down ${spanText('en')}, ${HAND[which].en}.`,
      `${key.de}-Dur ${spanText('de')} hinauf und hinab, ${HAND[which].de}.`,
    ),
    [
      say(both(`The ${key.en} major scale`, `Die ${key.de}-Dur-Tonleiter`), both(text('en'), text('de')), { highlight }),
      ...play(c, 'timed', TIMED),
    ],
  )
}

function scaleUnit(unit: number, octaves: number): Lesson[] {
  const hands: Hand[][] = [['R'], ['L'], ['R', 'L']]
  return KEYS.flatMap((key, k) => hands.map((h, i) => scaleLesson(`u${unit}l${k * 3 + i + 1}`, key, h, octaves, k === 0 && i === 0)))
}

export const unit9: Lesson[] = scaleUnit(9, 1)
export const unit10: Lesson[] = scaleUnit(10, 2)
