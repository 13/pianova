import type { Chart } from '../core/types'

/** A part of the song: a run of bars named by how it relates to the others (A, B, A′…). */
export interface Section {
  name: string
  /** 1-based, inclusive. */
  fromBar: number
  toBar: number
  startBeat: number
  endBeat: number
  /** Indices into chart.notes of the notes that start in this section. */
  notes: number[]
}

/** Parts that share this much of their notes count as variations of each other. */
const SIMILAR = 0.6

/**
 * Splits a chart into phrases of equal length (4 bars, or 2 for short pieces, 8 for long
 * ones) and names them by their music: a phrase that comes back gets the same letter,
 * one that comes back changed gets a prime.
 */
export function songSections(chart: Chart): Section[] {
  const bpb = chart.beatsPerBar
  const bars = Math.max(1, Math.ceil(chart.lengthBeats / bpb - 1e-9))
  const len = bars >= 64 ? 8 : bars >= 8 ? 4 : bars >= 4 ? 2 : bars

  const spans: [number, number][] = []
  for (let from = 1; from <= bars; from += len) spans.push([from, Math.min(bars, from + len - 1)])
  // A short leftover joins the part before it.
  const last = spans[spans.length - 1]
  const leftover = last[1] - last[0] + 1
  if (spans.length > 1 && (leftover === 1 || leftover <= len / 4)) {
    spans.pop()
    spans[spans.length - 1][1] = last[1]
  }

  let parts = spans.map(([fromBar, toBar]) => ({
    fromBar,
    toBar,
    startBeat: (fromBar - 1) * bpb,
    endBeat: toBar * bpb,
    notes: [] as number[],
  }))
  chart.notes.forEach((n, i) => {
    const part = parts.find((p) => n.startBeat < p.endBeat - 1e-6) ?? parts[parts.length - 1]
    part.notes.push(i)
  })
  // Silent stretches (an imported file's empty first bars) join the next part.
  parts = parts.reduceRight<typeof parts>((acc, p) => {
    if (!p.notes.length && acc.length) {
      acc[0] = { ...acc[0], fromBar: p.fromBar, startBeat: p.startBeat }
      return acc
    }
    return [p, ...acc]
  }, [])

  const shapes: { letter: string; sig: Set<string> }[] = []
  const seen = new Map<string, number>()
  return parts.map((p) => {
    const sig = new Set(
      p.notes.map((i) => {
        const n = chart.notes[i]
        return `${n.pitch}@${Math.round((n.startBeat - p.startBeat) * 1000)}:${Math.round(n.durationBeats * 1000)}:${n.hand}`
      }),
    )
    let best: { letter: string; score: number } | null = null
    for (const s of shapes) {
      const score = overlap(sig, s.sig)
      if (!best || score > best.score) best = { letter: s.letter, score }
    }
    let name: string
    if (best && best.score >= 0.999) name = best.letter
    else if (best && best.score >= SIMILAR) {
      // A′, then A″ for a second variation.
      const n = (seen.get(best.letter) ?? 0) + 1
      seen.set(best.letter, n)
      name = best.letter + (n === 1 ? '′' : n === 2 ? '″' : String(n))
    } else {
      const letter = shapes.length < 26 ? String.fromCharCode(65 + shapes.length) : String(shapes.length + 1)
      shapes.push({ letter, sig })
      name = letter
    }
    return { name, ...p }
  })
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 1
  let shared = 0
  for (const x of a) if (b.has(x)) shared++
  return shared / Math.max(a.size, b.size)
}

/** The same parts laid over another version of the song (say, a simpler arrangement of it). */
export function placeNotes(sections: Section[], chart: Chart): Section[] {
  const placed = sections.map((s) => ({ ...s, notes: [] as number[] }))
  chart.notes.forEach((n, i) => {
    const part = placed.find((p) => n.startBeat < p.endBeat - 1e-6) ?? placed[placed.length - 1]
    part?.notes.push(i)
  })
  return placed
}

/** The section playing at `beat` (the first before the music starts, the last after it ends). */
export function sectionAt(sections: Section[], beat: number): number {
  for (let i = sections.length - 1; i >= 0; i--) if (beat >= sections[i].startBeat - 1e-6) return i
  return 0
}
