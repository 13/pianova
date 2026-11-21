export type Hand = 'L' | 'R'
export type Finger = 1 | 2 | 3 | 4 | 5

export interface ChartNote {
  pitch: number
  startBeat: number
  durationBeats: number
  hand: Hand
  finger?: Finger
}

/** The kind of sound a backing note is played with. */
export type Voice = 'keys' | 'strings' | 'organ' | 'guitar' | 'brass' | 'lead' | 'bass' | 'pad' | 'drums'

/**
 * A note of the music around you: never yours to play, only heard. Drum notes use the
 * General MIDI drum map for `pitch` (36 kick, 38 snare, 42 hi-hat…).
 */
export interface BackingNote {
  pitch: number
  startBeat: number
  durationBeats: number
  voice: Voice
  /** 0..1 */
  velocity: number
}

export interface Chart {
  id: string
  title: string
  bpm: number
  beatsPerBar: number
  notes: ChartNote[]
  lengthBeats: number
  /** The rest of the song, played along with you: other instruments, or notes a level leaves out. */
  backing?: BackingNote[]
}
