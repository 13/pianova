import type { BandSound } from './band'
/** Relative strength of each harmonic: bright but mellow, vaguely piano-like. */
const HARMONICS = [1, 0.55, 0.28, 0.16, 0.1, 0.06, 0.04, 0.025, 0.015, 0.01]
const RELEASE_S = 0.18
const MAX_VOICES = 32
/** How far past the output delay sounds are scheduled ahead of the music. */
const SCHEDULE_AHEAD_S = 0.1
/** How quickly the heard-clock estimate follows the audio hardware (per reading). */
const CLOCK_SMOOTHING = 0.05
/** A reading further off than this is a jump (device change, stall), not jitter. */
const CLOCK_SNAP_S = 0.05

interface Voice {
  pitch: number
  /** Clock time the note starts; may be in the future when scheduled ahead. */
  start: number
  gain: GainNode
  oscs: OscillatorNode[]
  /** Key is up but the sustain pedal is holding the note. */
  pedalled: boolean
}

/**
 * A small polyphonic piano-ish synth, the metronome click, and the app's clock.
 *
 * Times are AudioContext seconds. `now()` is the moment being *heard* right now,
 * which trails `ctx.currentTime` by the output delay. Sound scheduled for time t
 * reaches the speakers when `now()` reaches t, so the highway, the sound, and
 * the judging all share one timeline.
 */
export class Synth {
  readonly ctx: AudioContext
  private master: GainNode
  private wave: PeriodicWave
  private voices: Voice[] = []
  private clicks: { osc: OscillatorNode; at: number }[] = []
  /** Mixer channels: the music played for you, the backing band, and the metronome. */
  private buses: Record<'accomp' | 'band' | 'click', GainNode>
  /** Band sounds scheduled ahead, so a pause or jump can take them back. */
  private bandNodes: { node: AudioScheduledSourceNode; at: number }[] = []
  private noise: AudioBuffer
  private sustain = false
  /** Smoothed (heard clock − performance.now()/1000). */
  private offset: number | null = null

  constructor() {
    this.ctx = new AudioContext({ latencyHint: 'interactive' })
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.8
    const limiter = this.ctx.createDynamicsCompressor()
    limiter.threshold.value = -12
    limiter.ratio.value = 8
    this.master.connect(limiter).connect(this.ctx.destination)
    const bus = (level: number) => {
      const g = this.ctx.createGain()
      g.gain.value = level
      g.connect(this.master)
      return g
    }
    this.buses = { accomp: bus(0.8), band: bus(0.7), click: bus(0.8) }
    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate)
    const data = this.noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const imag = new Float32Array([0, ...HARMONICS])
    this.wave = this.ctx.createPeriodicWave(new Float32Array(imag.length), imag)
  }

  /** The clock time being heard at `perfTime` (performance.now() scale, ms); defaults to now. */
  now(perfTime = performance.now()): number {
    this.sync()
    return perfTime / 1000 + (this.offset ?? this.ctx.currentTime - performance.now() / 1000 - this.outputDelay)
  }

  /** Converts an input event's timestamp to clock time. */
  fromPerf(perfTime: number): number {
    const nowPerf = performance.now()
    // Event timestamps from far in the past (or the future) are not trusted.
    return this.now(Math.max(nowPerf - 100, Math.min(nowPerf, perfTime)))
  }

  /** Seconds between scheduling a sound and hearing it. */
  get outputDelay(): number {
    return (this.ctx.baseLatency || 0) + (this.ctx.outputLatency || 0)
  }

  /** How far ahead of `now()` the music should be scheduled. */
  get lead(): number {
    return this.ctx.currentTime - this.now() + SCHEDULE_AHEAD_S
  }

  /** Browsers start audio suspended until the user interacts with the page. */
  async resume(): Promise<void> {
    if (this.ctx.state !== 'running') await this.ctx.resume()
  }

  get running(): boolean {
    return this.ctx.state === 'running'
  }

  setVolume(volume: number): void {
    this.master.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.02)
  }

  /** Mixer levels, 0..1 each. */
  setMix(mix: { accomp?: number; band?: number; click?: number }): void {
    for (const name of ['accomp', 'band', 'click'] as const) {
      const level = mix?.[name]
      if (typeof level === 'number' && Number.isFinite(level)) this.buses[name].gain.setTargetAtTime(Math.max(0, Math.min(1, level)), this.ctx.currentTime, 0.02)
    }
  }

  /**
   * Starts a note now, or at clock time `at` if that is later. Notes the app plays for you
   * (`accomp`) go through their own mixer channel; your own keys always go straight out.
   */
  noteOn(pitch: number, velocity = 0.75, at?: number, channel: 'keys' | 'accomp' = 'keys'): void {
    const t = Math.max(this.ctx.currentTime, at ?? 0)
    // A new strike of the same key ends the old one (at the moment the new one starts).
    this.stopVoices((v) => v.pitch === pitch && v.start <= t, 0.03, t)
    if (this.voices.length >= MAX_VOICES) this.stopVoices((v) => v === this.voices[0], 0.03)

    const freq = 440 * 2 ** ((pitch - 69) / 12)
    const level = 0.1 + 0.3 * velocity ** 1.5
    // Low notes ring longer than high ones, like real strings.
    const decay = 0.35 + 2.2 * 2 ** ((48 - pitch) / 24)

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = 0.5
    filter.frequency.setValueAtTime(Math.min(16000, freq * (4 + 10 * velocity)), t)
    filter.frequency.setTargetAtTime(Math.min(16000, freq * 2.5), t, decay * 0.4)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(level, t + 0.004)
    gain.gain.setTargetAtTime(level * 0.02, t + 0.004, decay)

    // Two slightly detuned strings give the tone some life.
    const oscs = [-3, 3].map((cents) => {
      const osc = this.ctx.createOscillator()
      osc.setPeriodicWave(this.wave)
      osc.frequency.value = freq
      osc.detune.value = cents
      osc.connect(filter)
      osc.start(t)
      return osc
    })
    filter.connect(gain).connect(channel === 'accomp' ? this.buses.accomp : this.master)
    this.voices.push({ pitch, start: t, gain, oscs, pedalled: false })
  }

  /** Releases a key now, or at clock time `at`. Only notes struck by then are released. */
  noteOff(pitch: number, at?: number): void {
    const t = at ?? this.ctx.currentTime
    const struck = (v: Voice) => v.pitch === pitch && v.start <= Math.max(t, this.ctx.currentTime)
    if (this.sustain) {
      for (const v of this.voices) if (struck(v)) v.pedalled = true
    } else {
      this.stopVoices(struck, RELEASE_S, t)
    }
  }

  setSustain(down: boolean): void {
    this.sustain = down
    if (!down) this.stopVoices((v) => v.pedalled, RELEASE_S)
  }

  allOff(): void {
    this.cancelAfter(-Infinity)
    this.stopVoices(() => true, 0.05)
  }

  /** Drops notes and clicks scheduled to start after clock time `t`. */
  cancelAfter(t: number): void {
    const now = this.ctx.currentTime
    this.voices = this.voices.filter((v) => {
      if (v.start <= Math.max(t, now)) return true
      for (const osc of v.oscs) osc.stop(now)
      return false
    })
    this.clicks = this.clicks.filter((c) => {
      if (c.at <= Math.max(t, now)) return c.at > now - 1
      c.osc.stop(now)
      return false
    })
    this.bandNodes = this.bandNodes.filter((b) => {
      if (b.at <= Math.max(t, now)) return b.at > now - 8
      b.node.stop(now)
      return false
    })
  }

  /**
   * One sound of the band at clock time `at`; `seconds` is how long a pitched one lasts.
   * Piano notes played for you (`keys`) go through the accompaniment channel, the rest
   * through the band's.
   */
  band(sound: BandSound, at: number, velocity: number, pitches: number[] = [], seconds = 0.5): void {
    const { ctx } = this
    const t = Math.max(ctx.currentTime, at)
    const out = sound === 'keys' ? this.buses.accomp : this.buses.band
    // Long songs schedule thousands of band sounds: forget the ones long finished.
    if (this.bandNodes.length > 512) this.bandNodes = this.bandNodes.filter((b) => b.at > ctx.currentTime - 8)
    const track = (node: AudioScheduledSourceNode) => this.bandNodes.push({ node, at: t })
    const env = (peak: number, attack: number, hold: number, release: number) => {
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(peak, t + attack)
      g.gain.setTargetAtTime(0, t + attack + hold, release / 3)
      return g
    }
    const noise = (filter: BiquadFilterType, freq: number, peak: number, length: number) => {
      const src = ctx.createBufferSource()
      src.buffer = this.noise
      const f = ctx.createBiquadFilter()
      f.type = filter
      f.frequency.value = freq
      src.connect(f).connect(env(peak, 0.002, 0, length)).connect(out)
      src.start(t, Math.random() * 0.5)
      src.stop(t + length + 0.1)
      track(src)
    }
    if (sound === 'kick') {
      const osc = ctx.createOscillator()
      osc.frequency.setValueAtTime(130, t)
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.12)
      osc.connect(env(0.9 * velocity, 0.003, 0.02, 0.3)).connect(out)
      osc.start(t)
      osc.stop(t + 0.45)
      track(osc)
    } else if (sound === 'snare') {
      noise('highpass', 1400, 0.38 * velocity, 0.16)
      const osc = ctx.createOscillator()
      osc.frequency.value = 190
      osc.connect(env(0.22 * velocity, 0.002, 0, 0.08)).connect(out)
      osc.start(t)
      osc.stop(t + 0.15)
      track(osc)
    } else if (sound === 'hat') {
      noise('highpass', 7500, 0.13 * velocity, 0.045)
    } else if (sound === 'crash') {
      noise('highpass', 5000, 0.12 * velocity, 1.1)
    } else if (sound === 'tom') {
      // Higher drum notes are smaller toms.
      const top = 70 + ((pitches[0] ?? 45) - 41) * 12
      const osc = ctx.createOscillator()
      osc.frequency.setValueAtTime(top * 1.6, t)
      osc.frequency.exponentialRampToValueAtTime(top, t + 0.08)
      osc.connect(env(0.6 * velocity, 0.003, 0.02, 0.35)).connect(out)
      osc.start(t)
      osc.stop(t + 0.5)
      track(osc)
    } else if (sound !== 'bass' && sound !== 'pad') {
      this.instrument(sound, t, velocity, pitches, Math.max(0.08, seconds), out, track)
    } else {
      const length = Math.max(0.1, seconds)
      for (const pitch of pitches) {
        const freq = 440 * 2 ** ((pitch - 69) / 12)
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = sound === 'bass' ? 700 : 1300
        const g = sound === 'bass' ? env(0.42 * velocity, 0.01, length * 0.8, 0.12) : env(0.045 * velocity, 0.3, length * 0.7, 0.5)
        filter.connect(g).connect(out)
        const shapes: [OscillatorType, number][] = sound === 'bass' ? [['triangle', 0], ['sine', -1200]] : [['sawtooth', -7], ['sawtooth', 7]]
        for (const [type, detune] of shapes) {
          const osc = ctx.createOscillator()
          osc.type = type
          osc.frequency.value = freq
          osc.detune.value = detune
          osc.connect(filter)
          osc.start(t)
          osc.stop(t + length + 0.8)
          track(osc)
        }
      }
    }
  }

  /** A pitched instrument of the band: each a few oscillators, a filter and an envelope. */
  private instrument(
    sound: 'keys' | 'strings' | 'organ' | 'guitar' | 'brass' | 'lead',
    t: number,
    velocity: number,
    pitches: number[],
    length: number,
    out: AudioNode,
    track: (node: AudioScheduledSourceNode) => void,
  ): void {
    const { ctx } = this
    const v = 0.3 + 0.7 * velocity
    for (const pitch of pitches) {
      const freq = 440 * 2 ** ((pitch - 69) / 12)
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      const g = ctx.createGain()
      let tail: number
      let shapes: [OscillatorType | 'piano', number, number][]
      if (sound === 'keys' || sound === 'guitar') {
        // Struck or plucked: a quick attack that fades on its own, cut off at the end.
        const decay = sound === 'keys' ? 0.35 + 2.2 * 2 ** ((48 - pitch) / 24) : 0.5
        const peak = (sound === 'keys' ? 0.16 : 0.1) * v
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(peak, t + 0.004)
        g.gain.setTargetAtTime(peak * 0.02, t + 0.004, decay)
        g.gain.setTargetAtTime(0, t + length, 0.06)
        filter.frequency.setValueAtTime(Math.min(16000, freq * (sound === 'keys' ? 6 : 8)), t)
        filter.frequency.setTargetAtTime(Math.min(16000, freq * 2), t, decay * 0.4)
        shapes = sound === 'keys' ? [['piano', -3, 1], ['piano', 3, 1]] : [['sawtooth', 0, 0.6], ['triangle', 2, 1]]
        tail = 0.4
      } else {
        // Blown, bowed or held: swells in, holds, lets go.
        const [peak, attack, release, cutoff] =
          sound === 'strings' ? [0.05, 0.12, 0.35, 2200] : sound === 'organ' ? [0.045, 0.01, 0.06, 3500] : sound === 'brass' ? [0.055, 0.05, 0.12, 1800] : [0.05, 0.02, 0.1, 2600]
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(peak * v, t + attack)
        g.gain.setValueAtTime(peak * v, t + Math.max(attack, length))
        g.gain.setTargetAtTime(0, t + Math.max(attack, length), release / 3)
        filter.frequency.value = cutoff
        if (sound === 'brass') {
          filter.frequency.setValueAtTime(cutoff * 0.3, t)
          filter.frequency.linearRampToValueAtTime(cutoff, t + 0.06)
        }
        shapes =
          sound === 'strings'
            ? [['sawtooth', -8, 1], ['sawtooth', 8, 1]]
            : sound === 'organ'
              ? [['sine', 0, 1], ['sine', 1200, 0.5], ['sine', 1902, 0.3]]
              : sound === 'brass'
                ? [['sawtooth', -4, 1], ['sawtooth', 4, 1]]
                : [['square', 0, 1]]
        tail = release + 0.1
      }
      filter.connect(g).connect(out)
      for (const [type, detune, level] of shapes) {
        const osc = ctx.createOscillator()
        if (type === 'piano') osc.setPeriodicWave(this.wave)
        else osc.type = type
        osc.frequency.value = freq
        osc.detune.value = detune
        let src: AudioNode = osc
        if (level !== 1) {
          const lg = ctx.createGain()
          lg.gain.value = level
          src = osc.connect(lg)
        }
        src.connect(filter)
        osc.start(t)
        osc.stop(t + length + tail)
        track(osc)
      }
    }
  }

  /** Metronome tick; the first beat of the bar is higher. `at` schedules it on the clock. */
  click(accent: boolean, at?: number): void {
    const t = Math.max(this.ctx.currentTime, at ?? 0)
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.frequency.value = accent ? 1760 : 1175
    gain.gain.setValueAtTime(accent ? 0.35 : 0.22, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
    osc.connect(gain).connect(this.buses.click)
    osc.start(t)
    osc.stop(t + 0.06)
    this.clicks = this.clicks.filter((c) => c.at > this.ctx.currentTime - 1)
    this.clicks.push({ osc, at: t })
  }

  /**
   * Follows the audio hardware's own report of what is being heard, smoothed so the
   * highway moves evenly even though the report only changes once per audio buffer.
   */
  private sync(): void {
    const ts = this.ctx.getOutputTimestamp?.()
    let measured: number
    if (ts && ts.contextTime && ts.performanceTime) {
      measured = ts.contextTime - ts.performanceTime / 1000
    } else {
      measured = this.ctx.currentTime - this.outputDelay - performance.now() / 1000
    }
    if (this.offset === null || Math.abs(measured - this.offset) > CLOCK_SNAP_S) this.offset = measured
    else this.offset += (measured - this.offset) * CLOCK_SMOOTHING
  }

  private stopVoices(match: (v: Voice) => boolean, release: number, at?: number): void {
    const now = this.ctx.currentTime
    const t = Math.max(now, at ?? now)
    this.voices = this.voices.filter((v) => {
      if (!match(v)) return true
      v.gain.gain.cancelScheduledValues(t)
      v.gain.gain.setTargetAtTime(0, t, release / 4)
      for (const osc of v.oscs) osc.stop(t + release + 0.05)
      return false
    })
  }
}
