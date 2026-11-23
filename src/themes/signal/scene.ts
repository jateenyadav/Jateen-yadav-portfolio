import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, PerspectiveCamera, Points, Scene, ShaderMaterial, Sphere, Vector3 } from 'three'
import { createStage, type Stage } from '../../shared/stage'
import { makeShape, rng, type ShapeId } from './shapes'

/**
 * Signal — one GPU particle field. Every formation lives in its own buffer
 * attribute (uploaded once); the vertex shader morphs between the two attributes
 * bound as aA / aB. Scroll gives a float `stage`: floor = from, fract = blend.
 */

export type Formation = {
  shape: ShapeId
  colors: [string, string]
  /** Constant spin around Y in rad/s (globe, solar). */
  spin?: number
  /** Base yaw. */
  yaw?: number
  scale?: number
}

export type SignalScene = { dispose: () => void; invalidate: () => void }

const VERT = /* glsl */ `
attribute vec3 aA;
attribute vec3 aB;
attribute vec4 aRnd;
uniform float uMix, uTime, uSize, uPx, uFocus, uDrift;
uniform float uYawA, uYawB, uScaleA, uScaleB;
uniform vec3 uOffA, uOffB;
uniform vec3 uPtr;
uniform float uPtrR, uPtrS;
uniform vec3 uA1, uA2, uB1, uB2;
varying vec3 vCol;
varying float vAlpha;

vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }

// divergence-free flow: each component ignores its own axis (cheap "curl-like" drift)
vec3 flow(vec3 p, float t) {
  return vec3(
    sin(p.y * 1.7 + t) + cos(p.z * 1.3 - t * 0.7),
    sin(p.z * 1.9 - t * 0.8) + cos(p.x * 1.1 + t),
    sin(p.x * 1.5 + t * 0.6) + cos(p.y * 1.2 - t)
  ) * 0.5;
}

void main() {
  float delay = aRnd.x * 0.5;
  float t = clamp((uMix - delay) / 0.5, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 a = rotY(aA, uYawA) * uScaleA + uOffA;
  vec3 b = rotY(aB, uYawB) * uScaleB + uOffB;
  vec3 p = mix(a, b, t);
  float swirl = sin(3.14159 * t);
  vec3 f1 = flow(p * 0.9 + aRnd.y * 2.0, uTime * 0.35 + aRnd.z * 6.28);
  p += f1 * (uDrift * (0.4 + aRnd.y) + swirl * (0.1 + 0.32 * aRnd.y) * uScaleA);

  // pointer repulsion (object space ≈ world space; tilt is tiny)
  vec2 dv = p.xy - uPtr.xy;
  float dist = length(dv);
  float push = smoothstep(uPtrR, 0.0, dist) * uPtrS;
  p.xy += dv / max(dist, 1e-3) * push * 0.55;
  p.z += push * 0.6;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = -mv.z;
  float coc = abs(depth - uFocus);
  float size = uSize * (0.55 + aRnd.z * 0.9) * (1.0 + coc * 1.1);
  gl_PointSize = max(1.0, size * uPx / depth);
  vAlpha = (0.8 / (1.0 + coc * coc * 2.5)) * (0.6 + 0.4 * aRnd.w);
  vec3 ca = aRnd.w < 0.2 ? uA2 : uA1;
  vec3 cb = aRnd.w < 0.2 ? uB2 : uB1;
  vCol = mix(ca, cb, t) * (1.0 + push * 2.2 + swirl * 0.4);
}
`

const FRAG = /* glsl */ `
varying vec3 vCol;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c) * 4.0;
  if (d > 1.0) discard;
  float a = (1.0 - d);
  a *= a;
  gl_FragColor = vec4(vCol * a * vAlpha, 1.0);
}
`

export function createSignalScene(
  canvas: HTMLCanvasElement,
  formations: Formation[],
  opts: {
    /** Current scroll stage (0 … formations.length - 1), read every frame. */
    stage: () => number
    /** Screen position of the formation centre in 0..1 (x, y) and its max size as a fraction of the shorter side. */
    layout: (w: number, h: number) => { x: number; y: number; size: number }
    font: string
    onStage?: (i: number) => void
  },
): SignalScene | null {
  const small = window.innerWidth < 700
  const N = small ? 9000 : 32000
  const camZ = 7
  const fov = 34

  const scene = new Scene()
  const camera = new PerspectiveCamera(fov, 1, 0.1, 50)
  camera.position.set(0, 0, camZ)

  const geo = new BufferGeometry()
  const targets = formations.map((f) => new BufferAttribute(makeShape(f.shape, N, opts.font), 3))
  const rnd = new Float32Array(N * 4)
  const r = rng(99)
  for (let i = 0; i < rnd.length; i++) rnd[i] = r()
  geo.setAttribute('position', targets[0]) // only for bounds / draw count
  geo.setAttribute('aA', targets[0])
  geo.setAttribute('aB', targets[Math.min(1, targets.length - 1)])
  geo.setAttribute('aRnd', new BufferAttribute(rnd, 4))
  // every formation is also kept on the geometry under its own name, so all of them are uploaded on
  // the first frame instead of hitching the first time scroll reaches each one
  targets.forEach((t, i) => geo.setAttribute(`t${i}`, t))
  geo.boundingSphere = new Sphere(new Vector3(), 100) // never frustum-culled

  const cols = formations.map((f) => f.colors.map((c) => new Color(c)) as [Color, Color])
  const mat = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
    uniforms: {
      uMix: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: small ? 0.015 : 0.012 },
      uPx: { value: 1 },
      uFocus: { value: camZ },
      uDrift: { value: 0.035 },
      uYawA: { value: 0 },
      uYawB: { value: 0 },
      uScaleA: { value: 1 },
      uScaleB: { value: 1 },
      uOffA: { value: [0, 0, 0] },
      uOffB: { value: [0, 0, 0] },
      uPtr: { value: [99, 99, 0] },
      uPtrR: { value: 0.7 },
      uPtrS: { value: 0 },
      uA1: { value: cols[0][0] },
      uA2: { value: cols[0][1] },
      uB1: { value: cols[0][0] },
      uB2: { value: cols[0][1] },
    },
  })
  const points = new Points(geo, mat)
  scene.add(points)

  // layout → world offset + scale
  let off = [0, 0, 0]
  let unit = 1
  let halfW = 1
  let halfH = 1
  const relayout = (w: number, h: number) => {
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    halfH = Math.tan(((fov / 2) * Math.PI) / 180) * camZ
    halfW = halfH * camera.aspect
    const L = opts.layout(w, h)
    off = [(L.x * 2 - 1) * halfW, -(L.y * 2 - 1) * halfH, 0]
    // shapes are ~2.6 units wide; fit them into `size` of the shorter screen side
    const shortWorld = Math.min(halfW, halfH) * 2
    unit = (shortWorld * L.size) / 2.6
  }

  // pointer, damped (critical) and only consumed in the frame loop
  const ptr = { tx: 99, ty: 99, x: 99, y: 99, on: 0, ton: 0 }
  const onMove = (e: PointerEvent) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1
    const ny = -(e.clientY / window.innerHeight) * 2 + 1
    ptr.tx = nx * halfW
    ptr.ty = ny * halfH
    ptr.ton = e.pointerType === 'mouse' ? 1 : 0.8
    if (ptr.x > 50) {
      ptr.x = ptr.tx
      ptr.y = ptr.ty
    }
  }
  const onLeave = () => (ptr.ton = 0)
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerdown', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  window.addEventListener('blur', onLeave)

  let from = -1
  let tilt = { x: 0, y: 0 }
  const last = formations.length - 1

  let stage: Stage | null = null
  stage = createStage(
    canvas,
    ({ dt, time, still, width, height }) => {
      const s = Math.max(0, Math.min(last, opts.stage()))
      let i = Math.min(last - 1, Math.floor(s))
      if (last === 0) i = 0
      let blend = s - i
      if (still) blend = blend < 0.5 ? 0 : 1
      if (i !== from) {
        from = i
        geo.setAttribute('aA', targets[i])
        geo.setAttribute('aB', targets[Math.min(last, i + 1)])
        mat.uniforms.uA1.value = cols[i][0]
        mat.uniforms.uA2.value = cols[i][1]
        mat.uniforms.uB1.value = cols[Math.min(last, i + 1)][0]
        mat.uniforms.uB2.value = cols[Math.min(last, i + 1)][1]
      }
      opts.onStage?.(Math.round(s))
      const fa = formations[i]
      const fb = formations[Math.min(last, i + 1)]
      const tt = still ? 0 : time
      const u = mat.uniforms
      u.uMix.value = blend
      u.uTime.value = tt
      u.uPx.value = (stage ? stage.renderer.getPixelRatio() : 1) * ((height * camZ) / (2 * halfH))
      u.uYawA.value = (fa.yaw ?? 0) + (fa.spin ?? 0) * tt
      u.uYawB.value = (fb.yaw ?? 0) + (fb.spin ?? 0) * tt
      u.uScaleA.value = unit * (fa.scale ?? 1)
      u.uScaleB.value = unit * (fb.scale ?? 1)
      u.uOffA.value = [0, 0, 0]
      u.uOffB.value = [0, 0, 0]
      u.uDrift.value = still ? 0 : 0.035

      // critically damped pointer follow (k≈14/s), frame-rate independent
      const k = 1 - Math.exp(-dt * 14)
      ptr.x += (ptr.tx - ptr.x) * k
      ptr.y += (ptr.ty - ptr.y) * k
      ptr.on += (ptr.ton - ptr.on) * (1 - Math.exp(-dt * 6))
      u.uPtr.value = [ptr.x - off[0], ptr.y - off[1], 0]
      u.uPtrS.value = still ? 0 : ptr.on * unit * 0.55
      u.uPtrR.value = unit * 0.75

      // a gentle parallax tilt toward the pointer
      const tx = still || ptr.x > 50 ? 0 : (ptr.y / halfH) * 0.08
      const ty = still || ptr.x > 50 ? 0 : (ptr.x / halfW) * 0.12
      tilt = { x: tilt.x + (tx - tilt.x) * (1 - Math.exp(-dt * 4)), y: tilt.y + (ty - tilt.y) * (1 - Math.exp(-dt * 4)) }
      points.rotation.set(-tilt.x, tilt.y, 0)
      // the formation pivots about its own centre
      points.position.set(off[0], off[1], off[2])
      if (width > 0) stage?.renderer.render(scene, camera)
    },
    { onResize: relayout, renderer: { antialias: false, alpha: false }, maxDpr: small ? 1.25 : 1.5 },
  )
  const st = stage as Stage | null
  if (!st) {
    geo.dispose()
    mat.dispose()
    return null
  }
  st.renderer.setClearColor(0x07080c, 1)
  relayout(st.width(), st.height())

  return {
    invalidate: () => st.invalidate(),
    dispose: () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
      st.dispose()
      geo.dispose()
      mat.dispose()
    },
  }
}
