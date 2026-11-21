/** A keyboard the player might own: how many keys, and whether it makes its own sound. */
export interface KeyboardModel {
  id: string
  name: string
  /** Lowest and highest MIDI note on the instrument. */
  lo: number
  hi: number
  /** Has its own speakers, so Pianova should not also sound the keys played on it. */
  speakers: boolean
  /** Recognises the instrument from the name it reports over USB MIDI. */
  match?: RegExp
}

export const KEYBOARDS: KeyboardModel[] = [
  // Yamaha Piaggero: 76 keys from E1 to G7 (NP-32/NP-35), 61 keys from C2 to C7 (NP-12/NP-15).
  { id: 'np32', name: 'Yamaha Piaggero NP-32 / NP-35 (76 keys)', lo: 28, hi: 103, speakers: true, match: /np-?3[25]/i },
  { id: 'np12', name: 'Yamaha Piaggero NP-12 / NP-15 (61 keys)', lo: 36, hi: 96, speakers: true, match: /np-?1[25]/i },
  { id: '88', name: '88 keys', lo: 21, hi: 108, speakers: false },
  { id: '76', name: '76 keys (E to G)', lo: 28, hi: 103, speakers: false },
  { id: '61', name: '61 keys (C to C)', lo: 36, hi: 96, speakers: false },
  { id: '49', name: '49 keys (C to C)', lo: 36, hi: 84, speakers: false },
]

export const FULL_PIANO: KeyboardModel = KEYBOARDS.find((k) => k.id === '88')!

/** The lowest and highest key of an instrument, as measured by playing them. */
export interface KeyRange {
  lo: number
  hi: number
}

/** The smallest keyboard Pianova accepts: two octaves. */
export const MIN_KEYS = 25

/**
 * Instruments known to have their own speakers even when the USB name does not say which
 * model it is (a Piaggero reports itself as just "Piaggero MIDI 1").
 */
const SPEAKER_NAMES = /piaggero|clavinova|arius|digital piano|e-?piano/i

/** The instrument a connected device's name points to, if Pianova knows it. */
export function detectKeyboard(names: string[]): KeyboardModel | null {
  for (const name of names) {
    const model = KEYBOARDS.find((k) => k.match?.test(name))
    if (model) return model
  }
  return null
}

/** Whether a connected device is an instrument with its own sound. */
export function hasSpeakers(names: string[]): boolean {
  return detectKeyboard(names)?.speakers ?? names.some((n) => SPEAKER_NAMES.test(n))
}

/** A measured range is usable: real MIDI pitches, low below high, at least two octaves. */
export function validRange(range: unknown): range is KeyRange {
  if (typeof range !== 'object' || range === null) return false
  const { lo, hi } = range as Record<string, unknown>
  return Number.isInteger(lo) && Number.isInteger(hi) && (lo as number) >= 0 && (hi as number) <= 127 && (hi as number) - (lo as number) + 1 >= MIN_KEYS
}

/** The standard size a measured range matches ("76 keys (E to G)"), if any. */
export function standardSize(range: KeyRange): KeyboardModel | null {
  return KEYBOARDS.find((k) => !k.match && k.lo === range.lo && k.hi === range.hi) ?? null
}

/** The instrument as measured, named by its size. */
export function measuredKeyboard(range: KeyRange, deviceNames: string[]): KeyboardModel {
  const n = range.hi - range.lo + 1
  return { id: 'measured', name: `${n} keys (measured)`, lo: range.lo, hi: range.hi, speakers: hasSpeakers(deviceNames) }
}

/**
 * The keyboard to draw and fit music to: the one chosen in settings (or measured), else
 * the one recognised from its USB name, else the measured one, else a full piano.
 */
export function chooseKeyboard(setting: string, deviceNames: string[], measured: KeyRange | null = null): KeyboardModel {
  if (setting === 'measured') return measured ? measuredKeyboard(measured, deviceNames) : (detectKeyboard(deviceNames) ?? FULL_PIANO)
  if (setting !== 'auto') return KEYBOARDS.find((k) => k.id === setting) ?? FULL_PIANO
  const found = detectKeyboard(deviceNames)
  if (found) return found
  if (measured) return measuredKeyboard(measured, deviceNames)
  // Unknown size: a full piano, but still quiet if it is an instrument with its own sound.
  return hasSpeakers(deviceNames) ? { ...FULL_PIANO, speakers: true } : FULL_PIANO
}
