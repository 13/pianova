import { describe, expect, it } from 'vitest'
import { compileChart } from '../src/chart/notation'
import { Session, type SessionOptions } from '../src/session/session'

// 60 bpm → one beat per second, so beats and seconds read the same.
const melody = compileChart({ id: 'm', title: 'M', bpm: 60, R: 'C4 D4 E4 F4' })
const twoHands = compileChart({ id: 'h', title: 'H', bpm: 60, R: 'E4 G4', L: 'C3:2' })
const twoBars = compileChart({ id: 'b', title: 'B', bpm: 60, R: 'C4 D4 E4 F4 | G4 F4 E4 D4' })

function make(opts: Partial<SessionOptions> & Pick<SessionOptions, 'chart' | 'mode'>) {
  const log: string[] = []
  const s = new Session(
    { hands: ['L', 'R'], ...opts },
    {
      autoNote: (p, on) => log.push(`${on ? 'on' : 'off'}${p}`),
      click: (accent) => log.push(accent ? 'CLICK' : 'click'),
      judged: (i, g) => log.push(`${g}${i}`),
      wrong: (p) => log.push(`wrong${p}`),
      finished: () => log.push('finished'),
      looped: () => log.push('looped'),
    },
  )
  return { s, log }
}

/** Advance in 50 ms frames from `from` up to and including `to`. */
function run(s: Session, from: number, to: number) {
  for (let t = from; t <= to + 1e-9; t += 0.05) s.update(Math.round(t * 100) / 100)
}

describe('Session, timed', () => {
  it('scores a perfectly played run and finishes', () => {
    const { s, log } = make({ chart: melody, mode: 'timed' })
    s.start(0)
    ;[60, 62, 64, 65].forEach((p, i) => {
      run(s, Math.max(0, i - 1), i)
      s.press(p, i)
    })
    run(s, 3, 6)
    expect(s.state).toBe('finished')
    expect(s.summary()).toMatchObject({ total: 4, perfect: 4, accuracy: 1 })
    expect(s.noteState).toEqual(['perfect', 'perfect', 'perfect', 'perfect'])
    expect(log.filter((l) => l === 'finished')).toHaveLength(1)
  })
  it('marks unplayed notes missed as they pass', () => {
    const { s, log } = make({ chart: melody, mode: 'timed' })
    s.start(0)
    run(s, 0, 1)
    expect(s.noteState[0]).toBe('miss')
    expect(log).toContain('miss0')
  })
  it('counts in one bar with an accented first click', () => {
    const { s, log } = make({ chart: melody, mode: 'timed', countIn: true })
    s.start(0)
    expect(s.beat).toBe(-4)
    run(s, 0, 3.9)
    expect(log).toEqual(['CLICK', 'click', 'click', 'click'])
    expect(s.noteState[0]).toBe('pending')
  })
  it('ignores presses during the count-in', () => {
    const { s } = make({ chart: melody, mode: 'timed', countIn: true })
    s.start(0)
    run(s, 0, 1)
    s.press(60, 1)
    expect(s.summary().wrong).toBe(0)
  })
  it('auto-plays the hand you are not practising and does not judge it', () => {
    const { s, log } = make({ chart: twoHands, mode: 'timed', hands: ['R'] })
    s.start(0)
    run(s, 0, 2.5)
    expect(log).toContain('on48')
    expect(log).toContain('off48')
    expect(log.indexOf('on48')).toBeLessThan(log.indexOf('off48'))
    expect(s.summary().total).toBe(2)
    expect(s.active).toEqual([false, true, true])
  })
  it('stretches time when the tempo is scaled down', () => {
    const { s } = make({ chart: melody, mode: 'timed', tempoScale: 0.5 })
    expect(s.secondsPerBeat).toBe(2)
    s.start(0)
    s.press(60, 0)
    run(s, 0, 2)
    s.press(62, 2)
    expect(s.summary().perfect).toBe(2)
  })
  it('shifts judging by the latency offset', () => {
    const { s } = make({ chart: melody, mode: 'timed', latencyMs: 100 })
    s.start(0)
    run(s, 0, 0.1)
    s.press(60, 0.1)
    expect(s.summary().perfect).toBe(1)
  })
  it('judges a press by its own timestamp, not the frame it arrived in', () => {
    const log: number[] = []
    const s = new Session({ chart: melody, mode: 'timed', hands: ['R'] }, { judged: (_i, _g, off) => log.push(off) })
    s.start(0)
    run(s, 0, 1.1)
    s.press(62, 1.02)
    expect(log).toHaveLength(2) // the missed first note, then this hit
    expect(log[1]).toBeCloseTo(20)
    expect(s.beat).toBeCloseTo(1.1)
  })
  it('does not turn a long stall into misses', () => {
    const { s } = make({ chart: melody, mode: 'timed' })
    s.start(0)
    s.update(0.05)
    s.update(5.05)
    expect(s.beat).toBeCloseTo(0.05)
    expect(s.summary().miss).toBe(0)
  })
  it('freezes while paused and silences auto-played notes', () => {
    const { s, log } = make({ chart: twoHands, mode: 'timed', hands: ['R'] })
    s.start(0)
    run(s, 0, 0.5)
    s.pause(0.5)
    expect(log).toContain('off48')
    s.update(3)
    s.press(64, 3)
    expect(s.beat).toBeCloseTo(0.5)
    s.resume(10)
    run(s, 10, 10.5)
    expect(s.beat).toBeCloseTo(1)
    expect(s.summary().wrong).toBe(0)
  })
  it('loops a bar range instead of finishing', () => {
    const { s, log } = make({ chart: twoBars, mode: 'timed', loop: { fromBar: 2, toBar: 2 } })
    s.start(0)
    expect(s.beat).toBe(4)
    expect(s.active.slice(0, 4)).toEqual([false, false, false, false])
    run(s, 0, 4.5)
    expect(log).toContain('looped')
    expect(log).not.toContain('finished')
    expect(s.beat).toBeCloseTo(4.5)
    expect(s.summary().total).toBe(4)
    expect(s.summary().miss).toBe(1)
  })
  it('normalises a reversed or out-of-range loop', () => {
    const a = make({ chart: twoBars, mode: 'timed', loop: { fromBar: 2, toBar: 1 } }).s
    a.start(0)
    expect(a.beat).toBe(0)
    expect(a.summary().total).toBe(8)
    const b = make({ chart: twoBars, mode: 'timed', loop: { fromBar: 0, toBar: 99 } }).s
    b.start(0)
    expect(b.beat).toBe(0)
    expect(b.summary().total).toBe(8)
  })
})

describe('Session, wait', () => {
  it('holds at each note until the right key is pressed', () => {
    const { s, log } = make({ chart: melody, mode: 'wait' })
    s.start(0)
    run(s, 0, 3)
    expect(s.beat).toBe(0)
    s.press(61, 3)
    expect(log).toContain('wrong61')
    s.press(60, 3)
    run(s, 3, 6)
    expect(s.beat).toBe(1)
    expect(s.noteState[0]).toBe('perfect')
    expect(log).not.toContain('click')
  })
  it('reports which notes it is waiting for', () => {
    const chord = compileChart({ id: 'c', title: 'C', bpm: 60, R: 'C4 [C4 E4 G4]' })
    const { s } = make({ chart: chord, mode: 'wait' })
    s.start(0)
    expect(s.pendingNotes()).toEqual([0])
    s.press(60, 0)
    expect(s.pendingNotes()).toEqual([1, 2, 3])
    expect(make({ chart: chord, mode: 'demo' }).s.pendingNotes()).toEqual([])
  })
  it('needs every key of a chord', () => {
    const chord = compileChart({ id: 'c', title: 'C', bpm: 60, R: '[C4 E4 G4] C4' })
    const { s } = make({ chart: chord, mode: 'wait' })
    s.start(0)
    s.press(60, 0)
    s.press(64, 0)
    run(s, 0, 2)
    expect(s.beat).toBe(0)
    s.press(67, 2)
    run(s, 2, 4)
    expect(s.beat).toBe(1)
  })
  it('finishes after the last note is played', () => {
    const { s, log } = make({ chart: melody, mode: 'wait' })
    s.start(0)
    let t = 0
    for (const p of [60, 62, 64, 65]) {
      s.press(p, t)
      run(s, t, t + 1)
      t += 1
    }
    run(s, t, t + 3)
    expect(s.state).toBe('finished')
    expect(log).toContain('finished')
    expect(s.summary().accuracy).toBe(1)
  })
})

describe('Session, demo', () => {
  it('plays every note itself and judges nothing', () => {
    const { s, log } = make({ chart: twoHands, mode: 'demo' })
    s.start(0)
    run(s, 0, 4)
    expect(log.filter((l) => l.startsWith('on'))).toEqual(['on48', 'on64', 'on67'])
    s.press(60, 4)
    expect(s.summary().total).toBe(0)
    expect(s.state).toBe('finished')
  })
})
