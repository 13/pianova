import { nameToMidi } from '../core/pitch'
import type { Chart, ChartNote, Finger, Hand } from '../core/types'

export interface ChartSource {
  id: string
  title: string
  bpm: number
  beatsPerBar?: number
  /** Right-hand line, e.g. "C4/1 D4/2:2 -:1 [C4 E4 G4]:2 |" */
  R?: string
  L?: string
}

/**
 * Notation: whitespace-separated tokens, each hand starting at beat 0.
 *   C4        one beat          C4:2      two beats       C4:0.5   half a beat
 *   C4/3      finger 3          C4/3:2    finger + length
 *   -:1       rest              [C4/1 E4/3 G4/5]:2  chord  |  bar line (ignored)
 */
export function compileChart(src: ChartSource): Chart {
  const beatsPerBar = src.beatsPerBar ?? 4
  const notes: ChartNote[] = []
  let end = 0
  for (const hand of ['R', 'L'] as Hand[]) {
    const line = src[hand]
    if (line) end = Math.max(end, compileLine(line, hand, notes))
  }
  notes.sort((a, b) => a.startBeat - b.startBeat || a.pitch - b.pitch)
  const lengthBeats = Math.max(beatsPerBar, Math.ceil(end / beatsPerBar - 1e-9) * beatsPerBar)
  return { id: src.id, title: src.title, bpm: src.bpm, beatsPerBar, notes, lengthBeats }
}

function compileLine(line: string, hand: Hand, out: ChartNote[]): number {
  // Split on whitespace, but keep "[...]" chords (which contain spaces) whole.
  const tokens = line.match(/\[[^\]]*\]\S*|\S+/g) ?? []
  let beat = 0
  for (const token of tokens) {
    if (token === '|') continue
    const m = /^(\[[^\]]*\]|[^:\[\]]+)(?::(\d+(?:\.\d+)?))?$/.exec(token)
    if (!m) throw new Error(`Bad chart token "${token}"`)
    const duration = m[2] === undefined ? 1 : Number(m[2])
    if (!(duration > 0)) throw new Error(`Bad chart token "${token}"`)
    const body = m[1]
    if (body !== '-') {
      const parts = body.startsWith('[') ? body.slice(1, -1).trim().split(/\s+/) : [body]
      for (const part of parts) out.push({ ...parseNote(part, token), startBeat: beat, durationBeats: duration, hand })
    }
    beat += duration
  }
  return beat
}

function parseNote(part: string, token: string): { pitch: number; finger?: Finger } {
  const m = /^([A-G][#b]?-?\d)(?:\/([1-5]))?$/.exec(part)
  if (!m) throw new Error(`Bad chart token "${token}"`)
  const pitch = nameToMidi(m[1])
  return m[2] ? { pitch, finger: Number(m[2]) as Finger } : { pitch }
}
