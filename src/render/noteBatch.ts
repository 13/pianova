import * as THREE from 'three'

/** Uniforms shared by every note batch: how far the highway runs, and the clock. */
export interface NoteShared {
  uFar: THREE.IUniform<number>
  uTime: THREE.IUniform<number>
}

/**
 * Every note slab of one kind (heads, or trails) drawn in a single instanced call,
 * optionally with its mirror image on the floor as a second call that shares the same
 * per-instance data. Each instance carries its box (position and size, in the instance
 * matrix), colour, rim colour, and alpha / glow / flow.
 *
 * Instances are filled in the order the caller pushes them and then reversed, so with
 * notes pushed nearest first they are drawn back to front, as separate transparent
 * meshes would have been sorted.
 */
export class NoteBatch {
  mesh!: THREE.InstancedMesh<THREE.BufferGeometry, THREE.ShaderMaterial>
  mirror: THREE.InstancedMesh<THREE.BufferGeometry, THREE.ShaderMaterial> | null = null
  count = 0
  private capacity = 0
  private matrix!: Float32Array
  private color!: Float32Array
  private rim!: THREE.InstancedBufferAttribute
  private params!: THREE.InstancedBufferAttribute
  private material: THREE.ShaderMaterial
  private mirrorMaterial: THREE.ShaderMaterial | null

  constructor(
    private base: THREE.BufferGeometry,
    shared: NoteShared,
    private parent: THREE.Object3D,
    private renderOrder: number,
    private mirrorParent: THREE.Object3D | null = null,
  ) {
    this.material = noteMaterial(shared, false)
    this.mirrorMaterial = mirrorParent ? noteMaterial(shared, true) : null
    this.allocate(64)
  }

  begin(): void {
    this.count = 0
  }

  push(x: number, y: number, z: number, sx: number, sy: number, sz: number, color: THREE.Color, rim: THREE.Color, alpha: number, glow: number, flow: number): void {
    if (this.count >= this.capacity) this.allocate(this.capacity * 2)
    const i = this.count++
    const m = this.matrix
    const o = i * 16
    m[o] = sx
    m[o + 1] = m[o + 2] = m[o + 3] = m[o + 4] = 0
    m[o + 5] = sy
    m[o + 6] = m[o + 7] = m[o + 8] = m[o + 9] = 0
    m[o + 10] = sz
    m[o + 11] = 0
    m[o + 12] = x
    m[o + 13] = y
    m[o + 14] = z
    m[o + 15] = 1
    const c = this.color
    c[i * 3] = color.r
    c[i * 3 + 1] = color.g
    c[i * 3 + 2] = color.b
    const r = this.rim.array as Float32Array
    r[i * 3] = rim.r
    r[i * 3 + 1] = rim.g
    r[i * 3 + 2] = rim.b
    const p = this.params.array as Float32Array
    p[i * 3] = alpha
    p[i * 3 + 1] = glow
    p[i * 3 + 2] = flow
  }

  /** Puts the instances in draw order (last pushed first) and uploads them. */
  finish(): void {
    const n = this.count
    reverse(this.matrix, n, 16)
    reverse(this.color, n, 3)
    reverse(this.rim.array as Float32Array, n, 3)
    reverse(this.params.array as Float32Array, n, 3)
    const mesh = this.mesh
    mesh.count = n
    mesh.visible = n > 0
    if (this.mirror) {
      this.mirror.count = n
      this.mirror.visible = n > 0
    }
    if (!n) return
    upload(mesh.instanceMatrix, n, 16)
    upload(mesh.instanceColor!, n, 3)
    upload(this.rim, n, 3)
    upload(this.params, n, 3)
  }

  dispose(): void {
    this.release()
    this.material.dispose()
    this.mirrorMaterial?.dispose()
  }

  /** Materials, for a caller that disposes them later (see `glPool`). */
  materials(): THREE.Material[] {
    return this.mirrorMaterial ? [this.material, this.mirrorMaterial] : [this.material]
  }

  /** Frees the GPU buffers but leaves the materials to the caller. */
  release(): void {
    if (!this.mesh) return
    this.mesh.removeFromParent()
    this.mirror?.removeFromParent()
    this.mesh.geometry.dispose()
    this.mesh.dispose()
    this.mirror?.dispose()
  }

  private allocate(capacity: number): void {
    const old = this.mesh
    const geo = this.base.clone()
    const rim = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3).setUsage(THREE.DynamicDrawUsage)
    const params = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3).setUsage(THREE.DynamicDrawUsage)
    geo.setAttribute('iRim', rim)
    geo.setAttribute('iParams', params)
    const mesh = new THREE.InstancedMesh(geo, this.material, capacity)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3).setUsage(THREE.DynamicDrawUsage)
    mesh.frustumCulled = false
    mesh.renderOrder = this.renderOrder
    mesh.count = 0
    if (old) {
      ;(mesh.instanceMatrix.array as Float32Array).set(this.matrix)
      ;(mesh.instanceColor.array as Float32Array).set(this.color)
      ;(rim.array as Float32Array).set(this.rim.array as Float32Array)
      ;(params.array as Float32Array).set(this.params.array as Float32Array)
      this.release()
    }
    this.parent.add(mesh)
    this.mesh = mesh
    this.matrix = mesh.instanceMatrix.array as Float32Array
    this.color = mesh.instanceColor.array as Float32Array
    this.rim = rim
    this.params = params
    this.capacity = capacity
    if (this.mirrorParent && this.mirrorMaterial) {
      // Same geometry and per-instance buffers, so the mirror costs no extra uploads.
      const mirror = new THREE.InstancedMesh(geo, this.mirrorMaterial, capacity)
      mirror.instanceMatrix = mesh.instanceMatrix
      mirror.instanceColor = mesh.instanceColor
      mirror.frustumCulled = false
      mirror.renderOrder = -1
      mirror.count = 0
      this.mirrorParent.add(mirror)
      this.mirror = mirror
    }
  }
}

function upload(attr: THREE.BufferAttribute, n: number, size: number): void {
  attr.clearUpdateRanges()
  attr.addUpdateRange(0, n * size)
  attr.needsUpdate = true
}

function reverse(a: Float32Array, n: number, size: number): void {
  for (let i = 0, j = n - 1; i < j; i++, j--) {
    const oi = i * size
    const oj = j * size
    for (let c = 0; c < size; c++) {
      const t = a[oi + c]
      a[oi + c] = a[oj + c]
      a[oj + c] = t
    }
  }
}

/**
 * Glass note slabs. The rounded box is stretched so the corner radius stays the same
 * whatever the note's length; the body is translucent and brightens towards the player,
 * with a lit rim, a sheen across the top and an inner glow once it sounds.
 */
function noteMaterial(shared: NoteShared, reflect: boolean): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uFar: shared.uFar, uTime: shared.uTime, uReflect: { value: reflect ? 1 : 0 } },
    vertexShader: /* glsl */ `
      attribute vec3 iRim;
      attribute vec3 iParams;
      varying vec3 vLocal;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorld;
      varying vec3 vSize;
      varying vec3 vColor;
      varying vec3 vRim;
      varying vec3 vParams;
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
        // The instance matrix holds the note's size as its scale.
        vec3 size = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        vec3 p = vec3(stretch(position.x, size.x), stretch(position.y, size.y), stretch(position.z, size.z));
        vLocal = p;
        // Undo the instance's scale so the stretched shape is used as-is.
        vec4 w = modelMatrix * instanceMatrix * vec4(p / size, 1.0);
        vWorld = w.xyz;
        vNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * (normal / size));
        vView = cameraPosition - w.xyz;
        vSize = size;
        vColor = instanceColor;
        vRim = iRim;
        vParams = iParams;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uFar;
      uniform float uReflect;
      uniform float uTime;
      varying vec3 vLocal;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorld;
      varying vec3 vSize;
      varying vec3 vColor;
      varying vec3 vRim;
      varying vec3 vParams;
      void main() {
        vec3 uSize = vSize;
        vec3 uColor = vColor;
        vec3 uRim = vRim;
        float uAlpha = vParams.x;
        float uGlow = vParams.y;
        // 1 while a long note's trail is being held: light runs along it.
        float uFlow = vParams.z;
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
    depthWrite: !reflect,
  })
}
