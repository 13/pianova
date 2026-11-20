import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { isBlack, midiToLetter } from '../core/pitch'
import type { Chart, Hand } from '../core/types'
import { keyLabelsVersion, labelForPitch } from '../input/keyboard'
import type { Grade } from '../judge/judge'
import { COLORS, FONT, LOOKAHEAD, lighten, type FlashTiming, type Frame, type HighwayOptions, type HighwayRenderer } from './common'
import { chordGroups, focusRange, handZones, streakMilestone, timingLabel, type ChordGroup, type Tone } from './staging'

// World units: one white key is 1 wide. x runs along the keyboard, y is up, and the
// hit line is at z = 0 with the keys towards the player (+z) and the music beyond (-z).

const KEY_LEN = 5.6
const KEY_THICK = 0.9
const KEY_GAP = 0.075
const BLACK_W = 0.56
const BLACK_LEN = KEY_LEN * 0.62
/** How far black keys stand above the white ones. */
const BLACK_RISE = 0.46
const BLACK_THICK = 0.9
const NOTE_H = 0.3
const WHITE_PRESS = 0.05
const BLACK_PRESS = 0.065

/** Horizontal half-angle of view (as a tangent): wide, for a sense of depth. */
const TAN_H = 0.5
/** Camera tilt below the horizontal. */
const PITCH = (35 * Math.PI) / 180
/** How far past the screen edges the front of the keyboard runs. */
const OVERRUN = 1.03

const SPARK_LIFE = 0.9
const MAX_SPARKS = 700
const MAX_RINGS = 24
const MAX_GLOWS = 12
const DUST = 160

/** A full piano: A0 to C8, 52 white keys. The camera frames the part the music needs. */
const PIANO_LO = 21
const PIANO_HI = 108
/** What the camera frames with no music to follow: C3 to C5, around middle C. */
const HOME_LO = 48
const HOME_HI = 72
/** The camera frames at least this many white keys (four octaves and a bit)... */
const MIN_VIEW = 30
/** ...unless the screen is too narrow to keep keys this many pixels wide. */
const MIN_KEY_PX = 26
/** White keys left spare either side of the music the camera follows. */
const VIEW_MARGIN = 3
/** Finger numbers float over the keys for notes this close (in beats). */
const CUE_BEATS = 1.6
const MAX_CUES = 10
const MAX_MARKS = 4
/** The keyboard takes at most this share of the screen height; when zoomed in, its front runs off the bottom. */
const MAX_KEYS_SHARE = 0.34
/** Long notes (this many beats or more) are drawn as a head with a trail. */
const LONG_BEATS = 1.5
const HEAD_LEN = 0.85
/** Lanes start to light this many beats before their note arrives. */
const APPROACH_BEATS = 2.5
const MAX_APPROACH = 12
const MAX_BRACKETS = 10
const MAX_POPUPS = 16
const POPUP_LIFE = 0.85
/** How far ahead (in beats) hand zones and the camera look. */
const ZONE_BEATS = 4
const TONE_COLORS: Record<Tone | 'gold', string> = { ok: '#7dffb6', warn: '#ffc46b', bad: '#a3abcf', gold: '#ffe27a' }

interface KeyObj {
  pitch: number
  black: boolean
  x: number
  /** Hinged at the back edge so it tips down when pressed. */
  pivot: THREE.Group
  mat: THREE.MeshPhysicalMaterial
  base: THREE.Color
  press: number
  /** Smoothed 0..1 brightness of the lit colour, and of the hint wash. */
  lit: number
  hint: number
  litColor: THREE.Color
  hintColor: THREE.Color
  labels: THREE.Mesh[]
}

interface NoteSlot {
  mesh: THREE.Mesh
  refl: THREE.Mesh
  uniforms: NoteUniforms
  /** The thinner body of a long note, behind its head. */
  trail: THREE.Mesh
  trailUniforms: NoteUniforms
  label: THREE.Sprite
}

interface Bracket {
  group: THREE.Group
  mat: THREE.MeshBasicMaterial
  bar: THREE.Mesh
  left: THREE.Mesh
  right: THREE.Mesh
  label: THREE.Sprite
}

interface Popup {
  sprite: THREE.Sprite
  age: number
  life: number
  alive: boolean
  pitch: number
  rise: number
  size: number
}

interface Zone {
  strip: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  lo: number
  hi: number
  level: number
}

interface NoteUniforms {
  [name: string]: THREE.IUniform
  uSize: THREE.IUniform<THREE.Vector3>
  uColor: THREE.IUniform<THREE.Color>
  uRim: THREE.IUniform<THREE.Color>
  uAlpha: THREE.IUniform<number>
  uGlow: THREE.IUniform<number>
  uFar: THREE.IUniform<number>
  uReflect: THREE.IUniform<number>
  /** 1 while a long note's trail is being held: light runs along it. */
  uFlow: THREE.IUniform<number>
  uTime: THREE.IUniform<number>
}

interface Spark {
  alive: boolean
  pos: THREE.Vector3
  vel: THREE.Vector3
  age: number
  life: number
  color: THREE.Color
  size: number
}

interface Ring {
  mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  age: number
  life: number
  alive: boolean
}

/** The note highway and a lit, playable-looking keyboard, drawn with WebGL. */
export class Highway3D implements HighwayRenderer {
  private renderer: THREE.WebGLRenderer
  private composer: EffectComposer
  private bloom: UnrealBloomPass
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000)
  private observer: ResizeObserver
  private w = 0
  private h = 0
  private tanV = 0.3

  private readonly lo = PIANO_LO
  private readonly hi = PIANO_HI
  private whites = 0
  /** x of the middle of each key, by pitch. */
  private xs: number[] = []
  /** Length of the highway in world units, and of one beat on it. */
  private length = 60
  private beatLen = 7.5
  private labels = true
  private keyHints = false
  private hintShift = 0
  private labelKey = ''
  private held = new Set<number>()

  private keyboard = new THREE.Group()
  private keys = new Map<number, KeyObj>()
  private whiteGeo = new RoundedBoxGeometry(1 - KEY_GAP, KEY_THICK, KEY_LEN, 3, 0.09)
  private blackGeo = new RoundedBoxGeometry(BLACK_W, BLACK_THICK, BLACK_LEN, 3, 0.08)
  private bed: THREE.Mesh
  private keyLight: THREE.DirectionalLight

  private floor: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private hitLine: THREE.Mesh
  private hitHalo: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>

  private notes: NoteSlot[] = []
  private noteGeo = new RoundedBoxGeometry(1, 1, 1, 4, 0.25)
  private noteGroup = new THREE.Group()
  private reflGroup = new THREE.Group()

  private sparks: Spark[] = []
  private sparkPoints: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  private sparkCursor = 0
  private lastSustainSpark = 0
  private rings: Ring[] = []
  private glows = new Map<number, { sprite: THREE.Sprite; level: number; color: THREE.Color }>()
  private glowTexture = radialTexture()
  private dust: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>

  /** White keys framed by the camera and their centre, eased towards a target that follows the music. */
  private viewW = 0
  private viewCx = 0
  private targetW = 0
  private targetCx = 0
  private chart: Chart | null = null
  private chords: ChordGroup[] = []
  private brackets: Bracket[] = []
  private bracketGeo = new THREE.BoxGeometry(1, 1, 1)
  private popups: Popup[] = []
  private zones: Record<Hand, Zone>
  private lastStreak = 0
  /** Smoothed 0..1 from the streak: how hot the hit line burns. */
  private heat = 0
  /** Brief flash along the hit line after a streak milestone, 0..1. */
  private surge = 0
  private timeUniform = { value: 0 }
  /** Finger numbers floating over the keys about to be played. */
  private cues: THREE.Sprite[] = []
  /** Lines across the highway where each part of the song begins. */
  private marks: { bar: THREE.Mesh; mat: THREE.MeshBasicMaterial; label: THREE.Sprite }[] = []

  private textures = new Map<string, THREE.CanvasTexture>()
  private last = performance.now()
  private time = 0
  private lostContext = false

  constructor(private canvas: HTMLCanvasElement) {
    canvas.dataset.gl = '1'
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    canvas.addEventListener('webglcontextlost', this.onLost)
    canvas.addEventListener('webglcontextrestored', this.onRestored)

    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })
    this.composer = new EffectComposer(this.renderer, target)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.7, 0.45, 1.05)
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())

    const scene = this.scene
    scene.background = new THREE.Color('#070a1c')
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 0.12
    pmrem.dispose()

    // A cool sky fill, a key light from behind that throws the black keys' shadows
    // forward onto the ivory, and a soft front light for the bevels.
    scene.add(new THREE.HemisphereLight('#b9c3ff', '#2a2440', 0.55))
    this.keyLight = new THREE.DirectionalLight('#fff2e0', 1.55)
    this.keyLight.castShadow = true
    this.keyLight.shadow.mapSize.set(2048, 1024)
    this.keyLight.shadow.bias = -0.0004
    this.keyLight.shadow.normalBias = 0.02
    this.keyLight.shadow.radius = 3
    scene.add(this.keyLight, this.keyLight.target)
    const front = new THREE.DirectionalLight('#dfe4ff', 0.45)
    front.position.set(0, 6, 20)
    scene.add(front)

    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), floorMaterial())
    this.floor.rotation.x = -Math.PI / 2
    this.floor.renderOrder = -2
    scene.add(this.floor)

    this.bed = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.4, KEY_LEN + 0.4),
      new THREE.MeshStandardMaterial({ color: '#040509', roughness: 0.6 }),
    )
    scene.add(this.bed)

    this.hitLine = new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 0.07), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.6, 2.1) }))
    scene.add(this.hitLine)
    this.hitHalo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), haloMaterial())
    this.hitHalo.renderOrder = 5
    scene.add(this.hitHalo)

    this.reflGroup.scale.y = -1
    scene.add(this.keyboard, this.reflGroup, this.noteGroup)

    this.sparkPoints = this.makeSparks()
    this.dust = this.makeDust()
    scene.add(this.sparkPoints, this.dust)
    for (let i = 0; i < MAX_RINGS; i++) {
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(0.82, 1, 48),
        new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
      )
      mesh.rotation.x = -Math.PI / 2
      mesh.visible = false
      mesh.renderOrder = 6
      scene.add(mesh)
      this.rings.push({ mesh, age: 0, life: 0.5, alive: false })
    }

    for (let i = 0; i < MAX_POPUPS; i++) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, depthTest: false, toneMapped: false }))
      sprite.visible = false
      sprite.renderOrder = 10
      scene.add(sprite)
      this.popups.push({ sprite, age: 0, life: POPUP_LIFE, alive: false, pitch: 0, rise: 1.4, size: 1 })
    }
    for (let i = 0; i < MAX_CUES; i++) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, depthTest: false, toneMapped: false }))
      sprite.visible = false
      sprite.renderOrder = 8
      scene.add(sprite)
      this.cues.push(sprite)
    }
    for (let i = 0; i < MAX_MARKS; i++) {
      const mat = new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat)
      bar.rotation.x = -Math.PI / 2
      bar.renderOrder = 3
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, depthTest: false, toneMapped: false }))
      label.renderOrder = 9
      bar.visible = label.visible = false
      scene.add(bar, label)
      this.marks.push({ bar, mat, label })
    }
    const zone = (): Zone => {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), stripMaterial())
      strip.renderOrder = 6
      strip.visible = false
      scene.add(strip)
      return { strip, lo: 0, hi: 0, level: 0 }
    }
    this.zones = { L: zone(), R: zone() }
    this.zones.L.strip.material.uniforms.uColor.value.set(COLORS.L)
    this.zones.R.strip.material.uniforms.uColor.value.set(COLORS.R)

    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas)
    this.buildKeys()
    this.resize()
  }

  destroy(): void {
    this.observer.disconnect()
    this.canvas.removeEventListener('webglcontextlost', this.onLost)
    this.canvas.removeEventListener('webglcontextrestored', this.onRestored)
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      mesh.geometry?.dispose()
      const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
      for (const m of mats) m.dispose()
    })
    for (const t of this.textures.values()) t.dispose()
    this.glowTexture.dispose()
    this.scene.environment?.dispose()
    this.composer.dispose()
    this.renderer.dispose()
    // Browsers cap live WebGL contexts, and every screen makes a new highway.
    this.renderer.forceContextLoss()
  }

  setRange(chart: Chart | null): void {
    this.chart = chart
    this.chords = chart ? chordGroups(chart) : []
    // Start already looking at the music's first notes rather than gliding over from middle C.
    this.viewW = 0
    this.layout()
  }

  setOptions(opts: HighwayOptions): void {
    this.labels = opts.labels
    this.keyHints = opts.keyHints
    this.hintShift = opts.hintShift ?? 0
  }

  setHeld(held: Set<number>): void {
    this.held = held
  }

  flash(pitch: number, kind: Grade | 'wrong', hand?: Hand, timing?: FlashTiming): void {
    if (timing && kind !== 'wrong') {
      const label = timingLabel(kind, timing.offsetMs, timing.timed)
      this.popup(pitch, label.text, kind === 'perfect' && timing.timed ? 'gold' : label.tone)
    }
    if (kind === 'miss') return
    const color = kind === 'wrong' ? COLORS.wrong : hand ? COLORS[hand] : COLORS.neutral
    this.burst(pitch, color, kind === 'perfect' ? 26 : kind === 'wrong' ? 10 : 14)
    if (kind !== 'wrong') this.ring(pitch, color, kind === 'perfect' ? 1.25 : 0.9)
  }

  // ---- setup -----------------------------------------------------------------

  private onLost = (e: Event) => {
    e.preventDefault()
    this.lostContext = true
  }

  private onRestored = () => {
    this.lostContext = false
    this.labelKey = ''
  }

  private resize(): void {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    if (w === 0 || h === 0) return
    this.w = w
    this.h = h
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(w, h, false)
    this.composer.setPixelRatio(dpr)
    this.composer.setSize(w, h)
    this.layout()
  }

  private keyX(pitch: number): number {
    return this.xs[Math.max(this.lo, Math.min(this.hi, pitch))]
  }

  private buildKeys(): void {
    for (const k of this.keys.values()) {
      k.mat.dispose()
      for (const l of k.labels) (l.material as THREE.Material).dispose()
    }
    this.keyboard.clear()
    this.keys.clear()
    this.labelKey = ''

    let whites = 0
    for (let p = this.lo; p <= this.hi; p++) {
      this.xs[p] = isBlack(p) ? whites : whites + 0.5
      if (!isBlack(p)) whites++
    }
    this.whites = whites
    this.viewW = 0

    for (let p = this.lo; p <= this.hi; p++) {
      const black = isBlack(p)
      const base = new THREE.Color(black ? '#0d0d12' : '#f4efe4')
      const mat = new THREE.MeshPhysicalMaterial({
        color: base.clone(),
        roughness: black ? 0.32 : 0.42,
        clearcoat: black ? 1 : 0.55,
        clearcoatRoughness: black ? 0.12 : 0.28,
        emissive: new THREE.Color(0, 0, 0),
      })
      const mesh = new THREE.Mesh(black ? this.blackGeo : this.whiteGeo, mat)
      mesh.castShadow = black
      mesh.receiveShadow = !black
      const pivot = new THREE.Group()
      const x = this.keyX(p)
      if (black) {
        pivot.position.set(x, 0, 0)
        mesh.position.set(0, BLACK_RISE - BLACK_THICK / 2, BLACK_LEN / 2)
      } else {
        pivot.position.set(x, -0.002, 0)
        mesh.position.set(0, -KEY_THICK / 2, KEY_LEN / 2)
      }
      pivot.add(mesh)
      this.keyboard.add(pivot)
      this.keys.set(p, {
        pitch: p,
        black,
        x,
        pivot,
        mat,
        base,
        press: 0,
        lit: 0,
        hint: 0,
        litColor: new THREE.Color(),
        hintColor: new THREE.Color(),
        labels: [],
      })
    }

    // The dark bed the keys sit in, showing through the gaps between them.
    this.bed.scale.set(whites + 6, 1, 1)
    this.bed.position.set(whites / 2, -KEY_THICK + 0.05, KEY_LEN / 2 + 0.1)
  }

  /** Sizes everything that depends on the keyboard's range rather than on the camera. */
  private layout(): void {
    if (this.w === 0) return
    const W = this.whites
    const cx = W / 2
    // Index (among white-key boundaries) of the first C boundary, for stronger lane lines.
    let ci = 0
    for (let p = this.lo, i = 0; p <= this.hi; p++) {
      if (isBlack(p)) continue
      if (p % 12 === 0) {
        ci = i
        break
      }
      i++
    }
    this.floor.material.uniforms.uCIndex.value = ci

    this.hitLine.scale.set(W + 4, 1, 1)
    this.hitLine.position.set(cx, 0.03, -0.04)
    this.hitHalo.scale.set(W + 4, 2.2, 1)
    this.hitHalo.position.set(cx, 0.02, -1.0)
    this.hitHalo.rotation.x = -Math.PI / 2

    if (!this.viewW) this.resetView()
    this.aim()
    this.labelKey = ''
  }

  private resetView(): void {
    const range = (this.chart && focusRange(this.chart, 0, LOOKAHEAD * 0.8)) ?? { lo: HOME_LO, hi: HOME_HI }
    this.frameRange(range.lo, range.hi)
    this.viewW = this.targetW
    this.viewCx = this.targetCx
  }

  /** Sets the camera's target to show keys lo..hi with some spare, at least a few octaves wide. */
  private frameRange(lo: number, hi: number): void {
    const W = this.whites
    const minView = Math.min(MIN_VIEW, Math.max(12, this.w / MIN_KEY_PX))
    const x0 = this.keyX(lo) - 0.5 - VIEW_MARGIN
    const x1 = this.keyX(hi) + 0.5 + VIEW_MARGIN
    this.targetW = Math.min(W, Math.max(minView, x1 - x0))
    const half = this.targetW / 2
    this.targetCx = Math.min(W - half, Math.max(half, (x0 + x1) / 2))
  }

  /**
   * Places the camera to frame `viewW` white keys around `viewCx`, with the front of the
   * keyboard on the bottom edge of the screen (or below it, when zoomed in), and sizes
   * the highway to reach the top of the screen.
   */
  private aim(): void {
    const W = this.viewW
    const cx = this.viewCx
    const aspect = this.w / this.h
    const tanH = TAN_H
    this.tanV = tanH / aspect

    const aimZ = KEY_LEN * 0.5
    const dist = W / 2 / (OVERRUN * tanH) + (KEY_LEN - aimZ) * Math.cos(PITCH)
    const cam = this.camera
    cam.position.set(cx, dist * Math.sin(PITCH), aimZ + dist * Math.cos(PITCH))
    cam.up.set(0, 1, 0)
    cam.lookAt(cx, 0, aimZ)
    cam.aspect = aspect
    cam.fov = (2 * Math.atan(this.tanV) * 180) / Math.PI
    cam.far = dist * 12
    cam.updateProjectionMatrix()
    cam.updateMatrixWorld()

    // Shift the lens so the front edge of the keyboard sits on the bottom of the screen,
    // unless that would let the keys fill too much of it.
    const front = tmpV.set(cx, -KEY_THICK, KEY_LEN + 0.15).project(cam).y
    const line = tmpV.set(cx, 0, 0).project(cam).y
    const maxLine = -1 + 2 * MAX_KEYS_SHARE
    cam.projectionMatrix.elements[9] = Math.max(front + 1, line - maxLine)
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert()

    // The shadow-casting light covers just the keys in view, so its shadows stay crisp.
    const l = this.keyLight
    l.position.set(cx - W * 0.12, 14, -7)
    l.target.position.set(cx, 0, KEY_LEN * 0.5)
    l.target.updateMatrixWorld()
    const sc = l.shadow.camera
    sc.left = -W * 0.62 - 2
    sc.right = W * 0.62 + 2
    sc.top = 9
    sc.bottom = -9
    sc.near = 1
    sc.far = 40
    sc.updateProjectionMatrix()

    // The highway runs back to wherever the top of the screen meets the floor.
    raycaster.setFromCamera(tmpV2.set(0, 1), cam)
    const hit = raycaster.ray.intersectPlane(floorPlane, tmpV)
    const far = hit && hit.z < 0 ? -hit.z : W * 4
    this.length = Math.min(W * 4, Math.max(W * 0.6, far * 1.02))
    this.beatLen = this.length / LOOKAHEAD

    this.floor.scale.set(this.whites * 6, this.length + 2, 1)
    this.floor.position.set(this.whites / 2, -0.012, -(this.length + 2) / 2 + 0.5)
    const fu = this.floor.material.uniforms
    fu.uLength.value = this.length
    fu.uBeatLen.value = this.beatLen
    fu.uView.value.set(cx, W)

    this.sparkPoints.material.uniforms.uScale.value = (this.h * this.renderer.getPixelRatio()) / (2 * this.tanV)
    this.dust.material.uniforms.uScale.value = this.sparkPoints.material.uniforms.uScale.value
    this.dust.material.uniforms.uBox.value.set(W, 7, this.length)
    this.dust.position.set(cx - W / 2, 0, 0)
  }

  /** Eases the camera towards the keys the music needs next. */
  private follow(frame: Frame, dt: number): void {
    const chart = frame.chart
    if (chart) {
      const range = focusRange(chart, frame.beat, LOOKAHEAD * 0.8)
      if (range) this.frameRange(range.lo, range.hi)
    } else {
      // Explanations: around middle C, taking in any keys being pointed out.
      let lo = HOME_LO
      let hi = HOME_HI
      for (const p of frame.highlight?.keys() ?? []) {
        lo = Math.min(lo, p)
        hi = Math.max(hi, p)
      }
      for (const p of this.held) {
        lo = Math.min(lo, p)
        hi = Math.max(hi, p)
      }
      this.frameRange(lo, hi)
    }
    // Slow and smooth, so the keys never seem to slide out from under the hands.
    const k = 1 - Math.exp(-dt * 1.6)
    const before = this.viewW + this.viewCx * 1000
    this.viewW += (this.targetW - this.viewW) * k
    this.viewCx += (this.targetCx - this.viewCx) * k
    if (Math.abs(this.viewW + this.viewCx * 1000 - before) > 1e-5) this.aim()
  }

  // ---- labels ----------------------------------------------------------------

  /** A small transparent texture of some text, shared by every key or note that shows it. */
  private text(text: string, style: 'c' | 'letter' | 'hint' | 'hintDark' | 'note' | 'chord' | 'pop' | 'finger', color = '#ffffff'): THREE.CanvasTexture {
    const id = `${style}|${color}|${text}`
    const cached = this.textures.get(id)
    if (cached) return cached
    const c = document.createElement('canvas')
    const wide = style === 'chord' || style === 'pop'
    c.width = wide ? 256 : 128
    c.height = 128
    const g = c.getContext('2d')!
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    if (style === 'finger') {
      // A badge in the hand's colour: the finger number on a glowing disc.
      g.shadowColor = color
      g.shadowBlur = 14
      g.fillStyle = color
      g.beginPath()
      g.arc(64, 64, 46, 0, Math.PI * 2)
      g.fill()
      g.shadowBlur = 0
      g.lineWidth = 6
      g.strokeStyle = 'rgba(255, 255, 255, 0.92)'
      g.stroke()
      g.font = `800 66px ${FONT}`
      g.fillStyle = 'rgba(6, 8, 26, 1)'
      g.fillText(text, 64, 69)
    } else if (wide) {
      // Bold, with a dark outline and a glow of its own colour so it reads over anything.
      g.font = `${style === 'pop' ? 'italic 900' : '800'} ${style === 'pop' ? 62 : 70}px ${FONT}`
      const size = g.measureText(text).width
      if (size > 236) g.font = g.font.replace(/\d+px/, `${Math.floor((style === 'pop' ? 62 : 70) * (236 / size))}px`)
      g.lineJoin = 'round'
      g.lineWidth = 10
      g.strokeStyle = 'rgba(4, 6, 20, 0.85)'
      g.strokeText(text, 128, 66)
      g.shadowColor = color
      g.shadowBlur = 16
      g.fillStyle = color
      g.fillText(text, 128, 66)
      g.shadowBlur = 0
      g.fillText(text, 128, 66)
    } else if (style === 'note') {
      g.font = `800 84px ${FONT}`
      g.shadowColor = 'rgba(255, 255, 255, 0.8)'
      g.shadowBlur = 10
      g.fillStyle = 'rgba(6, 8, 26, 1)'
    } else if (style === 'c') {
      g.font = `italic 600 64px ${FONT}`
      g.fillStyle = 'rgba(64, 60, 54, 0.9)'
    } else if (style === 'letter') {
      g.font = `500 54px ${FONT}`
      g.fillStyle = 'rgba(64, 60, 54, 0.5)'
    } else {
      g.font = `700 50px ${FONT}`
      g.fillStyle = style === 'hint' ? 'rgba(255, 255, 255, 0.62)' : 'rgba(64, 60, 54, 0.55)'
    }
    if (!wide && style !== 'finger') g.fillText(text, 64, 68)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    this.textures.set(id, t)
    return t
  }

  /** Letters and computer-key hints printed on the key tops, rebuilt when they would change. */
  private syncKeyLabels(): void {
    const keyPx = this.w / Math.max(1, this.viewW || this.whites)
    const key = [this.labels, this.keyHints, this.hintShift, keyLabelsVersion(), keyPx >= 30, this.lo, this.hi].join('|')
    if (key === this.labelKey) return
    this.labelKey = key
    for (const k of this.keys.values()) {
      for (const l of k.labels) {
        k.pivot.remove(l)
        ;(l.material as THREE.Material).dispose()
      }
      k.labels = []
      const add = (texture: THREE.CanvasTexture, size: number, y: number, z: number) => {
        const m = new THREE.Mesh(
          labelPlane,
          new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, toneMapped: false }),
        )
        m.rotation.x = -Math.PI / 2
        m.scale.setScalar(size)
        m.position.set(0, y, z)
        m.renderOrder = 1
        k.pivot.add(m)
        k.labels.push(m)
      }
      const p = k.pitch
      const hint = this.keyHints && keyPx >= 30 ? labelForPitch(p, this.hintShift) : null
      if (k.black) {
        if (hint) add(this.text(hint, 'hint'), 0.46, BLACK_RISE + 0.004, BLACK_LEN * 0.8)
      } else {
        const isC = p % 12 === 0
        if (isC) add(this.text(midiToLetter(p) + String(Math.floor(p / 12) - 1), 'c'), 0.78, 0.004, KEY_LEN * 0.86)
        else if (this.labels && keyPx >= 30) add(this.text(midiToLetter(p), 'letter'), 0.62, 0.004, KEY_LEN * 0.87)
        if (hint) add(this.text(hint, 'hintDark'), 0.5, 0.004, KEY_LEN * 0.7)
      }
    }
  }

  // ---- per frame -------------------------------------------------------------

  draw(frame: Frame): void {
    if (this.w === 0 || this.h === 0 || this.lostContext) return
    const now = performance.now()
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.time += dt
    this.timeUniform.value = this.time
    if ((frame.chart ?? null) !== this.chart) {
      this.chart = frame.chart ?? null
      this.chords = this.chart ? chordGroups(this.chart) : []
    }

    this.follow(frame, dt)
    this.syncKeyLabels()
    const sounding = new Map<number, string>()
    if (frame.chart) this.updateNotes(frame, frame.chart, now, sounding)
    else this.hideNotes(0)
    this.updateBrackets(frame)
    this.updateKeys(frame, dt, sounding)
    this.updateFloor(frame, sounding)
    this.updateZones(frame, dt)
    this.updateCues(frame)
    this.updateMarks(frame)
    this.updateStreak(frame, dt)
    this.updateSparks(dt)
    this.updateRings(dt)
    this.updatePopups(dt)
    this.dust.material.uniforms.uTime.value = this.time
    this.composer.render(dt)
  }

  private updateNotes(frame: Frame, chart: Chart, now: number, sounding: Map<number, string>): void {
    const spawnSustain = now - this.lastSustainSpark > 45
    let used = 0
    for (let i = 0; i < chart.notes.length; i++) {
      const n = chart.notes[i]
      const ahead = n.startBeat - frame.beat
      const tail = ahead + n.durationBeats
      if (ahead > LOOKAHEAD || tail < 0) continue
      if (n.pitch < this.lo || n.pitch > this.hi) continue
      const state = frame.noteState?.[i] ?? 'pending'
      const active = frame.active?.[i] ?? true
      const hit = state === 'perfect' || state === 'good'
      const cut = !!frame.cut?.[i]
      const isSounding = ahead <= 0 && !cut && (hit || !active || !frame.active)

      // The note is swallowed by the line as it is played.
      const nearB = Math.max(0, ahead)
      const farB = Math.min(LOOKAHEAD + 0.5, Math.max(nearB + 0.06, tail))
      const zNear = -nearB * this.beatLen
      const zFar = -farB * this.beatLen + Math.min(0.12, (farB - nearB) * this.beatLen * 0.2)
      const len = Math.max(0.12, zNear - zFar)
      const black = isBlack(n.pitch)
      const width = black ? 0.5 : 0.74
      const x = this.keyX(n.pitch)

      const slot = this.slot(used++)
      const u = slot.uniforms
      const color = state === 'miss' ? COLORS.miss : COLORS[n.hand]
      const alpha = state === 'miss' ? 0.4 : cut ? 0.3 : active ? 1 : 0.5
      const glow = state === 'miss' ? 0 : isSounding ? 1 : 0
      u.uColor.value.set(color)
      u.uRim.value.set(lighten(color, 0.55))
      u.uAlpha.value = alpha
      u.uGlow.value = glow
      u.uFar.value = this.length
      const h = black ? NOTE_H + 0.12 : NOTE_H
      const base = black ? 0.12 : 0

      // Long notes: a solid head, then a slim glowing trail that drains into the line as it is held.
      const long = n.durationBeats >= LONG_BEATS && len > HEAD_LEN * 1.6
      const headLen = long ? (ahead > 0 ? HEAD_LEN : Math.min(0.4, len)) : len
      u.uSize.value.set(width, h, headLen)
      slot.mesh.position.set(x, base + h / 2, zNear - headLen / 2)
      slot.mesh.scale.set(width, h, headLen)
      slot.refl.position.copy(slot.mesh.position)
      slot.refl.scale.copy(slot.mesh.scale)
      slot.mesh.visible = slot.refl.visible = true
      slot.trail.visible = long
      if (long) {
        const t = slot.trailUniforms
        const tw = width * 0.42
        const th = 0.14
        const tLen = len - headLen + 0.1
        t.uColor.value.set(color)
        t.uRim.value.set(lighten(color, 0.6))
        t.uAlpha.value = alpha * 0.8
        t.uGlow.value = glow * 0.8
        t.uFlow.value = glow
        t.uFar.value = this.length
        t.uSize.value.set(tw, th, tLen)
        slot.trail.position.set(x, base + th / 2, zNear - headLen + 0.1 - tLen / 2)
        slot.trail.scale.set(tw, th, tLen)
      }
      const y = base + h / 2

      // Finger number (or note name) rides on the leading end.
      const label = n.finger ? String(n.finger) : this.labels ? midiToLetter(n.pitch) : ''
      const show = label && active && state === 'pending' && ahead > -0.05 && len > 0.6
      slot.label.visible = !!show
      if (show) {
        const tex = this.text(label, 'note')
        if (slot.label.material.map !== tex) {
          slot.label.material.map = tex
          slot.label.material.needsUpdate = true
        }
        const s = black ? 0.56 : 0.7
        slot.label.scale.set(s, s, 1)
        slot.label.position.set(x, y + h / 2 + 0.2, zNear - Math.min(0.42, headLen / 2))
        slot.label.material.opacity = Math.min(1, (this.length * 0.9 + zNear) / (this.length * 0.25))
      }

      if (isSounding && state !== 'miss') {
        sounding.set(n.pitch, COLORS[n.hand])
        if (spawnSustain && tail > 0.05) this.burst(n.pitch, COLORS[n.hand], 1)
      }
    }
    if (spawnSustain) this.lastSustainSpark = now
    this.hideNotes(used)
  }

  private hideNotes(from: number): void {
    for (let i = from; i < this.notes.length; i++) {
      const s = this.notes[i]
      s.mesh.visible = s.refl.visible = s.label.visible = s.trail.visible = false
    }
  }

  private slot(i: number): NoteSlot {
    if (this.notes[i]) return this.notes[i]
    const uniforms: NoteUniforms = {
      uSize: { value: new THREE.Vector3(1, 1, 1) },
      uColor: { value: new THREE.Color() },
      uRim: { value: new THREE.Color() },
      uAlpha: { value: 1 },
      uGlow: { value: 0 },
      uFar: { value: 60 },
      uReflect: { value: 0 },
      uFlow: { value: 0 },
      uTime: this.timeUniform,
    }
    const trailUniforms: NoteUniforms = {
      ...uniforms,
      uSize: { value: new THREE.Vector3(1, 1, 1) },
      uColor: { value: new THREE.Color() },
      uRim: { value: new THREE.Color() },
      uAlpha: { value: 1 },
      uGlow: { value: 0 },
      uFlow: { value: 0 },
      uFar: { value: 60 },
    }
    const trail = new THREE.Mesh(this.noteGeo, noteMaterial(trailUniforms))
    trail.renderOrder = 1
    const mesh = new THREE.Mesh(this.noteGeo, noteMaterial(uniforms))
    mesh.renderOrder = 2
    const refl = new THREE.Mesh(this.noteGeo, noteMaterial({ ...uniforms, uReflect: { value: 1 } }))
    refl.renderOrder = -1
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, depthTest: false, toneMapped: false }))
    label.renderOrder = 3
    this.noteGroup.add(trail, mesh, label)
    this.reflGroup.add(refl)
    const slot = { mesh, refl, uniforms, trail, trailUniforms, label }
    this.notes[i] = slot
    return slot
  }

  private updateKeys(frame: Frame, dt: number, sounding: Map<number, string>): void {
    const ease = 1 - Math.exp(-dt * 28)
    const fade = 1 - Math.exp(-dt * 14)
    const pulse = 0.75 + 0.25 * Math.sin(this.time * 5)
    const white = new THREE.Color()
    for (const k of this.keys.values()) {
      const held = this.held.has(k.pitch)
      const hand = frame.keyHands?.get(k.pitch)
      const mark = frame.highlight?.get(k.pitch)

      k.press += ((held ? 1 : 0) - k.press) * ease
      k.pivot.rotation.x = k.press * (k.black ? BLACK_PRESS : WHITE_PRESS)

      if (held) k.litColor.set(hand ? COLORS[hand] : COLORS.neutral)
      k.lit += ((held ? 1 : 0) - k.lit) * (held ? ease : fade)
      if (mark) k.hintColor.set(mark === 'hint' ? COLORS.hint : COLORS[mark])
      k.hint += ((mark ? 1 : 0) - k.hint) * fade

      // Ivory (or ebony) tinted towards the lit colour, glowing from within.
      const tint = Math.max(k.lit, k.hint * 0.55)
      const tintColor = k.lit >= k.hint * 0.55 ? k.litColor : k.hintColor
      white.copy(tintColor).lerp(WHITE, k.black ? 0.2 : 0.12)
      k.mat.color.copy(k.base).lerp(white, tint * (k.black ? 0.9 : 0.9))
      k.mat.emissive.copy(k.litColor).multiplyScalar(k.lit * (k.black ? 1.1 : 0.6))
      k.mat.emissive.add(white.copy(k.hintColor).multiplyScalar(k.hint * (1 - k.lit) * 0.42 * pulse))

      // A soft flare where the key meets the line while it plays.
      const flare = sounding.get(k.pitch) ?? (held ? (hand ? COLORS[hand] : COLORS.neutral) : null)
      this.updateGlow(k, flare, dt)
    }
  }

  private updateGlow(k: KeyObj, color: string | null, dt: number): void {
    let g = this.glows.get(k.pitch)
    if (!g && !color) return
    if (!g) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: this.glowTexture, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }),
      )
      sprite.renderOrder = 7
      this.scene.add(sprite)
      g = { sprite, level: 0, color: new THREE.Color() }
      this.glows.set(k.pitch, g)
    }
    if (color) g.color.set(color)
    g.level += ((color ? 1 : 0) - g.level) * (1 - Math.exp(-dt * (color ? 30 : 9)))
    const flicker = 0.92 + 0.08 * Math.sin(this.time * 31 + k.pitch)
    g.sprite.visible = g.level > 0.01
    g.sprite.material.color.copy(g.color).multiplyScalar(1.5 * g.level * flicker)
    g.sprite.position.set(k.x, k.black ? BLACK_RISE + 0.15 : 0.18, -0.05)
    g.sprite.scale.set(k.black ? 1.8 : 2.3, 1.2, 1)
  }

  private updateFloor(frame: Frame, sounding: Map<number, string>): void {
    const u = this.floor.material.uniforms
    u.uBeat.value = frame.beat
    u.uBpb.value = frame.chart?.beatsPerBar ?? 0
    u.uTime.value = this.time
    // Light spilling up each lane that is being played.
    const lanes = u.uLanes.value as THREE.Vector4[]
    const colors = u.uLaneColors.value as THREE.Color[]
    let i = 0
    const lit = new Map(sounding)
    for (const p of this.held) {
      const hand = frame.keyHands?.get(p)
      if (!lit.has(p)) lit.set(p, hand ? COLORS[hand] : COLORS.neutral)
    }
    for (const [p, color] of lit) {
      if (i >= MAX_GLOWS) break
      const k = this.keys.get(p)
      if (!k) continue
      lanes[i].set(k.x, k.black ? 0.3 : 0.42, sounding.has(p) ? 1 : 0.6, 0)
      colors[i].set(color)
      i++
    }
    u.uLaneCount.value = i

    // Lanes light up ahead of the notes coming down them, brighter as each gets close.
    const approach = u.uApproach.value as THREE.Vector4[]
    const approachColors = u.uApproachColors.value as THREE.Color[]
    let a = 0
    const notes = frame.chart?.notes ?? []
    for (let j = 0; j < notes.length && a < MAX_APPROACH; j++) {
      const n = notes[j]
      const ahead = n.startBeat - frame.beat
      if (ahead <= 0 || ahead >= APPROACH_BEATS) continue
      if ((frame.noteState?.[j] ?? 'pending') !== 'pending' || !(frame.active?.[j] ?? true)) continue
      const k = this.keys.get(n.pitch)
      if (!k) continue
      const near = Math.pow(1 - ahead / APPROACH_BEATS, 1.5)
      approach[a].set(k.x, k.black ? 0.3 : 0.44, near, -ahead * this.beatLen)
      approachColors[a].set(COLORS[n.hand])
      a++
    }
    u.uApproachCount.value = a
  }

  // ---- chords, hand zones, streak and popups ---------------------------------

  /** A glowing bracket across each chord still to come, with its name beside it. */
  private updateBrackets(frame: Frame): void {
    let used = 0
    for (const g of this.chords) {
      if (used >= MAX_BRACKETS) break
      const ahead = g.startBeat - frame.beat
      if (ahead > LOOKAHEAD * 0.95 || ahead < -0.04) continue
      if (frame.active && !g.notes.some((i) => frame.active![i])) continue
      if (frame.noteState && g.notes.every((i) => frame.noteState![i] !== 'pending')) continue
      if (g.lo < this.lo || g.hi > this.hi) continue
      const b = this.bracket(used++)
      const edge = (p: number) => (isBlack(p) ? 0.32 : 0.44)
      const x0 = this.keyX(g.lo) - edge(g.lo) - 0.1
      const x1 = this.keyX(g.hi) + edge(g.hi) + 0.1
      const z = -Math.max(0, ahead) * this.beatLen + 0.14
      const fade = Math.max(0, Math.min(1, (this.length * 0.95 + z) / (this.length * 0.2)))
      b.mat.color.set(COLORS[g.hand]).multiplyScalar(1.7)
      b.mat.opacity = 0.9 * fade
      b.bar.position.set((x0 + x1) / 2, 0.05, z)
      b.bar.scale.set(x1 - x0, 0.06, 0.08)
      b.left.position.set(x0, 0.24, z)
      b.right.position.set(x1, 0.24, z)
      b.group.visible = true
      b.label.visible = !!g.name
      if (g.name) {
        const tex = this.text(g.name, 'chord', lighten(COLORS[g.hand], 0.35))
        if (b.label.material.map !== tex) {
          b.label.material.map = tex
          b.label.material.needsUpdate = true
        }
        b.label.material.opacity = fade
        b.label.position.set(x0 - 0.85, 0.5, z - 0.1)
        b.label.scale.set(1.6, 0.8, 1)
      }
    }
    for (let i = used; i < this.brackets.length; i++) this.brackets[i].group.visible = false
  }

  private bracket(i: number): Bracket {
    if (this.brackets[i]) return this.brackets[i]
    const mat = new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
    const bar = new THREE.Mesh(this.bracketGeo, mat)
    const left = new THREE.Mesh(this.bracketGeo, mat)
    const right = new THREE.Mesh(this.bracketGeo, mat)
    left.scale.set(0.07, 0.42, 0.07)
    right.scale.set(0.07, 0.42, 0.07)
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, depthTest: false, toneMapped: false }))
    label.renderOrder = 9
    const group = new THREE.Group()
    group.renderOrder = 4
    group.add(bar, left, right, label)
    this.scene.add(group)
    const b = { group, mat, bar, left, right, label }
    this.brackets[i] = b
    return b
  }

  /** Each hand's next notes get their finger number floating over the key, growing as they near. */
  private updateCues(frame: Frame): void {
    let used = 0
    const notes = frame.chart?.notes ?? []
    const next: Record<Hand, number> = { L: Infinity, R: Infinity }
    const waiting = (i: number) =>
      notes[i].finger && (frame.noteState?.[i] ?? 'pending') === 'pending' && (frame.active?.[i] ?? true) && notes[i].startBeat - frame.beat > -0.3
    for (let i = 0; i < notes.length; i++) {
      if (waiting(i)) next[notes[i].hand] = Math.min(next[notes[i].hand], notes[i].startBeat)
    }
    for (let i = 0; i < notes.length && used < MAX_CUES; i++) {
      const n = notes[i]
      const ahead = n.startBeat - frame.beat
      if (ahead > CUE_BEATS || Math.abs(n.startBeat - next[n.hand]) > 1e-6 || !waiting(i)) continue
      const k = this.keys.get(n.pitch)
      if (!k) continue
      const sprite = this.cues[used++]
      const tex = this.text(String(n.finger), 'finger', COLORS[n.hand])
      if (sprite.material.map !== tex) {
        sprite.material.map = tex
        sprite.material.needsUpdate = true
      }
      const near = 1 - Math.max(0, Math.min(1, ahead / CUE_BEATS))
      // Due now: a gentle beat so it reads as "this one".
      const pulse = ahead < 0.08 ? 1 + 0.09 * Math.sin(this.time * 11) : 1
      const size = (k.black ? 0.78 : 0.95) * (0.6 + 0.4 * near) * pulse
      sprite.scale.set(size, size, 1)
      sprite.position.set(k.x, (k.black ? BLACK_RISE : 0) + 0.55 + 0.25 * near, k.black ? 0.75 : 1.15)
      sprite.material.opacity = Math.min(1, near * 2.2)
      sprite.visible = true
    }
    for (let i = used; i < MAX_CUES; i++) this.cues[i].visible = false
  }

  /** A line across the highway, with the part's name, where each section of the song starts. */
  private updateMarks(frame: Frame): void {
    let used = 0
    for (const s of frame.chart ? frame.sections ?? [] : []) {
      if (used >= MAX_MARKS) break
      const ahead = s.startBeat - frame.beat
      if (ahead > LOOKAHEAD * 0.95 || ahead < -0.6) continue
      const m = this.marks[used++]
      const z = -Math.max(0, ahead) * this.beatLen
      const far = Math.max(0, Math.min(1, (this.length * 0.95 + z) / (this.length * 0.2)))
      const passed = ahead < 0 ? 1 + ahead / 0.6 : 1
      const fade = far * passed
      m.mat.color.setRGB(0.8, 0.84, 1.7).multiplyScalar(fade * (ahead < 0.15 ? 1.6 : 1))
      m.bar.position.set(this.viewCx, 0.02, z)
      m.bar.scale.set(this.viewW + 4, 0.1, 1)
      const tex = this.text(`Part ${s.name}`, 'chord', '#cdd2ff')
      if (m.label.material.map !== tex) {
        m.label.material.map = tex
        m.label.material.needsUpdate = true
      }
      m.label.material.opacity = fade
      m.label.position.set(this.viewCx - this.viewW / 2 + 2.6, 0.55, z - 0.1)
      m.label.scale.set(2.4, 1.2, 1)
      m.bar.visible = m.label.visible = true
    }
    for (let i = used; i < MAX_MARKS; i++) this.marks[i].bar.visible = this.marks[i].label.visible = false
  }

  /** A band of each hand's colour along the line, over the keys that hand will play next. */
  private updateZones(frame: Frame, dt: number): void {
    const zones = this.chart && frame.chart ? handZones(this.chart, frame.beat, ZONE_BEATS) : {}
    const u = this.floor.material.uniforms
    const fade = 1 - Math.exp(-dt * 4)
    const glide = 1 - Math.exp(-dt * 5)
    for (const [i, hand] of (['L', 'R'] as Hand[]).entries()) {
      const z = this.zones[hand]
      const r = zones[hand]
      if (r && r.lo >= this.lo && r.hi <= this.hi) {
        const x0 = this.keyX(r.lo) - (isBlack(r.lo) ? 0.3 : 0.5)
        const x1 = this.keyX(r.hi) + (isBlack(r.hi) ? 0.3 : 0.5)
        if (z.level < 0.02) {
          z.lo = x0
          z.hi = x1
        } else {
          z.lo += (x0 - z.lo) * glide
          z.hi += (x1 - z.hi) * glide
        }
        z.level += (1 - z.level) * fade
      } else {
        z.level += (0 - z.level) * fade
      }
      z.strip.visible = z.level > 0.01
      z.strip.position.set((z.lo + z.hi) / 2, 0.036, -0.32)
      z.strip.scale.set(z.hi - z.lo, 0.6, 1)
      z.strip.rotation.x = -Math.PI / 2
      z.strip.material.uniforms.uLevel.value = z.level
      ;(u.uZones.value as THREE.Vector4[])[i].set(z.lo, z.hi, z.level, 0)
      ;(u.uZoneColors.value as THREE.Color[])[i].set(COLORS[hand])
    }
  }

  /** The hit line burns hotter as the streak grows, and flares at milestones. */
  private updateStreak(frame: Frame, dt: number): void {
    const streak = frame.streak ?? 0
    const milestone = streakMilestone(this.lastStreak, streak)
    this.lastStreak = streak
    if (milestone) {
      this.surge = 1
      this.popup(null, `${milestone} in a row!`, 'gold')
      for (let i = 0; i < 70; i++) {
        const x = this.viewCx + (Math.random() - 0.5) * this.viewW
        this.burstAt(x, 0.08, -0.1, Math.random() < 0.5 ? TONE_COLORS.gold : '#ffffff', 1, 0.2)
      }
    }
    this.heat += (Math.min(1, streak / 40) - this.heat) * (1 - Math.exp(-dt * 3))
    this.surge = Math.max(0, this.surge - dt * 1.3)
    const line = (this.hitLine.material as THREE.MeshBasicMaterial).color
    line.copy(HIT_COOL).lerp(HIT_HOT, this.heat * 0.75).multiplyScalar(1 + this.heat * 0.45 + this.surge * 1.6)
    const hu = this.hitHalo.material.uniforms
    hu.uColor.value.copy(HALO_COOL).lerp(HALO_HOT, this.heat * 0.8)
    hu.uStrength.value = 0.35 * (1 + this.heat * 1.1 + this.surge * 2.5)
  }

  /** A word that pops up from a key and floats away (or from the middle of the line, with no key). */
  private popup(pitch: number | null, text: string, tone: Tone | 'gold'): void {
    const k = pitch === null ? null : this.keys.get(pitch)
    if (pitch !== null && !k) return
    const p =
      this.popups.find((x) => x.alive && pitch !== null && x.pitch === pitch) ??
      this.popups.find((x) => !x.alive) ??
      this.popups.reduce((a, b) => (a.age > b.age ? a : b))
    const big = pitch === null
    p.alive = true
    p.age = 0
    p.pitch = pitch ?? -1
    p.life = big ? 1.7 : POPUP_LIFE
    p.size = big ? 2.1 : 1
    p.rise = big ? 0.9 : 1.3
    const tex = this.text(text, 'pop', TONE_COLORS[tone])
    if (p.sprite.material.map !== tex) {
      p.sprite.material.map = tex
      p.sprite.material.needsUpdate = true
    }
    p.sprite.userData.x = k ? k.x : this.viewCx
    p.sprite.userData.y = big ? 2.4 : k?.black ? 1.25 : 1.0
    p.sprite.userData.z = big ? -3 : -0.5
    p.sprite.visible = true
  }

  private updatePopups(dt: number): void {
    for (const p of this.popups) {
      if (!p.alive) continue
      p.age += dt
      const t = p.age / p.life
      if (t >= 1) {
        p.alive = false
        p.sprite.visible = false
        continue
      }
      const rise = 1 - Math.pow(1 - t, 3)
      // Pop in slightly oversized, settle, then fade as it drifts up.
      const pop = t < 0.1 ? 0.55 + 0.7 * (t / 0.1) : 1.25 - 0.25 * Math.min(1, (t - 0.1) / 0.12)
      const s = p.size * pop
      const { x, y, z } = p.sprite.userData as { x: number; y: number; z: number }
      p.sprite.position.set(x, y + rise * p.rise, z)
      p.sprite.scale.set(1.9 * s, 0.95 * s, 1)
      p.sprite.material.opacity = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4
    }
  }

  // ---- sparks, rings and dust ------------------------------------------------

  private makeSparks(): THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_SPARKS * 3), 3).setUsage(THREE.DynamicDrawUsage))
    geo.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(MAX_SPARKS * 3), 3).setUsage(THREE.DynamicDrawUsage))
    geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(MAX_SPARKS), 1).setUsage(THREE.DynamicDrawUsage))
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(MAX_SPARKS), 1).setUsage(THREE.DynamicDrawUsage))
    for (let i = 0; i < MAX_SPARKS; i++) {
      this.sparks.push({ alive: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), age: 0, life: 1, color: new THREE.Color(), size: 1 })
    }
    const points = new THREE.Points(geo, pointsMaterial(3.2))
    points.frustumCulled = false
    points.renderOrder = 8
    return points
  }

  private makeDust(): THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> {
    const geo = new THREE.BufferGeometry()
    const seed = new Float32Array(DUST * 3)
    for (let i = 0; i < seed.length; i++) seed[i] = Math.random()
    geo.setAttribute('position', new THREE.BufferAttribute(seed, 3))
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uScale: { value: 400 }, uBox: { value: new THREE.Vector3(30, 6, 60) } },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uScale; uniform vec3 uBox;
        varying float vAlpha;
        void main() {
          vec3 s = position;
          // Motes drift slowly towards the player and gently sway.
          float z = -fract(s.z - uTime * 0.012) * uBox.z;
          vec3 p = vec3(s.x * uBox.x * 1.3 - uBox.x * 0.15 + sin(uTime * 0.4 + s.y * 20.0) * 0.4,
                        0.4 + s.y * uBox.y + sin(uTime * 0.6 + s.x * 30.0) * 0.3, z);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (0.05 + 0.07 * fract(s.x * 13.7)) * uScale / -mv.z;
          float t = -z / uBox.z;
          vAlpha = smoothstep(0.0, 0.15, t) * (1.0 - smoothstep(0.7, 1.0, t)) * (0.35 + 0.65 * fract(s.y * 7.3 + uTime * 0.1 * fract(s.z * 5.0)));
        }`,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vec3(0.55, 0.62, 1.0) * 0.9, a * a * vAlpha * 0.55);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const points = new THREE.Points(geo, mat)
    points.frustumCulled = false
    points.renderOrder = 4
    return points
  }

  private burst(pitch: number, color: string, count: number): void {
    const k = this.keys.get(pitch)
    if (!k) return
    this.burstAt(k.x, k.black ? BLACK_RISE : 0.05, -0.08, color, count, (k.black ? 0.5 : 0.74) * 1.2)
  }

  private burstAt(x: number, y: number, z: number, color: string, count: number, spread: number): void {
    for (let i = 0; i < count; i++) {
      const s = this.sparks[this.sparkCursor]
      this.sparkCursor = (this.sparkCursor + 1) % MAX_SPARKS
      s.alive = true
      s.age = 0
      s.life = SPARK_LIFE * (0.55 + Math.random() * 0.6)
      s.pos.set(x + (Math.random() - 0.5) * spread, y + Math.random() * 0.1, z - Math.random() * 0.15)
      s.vel.set((Math.random() - 0.5) * 2.2, 1.6 + Math.random() * 3.4, -(0.4 + Math.random() * 2.4))
      s.color.set(Math.random() < 0.25 ? lighten(color, 0.6) : color)
      s.size = 0.06 + Math.random() * 0.1
    }
  }

  private updateSparks(dt: number): void {
    const geo = this.sparkPoints.geometry
    const pos = geo.getAttribute('position') as THREE.BufferAttribute
    const col = geo.getAttribute('aColor') as THREE.BufferAttribute
    const size = geo.getAttribute('aSize') as THREE.BufferAttribute
    const alpha = geo.getAttribute('aAlpha') as THREE.BufferAttribute
    for (let i = 0; i < MAX_SPARKS; i++) {
      const s = this.sparks[i]
      if (s.alive) {
        s.age += dt
        if (s.age >= s.life) s.alive = false
      }
      if (!s.alive) {
        alpha.setX(i, 0)
        continue
      }
      // Rise fast, then slow and drift, like embers.
      const drag = Math.exp(-dt * 2.6)
      s.vel.multiplyScalar(drag)
      s.vel.y -= dt * 0.6
      s.vel.x += Math.sin(this.time * 7 + i) * dt * 0.8
      s.pos.addScaledVector(s.vel, dt)
      const life = 1 - s.age / s.life
      pos.setXYZ(i, s.pos.x, s.pos.y, s.pos.z)
      col.setXYZ(i, s.color.r, s.color.g, s.color.b)
      size.setX(i, s.size * (0.6 + 0.4 * life))
      alpha.setX(i, life * life)
    }
    pos.needsUpdate = col.needsUpdate = size.needsUpdate = alpha.needsUpdate = true
  }

  private ring(pitch: number, color: string, strength: number): void {
    const k = this.keys.get(pitch)
    if (!k) return
    const r = this.rings.find((x) => !x.alive) ?? this.rings[0]
    r.alive = true
    r.age = 0
    r.life = 0.45
    r.mesh.material.color.set(color).multiplyScalar(2.4 * strength)
    r.mesh.position.set(k.x, k.black ? BLACK_RISE + 0.02 : 0.02, -0.02)
    r.mesh.visible = true
  }

  private updateRings(dt: number): void {
    for (const r of this.rings) {
      if (!r.alive) continue
      r.age += dt
      const t = r.age / r.life
      if (t >= 1) {
        r.alive = false
        r.mesh.visible = false
        continue
      }
      const e = 1 - Math.pow(1 - t, 3)
      r.mesh.scale.set(0.25 + e * 1.5, 0.25 + e * 1.5, 1)
      r.mesh.material.opacity = (1 - t) * (1 - t)
    }
  }
}

// ---- materials -----------------------------------------------------------------

const labelPlane = new THREE.PlaneGeometry(1, 1)
const tmpV = new THREE.Vector3()
const tmpV2 = new THREE.Vector2()
const raycaster = new THREE.Raycaster()
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const WHITE = new THREE.Color(1, 1, 1)
const HIT_COOL = new THREE.Color(1.5, 1.6, 2.1)
const HIT_HOT = new THREE.Color(2.4, 1.95, 1.15)
const HALO_COOL = new THREE.Color(0.5, 0.58, 1.0)
const HALO_HOT = new THREE.Color(1.0, 0.72, 0.32)

/** A soft round glow for flares. */
function radialTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.2, 'rgba(255,255,255,0.55)')
  grad.addColorStop(0.5, 'rgba(255,255,255,0.12)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

/**
 * The highway floor: deep blue fading into the distance, lane lines at every key with
 * stronger ones at C and F, bar lines that scroll with the music, and light spilling up
 * the lanes being played.
 */
function floorMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uLength: { value: 60 },
      uBeatLen: { value: 7.5 },
      uBeat: { value: 0 },
      uBpb: { value: 0 },
      uTime: { value: 0 },
      uCIndex: { value: 0 },
      uLaneCount: { value: 0 },
      uLanes: { value: Array.from({ length: MAX_GLOWS }, () => new THREE.Vector4()) },
      uLaneColors: { value: Array.from({ length: MAX_GLOWS }, () => new THREE.Color()) },
      uApproachCount: { value: 0 },
      uApproach: { value: Array.from({ length: MAX_APPROACH }, () => new THREE.Vector4()) },
      uApproachColors: { value: Array.from({ length: MAX_APPROACH }, () => new THREE.Color()) },
      uZones: { value: [new THREE.Vector4(), new THREE.Vector4()] },
      uZoneColors: { value: [new THREE.Color(), new THREE.Color()] },
      uView: { value: new THREE.Vector2(0, 30) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uLength, uBeatLen, uBeat, uBpb, uTime, uCIndex;
      uniform int uLaneCount;
      uniform vec4 uLanes[${MAX_GLOWS}];
      uniform vec3 uLaneColors[${MAX_GLOWS}];
      uniform int uApproachCount;
      uniform vec4 uApproach[${MAX_APPROACH}];
      uniform vec3 uApproachColors[${MAX_APPROACH}];
      uniform vec4 uZones[2];
      uniform vec3 uZoneColors[2];
      uniform vec2 uView;
      varying vec3 vWorld;

      // Antialiased line; once thinner than a pixel it dims instead of breaking into dashes.
      float lineAA(float d, float width) {
        float w = fwidth(d);
        float px = max(width, w);
        return (1.0 - smoothstep(px, px + w * 1.5, abs(d))) * (width / px);
      }

      void main() {
        float depth = clamp(-vWorld.z / uLength, 0.0, 1.0);
        // Base: a glow rising from the keyboard into deep navy.
        vec3 near = vec3(0.045, 0.058, 0.16);
        vec3 far = vec3(0.012, 0.016, 0.05);
        vec3 col = mix(near, far, smoothstep(0.0, 0.85, depth));
        col += vec3(0.06, 0.08, 0.26) * exp(-depth * 7.0) * 0.5;

        // Lane lines on every white-key boundary; C and F (the edges of the black-key groups) brighter.
        float idx = floor(vWorld.x + 0.5);
        float m = mod(idx - uCIndex + 70.0, 7.0);
        bool strong = m < 0.5 || abs(m - 3.0) < 0.5;
        float lane = lineAA(vWorld.x - idx, 0.012 + depth * 0.02);
        float laneFade = smoothstep(1.0, 0.25, depth);
        col += vec3(0.42, 0.48, 1.0) * lane * (strong ? 0.1 : 0.016) * laneFade;

        // Bar lines (and faint beat lines) scrolling towards the player.
        if (uBpb > 0.0) {
          float beatAt = uBeat + (-vWorld.z) / uBeatLen;
          float barD = (fract(beatAt / uBpb + 0.5) - 0.5) * uBpb * uBeatLen;
          float bars = lineAA(barD, 0.025) * 0.1 * (1.0 - depth);
          col += vec3(0.45, 0.52, 1.0) * bars * laneFade * step(0.02, -vWorld.z);
        }

        // Light spilling up the lanes being played.
        for (int i = 0; i < ${MAX_GLOWS}; i++) {
          if (i >= uLaneCount) break;
          vec4 L = uLanes[i];
          float dx = (vWorld.x - L.x) / L.y;
          float across = exp(-dx * dx * 1.6);
          float along = exp(vWorld.z / (uLength * 0.22)) ;
          float core = exp(-dx * dx * 12.0) * exp(vWorld.z / (uLength * 0.06));
          col += uLaneColors[i] * L.z * (across * along * 0.22 + core * 0.6);
        }

        // Lanes lit ahead of an incoming note: a soft fill between bright rails, from the line up to the note.
        for (int i = 0; i < ${MAX_APPROACH}; i++) {
          if (i >= uApproachCount) break;
          vec4 A = uApproach[i];
          float dx = abs(vWorld.x - A.x);
          float inside = 1.0 - smoothstep(A.y - 0.08, A.y + 0.02, dx);
          float along = smoothstep(A.w - 0.3, A.w + 0.2, vWorld.z) * step(vWorld.z, 0.05);
          float rail = lineAA(dx - A.y, 0.022);
          // Brightest right behind the note, so the light seems to lead it in.
          float lead = 0.5 + 0.5 * exp((A.w - vWorld.z) * 0.6);
          col += uApproachColors[i] * A.z * along * (inside * 0.13 * lead + rail * 0.85);
        }

        // Where each hand will be playing: a soft wash of its colour just behind the line.
        for (int i = 0; i < 2; i++) {
          vec4 Z = uZones[i];
          if (Z.z < 0.01) continue;
          float across = smoothstep(Z.x - 0.4, Z.x + 0.3, vWorld.x) * (1.0 - smoothstep(Z.y - 0.3, Z.y + 0.4, vWorld.x));
          float back = exp(vWorld.z / max(1.0, uLength * 0.05));
          col += uZoneColors[i] * Z.z * across * back * 0.32;
        }

        // Sideways vignette so the eye stays on the keys in play.
        float edge = abs(vWorld.x - uView.x) / max(1.0, uView.y * 0.5);
        col *= 1.0 - smoothstep(0.7, 1.5, edge) * 0.55;
        gl_FragColor = vec4(col, 1.0);
      }`,
    depthWrite: false,
  })
}

/** A soft band of light lying on the highway just behind the hit line. */
function haloMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(0.5, 0.58, 1.0) }, uStrength: { value: 0.35 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uStrength;
      varying vec2 vUv;
      void main() {
        float a = pow(1.0 - vUv.y, 4.0) * (1.0 - pow(abs(vUv.x - 0.5) * 2.0, 4.0));
        gl_FragColor = vec4(uColor * uStrength, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

/** A hand zone's band along the line: brightest at the line, soft at both ends. */
function stripMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color() }, uLevel: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uLevel;
      varying vec2 vUv;
      void main() {
        float ends = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
        // The plane lies flat; uv.y = 0 is at the line, 1 further up the highway.
        float a = ends * (exp(-vUv.y * 9.0) * 0.9 + 0.1 * (1.0 - vUv.y));
        gl_FragColor = vec4(uColor * 2.6, a * uLevel);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

/**
 * Glass note slabs. The rounded box is stretched so the corner radius stays the same
 * whatever the note's length; the body is translucent and brightens towards the player,
 * with a lit rim, a sheen across the top and an inner glow once it sounds.
 */
function noteMaterial(uniforms: NoteUniforms): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      uniform vec3 uSize;
      uniform float uReflect;
      varying vec3 vLocal;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorld;
      const float R0 = 0.25;
      float stretch(float p, float size) {
        float r = min(0.11, size * 0.5);
        float inner = 0.5 - R0;
        float s = sign(p);
        float a = abs(p);
        float half_ = size * 0.5;
        // Flat middle scales to fit; the rounded rim keeps radius r.
        float o = a <= inner ? a / inner * (half_ - r) : (half_ - r) + (a - inner) / R0 * r;
        return s * o;
      }
      void main() {
        vec3 p = vec3(stretch(position.x, uSize.x), stretch(position.y, uSize.y), stretch(position.z, uSize.z));
        vLocal = p;
        // The mesh is scaled by uSize; undo that so the stretched shape is used as-is.
        vec4 w = modelMatrix * vec4(p / uSize, 1.0);
        vWorld = w.xyz;
        vNormal = normalize(mat3(modelMatrix) * (normal / uSize));
        vView = cameraPosition - w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uSize;
      uniform vec3 uColor;
      uniform vec3 uRim;
      uniform float uAlpha;
      uniform float uGlow;
      uniform float uFar;
      uniform float uReflect;
      uniform float uFlow;
      uniform float uTime;
      varying vec3 vLocal;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorld;
      void main() {
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vView);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 2.5);
        vec3 half_ = uSize * 0.5;
        // 0 at the far end of the note, 1 at the end nearest the player.
        float t = clamp(vLocal.z / uSize.z + 0.5, 0.0, 1.0);
        float top = smoothstep(0.6, 0.95, n.y);
        float edge = min(half_.x - abs(vLocal.x), half_.z - abs(vLocal.z));
        float rim = (1.0 - smoothstep(0.0, 0.07, edge)) * top;
        float sheen = top * smoothstep(0.35, 0.0, abs(vLocal.x / uSize.x + 0.18)) * 0.35;

        vec3 body = uColor * mix(0.42, 1.0, pow(t, 0.8));
        vec3 col = body * (0.55 + 0.45 * top) + uRim * (rim * 1.25 + fres * (1.0 - top) * 0.9 + sheen);
        // Played: the whole slab lights up from within (HDR, so it blooms).
        col = mix(col, (uRim * 1.4 + uColor) * (1.3 + 0.9 * t), uGlow * 0.85);
        col *= 1.0 + uGlow * 1.2;
        col *= 1.25;
        // A held trail: bands of light run down it into the line.
        col += uRim * uFlow * pow(fract(vWorld.z * 0.35 - uTime * 2.2), 6.0) * 1.4;

        float alpha = mix(0.72, 0.95, t) + rim * 0.2 + fres * 0.2;
        // Fade in from the far end of the highway.
        float fade = smoothstep(-uFar, -uFar * 0.72, vWorld.z);
        alpha *= uAlpha * fade;
        if (uReflect > 0.5) {
          // A dim mirror image on the glossy floor, fading with height.
          alpha *= 0.16 * (1.0 - smoothstep(0.0, 0.5, -vWorld.y));
          col *= 0.8;
        }
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
      }`,
    transparent: true,
    depthWrite: uniforms.uReflect.value < 0.5,
  })
}

/** Additive round points whose size follows perspective. */
function pointsMaterial(boost: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 400 } },
    vertexShader: /* glsl */ `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aAlpha;
      uniform float uScale;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(1.0, aSize * uScale / -mv.z);
        vColor = aColor;
        vAlpha = aAlpha;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        if (vAlpha <= 0.0) discard;
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor * ${boost.toFixed(2)}, a * a * vAlpha);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}
