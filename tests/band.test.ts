import { describe, expect, it } from 'vitest'
import { bandFor } from '../src/audio/band'
import { warmupChart } from '../src/practice/warmup'
import { PIECES } from '../src/curriculum'
import { Session } from '../src/session/session'

const piece = (id: string) => PIECES.find((p) => p.id === id)!.chart

describe('backing band', () => {
  it('plays a groove, a bass and a pad inside the song', () => {
    const chart = piece('jingle-bells')
    const band = bandFor(chart)
    for (const sound of ['kick', 'snare', 'hat', 'bass', 'pad']) expect(band.some((e) => e.sound === sound), sound).toBe(true)
    expect(band.every((e) => e.beat >= 0 && e.beat < chart.lengthBeats)).toBe(true)
    // Bass stays low, the pad sits around G3–G4.
    for (const e of band.filter((e) => e.sound === 'bass')) expect(e.pitches[0]).toBeLessThan(52)
    for (const e of band.filter((e) => e.sound === 'pad')) for (const p of e.pitches) expect(p >= 55 && p <= 66).toBe(true)
  })
  it('is scheduled by the session ahead of time, and again on each loop', () => {
    const chart = piece('ode-to-joy')
    const band = bandFor(chart)
    const heard: number[] = []
    const s = new Session(
      { chart, mode: 'timed', hands: ['R'], loop: { fromBar: 1, toBar: 1 }, extras: band },
      { extra: (i) => heard.push(band[i].beat) },
    )
    s.start(0)
    const spb = s.secondsPerBeat
    for (let t = 0; t <= chart.beatsPerBar * 2 * spb + 0.01; t += 0.02) s.update(t, 0.1)
    const firstBar = band.filter((e) => e.beat < chart.beatsPerBar).length
    expect(heard.length).toBeGreaterThanOrEqual(firstBar * 2)
    expect(heard.every((b) => b < chart.beatsPerBar)).toBe(true)
  })
})

describe('warm-up', () => {
  it('runs a scale then four chords, in a key that changes by the day', () => {
    const a = warmupChart(0)
    const b = warmupChart(1)
    expect(a.key).not.toBe(b.key)
    expect(a.chart.lengthBeats).toBe(32)
    const right = a.chart.notes.filter((n) => n.hand === 'R' && n.startBeat < 16).map((n) => n.pitch)
    expect(right.slice(0, 8)).toEqual([60, 62, 64, 65, 67, 69, 71, 72])
  })
})
