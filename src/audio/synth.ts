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

  /** Starts a note now, or at clock time `at` if that is later. */
  noteOn(pitch: number, velocity = 0.75, at?: number): void {
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
    filter.connect(gain).connect(this.master)
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
  }

  /** Metronome tick; the first beat of the bar is higher. `at` schedules it on the clock. */
  click(accent: boolean, at?: number): void {
    const t = Math.max(this.ctx.currentTime, at ?? 0)
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.frequency.value = accent ? 1760 : 1175
    gain.gain.setValueAtTime(accent ? 0.35 : 0.22, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
    osc.connect(gain).connect(this.master)
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
