import {
  ACESFilmicToneMapping,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  LinearMipmapLinearFilter,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Raycaster,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SpotLight,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  type Material,
  type Texture,
  type WebGLRenderer,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { createStage } from '../../shared/stage'
import { PHOSPHOR, type Phosphor, type Terminal } from './terminal'

/**
 * "Retro": a beige 1980s computer on a desk in a dark room. The screen is the live
 * terminal canvas, drawn through a CRT shader (barrel curve, scanlines, RGB fringe,
 * mip-based glow). Scroll pulls the camera back from the screen, round the desk, then
 * pushes into the glass for the contact section.
 */

export type RetroOptions = {
  term: Terminal
  /** Camera progress in stop units (0..STOPS-1), already eased. */
  progress: () => number
  onScreenClick: () => void
}
export type RetroScene = {
  setPhosphor: (p: Phosphor) => void
  press: (ch: string) => void
  invalidate: () => void
  dispose: () => void
}

type Stop = { pos: [number, number, number]; at: [number, number, number]; ox: number }
// ox: lens shift (fraction of width), + moves the scene right so the left column stays clear
const STOPS: Stop[] = [
  { pos: [1.4, 3.7, 9.4], at: [0.1, 2.72, 1.0], ox: 0.2 }, // hero: close on the screen
  { pos: [-4.8, 5.0, 11.8], at: [0.2, 2.2, 0.8], ox: 0.21 }, // about: pull back
  { pos: [5.6, 6.9, 12.0], at: [0, 1.3, 1.4], ox: 0.21 }, // skills: over the keyboard
  { pos: [-1.5, 9.4, 16.5], at: [-0.3, 1.5, 0.4], ox: 0.2 }, // work: the whole desk
  { pos: [7.9, 3.6, 10.8], at: [0.2, 2.2, 0.6], ox: 0.21 }, // experience: low and wide
  { pos: [0, 2.94, 8.0], at: [0, 2.94, 1.0], ox: 0.225 }, // contact: into the screen
]

const SCREEN = { w: 3.12, h: 2.34, y: 2.94, z: 1.06 }

const KEY_ROWS = ['1234567890-=', 'qwertyuiop[]', "asdfghjkl;'", 'zxcvbnm,./']

function woodTexture(): Texture {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = '#3a2416'
  g.fillRect(0, 0, 512, 256)
  let seed = 4
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 140; i++) {
    const y = r() * 256
    g.strokeStyle = `rgba(${r() < 0.5 ? '20,10,4' : '96,62,36'},${0.18 + r() * 0.25})`
    g.lineWidth = 0.6 + r() * 2.2
    g.beginPath()
    g.moveTo(0, y)
    for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x * 0.012 + i) * (2 + r() * 3))
    g.stroke()
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(2, 1)
  t.anisotropy = 4
  return t
}

function badgeTexture(text: string): Texture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 64
  const g = c.getContext('2d')!
  const grd = g.createLinearGradient(0, 0, 0, 64)
  grd.addColorStop(0, '#d9d3c3')
  grd.addColorStop(1, '#a9a291')
  g.fillStyle = grd
  g.fillRect(0, 0, 256, 64)
  g.fillStyle = '#2a2721'
  g.font = '700 30px "IBM Plex Mono", monospace'
  g.textBaseline = 'middle'
  g.fillText(text, 18, 34)
  g.fillStyle = '#e8572f'
  g.fillRect(206, 18, 32, 28)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

const CRT_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const CRT_FRAG = /* glsl */ `
uniform sampler2D map;
uniform float uTime;
uniform float uOn;
uniform float uFlicker;
uniform vec3 uTint;
varying vec2 vUv;

vec2 barrel(vec2 uv) {
  vec2 c = uv * 2.0 - 1.0;
  c *= 1.0 + 0.035 * dot(c, c);
  return c * 0.5 + 0.5;
}

void main() {
  vec2 uv = barrel(vUv);
  vec2 c = uv * 2.0 - 1.0;
  // power-on: the picture opens from a bright horizontal line
  float open = smoothstep(0.0, 1.0, uOn);
  float lineMask = step(abs(c.y), max(open, 0.004)) * step(abs(c.x), min(1.0, uOn * 6.0));
  uv.y = (uv.y - 0.5) / max(open, 0.004) + 0.5;
  vec2 inside = step(vec2(0.0), uv) * step(uv, vec2(1.0));
  float mask = inside.x * inside.y * lineMask;

  vec2 dir = c * 0.0022;
  vec3 col;
  col.r = texture2D(map, uv + dir).r;
  col.g = texture2D(map, uv).g;
  col.b = texture2D(map, uv - dir).b;
  // phosphor bloom from blurred mip levels
  vec3 glow = texture2D(map, uv, 1.5).rgb * 0.32 + texture2D(map, uv, 3.0).rgb * 0.18;
  col += glow;

  float scan = 0.78 + 0.22 * sin(uv.y * 384.0 * 3.14159265);
  col *= scan;
  // faint vertical aperture grille
  col *= 0.94 + 0.06 * sin(gl_FragCoord.x * 2.1);
  // slow rolling band + a whisper of flicker
  float band = smoothstep(0.0, 0.12, fract(uv.y * 0.6 - uTime * 0.09)) * smoothstep(0.24, 0.12, fract(uv.y * 0.6 - uTime * 0.09));
  col *= 1.0 + band * 0.05 + uFlicker * 0.018 * sin(uTime * 97.0);
  col += uTint * 0.012;
  // rounded-rect tube edge, slightly darker toward the corners
  vec2 e = smoothstep(vec2(0.0), vec2(0.03), uv) * smoothstep(vec2(0.0), vec2(0.03), 1.0 - uv);
  col *= e.x * e.y * (1.0 - 0.28 * dot(c, c) * 0.5);
  col *= mask;
  col += (1.0 - open) * lineMask * 1.6 * uTint * 6.0;
  // glass: a soft reflection from the room
  float refl = smoothstep(0.75, 0.0, length((vUv - vec2(0.24, 0.84)) * vec2(1.0, 1.6)));
  col += vec3(0.05, 0.05, 0.045) * refl;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`

export function createRetroScene(canvas: HTMLCanvasElement, opts: RetroOptions): RetroScene | null {
  const small = window.innerWidth < 700
  const scene = new Scene()
  scene.background = new Color('#0b0d0a')
  scene.fog = new Fog('#0b0d0a', 14, 34)
  const camera = new PerspectiveCamera(32, 1, 0.1, 80)
  const own: { dispose: () => void }[] = []
  const keep = <T extends { dispose: () => void }>(x: T) => (own.push(x), x)
  let renderer: WebGLRenderer | null = null

  const std = (color: string, roughness = 0.62, extra: Partial<ConstructorParameters<typeof MeshStandardMaterial>[0]> = {}) =>
    keep(new MeshStandardMaterial({ color, roughness, metalness: 0, ...extra }))
  const beige = std('#d9cfb4', 0.55)
  const beigeDark = std('#bdb194', 0.6)
  const charcoal = std('#2a2823', 0.7)
  const black = std('#121210', 0.5)
  const add = (geo: BufferGeometry, mat: Material, x: number, y: number, z: number, parent: Group | Scene = scene, cast = true) => {
    const m = new Mesh(keep(geo), mat)
    m.position.set(x, y, z)
    m.castShadow = cast
    m.receiveShadow = true
    parent.add(m)
    return m
  }

  /* ---------- room + desk */
  const wood = keep(woodTexture())
  const deskMat = std('#ffffff', 0.58, { map: wood })
  add(new BoxGeometry(17, 0.4, 7.4), deskMat, 0, -0.2, 0.9, scene, false)
  const wall = add(new PlaneGeometry(40, 18), std('#1a1a15', 0.95), 0, 6, -3.2, scene, false)
  wall.receiveShadow = true
  const paperMat = std('#e4dcc6', 0.9)

  /* ---------- the computer */
  const pc = new Group()
  scene.add(pc)
  // system unit
  add(new RoundedBoxGeometry(5.0, 1.15, 4.1, 3, 0.1), beige, 0, 0.58, -0.35, pc)
  add(new BoxGeometry(1.5, 0.08, 0.04), black, 1.45, 0.78, 1.71, pc, false)
  add(new BoxGeometry(1.5, 0.08, 0.04), black, 1.45, 0.42, 1.71, pc, false)
  add(new BoxGeometry(0.34, 0.12, 0.05), beigeDark, 0.5, 0.78, 1.71, pc, false)
  add(new BoxGeometry(0.34, 0.12, 0.05), beigeDark, 0.5, 0.42, 1.71, pc, false)
  const ledMat = keep(new MeshBasicMaterial({ color: '#ff4a2a' }))
  add(new BoxGeometry(0.09, 0.05, 0.03), ledMat, -2.05, 0.82, 1.72, pc, false)
  const badge = keep(badgeTexture('JY-2026'))
  add(new PlaneGeometry(1.1, 0.275), std('#ffffff', 0.45, { map: badge }), -1.35, 0.6, 1.705, pc, false)
  for (let i = 0; i < 7; i++) add(new BoxGeometry(0.05, 0.5, 0.02), charcoal, -0.6 + i * 0.13, 0.6, 1.705, pc, false)

  // monitor: front shell + tapered tube behind
  const mon = new Group()
  mon.position.set(0, 1.17, 0)
  pc.add(mon)
  add(new RoundedBoxGeometry(4.3, 3.55, 1.0, 4, 0.16), beige, 0, 1.78, 0.48, mon)
  const tube = new CylinderGeometry(1.25, 2.1, 2.5, 4, 1)
  tube.rotateY(Math.PI / 4)
  tube.rotateX(-Math.PI / 2)
  tube.scale(1.15, 0.95, 1)
  add(tube, beigeDark, 0, 1.85, -1.2, mon)
  add(new BoxGeometry(2.6, 0.04, 0.9), charcoal, 0, 3.565, -0.6, mon, false)
  // bezel recess around the glass
  add(new BoxGeometry(3.52, 2.72, 0.06), std('#2a2822', 0.4), 0, SCREEN.y - 1.17, 0.99, mon, false)
  for (const [w, h, x, y] of [
    [3.72, 0.12, 0, 1.4],
    [3.72, 0.12, 0, -1.4],
    [0.12, 2.9, 1.82, 0],
    [0.12, 2.9, -1.82, 0],
  ] as const)
    add(new RoundedBoxGeometry(w, h, 0.14, 2, 0.04), beigeDark, x, SCREEN.y - 1.17 + y, 1.0, mon, false)
  // knobs + a little label strip under the screen
  for (const x of [1.45, 1.8]) {
    const k = add(new CylinderGeometry(0.1, 0.11, 0.1, 18), charcoal, x, 0.22, 1.0, mon, false)
    k.rotation.x = Math.PI / 2
  }
  add(new BoxGeometry(0.9, 0.06, 0.02), charcoal, -1.25, 0.22, 0.99, mon, false)

  // the glass: live terminal through the CRT shader
  const term = opts.term
  const tex = keep(new CanvasTexture(term.canvas))
  tex.colorSpace = SRGBColorSpace
  tex.generateMipmaps = true
  tex.minFilter = LinearMipmapLinearFilter
  tex.anisotropy = 4
  const tint = new Color(PHOSPHOR[term.phosphor].fg)
  const crt = keep(
    new ShaderMaterial({
      uniforms: { map: { value: tex }, uTime: { value: 0 }, uOn: { value: 0 }, uFlicker: { value: 1 }, uTint: { value: tint } },
      vertexShader: CRT_VERT,
      fragmentShader: CRT_FRAG,
      toneMapped: false,
    }),
  )
  const screenGeo = new PlaneGeometry(SCREEN.w, SCREEN.h, 24, 18)
  {
    const p = screenGeo.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / (SCREEN.w / 2)
      const y = p.getY(i) / (SCREEN.h / 2)
      p.setZ(i, 0.08 * (1 - x * x * 0.6) * (1 - y * y * 0.6))
    }
    screenGeo.computeVertexNormals()
  }
  const screen = add(screenGeo, crt, 0, SCREEN.y - 1.17, 1.035, mon, false)
  screen.receiveShadow = false
  /* ---------- keyboard with instanced keys */
  const kb = new Group()
  kb.position.set(-0.1, 0, 3.45)
  kb.rotation.x = 0.05
  scene.add(kb)
  add(new RoundedBoxGeometry(5.6, 0.32, 2.0, 3, 0.08), beige, 0, 0.16, 0, kb)
  type Key = { x: number; z: number; w: number; dark: boolean; press: number }
  const keys: Key[] = []
  const keyIndex = new Map<string, number>()
  const KW = 0.36
  KEY_ROWS.forEach((row, r) => {
    const z = -0.66 + r * 0.38
    const x0 = -2.45 + r * 0.12
    for (let i = 0; i < row.length; i++) {
      keyIndex.set(row[i], keys.length)
      keys.push({ x: x0 + i * KW + KW / 2, z, w: 0.32, dark: false, press: 0 })
    }
    if (r === 0) {
      keyIndex.set('\b', keys.length)
      keys.push({ x: x0 + row.length * KW + 0.38, z, w: 0.66, dark: true, press: 0 })
    }
    if (r === 2) {
      keyIndex.set('\n', keys.length)
      keys.push({ x: x0 + row.length * KW + 0.42, z, w: 0.76, dark: true, press: 0 })
    }
    if (r === 3) keys.push({ x: x0 - 0.36, z, w: 0.5, dark: true, press: 0 }, { x: x0 + row.length * KW + 0.42, z, w: 0.7, dark: true, press: 0 })
  })
  keyIndex.set(' ', keys.length)
  keys.push({ x: 0, z: 0.86, w: 2.3, dark: false, press: 0 })
  keys.push({ x: -1.85, z: 0.86, w: 0.6, dark: true, press: 0 }, { x: 1.75, z: 0.86, w: 0.6, dark: true, press: 0 })
  const keyMesh = new InstancedMesh(keep(new RoundedBoxGeometry(1, 0.2, 0.32, 2, 0.05)), std('#e7dfca', 0.5), keys.length)
  const m4 = new Matrix4()
  const kc = new Color()
  const setKey = (i: number) => {
    const k = keys[i]
    m4.makeScale(k.w, 1, 1).setPosition(k.x, 0.38 - k.press * 0.08, k.z)
    keyMesh.setMatrixAt(i, m4)
  }
  keys.forEach((k, i) => {
    setKey(i)
    keyMesh.setColorAt(i, kc.set(k.dark ? '#b2a68a' : '#e9e2cf'))
  })
  keyMesh.castShadow = true
  keyMesh.receiveShadow = true
  kb.add(keyMesh)

  // coiled cable from keyboard to the system unit
  const pts: Vector3[] = []
  for (let i = 0; i <= 80; i++) {
    const t = i / 80
    const base = new Vector3(-2.2 - Math.sin(t * Math.PI) * 0.7, 0.12, 2.5 - t * 1.0)
    const coil = t > 0.15 && t < 0.85 ? 0.06 : 0
    base.x += Math.cos(t * 70) * coil
    base.y += Math.sin(t * 70) * coil + 0.04
    pts.push(base)
  }
  add(new TubeGeometry(new CatmullRomCurve3(pts), 220, 0.03, 6, false), std('#b9ad90', 0.6), 0, 0, 0, scene, false)

  /* ---------- props */
  const mug = new Group()
  mug.position.set(3.9, 0, 3.1)
  scene.add(mug)
  add(new CylinderGeometry(0.42, 0.38, 0.95, 28, 1, true), std('#a8392b', 0.4, { side: DoubleSide }), 0, 0.475, 0, mug)
  add(new CylinderGeometry(0.38, 0.38, 0.04, 28), std('#2a170c', 0.2), 0, 0.78, 0, mug, false)
  add(new CylinderGeometry(0.38, 0.38, 0.04, 28), std('#a8392b', 0.4), 0, 0.02, 0, mug, false)
  const handle = add(new TorusGeometry(0.24, 0.06, 10, 20, Math.PI), std('#a8392b', 0.4), 0.42, 0.48, 0, mug)
  handle.rotation.z = -Math.PI / 2
  // floppy disks
  const floppies = new Group()
  floppies.position.set(-4.1, 0, 2.6)
  floppies.rotation.y = 0.35
  scene.add(floppies)
  ;['#1c1d22', '#2a4d8f', '#b8432f'].forEach((c, i) => {
    const f = add(new BoxGeometry(1.0, 0.045, 1.0), std(c, 0.5), 0, 0.025 + i * 0.05, 0, floppies)
    f.rotation.y = (i - 1) * 0.12
    const lab = add(new PlaneGeometry(0.7, 0.42), paperMat, 0, 0.05 + i * 0.05, 0.18, floppies, false)
    lab.rotation.set(-Math.PI / 2, 0, (i - 1) * 0.12)
  })
  // notepad + pencil
  const pad = add(new BoxGeometry(1.5, 0.06, 2.0), std('#efe7cf', 0.9), 4.6, 0.03, 0.7, scene)
  pad.rotation.y = -0.2
  const pencil = add(new CylinderGeometry(0.035, 0.035, 1.4, 6), std('#e3b33a', 0.5), 4.5, 0.1, 0.8, scene)
  pencil.rotation.set(Math.PI / 2, 0, 0.5)

  // desk lamp (the key light)
  const lamp = new Group()
  lamp.position.set(6.6, 0, -1.4)
  lamp.scale.x = -1 // mirrored: the lamp stands to the right of the computer
  scene.add(lamp)
  const lampMat = std('#262521', 0.45, { metalness: 0.4 })
  add(new CylinderGeometry(0.55, 0.62, 0.14, 28), lampMat, 0, 0.07, 0, lamp)
  const arm1 = add(new CylinderGeometry(0.05, 0.05, 2.8, 8), lampMat, 0.35, 1.45, 0, lamp)
  arm1.rotation.z = -0.25
  const arm2 = add(new CylinderGeometry(0.05, 0.05, 2.2, 8), lampMat, 1.25, 3.05, 0.0, lamp)
  arm2.rotation.z = -1.15
  const head = add(new CylinderGeometry(0.22, 0.62, 0.7, 24, 1, true), std('#2e4a3a', 0.4, { side: DoubleSide, metalness: 0.3 }), 2.2, 3.15, 0.15, lamp)
  head.rotation.z = 0.75
  const bulb = add(new SphereGeometry(0.17, 16, 12), keep(new MeshBasicMaterial({ color: '#ffe2a8' })), 2.3, 3.02, 0.15, lamp, false)
  bulb.castShadow = false

  /* ---------- lights */
  scene.add(new HemisphereLight('#4a4a58', '#1a120a', 0.55))
  const key = new SpotLight('#ffcf8f', 70, 22, 0.78, 0.65, 1.6)
  key.position.set(4.3, 3.0, -1.25)
  key.target.position.set(-0.6, 0, 2.2)
  key.castShadow = !small
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.bias = -0.0004
  key.shadow.radius = 4
  scene.add(key, key.target)
  const rim = new DirectionalLight('#7f93c9', 0.9)
  rim.position.set(6, 7, -6)
  scene.add(rim)
  const fill = new DirectionalLight('#ffe9cc', 0.8)
  fill.position.set(-3, 5, 9)
  scene.add(fill)
  const spill = new PointLight(tint.clone(), 1.1, 6, 1.6)
  spill.position.set(0, SCREEN.y, SCREEN.z + 0.9)
  scene.add(spill)

  /* ---------- camera path */
  const posCurve = new CatmullRomCurve3(
    STOPS.map((s) => new Vector3(...s.pos)),
    false,
    'centripetal',
  )
  const atCurve = new CatmullRomCurve3(
    STOPS.map((s) => new Vector3(...s.at)),
    false,
    'centripetal',
  )
  const last = STOPS.length - 1

  /* ---------- pointer: tiny parallax + click the glass to type */
  const ndc = new Vector2()
  const par = new Vector2()
  const parVel = new Vector2()
  const parTarget = new Vector2()
  const ray = new Raycaster()
  let overScreen = false
  let pointerDirty = false
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    parTarget.set(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5)
    if (e.target === canvas) {
      const r = canvas.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      pointerDirty = true
    } else if (overScreen) {
      overScreen = false
      canvas.style.cursor = ''
    }
  }
  const hitScreen = () => {
    ray.setFromCamera(ndc, camera)
    return ray.intersectObject(screen, false).length > 0
  }
  const onClick = (e: MouseEvent) => {
    const r = canvas.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    if (hitScreen()) opts.onScreenClick()
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  canvas.addEventListener('click', onClick)

  /* ---------- frame */
  const camPos = new Vector3()
  const camAt = new Vector3()
  const right = new Vector3()
  const up = new Vector3()
  let seenVersion = -1
  let on = 0
  let keysMoving = false
  const frame = (dt: number, time: number, w: number, h: number, still: boolean) => {
    if (!renderer) return
    const u = Math.max(0, Math.min(last, opts.progress()))
    posCurve.getPoint(u / last, camPos)
    atCurve.getPoint(u / last, camAt)
    // critically damped pointer parallax (pointer only — scroll is applied directly)
    if (!still) {
      const k = 40
      parVel.x += (-(par.x - parTarget.x) * k - parVel.x * 2 * Math.sqrt(k)) * dt
      parVel.y += (-(par.y - parTarget.y) * k - parVel.y * 2 * Math.sqrt(k)) * dt
      par.addScaledVector(parVel, dt)
    }
    camera.position.copy(camPos)
    camera.lookAt(camAt)
    const near = 1 - Math.min(1, Math.max(0, u - (last - 1)))
    right.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(par.x * 0.35 * near)
    up.setFromMatrixColumn(camera.matrixWorld, 1).multiplyScalar(-par.y * 0.22 * near)
    camera.position.add(right).add(up)
    camera.lookAt(camAt)
    const i0 = Math.floor(u)
    const i1 = Math.min(last, i0 + 1)
    const ox = STOPS[i0].ox + (STOPS[i1].ox - STOPS[i0].ox) * (u - i0)
    camera.setViewOffset(w, h, small ? 0 : -ox * w, 0, w, h)

    // power-on, then live screen
    on = still ? 1 : Math.min(1, on + dt * 1.1)
    crt.uniforms.uOn.value = on
    crt.uniforms.uTime.value = time
    crt.uniforms.uFlicker.value = still ? 0 : 1
    if (term.version !== seenVersion) {
      seenVersion = term.version
      tex.needsUpdate = true
    }

    if (keysMoving) {
      keysMoving = false
      keys.forEach((k, i) => {
        if (k.press > 0) {
          k.press = Math.max(0, k.press - dt * 7)
          keysMoving = true
          setKey(i)
        }
      })
      keyMesh.instanceMatrix.needsUpdate = true
    }

    if (pointerDirty) {
      pointerDirty = false
      const over = hitScreen()
      if (over !== overScreen) {
        overScreen = over
        canvas.style.cursor = over ? 'text' : ''
      }
    }

    renderer.render(scene, camera)
  }

  const stage = createStage(canvas, (f) => frame(f.dt, f.time, f.width, f.height, f.still), {
    onResize: (w, h) => {
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    },
  })
  if (!stage) {
    window.removeEventListener('pointermove', onMove)
    canvas.removeEventListener('click', onClick)
    own.forEach((d) => d.dispose())
    return null
  }
  renderer = stage.renderer
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  renderer.shadowMap.enabled = key.castShadow
  renderer.shadowMap.type = PCFSoftShadowMap
  // nothing big moves: render the lamp's shadow once
  renderer.shadowMap.autoUpdate = false
  renderer.shadowMap.needsUpdate = true
  stage.invalidate()

  // keep the reduced-motion still frame in sync with the terminal
  const offTerm = term.onChange(() => stage.invalidate())

  return {
    setPhosphor: (p) => {
      tint.set(PHOSPHOR[p].fg)
      spill.color.copy(tint)
      stage.invalidate()
    },
    press: (ch) => {
      const i = keyIndex.get(ch.toLowerCase())
      if (i === undefined) return
      keys[i].press = 1
      setKey(i)
      keyMesh.instanceMatrix.needsUpdate = true
      keysMoving = true
    },
    invalidate: () => stage.invalidate(),
    dispose: () => {
      offTerm()
      window.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('click', onClick)
      stage.dispose()
      key.shadow.dispose()
      own.forEach((d) => d.dispose())
    },
  }
}
