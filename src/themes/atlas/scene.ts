import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  Color,
  CubicBezierCurve3,
  Group as TGroup,
  InstancedBufferAttribute,
  InstancedMesh,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Points,
  Quaternion,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import { createStage, type StageFrame } from '../../shared/stage'
import { LAND, LAND_H, LAND_W } from './land'
import { ARCS, PLACES, type View } from './places'

/**
 * Atlas: a dotted globe of land, arcs from Gurugram to where the work goes.
 * The page hands over a list of scroll stops (element + view); the globe is a pure
 * function of the scroll position between them — no easing that trails the page.
 */

export type Stop = { el: HTMLElement; view: View; at?: number }
export type AtlasScene = {
  setStops: (stops: Stop[]) => void
  setLabels: (els: Record<string, HTMLElement>) => void
  measure: () => void
  dispose: () => void
}

const DEG = Math.PI / 180
const FOV = 35

export function latLon(lat: number, lon: number, r = 1, out = new Vector3()) {
  const phi = (90 - lat) * DEG
  const theta = (lon + 180) * DEG
  return out.set(-Math.sin(phi) * Math.cos(theta) * r, Math.cos(phi) * r, Math.sin(phi) * Math.sin(theta) * r)
}

/** Rotation that brings (lat, lon) to face the camera with north up. */
function viewQuat(lat: number, lon: number, out = new Quaternion()) {
  const p = latLon(0, lon)
  const qy = new Quaternion().setFromUnitVectors(p, new Vector3(0, 0, 1))
  const qx = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), lat * DEG)
  return out.copy(qx).multiply(qy)
}

function decodeLand() {
  const bin = atob(LAND)
  const bits = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bits[i] = bin.charCodeAt(i)
  return (lat: number, lon: number) => {
    const col = Math.min(LAND_W - 1, Math.max(0, Math.floor(((lon + 180) / 360) * LAND_W)))
    const row = Math.min(LAND_H - 1, Math.max(0, Math.floor(((90 - lat) / 180) * LAND_H)))
    const k = row * LAND_W + col
    return (bits[k >> 3] >> (k & 7)) & 1
  }
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const DOT_VERT = /* glsl */ `
attribute float aSeed;
uniform vec3 uLight;
uniform vec3 uHot;
varying float vLight;
varying float vFace;
varying float vSeed;
varying float vHot;
void main() {
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vec3 n = normalize((modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz);
  vLight = dot(n, uLight);
  vFace = dot(n, normalize(cameraPosition - wp.xyz));
  vSeed = aSeed;
  vHot = smoothstep(0.99955, 0.99998, dot(n, uHot));
  gl_Position = projectionMatrix * viewMatrix * wp;
}`
const DOT_FRAG = /* glsl */ `
uniform vec3 uDim;
uniform vec3 uLit;
uniform vec3 uHotC;
uniform float uTime;
uniform float uIntro;
varying float vLight;
varying float vFace;
varying float vSeed;
varying float vHot;
void main() {
  if (vSeed > uIntro) discard;
  vec3 c = mix(uDim, uLit, smoothstep(-0.35, 0.85, vLight));
  c *= 0.86 + 0.14 * sin(uTime * 1.7 + vSeed * 91.0);
  c = mix(c, uHotC, vHot);
  c *= 0.25 + 0.75 * smoothstep(0.0, 0.45, vFace);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`

const OCEAN_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`
const OCEAN_FRAG = /* glsl */ `
uniform vec3 uDeep;
uniform vec3 uRim;
uniform vec3 uLight;
varying vec3 vN;
varying vec3 vV;
void main() {
  float f = pow(1.0 - max(dot(vN, vV), 0.0), 3.0);
  float l = smoothstep(-0.4, 1.0, dot(vN, uLight));
  vec3 c = uDeep * (0.6 + 0.6 * l) + uRim * f * 0.42;
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`
const ATMO_FRAG = /* glsl */ `
uniform vec3 uRim;
varying vec3 vN;
varying vec3 vV;
void main() {
  // back faces: 0 at the outer edge of the halo, ~0.5 where it meets the globe
  float d = -dot(vN, vV);
  float a = pow(clamp(d / 0.52, 0.0, 1.0), 5.0);
  gl_FragColor = vec4(uRim * a * 0.55, 1.0);
  #include <colorspace_fragment>
}`

const ARC_VERT = /* glsl */ `
varying float vU;
void main() { vU = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const ARC_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
uniform float uDraw;
uniform float uTime;
uniform float uPhase;
varying float vU;
void main() {
  float drawn = step(vU, uDraw);
  float growing = 1.0 - step(0.999, uDraw);
  float head = smoothstep(uDraw - 0.1, uDraw, vU) * growing;
  float p = fract(uTime * 0.28 + uPhase) * 1.3;
  float comet = (1.0 - growing) * smoothstep(p - 0.22, p, vU) * step(vU, p);
  float a = drawn * (0.3 + 1.1 * head) + comet * 1.1;
  vec3 c = mix(uColor, vec3(1.0, 0.96, 0.86), clamp(head + comet * 0.7, 0.0, 1.0));
  gl_FragColor = vec4(c * a * uAlpha, 1.0);
  #include <colorspace_fragment>
}`

const PIN_VERT = /* glsl */ `
attribute float aW;
attribute float aPhase;
uniform float uTime;
uniform float uRing;
uniform float uScale;
varying float vW;
varying float vR;
void main() {
  float t = fract(uTime * 0.6 + aPhase);
  float s = uRing > 0.5 ? (0.6 + t * 1.8) : 1.0;
  vW = aW * (uRing > 0.5 ? (1.0 - t) : 1.0);
  vec4 wp = modelMatrix * instanceMatrix * vec4(position * s * uScale, 1.0);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`
const PIN_FRAG = /* glsl */ `
uniform vec3 uColor;
varying float vW;
void main() {
  if (vW < 0.01) discard;
  gl_FragColor = vec4(uColor * vW, 1.0);
  #include <colorspace_fragment>
}`

const STAR_VERT = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uPx;
varying float vA;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vA = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (0.6 + aSeed) + aSeed * 50.0));
  gl_PointSize = uPx * (0.6 + aSeed * 1.4);
  gl_Position = projectionMatrix * mv;
}`
const STAR_FRAG = /* glsl */ `
varying float vA;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.0, length(d)) * vA;
  gl_FragColor = vec4(vec3(0.78, 0.86, 1.0) * a, 1.0);
}`

const HEAD_VERT = /* glsl */ `
attribute float aA;
uniform float uPx;
varying float vA;
void main() {
  vA = aA;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uPx * 14.0 * (2.5 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`
const HEAD_FRAG = /* glsl */ `
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = (smoothstep(0.5, 0.0, d) * 0.6 + smoothstep(0.14, 0.0, d)) * vA;
  gl_FragColor = vec4(vec3(1.0, 0.85, 0.55) * a, 1.0);
}`

export function createAtlasScene(canvas: HTMLCanvasElement): AtlasScene | null {
  const small = window.innerWidth < 700
  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 0.05, 200)
  camera.position.set(0, 0, 3.3)

  let ready = false
  let W = 1
  let H = 1
  const stage = createStage(canvas, (f) => ready && frame(f), {
    onResize: (w, h) => {
      W = w
      H = h
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      if (ready) {
        lastOff = ''
        measure()
      }
    },
  })
  if (!stage) return null
  const { renderer } = stage
  renderer.setClearColor('#050a12')

  const globe = new TGroup()
  scene.add(globe)
  const disposables: { dispose: () => void }[] = []
  const track = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x)

  const light = new Vector3(-0.55, 0.55, 0.65).normalize()

  // ocean + rim
  const oceanMat = track(
    new ShaderMaterial({
      vertexShader: OCEAN_VERT,
      fragmentShader: OCEAN_FRAG,
      uniforms: { uDeep: { value: new Color('#0a1626') }, uRim: { value: new Color('#3f7bff') }, uLight: { value: light } },
    }),
  )
  const sphereGeo = track(new SphereGeometry(1, small ? 48 : 72, small ? 32 : 48))
  const ocean = new Mesh(sphereGeo, oceanMat)
  ocean.scale.setScalar(0.992)
  globe.add(ocean)

  // atmosphere: back faces of a bigger sphere, additive
  const atmo = new Mesh(
    sphereGeo,
    track(
      new ShaderMaterial({
        vertexShader: OCEAN_VERT,
        fragmentShader: ATMO_FRAG,
        uniforms: { uRim: { value: new Color('#4d8dff') } },
        side: BackSide,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    ),
  )
  atmo.scale.setScalar(1.12)
  scene.add(atmo)

  // land dots on a Fibonacci sphere
  const isLand = decodeLand()
  const N = small ? 26000 : 60000
  const golden = Math.PI * (3 - Math.sqrt(5))
  const pts: { lat: number; lon: number }[] = []
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N
    const lat = Math.asin(y) / DEG
    let lon = ((i * golden) % (Math.PI * 2)) / DEG - 180
    if (lon > 180) lon -= 360
    if (isLand(lat, lon)) pts.push({ lat, lon })
  }
  const dotR = small ? 0.0062 : 0.0042
  const dotGeo = track(new CircleGeometry(dotR, 6))
  const dotMat = track(
    new ShaderMaterial({
      vertexShader: DOT_VERT,
      fragmentShader: DOT_FRAG,
      uniforms: {
        uLight: { value: light },
        uHot: { value: new Vector3() },
        uDim: { value: new Color('#24406a') },
        uLit: { value: new Color('#9cc0ff') },
        uHotC: { value: new Color('#ffb000') },
        uTime: { value: 0 },
        uIntro: { value: 0 },
      },
    }),
  )
  const dots = new InstancedMesh(dotGeo, dotMat, pts.length)
  const seeds = new Float32Array(pts.length)
  const o = new Object3D()
  const v = new Vector3()
  pts.forEach((p, i) => {
    latLon(p.lat, p.lon, 1.0005, o.position)
    o.lookAt(v.copy(o.position).multiplyScalar(2))
    o.updateMatrix()
    dots.setMatrixAt(i, o.matrix)
    // intro sweeps in from Gurugram's longitude outwards
    const dl = Math.abs(((p.lon - 77 + 540) % 360) - 180) / 180
    seeds[i] = Math.min(0.999, dl * 0.85 + Math.random() * 0.15)
  })
  dotGeo.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 1))
  dots.instanceMatrix.needsUpdate = true
  dots.frustumCulled = false
  globe.add(dots)

  // arcs
  const placeVec = (id: string, r = 1) => {
    const p = PLACES.find((x) => x.id === id)!
    return latLon(p.lat, p.lon, r)
  }
  const arcs = ARCS.map((a, i) => {
    const s = placeVec(a.from, 1.002)
    const e = placeVec(a.to, 1.002)
    const d = s.distanceTo(e)
    const lift = 1.004 + d * 0.5
    const c1 = s.clone().lerp(e, 0.25).normalize().multiplyScalar(lift)
    const c2 = s.clone().lerp(e, 0.75).normalize().multiplyScalar(lift)
    const curve = new CubicBezierCurve3(s, c1, c2, e)
    // short hops are seen from close up, so they get a thinner line
    const radius = (small ? 0.0055 : 0.0038) * Math.min(1, Math.max(0.22, d * 3))
    const geo = track(new TubeGeometry(curve, d > 0.3 ? 120 : 48, radius, 5, false))
    const mat = track(
      new ShaderMaterial({
        vertexShader: ARC_VERT,
        fragmentShader: ARC_FRAG,
        uniforms: {
          uColor: { value: new Color('#ffb000') },
          uAlpha: { value: 0 },
          uDraw: { value: 0 },
          uTime: { value: 0 },
          uPhase: { value: i * 0.27 },
        },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    )
    const mesh = new Mesh(geo, mat)
    mesh.visible = false
    globe.add(mesh)
    return { id: a.id, curve, mesh, mat }
  })

  // flight heads (one Points draw call)
  const headGeo = track(new BufferGeometry())
  const headPos = new Float32Array(arcs.length * 3)
  const headA = new Float32Array(arcs.length)
  headGeo.setAttribute('position', new BufferAttribute(headPos, 3))
  headGeo.setAttribute('aA', new BufferAttribute(headA, 1))
  const headMat = track(
    new ShaderMaterial({
      vertexShader: HEAD_VERT,
      fragmentShader: HEAD_FRAG,
      uniforms: { uPx: { value: 1 } },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  )
  const heads = new Points(headGeo, headMat)
  heads.frustumCulled = false
  globe.add(heads)

  // pins: a solid dot and an expanding ring per place (two instanced draws)
  const pinW = new Float32Array(PLACES.length)
  const pinPhase = new Float32Array(PLACES.map((_, i) => i * 0.37))
  const makePins = (geo: BufferGeometry, ring: boolean, color: string) => {
    track(geo)
    geo.setAttribute('aW', new InstancedBufferAttribute(pinW, 1))
    geo.setAttribute('aPhase', new InstancedBufferAttribute(pinPhase, 1))
    const mat = track(
      new ShaderMaterial({
        vertexShader: PIN_VERT,
        fragmentShader: PIN_FRAG,
        uniforms: { uTime: { value: 0 }, uRing: { value: ring ? 1 : 0 }, uScale: { value: 1 }, uColor: { value: new Color(color) } },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    )
    const m = new InstancedMesh(geo, mat, PLACES.length)
    PLACES.forEach((p, i) => {
      latLon(p.lat, p.lon, 1.003, o.position)
      o.lookAt(v.copy(o.position).multiplyScalar(2))
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    })
    m.frustumCulled = false
    globe.add(m)
    return { m, mat }
  }
  const pinDots = makePins(new CircleGeometry(small ? 0.012 : 0.009, 16), false, '#ffd27a')
  const pinRings = makePins(new RingGeometry(small ? 0.016 : 0.012, small ? 0.021 : 0.016, 32), true, '#ffb000')

  // stars
  const S = small ? 700 : 1600
  const sp = new Float32Array(S * 3)
  const ss = new Float32Array(S)
  for (let i = 0; i < S; i++) {
    const u = Math.random() * 2 - 1
    const t = Math.random() * Math.PI * 2
    const r = 30 + Math.random() * 30
    const q = Math.sqrt(1 - u * u)
    sp.set([q * Math.cos(t) * r, u * r, q * Math.sin(t) * r], i * 3)
    ss[i] = Math.random()
  }
  const starGeo = track(new BufferGeometry())
  starGeo.setAttribute('position', new BufferAttribute(sp, 3))
  starGeo.setAttribute('aSeed', new BufferAttribute(ss, 1))
  const starMat = track(
    new ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: { uTime: { value: 0 }, uPx: { value: 1 } },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  )
  const stars = new Points(starGeo, starMat)
  scene.add(stars)

  // ---- scroll stops ----
  let stops: Stop[] = []
  let at: number[] = []
  let labelEls: { el: HTMLElement; place: (typeof PLACES)[number]; last: string }[] = []
  const hotDir = placeVec('ggn')

  function measure() {
    const sy = window.scrollY
    const vh = window.innerHeight
    const max = Math.max(0, document.documentElement.scrollHeight - vh)
    // a stop is fully reached when its element's top crosses 40% of the screen
    at = stops.map((s, i) => (i === 0 ? 0 : Math.min(max, s.el.getBoundingClientRect().top + sy - vh * 0.4)))
    stage?.invalidate()
  }

  // ---- drag with inertia ----
  const user = { yaw: 0, pitch: 0, vy: 0, vp: 0, dragging: false, lastX: 0, lastY: 0, idle: 0 }
  const down = (e: PointerEvent) => {
    user.dragging = true
    user.lastX = e.clientX
    user.lastY = e.clientY
    user.vy = user.vp = 0
  }
  const move = (e: PointerEvent) => {
    if (!user.dragging) return
    const dx = e.clientX - user.lastX
    const dy = e.clientY - user.lastY
    user.lastX = e.clientX
    user.lastY = e.clientY
    user.vy = dx * 0.005
    user.vp = dy * 0.004
    user.yaw += user.vy
    user.pitch = Math.max(-0.8, Math.min(0.8, user.pitch + user.vp))
    user.idle = 0
    stage?.invalidate()
  }
  const up = () => (user.dragging = false)
  canvas.addEventListener('pointerdown', down)
  window.addEventListener('pointermove', move, { passive: true })
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)
  const onScroll = () => stage?.invalidate()
  window.addEventListener('scroll', onScroll, { passive: true })

  // ---- frame ----
  const qa = new Quaternion()
  const qb = new Quaternion()
  const qView = new Quaternion()
  const qUser = new Quaternion()
  const yAxis = new Vector3(0, 1, 0)
  const xAxis = new Vector3(1, 0, 0)
  const tmpQ = new Quaternion()
  const camDir = new Vector3()
  const wp = new Vector3()
  const nrm = new Vector3()
  let intro = 0
  let lastOff = ''

  function blendView(sy: number) {
    // which stop we are in, and how far into the hop towards the next one
    let i = 0
    while (i < at.length - 1 && sy >= at[i + 1]) i++
    const a = stops[i]?.view
    const nextI = Math.min(i + 1, stops.length - 1)
    const b = stops[nextI]?.view
    if (!a || !b) return null
    const vh = window.innerHeight
    const span = nextI === i ? 1 : Math.max(1, at[nextI] - at[i])
    // the hop uses the last part of each stop (up to one screen), so each stop holds for reading
    const len = Math.min(span * 0.85, vh * 0.95)
    const t = nextI === i ? 0 : smooth(at[nextI] - len, at[nextI], sy)
    return { a, b, t }
  }

  const tmpW: Record<string, number> = {}
  function frame(f: StageFrame) {
    const still = f.still
    const sy = window.scrollY
    const time = still ? 0 : f.time
    intro = still ? 1 : Math.min(1, intro + f.dt / 2.2)
    const ie = 1 - Math.pow(1 - intro, 3)

    const bv = blendView(sy)
    if (!bv) {
      renderer.render(scene, camera)
      return
    }
    const { a, b, t } = bv

    // rotation (shortest path)
    viewQuat(a.lat, a.lon, qa)
    viewQuat(b.lat, b.lon, qb)
    qView.slerpQuaternions(qa, qb, t)

    // user drag: inertia, then ease back to the story after a pause
    if (!user.dragging && !still) {
      user.yaw += user.vy
      user.pitch = Math.max(-0.8, Math.min(0.8, user.pitch + user.vp))
      const k = Math.exp(-f.dt * 3.2)
      user.vy *= k
      user.vp *= k
      user.idle += f.dt
      if (user.idle > 2.5) {
        const r = 1 - Math.exp(-f.dt * 0.9)
        user.yaw -= user.yaw * r
        user.pitch -= user.pitch * r
      }
    }
    const drift = still ? 0 : Math.sin(time * 0.12) * 0.06 - (1 - ie) * 0.9
    qUser.setFromAxisAngle(yAxis, user.yaw + drift)
    tmpQ.setFromAxisAngle(xAxis, user.pitch)
    qUser.premultiply(tmpQ)
    globe.quaternion.copy(qUser).multiply(qView)
    stars.quaternion.copy(qUser)

    // distance and screen offset
    const dist = (a.dist + (b.dist - a.dist) * t) * (1 + (1 - ie) * 0.35)
    camera.position.set(0, 0, dist)
    const ox = a.x + (b.x - a.x) * t
    const oy = a.y + (b.y - a.y) * t
    const key = `${ox.toFixed(4)}|${oy.toFixed(4)}|${W}|${H}`
    if (key !== lastOff) {
      lastOff = key
      if (Math.abs(ox) < 1e-4 && Math.abs(oy) < 1e-4) camera.clearViewOffset()
      else camera.setViewOffset(W, H, -ox * W, oy * H, W, H)
    }
    camera.updateMatrixWorld()

    // shader clocks
    dotMat.uniforms.uTime.value = time
    dotMat.uniforms.uIntro.value = ie * 1.001
    pinRings.mat.uniforms.uTime.value = time
    // pins keep the same size on screen whether we are close or far
    const ps = Math.min(1.2, Math.max(0.5, (dist - 1) / 3))
    pinRings.mat.uniforms.uScale.value = ps
    pinDots.mat.uniforms.uScale.value = ps
    starMat.uniforms.uTime.value = time
    const px = renderer.getPixelRatio()
    starMat.uniforms.uPx.value = px * (small ? 1.6 : 2)
    headMat.uniforms.uPx.value = px
    globe.updateMatrixWorld()
    dotMat.uniforms.uHot.value.copy(hotDir).applyQuaternion(globe.quaternion)

    // arcs: opacity eases in fast, the drawn length follows scroll exactly
    for (let k = 0; k < arcs.length; k++) {
      const arc = arcs[k]
      const [a0, d0] = a.arcs[arc.id] ?? [0, 0]
      const [a1, d1] = b.arcs[arc.id] ?? [0, 0]
      const ta = a1 > a0 ? smooth(0, 0.25, t) : t
      const alpha = (a0 + (a1 - a0) * ta) * ie
      const draw = d0 + (d1 - d0) * t
      arc.mesh.visible = alpha > 0.003 && draw > 0.002
      arc.mat.uniforms.uAlpha.value = alpha
      arc.mat.uniforms.uDraw.value = still ? Math.round(draw * 100) / 100 : draw
      arc.mat.uniforms.uTime.value = time
      // a bright head rides on a route while it is being flown
      const flying = draw > 0.01 && draw < 0.995 ? alpha : 0
      headA[k] = flying
      if (flying) {
        arc.curve.getPoint(draw, wp)
        headPos.set([wp.x, wp.y, wp.z], k * 3)
      }
    }
    headGeo.attributes.position.needsUpdate = true
    headGeo.attributes.aA.needsUpdate = true

    // labels + pins
    camDir.copy(camera.position).normalize()
    for (let k = 0; k < PLACES.length; k++) {
      const p = PLACES[k]
      const w0 = a.labels[p.id] ?? a.labels[p.group] ?? 0
      const w1 = b.labels[p.id] ?? b.labels[p.group] ?? 0
      tmpW[p.id] = (w0 + (w1 - w0) * t) * ie
      pinW[k] = tmpW[p.id]
    }
    ;(pinDots.m.geometry.getAttribute('aW') as InstancedBufferAttribute).needsUpdate = true
    ;(pinRings.m.geometry.getAttribute('aW') as InstancedBufferAttribute).needsUpdate = true

    for (const l of labelEls) {
      const p = l.place
      latLon(p.lat, p.lon, 1.0, nrm).applyQuaternion(globe.quaternion)
      const facing = nrm.dot(wp.copy(camera.position).sub(nrm).normalize())
      const w = (tmpW[p.id] ?? 0) * smooth(0.12, 0.35, facing)
      wp.copy(nrm).project(camera)
      const x = (wp.x * 0.5 + 0.5) * W
      const y = (-wp.y * 0.5 + 0.5) * H
      const s = w < 0.01 ? 'h' : `${x.toFixed(1)},${y.toFixed(1)},${w.toFixed(2)}`
      if (s === l.last) continue
      l.last = s
      if (s === 'h') {
        l.el.style.opacity = '0'
        continue
      }
      l.el.style.opacity = w.toFixed(2)
      l.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
    }

    renderer.render(scene, camera)
  }

  ready = true
  W = stage.width()
  H = stage.height()
  camera.aspect = W / H
  camera.updateProjectionMatrix()

  return {
    setStops(list) {
      stops = list
      measure()
    },
    setLabels(map) {
      labelEls = PLACES.filter((p) => map[p.id]).map((place) => ({ el: map[place.id], place, last: '' }))
      stage.invalidate()
    },
    measure,
    dispose() {
      ready = false
      canvas.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('scroll', onScroll)
      disposables.forEach((d) => d.dispose())
      stage.dispose()
    },
  }
}
