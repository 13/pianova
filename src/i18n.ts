/**
 * English and German. UI strings are written as pairs right where they are used,
 * `t('Lessons', 'Lektionen')`, so a screen reads in both languages at once and nothing
 * can go missing from a separate table. Lesson content uses `Text` values, which hold both.
 */
export type Lang = 'en' | 'de'

/** Words in both languages. A plain string is the same in both (a name, a note). */
export type Text = string | { en: string; de: string }

export const LANGUAGES: { id: Lang; name: string }[] = [
  { id: 'en', name: 'English' },
  { id: 'de', name: 'Deutsch' },
]

let current: Lang = 'en'

export function setLang(lang: Lang): void {
  current = lang
  if (typeof document !== 'undefined') document.documentElement.lang = lang
}

export function getLang(): Lang {
  return current
}

/** The language for a setting: 'auto' follows the browser. */
export function resolveLang(setting: string, browser = typeof navigator === 'undefined' ? 'en' : navigator.language): Lang {
  if (setting === 'en' || setting === 'de') return setting
  return /^de\b/i.test(browser) ? 'de' : 'en'
}

/** The current language's half of a pair. */
export function t(en: string, de: string): string {
  return current === 'de' ? de : en
}

/** Text in the current language. */
export function tr(text: Text): string {
  return typeof text === 'string' ? text : text[current]
}

/** Builds a Text pair (reads better in content files than an object literal). */
export function both(en: string, de: string): Text {
  return { en, de }
}

/** A percentage in the current language's style: "85%" or "85 %". */
export function pct(value: number): string {
  const n = Math.round(value * 100)
  return current === 'de' ? `${n} %` : `${n}%`
}

const LETTERS: Record<Lang, string[]> = {
  en: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  // German names B natural "H", and the black key below it "B" (B flat).
  de: ['C', 'Cis', 'D', 'Dis', 'E', 'F', 'Fis', 'G', 'Gis', 'A', 'B', 'H'],
}

/** A note's letter as a player reading this language would say it: 'B' in English is 'H' in German. */
export function noteLetter(midi: number): string {
  return LETTERS[current][((midi % 12) + 12) % 12]
}

/** Letter and octave: 'B3' / 'H3'. */
export function noteName(midi: number): string {
  return noteLetter(midi) + (Math.floor(midi / 12) - 1)
}
