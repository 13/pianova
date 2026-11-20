/** Relative strength of each harmonic: bright but mellow, vaguely piano-like. */
const HARMONICS = [1, 0.55, 0.28, 0.16, 0.1, 0.06, 0.04, 0.025, 0.015, 0.01]
const RELEASE_S = 0.18
const MAX_VOICES = 32

interface Voice {
  pitch: number
  gain: GainNode
  oscs: OscillatorNode[]
  /** Key is up but the sustain pedal is holding the note. */
  pedalled: boolean
}

/**
 * A small polyphonic piano-ish synth, the metronome click, and the app's clock.
 * Everything that needs "now" uses `now()`, which is AudioContext time in seconds.
 */
export class Synth {
  readonly ctx: AudioContext
  private master: GainNode
  private wave: PeriodicWave
  private voices: Voice[] = []
  private sustain = false

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

  now(): number {
    return this.ctx.currentTime
  }

  /** Converts an event timestamp (performance.now() scale, ms) to clock time. */
  fromPerf(perfTime: number): number {
    const age = Math.max(0, Math.min(0.1, (performance.now() - perfTime) / 1000))
    return this.ctx.currentTime - age
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

  noteOn(pitch: number, velocity = 0.75): void {
    const t = this.ctx.currentTime
    this.stopVoices((v) => v.pitch === pitch, 0.03)
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
    this.voices.push({ pitch, gain, oscs, pedalled: false })
  }

  noteOff(pitch: number): void {
    if (this.sustain) {
      for (const v of this.voices) if (v.pitch === pitch) v.pedalled = true
    } else {
      this.stopVoices((v) => v.pitch === pitch, RELEASE_S)
    }
  }

  setSustain(down: boolean): void {
    this.sustain = down
    if (!down) this.stopVoices((v) => v.pedalled, RELEASE_S)
  }

  allOff(): void {
    this.stopVoices(() => true, 0.05)
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
  }

  private stopVoices(match: (v: Voice) => boolean, release: number): void {
    const t = this.ctx.currentTime
    this.voices = this.voices.filter((v) => {
      if (!match(v)) return true
      v.gain.gain.cancelScheduledValues(t)
      v.gain.gain.setTargetAtTime(0, t, release / 4)
      for (const osc of v.oscs) osc.stop(t + release + 0.05)
      return false
    })
  }
}
