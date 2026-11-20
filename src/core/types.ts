export type Hand = 'L' | 'R'
export type Finger = 1 | 2 | 3 | 4 | 5

export interface ChartNote {
  pitch: number
  startBeat: number
  durationBeats: number
  hand: Hand
  finger?: Finger
}

export interface Chart {
  id: string
  title: string
  bpm: number
  beatsPerBar: number
  notes: ChartNote[]
  lengthBeats: number
}
