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

/** The instrument a connected device's name points to, if Pianova knows it. */
export function detectKeyboard(names: string[]): KeyboardModel | null {
  for (const name of names) {
    const model = KEYBOARDS.find((k) => k.match?.test(name))
    if (model) return model
  }
  return null
}

/**
 * The keyboard to draw and fit music to: the one chosen in settings, else the one
 * recognised from its USB name, else a full piano.
 */
export function chooseKeyboard(setting: string, deviceNames: string[]): KeyboardModel {
  if (setting !== 'auto') return KEYBOARDS.find((k) => k.id === setting) ?? FULL_PIANO
  return detectKeyboard(deviceNames) ?? FULL_PIANO
}
