import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

/**
 * WebGL renderers (with their canvas, bloom chain and environment map) kept between
 * highways. Every screen builds a new highway, and a fresh context means fresh shader
 * compiles and a new environment pass; a pooled one keeps its compiled programs.
 *
 * Two are pooled because a screen builds its highway before the old screen is torn down,
 * so screen changes alternate between them. A third highway alive at once gets a private
 * renderer that is thrown away with it.
 */
export interface GL {
  renderer: THREE.WebGLRenderer
  /** The canvas drawn to: the one passed in, or a pooled one put in its place. */
  canvas: HTMLCanvasElement
  composer: EffectComposer
  renderPass: RenderPass
  bloom: UnrealBloomPass
  output: OutputPass
  env: THREE.Texture
  pooled: boolean
  busy: boolean
  lost: boolean
  /**
   * The previous owner's materials, disposed only when the next owner is done, so the
   * programs they share stay compiled (three frees a program once no material uses it).
   */
  stale: THREE.Material[]
}

const POOL_SIZE = 2
const pool: GL[] = []
const emptyScene = new THREE.Scene()

/** A renderer for a highway on `canvas`: a free pooled one (swapped into the DOM in its place) or a new one. */
export function acquireGL(canvas: HTMLCanvasElement, scene: THREE.Scene, camera: THREE.Camera): GL {
  const free = canvas.parentNode ? pool.find((g) => !g.busy && !g.lost) : undefined
  let gl: GL
  if (free) {
    gl = free
    adopt(gl.canvas, canvas)
    canvas.replaceWith(gl.canvas)
  } else {
    gl = create(canvas)
    if (pool.length < POOL_SIZE) {
      gl.pooled = true
      pool.push(gl)
    }
  }
  gl.busy = true
  gl.renderPass.scene = scene
  gl.renderPass.camera = camera
  // Only frames that change what casts shadows ask for the shadow map.
  gl.renderer.shadowMap.needsUpdate = true
  return gl
}

function settle(gl: GL): void {
  for (const m of gl.stale) m.dispose()
  gl.stale = []
}

/**
 * Hands a renderer back. `materials` are the owner's (its geometries and textures should
 * already be disposed); `drew` says whether it ever rendered with them. A pooled renderer is kept, its canvas taken out of the page;
 * any other is disposed with its context.
 */
export function releaseGL(gl: GL, materials: THREE.Material[], drew: boolean): void {
  gl.renderPass.scene = emptyScene
  gl.busy = false
  if (gl.pooled && !gl.lost) {
    if (drew) {
      settle(gl)
      gl.stale = materials
    } else {
      // An owner that never drew compiled nothing: keep the older materials (and so
      // their programs) for the next owner instead.
      for (const m of materials) m.dispose()
    }
    gl.canvas.remove()
    return
  }
  for (const m of materials) m.dispose()
  settle(gl)
  dispose(gl)
}

function create(canvas: HTMLCanvasElement): GL {
  // Marked first: a canvas that has handed out a WebGL context can never give a 2D one.
  canvas.dataset.gl = '1'
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.shadowMap.autoUpdate = false

  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 2 })
  const composer = new EffectComposer(renderer, target)
  const renderPass = new RenderPass(emptyScene, new THREE.PerspectiveCamera())
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.7, 0.45, 1.05)
  const output = new OutputPass()
  composer.addPass(renderPass)
  composer.addPass(bloom)
  composer.addPass(output)

  const pmrem = new THREE.PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const env = pmrem.fromScene(room, 0.04).texture
  room.dispose()
  pmrem.dispose()

  const gl: GL = { renderer, canvas, composer, renderPass, bloom, output, env, pooled: false, busy: false, lost: false, stale: [] }
  canvas.addEventListener('webglcontextlost', () => {
    // A lost context is no use to the next highway: drop it from the pool.
    gl.lost = true
    const i = pool.indexOf(gl)
    if (i >= 0) pool.splice(i, 1)
    if (!gl.busy) dispose(gl)
  })
  return gl
}

function dispose(gl: GL): void {
  gl.renderPass.dispose()
  gl.bloom.dispose()
  gl.output.dispose()
  gl.composer.dispose()
  gl.env.dispose()
  gl.renderer.dispose()
  // Browsers cap live WebGL contexts.
  try {
    gl.renderer.forceContextLoss()
  } catch {
    // Already lost.
  }
}

/** Gives the pooled canvas the attributes (class, style, id…) of the one it stands in for. */
function adopt(pooled: HTMLCanvasElement, from: HTMLCanvasElement): void {
  const keep = (name: string) => name === 'width' || name === 'height' || name === 'data-gl'
  for (const name of pooled.getAttributeNames()) if (!keep(name)) pooled.removeAttribute(name)
  for (const name of from.getAttributeNames()) if (!keep(name)) pooled.setAttribute(name, from.getAttribute(name)!)
  pooled.dataset.gl = '1'
}
