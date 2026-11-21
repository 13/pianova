import { describe, expect, it } from 'vitest'
import { bandFor, drumFor } from '../src/audio/band'
import { arrangement } from '../src/chart/arrangements'
import { arrange, MAX_LEVEL } from '../src/chart/difficulty'
import { songSections } from '../src/chart/sections'
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

describe('song backing', () => {
  const base = piece('ode-to-joy')
  it("plays the song's own instruments and steps back from what they cover", () => {
    const chart = {
      ...base,
      backing: [
        { pitch: 36, startBeat: 0, durationBeats: 0.25, voice: 'drums' as const, velocity: 0.9 },
        { pitch: 42, startBeat: 0.5, durationBeats: 0.25, voice: 'drums' as const, velocity: 0.5 },
        { pitch: 40, startBeat: 0, durationBeats: 2, voice: 'bass' as const, velocity: 0.8 },
      ],
    }
    const band = bandFor(chart)
    // The file's drums and bass, not a second drummer or bass player; the pad stays.
    expect(band.filter((e) => ['kick', 'snare', 'hat'].includes(e.sound)).map((e) => [e.beat, e.sound])).toEqual([
      [0, 'kick'],
      [0.5, 'hat'],
    ])
    expect(band.filter((e) => e.sound === 'bass')).toEqual([{ beat: 0, sound: 'bass', pitches: [40], durationBeats: 2, velocity: 0.8 }])
    expect(band.some((e) => e.sound === 'pad')).toBe(true)
    expect(bandFor(chart, false).map((e) => e.sound)).toEqual(['kick', 'bass', 'hat'])
  })
  it('maps General MIDI drums onto the kit', () => {
    expect([36, 38, 42, 45, 49, 51].map(drumFor)).toEqual(['kick', 'snare', 'hat', 'tom', 'crash', 'hat'])
  })
})

describe('notes left out at a level', () => {
  it('still sound, so the song is heard whole', () => {
    const chart = piece('ode-to-joy')
    const sections = songSections(chart)
    const { chart: easy } = arrange(chart, sections, sections.map(() => 1))
    expect(easy.notes.length).toBeLessThan(chart.notes.length)
    expect(easy.notes.length + easy.backing!.length).toBe(chart.notes.length)
    expect(easy.backing!.every((n) => n.voice === 'keys')).toBe(true)
    const { chart: full } = arrange(chart, sections, sections.map(() => MAX_LEVEL))
    expect(full.backing).toBeUndefined()
  })
  it('the melody arrangement keeps everything under the tune playing', () => {
    const chart = piece('ode-to-joy')
    const a = arrangement(chart, 'melody')
    expect(a.chart.notes.length + a.chart.backing!.length).toBe(chart.notes.length)
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
