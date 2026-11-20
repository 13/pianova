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
import { COLORS, FONT, LOOKAHEAD, keyRange, lighten, type Frame, type HighwayOptions, type HighwayRenderer } from './common'

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
  label: THREE.Sprite
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

  private lo = 43
  private hi = 77
  private whites = 0
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
    const { lo, hi } = keyRange(chart)
    if (lo === this.lo && hi === this.hi) return
    this.lo = lo
    this.hi = hi
    this.buildKeys()
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

  flash(pitch: number, kind: Grade | 'wrong', hand?: Hand): void {
    const color = kind === 'wrong' ? COLORS.wrong : hand ? COLORS[hand] : COLORS.neutral
    this.burst(pitch, color, kind === 'perfect' ? 26 : kind === 'wrong' ? 10 : 14)
    if (kind !== 'wrong' && kind !== 'miss') this.ring(pitch, color, kind === 'perfect' ? 1.25 : 0.9)
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
    let whites = 0
    for (let p = this.lo; p < pitch; p++) if (!isBlack(p)) whites++
    return isBlack(pitch) ? whites : whites + 0.5
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
    for (let p = this.lo; p <= this.hi; p++) if (!isBlack(p)) whites++
    this.whites = whites

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

  /** Places the camera so the keyboard spans the screen and sits on its bottom edge. */
  private layout(): void {
    if (this.w === 0) return
    const W = this.whites
    const cx = W / 2
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

    // Shift the lens so the front edge of the keyboard sits on the bottom of the screen.
    const front = new THREE.Vector3(cx, -KEY_THICK, KEY_LEN + 0.15).project(cam)
    cam.projectionMatrix.elements[9] = front.y + 1
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert()

    // The highway runs back to wherever the top of the screen meets the floor.
    const ray = new THREE.Raycaster()
    ray.setFromCamera(new THREE.Vector2(0, 1), cam)
    const hit = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3())
    const far = hit && hit.z < 0 ? -hit.z : W * 4
    this.length = Math.min(W * 4, Math.max(W * 0.6, far * 1.02))
    this.beatLen = this.length / LOOKAHEAD

    const span = W * 6
    this.floor.scale.set(span, this.length + 2, 1)
    this.floor.position.set(cx, -0.012, -(this.length + 2) / 2 + 0.5)
    const fu = this.floor.material.uniforms
    fu.uLength.value = this.length
    fu.uBeatLen.value = this.beatLen
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
    fu.uCIndex.value = ci

    this.hitLine.scale.set(W + 4, 1, 1)
    this.hitLine.position.set(cx, 0.03, -0.04)
    this.hitHalo.scale.set(W + 4, 2.2, 1)
    this.hitHalo.position.set(cx, 0.02, -1.0)
    this.hitHalo.rotation.x = -Math.PI / 2

    const l = this.keyLight
    l.position.set(cx - W * 0.12, 14, -7)
    l.target.position.set(cx, 0, KEY_LEN * 0.5)
    const sc = l.shadow.camera
    sc.left = -W * 0.62
    sc.right = W * 0.62
    sc.top = 9
    sc.bottom = -9
    sc.near = 1
    sc.far = 40
    sc.updateProjectionMatrix()

    this.sparkPoints.material.uniforms.uScale.value = (this.h * this.renderer.getPixelRatio()) / (2 * this.tanV)
    this.dust.material.uniforms.uScale.value = this.sparkPoints.material.uniforms.uScale.value
    this.dust.material.uniforms.uBox.value.set(W, 7, this.length)
    this.dust.position.set(0, 0, 0)
    this.labelKey = ''
  }

  // ---- labels ----------------------------------------------------------------

  /** A small transparent texture of some text, shared by every key or note that shows it. */
  private text(text: string, style: 'c' | 'letter' | 'hint' | 'hintDark' | 'note'): THREE.CanvasTexture {
    const id = `${style}|${text}`
    const cached = this.textures.get(id)
    if (cached) return cached
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')!
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    if (style === 'note') {
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
    g.fillText(text, 64, 68)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    this.textures.set(id, t)
    return t
  }

  /** Letters and computer-key hints printed on the key tops, rebuilt when they would change. */
  private syncKeyLabels(): void {
    const keyPx = this.w / this.whites
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

    this.syncKeyLabels()
    const sounding = new Map<number, string>()
    if (frame.chart) this.updateNotes(frame, frame.chart, now, sounding)
    else this.hideNotes(0)
    this.updateKeys(frame, dt, sounding)
    this.updateFloor(frame, sounding)
    this.updateSparks(dt)
    this.updateRings(dt)
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
      u.uColor.value.set(color)
      u.uRim.value.set(lighten(color, 0.55))
      u.uAlpha.value = state === 'miss' ? 0.4 : cut ? 0.3 : active ? 1 : 0.5
      u.uGlow.value = state === 'miss' ? 0 : isSounding ? 1 : 0
      u.uFar.value = this.length
      const h = black ? NOTE_H + 0.12 : NOTE_H
      u.uSize.value.set(width, h, len)
      const y = black ? 0.12 + h / 2 : h / 2
      slot.mesh.position.set(x, y, zNear - len / 2)
      slot.mesh.scale.set(width, h, len)
      slot.refl.position.copy(slot.mesh.position)
      slot.refl.scale.copy(slot.mesh.scale)
      slot.mesh.visible = slot.refl.visible = true

      // Finger number (or note name) rides on the leading end.
      const label = n.finger ? String(n.finger) : this.labels ? midiToLetter(n.pitch) : ''
      const show = label && active && state === 'pending' && ahead > -0.05 && len > 0.9
      slot.label.visible = !!show
      if (show) {
        const tex = this.text(label, 'note')
        if (slot.label.material.map !== tex) {
          slot.label.material.map = tex
          slot.label.material.needsUpdate = true
        }
        const s = black ? 0.56 : 0.7
        slot.label.scale.set(s, s, 1)
        slot.label.position.set(x, y + h / 2 + 0.2, zNear - 0.42)
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
      s.mesh.visible = s.refl.visible = s.label.visible = false
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
    }
    const mesh = new THREE.Mesh(this.noteGeo, noteMaterial(uniforms))
    mesh.renderOrder = 2
    const refl = new THREE.Mesh(this.noteGeo, noteMaterial({ ...uniforms, uReflect: { value: 1 } }))
    refl.renderOrder = -1
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, depthTest: false, toneMapped: false }))
    label.renderOrder = 3
    this.noteGroup.add(mesh, label)
    this.reflGroup.add(refl)
    const slot = { mesh, refl, uniforms, label }
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
    const width = k.black ? 0.5 : 0.74
    const y = k.black ? BLACK_RISE : 0.05
    for (let i = 0; i < count; i++) {
      const s = this.sparks[this.sparkCursor]
      this.sparkCursor = (this.sparkCursor + 1) % MAX_SPARKS
      s.alive = true
      s.age = 0
      s.life = SPARK_LIFE * (0.55 + Math.random() * 0.6)
      s.pos.set(k.x + (Math.random() - 0.5) * width * 1.2, y + Math.random() * 0.1, -0.08 - Math.random() * 0.15)
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
const WHITE = new THREE.Color(1, 1, 1)

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

        // Sideways vignette so the eye stays on the keys in play.
        float edge = abs(vWorld.x - cameraPosition.x) / max(1.0, uLength * 0.5);
        col *= 1.0 - smoothstep(0.35, 1.2, edge) * 0.5;
        gl_FragColor = vec4(col, 1.0);
      }`,
    depthWrite: false,
  })
}

/** A soft band of light lying on the highway just behind the hit line. */
function haloMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        float a = pow(1.0 - vUv.y, 4.0) * (1.0 - pow(abs(vUv.x - 0.5) * 2.0, 4.0));
        gl_FragColor = vec4(vec3(0.5, 0.58, 1.0) * 0.35, a);
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
