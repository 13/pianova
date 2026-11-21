import type { Chart, Hand } from '../core/types'
import { both, type Text } from '../i18n'
import { chart } from './build'

/** One short test in the skill check, from finding keys up to both hands together. */
export interface SkillTest {
  title: Text
  /** What it checks, shown before it starts. */
  text: Text
  chart: Chart
  /** Untimed: just the right keys. */
  mode: 'wait' | 'timed'
  hands?: Hand[]
}

export const SKILL_TESTS: SkillTest[] = [
  {
    title: both('Find the keys', 'Tasten finden'),
    text: both('Play each note as it reaches the line. The music waits for you.', 'Spiel jede Note, wenn sie die Linie erreicht. Die Musik wartet auf dich.'),
    chart: chart('skill-1', 'Find the keys', 80, { R: 'C4 E4 G4 F4 | D4 C4 A4 B4 | C5:2 G4:2' }),
    mode: 'wait',
  },
  {
    title: both('Right hand, in time', 'Rechte Hand im Takt'),
    text: both('A short tune for your right hand, played in time with the click.', 'Eine kurze Melodie für die rechte Hand, im Takt mit dem Klick.'),
    chart: chart('skill-2', 'Right hand, in time', 84, { R: 'C4 D4 E4 C4 | E4 F4 G4:2 | G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4 | D4 G3 C4:2' }),
    mode: 'timed',
  },
  {
    title: both('Left hand, in time', 'Linke Hand im Takt'),
    text: both('Now the left hand on its own, lower down the keyboard.', 'Jetzt die linke Hand allein, weiter unten auf der Tastatur.'),
    chart: chart('skill-3', 'Left hand, in time', 80, { L: 'C3 E3 G3 E3 | F3 A3 C4:2 | G3 B3 D4 B3 | C3:4' }),
    mode: 'timed',
  },
  {
    title: both('Both hands', 'Beide Hände'),
    text: both('A tune over chords: both hands together, in time.', 'Eine Melodie über Akkorden: beide Hände zusammen, im Takt.'),
    chart: chart('skill-4', 'Both hands', 80, {
      R: 'E4 D4 C4 D4 | E4 E4 E4:2 | D4 D4 E4 D4 | C4:4',
      L: '[C3 G3]:4 | [C3 G3]:4 | [B2 G3]:4 | [C3 G3]:4',
    }),
    mode: 'timed',
  },
]

/** A test counts as passed at this accuracy. */
export const SKILL_PASS = 0.75

/**
 * What a skill level (the number of tests passed, 0–4) means. Lessons in units up to
 * `openUnit` are open from the start; songs begin at `songLevel`.
 */
export const PLACEMENT = [
  { openUnit: 1, songLevel: 1, label: both('Starting from the first note', 'Los geht es mit dem ersten Ton') },
  { openUnit: 2, songLevel: 1, label: both('You know your way around the keys', 'Du kennst dich auf den Tasten aus') },
  { openUnit: 4, songLevel: 2, label: both('Your right hand keeps time', 'Deine rechte Hand hält den Takt') },
  { openUnit: 5, songLevel: 3, label: both('Both hands work on their own', 'Beide Hände spielen sicher allein') },
  { openUnit: 6, songLevel: 4, label: both('You can play hands together', 'Du spielst mit beiden Händen zusammen') },
]

export function placement(skill: number | null) {
  return PLACEMENT[Math.max(0, Math.min(PLACEMENT.length - 1, skill ?? 0))]
}
