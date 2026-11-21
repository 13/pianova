import { describe, expect, it } from 'vitest'
import { arrange, mastery, MAX_LEVEL, noteTiers, shareFor } from '../src/chart/difficulty'
import { fitToRange } from '../src/chart/fit'
import { compileChart } from '../src/chart/notation'
import { songSections } from '../src/chart/sections'
import { nameToMidi as m } from '../src/core/pitch'
import { chooseKeyboard, detectKeyboard, standardSize, validRange } from '../src/input/instruments'
import { afterPass, levelsAfterRun, startDrill } from '../src/practice/trainer'

const song = (R: string, L?: string) => compileChart({ id: 's', title: 'S', bpm: 100, R, L })

describe('noteTiers', () => {
  it('ranks the tune above the bass, strong beats above weak ones', () => {
    const c = song('C4:2 D4 E4:0.5 F4:0.5 | [E4 G4]:4', 'C3:2 G2:2 | C3:4')
    const tier = (pitch: string, beat: number) => noteTiers(c)[c.notes.findIndex((n) => n.pitch === m(pitch) && n.startBeat === beat)]
    expect(tier('C4', 0)).toBe(1) // downbeat
    expect(tier('D4', 2)).toBe(1) // middle of the bar
    expect(tier('E4', 3)).toBe(2) // on a beat
    expect(tier('F4', 3.5)).toBe(3) // off the beat
    expect(tier('G4', 4)).toBe(1) // top of a chord, downbeat
    expect(tier('E4', 4)).toBe(4) // the chord's bottom note
    expect(tier('C3', 0)).toBe(3) // bass on the downbeat
    expect(tier('G2', 2)).toBe(4) // bass on another beat
  })
})

describe('arrange', () => {
  const c = song('C4 D4 E4 F4 | G4 A4 B4 C5', 'C3:4 | G2:4')
  const sections = songSections(c)

  it('keeps more notes at higher levels', () => {
    const counts = [1, 2, 3, 4, 5].map((l) => arrange(c, sections, sections.map(() => l)).chart.notes.length)
    expect(counts).toEqual([4, 8, 10, 10, 10])
    expect(arrange(c, sections, sections.map(() => MAX_LEVEL)).chart.notes).toEqual(c.notes)
  })
  it('maps arranged notes back to the full chart', () => {
    const a = arrange(c, sections, [1])
    a.source.forEach((src, i) => expect(a.chart.notes[i]).toBe(c.notes[src]))
  })
  it('never leaves a part empty', () => {
    const offbeat = song('-:0.5 C4:0.5 -:0.5 D4:0.5 -:2')
    const a = arrange(offbeat, songSections(offbeat), [1])
    expect(a.chart.notes.map((n) => n.pitch)).toEqual([m('C4'), m('D4')])
  })
})

describe('mastery', () => {
  it('counts the real notes played right, part by part', () => {
    const c = song('C4 D4 E4 F4 | G4 A4 B4 C5 | C4 D4 E4 F4 | G4 A4 B4 C5')
    const sections = songSections(c)
    const tiers = noteTiers(c)
    expect(sections).toHaveLength(2)
    // Level 1 is half of each part's notes; all of them right is half the song.
    const half = shareFor(sections[0], 1, 1, tiers)
    expect(half).toBe(0.5)
    expect(mastery(sections, [half, half])).toBe(0.5)
    expect(mastery(sections, [1, 0])).toBe(0.5)
    expect(mastery(sections, [1, 1])).toBe(1)
  })
})

describe('section trainer', () => {
  it('speeds up after clean passes, then adds notes, then calls it learned', () => {
    let s = startDrill(MAX_LEVEL - 1)
    const events: string[] = []
    for (let i = 0; i < 8; i++) {
      const r = afterPass(s, 0.95)
      s = r.state
      events.push(String(r.event))
    }
    expect(events).toEqual(['faster', 'faster', 'faster', 'level-up', 'faster', 'faster', 'learned', 'learned'])
  })
  it('eases off after two rough passes in a row', () => {
    let s = startDrill(2)
    expect(afterPass(s, 0.3).event).toBeNull()
    s = afterPass(s, 0.3).state
    expect(afterPass(s, 0.3)).toMatchObject({ event: 'slower', state: { tempo: 0.6, level: 2 } })
    s = { level: 2, tempo: 0.5, rough: 1 }
    expect(afterPass(s, 0.2)).toMatchObject({ event: 'level-down', state: { level: 1 } })
    // A middling pass breaks the run of rough ones.
    expect(afterPass({ level: 2, tempo: 0.8, rough: 1 }, 0.7).state.rough).toBe(0)
  })
  it('moves each part after a full run, repeated parts together', () => {
    expect(levelsAfterRun(['A', 'B', 'A', 'C'], [2, 2, 2, 3], [0.95, 0.4, 0.92, 0.7])).toEqual([3, 1, 3, 3])
    expect(levelsAfterRun(['A'], [5], [1])).toEqual([5])
    expect(levelsAfterRun(['A', 'B'], [2, 2], [null, 0.95])).toEqual([2, 3])
  })
})

describe('keyboards', () => {
  it('recognises a Piaggero from its USB name', () => {
    expect(detectKeyboard(['Yamaha NP-32'])?.lo).toBe(m('E1'))
    expect(detectKeyboard(['NP32 MIDI 1'])?.hi).toBe(m('G7'))
    expect(detectKeyboard(['Some Controller'])).toBeNull()
    expect(chooseKeyboard('auto', ['Some Controller']).id).toBe('88')
    expect(chooseKeyboard('61', ['Yamaha NP-32']).id).toBe('61')
  })
  it('uses a measured keyboard when the device name does not say its size', () => {
    // A Piaggero reports itself as just "Piaggero MIDI 1".
    expect(chooseKeyboard('auto', ['Piaggero MIDI 1'])).toMatchObject({ id: '88', speakers: true })
    const measured = chooseKeyboard('auto', ['Piaggero MIDI 1'], { lo: m('E1'), hi: m('G7') })
    expect(measured).toMatchObject({ id: 'measured', lo: m('E1'), hi: m('G7'), speakers: true })
    expect(chooseKeyboard('measured', ['Some Controller'], { lo: 36, hi: 96 })).toMatchObject({ id: 'measured', lo: 36, hi: 96, speakers: false })
    // A recognised model still wins in automatic mode; choosing "measured" wins over it.
    expect(chooseKeyboard('auto', ['Yamaha NP-12'], { lo: 21, hi: 108 }).id).toBe('np12')
    expect(chooseKeyboard('measured', ['Yamaha NP-12'], { lo: 21, hi: 108 }).id).toBe('measured')
  })
  it('accepts only real, at-least-two-octave ranges as measurements', () => {
    expect(validRange({ lo: 28, hi: 103 })).toBe(true)
    expect(validRange({ lo: 60, hi: 72 })).toBe(false)
    expect(validRange({ lo: 72, hi: 28 })).toBe(false)
    expect(validRange({ lo: 1.5, hi: 90 })).toBe(false)
    expect(validRange(null)).toBe(false)
    expect(standardSize({ lo: 28, hi: 103 })?.id).toBe('76')
  })
  it('fits music onto a smaller keyboard, keeping each hand in shape', () => {
    const c = song('C7 E7 G7 C8', 'C1 G1')
    const fit = fitToRange(c, m('E1'), m('G7'))
    const r = fit.notes.filter((n) => n.hand === 'R').map((n) => n.pitch)
    expect(r).toEqual([m('C6'), m('E6'), m('G6'), m('C7')])
    expect(fit.notes.filter((n) => n.hand === 'L').map((n) => n.pitch)).toEqual([m('C2'), m('G2')])
    expect(fitToRange(song('C4'), 28, 103)).toEqual(song('C4'))
  })
})
