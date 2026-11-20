const SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/** 'C4' → 60, 'F#3' → 54, 'Bb3' → 58. Throws on anything else. */
export function nameToMidi(name: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name)
  if (!m) throw new Error(`Bad note name "${name}"`)
  const accidental = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0
  return (Number(m[3]) + 1) * 12 + SEMITONE[m[1]] + accidental
}

/** 60 → 'C4'. Black keys are spelled as sharps. */
export function midiToName(midi: number): string {
  return SHARP_NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1)
}

/** 60 → 'C' — the letter name without the octave. */
export function midiToLetter(midi: number): string {
  return SHARP_NAMES[((midi % 12) + 12) % 12]
}

export function isBlack(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12)
}
