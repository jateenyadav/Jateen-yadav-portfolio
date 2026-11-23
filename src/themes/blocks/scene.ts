import {
  AdditiveBlending,
  BackSide,
  Box3,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Fog,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Quaternion,
  Raycaster,
  RingGeometry,
  Scene,
  Shape,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  type Material,
  type WebGLRenderer,
  type Texture,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { createStage } from '../../shared/stage'
import { SHOP_COLORS, SPOTS } from './spots'

/**
 * "Blocks": a hand-built voxel island floating in the sky. Each project is a landmark,
 * each skill a little workshop. The page owns scroll; every frame we read progress (0..8,
 * one unit per section) and place the camera on a spline — no easing that trails the scroll.
 * Time of day (dawn → night) follows the same progress; windows light up after sunset.
 */

export type BlocksOptions = {
  /** Camera progress in stop units, 0..STOPS.length-1 (already includes the dwell easing). */
  progress: () => number
  labels: (HTMLElement | null)[]
  onHover: (key: string | null) => void
  onPick: (key: string) => void
  /** Optional: receives the time of day 0..1 every time it changes (for the clock chip). */
  onTime?: (t: number) => void
}

export type BlocksScene = {
  highlight: (key: string | null) => void
  invalidate: () => void
  dispose: () => void
}

/* ------------------------------------------------------------------ helpers */

const rand = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const tmpC = new Color()

/** Paints a geometry for the shared vertex-colour material: colour + `glow` (lights at night). */
function part(g: BufferGeometry, color: string, x = 0, y = 0, z = 0, glow = 0): BufferGeometry {
  const geo = g.index ? g.toNonIndexed() : g
  if (geo !== g) g.dispose()
  geo.deleteAttribute('uv')
  geo.translate(x, y, z)
  const n = geo.attributes.position.count
  const col = new Float32Array(n * 3)
  const gl = new Float32Array(n)
  tmpC.set(color)
  for (let i = 0; i < n; i++) {
    col[i * 3] = tmpC.r
    col[i * 3 + 1] = tmpC.g
    col[i * 3 + 2] = tmpC.b
    gl[i] = glow
  }
  geo.setAttribute('color', new BufferAttribute(col, 3))
  geo.setAttribute('glow', new BufferAttribute(gl, 1))
  return geo
}
/** Box whose base sits on y. */
const box = (w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0, glow = 0) => part(new BoxGeometry(w, h, d), color, x, y + h / 2, z, glow)
/** Gable roof: triangle in XY (width w, height h) extruded d along Z, base on y. */
function gable(w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0, ry = 0) {
  const s = new Shape()
  s.moveTo(-w / 2, 0)
  s.lineTo(w / 2, 0)
  s.lineTo(0, h)
  s.closePath()
  const g = new ExtrudeGeometry(s, { depth: d, bevelEnabled: false })
  g.translate(0, 0, -d / 2)
  if (ry) g.rotateY(ry)
  return part(g, color, x, y, z)
}
const cyl = (rt: number, rb: number, h: number, seg: number, color: string, x = 0, y = 0, z = 0, glow = 0) =>
  part(new CylinderGeometry(rt, rb, h, seg), color, x, y + h / 2, z, glow)
const merge = (parts: BufferGeometry[]) => {
  const g = mergeGeometries(parts, false)!
  parts.forEach((p) => p.dispose())
  g.computeBoundingBox()
  return g
}

function glowTexture(): Texture {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,236,190,1)')
  grd.addColorStop(0.25, 'rgba(255,200,120,0.45)')
  grd.addColorStop(1, 'rgba(255,180,90,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  return new CanvasTexture(c)
}

/* ------------------------------------------------------------------ sky keyframes */

type SkyKey = { top: string; bottom: string; sun: string; sunI: number; hs: string; hg: string; hI: number; dir: [number, number, number]; night: number }
const SKY: [number, SkyKey][] = [
  [0.0, { top: '#86c3ea', bottom: '#ffe0c8', sun: '#ffc79e', sunI: 2.1, hs: '#d6e9ff', hg: '#c7a98f', hI: 1.15, dir: [0.9, 0.38, 0.55], night: 0 }],
  [0.22, { top: '#5aaee6', bottom: '#cbeef8', sun: '#fff1dc', sunI: 2.6, hs: '#dbefff', hg: '#a6b98e', hI: 1.2, dir: [0.55, 0.85, 0.5], night: 0 }],
  [0.5, { top: '#54a6e0', bottom: '#d2eff6', sun: '#fff6ea', sunI: 2.7, hs: '#dff2ff', hg: '#a6b98e', hI: 1.2, dir: [-0.35, 0.9, 0.45], night: 0 }],
  [0.7, { top: '#7182c6', bottom: '#ffc28c', sun: '#ffb06e', sunI: 2.3, hs: '#ffdcc4', hg: '#9a7f8f', hI: 1.0, dir: [-0.85, 0.42, 0.38], night: 0.08 }],
  [0.86, { top: '#2e3977', bottom: '#e07a7c', sun: '#ff8d6c', sunI: 1.2, hs: '#958bc8', hg: '#5a4a6a', hI: 0.8, dir: [-0.95, 0.2, 0.28], night: 0.7 }],
  [1.0, { top: '#0a1331', bottom: '#26376e', sun: '#a5b8ff', sunI: 0.75, hs: '#5465a8', hg: '#1c2238', hI: 0.65, dir: [0.45, 0.75, -0.45], night: 1 }],
]

/* ------------------------------------------------------------------ camera stops */

type Stop = { pos: [number, number, number]; at: [number, number, number]; ox: number }
// ox: horizontal lens shift as a fraction of the width (+ = scene moves right, the card sits left)
const STOPS_DESK: Stop[] = [
  { pos: [7, 24, 48], at: [0.5, -1.2, 0.5], ox: 0.2 }, // top: whole island
  { pos: [-17, 10, 20], at: [0, 1.2, 0.5], ox: -0.2 }, // about: the plaza
  { pos: [2, 9.5, 23.5], at: [0.8, 1.1, 5.4], ox: 0.21 }, // skills: workshop lane
  { pos: [-15.5, 7, 14], at: [-4.6, 1.7, 2.4], ox: -0.21 }, // lifeos house
  { pos: [12.5, 12.5, 0.5], at: [3.6, 1.9, -3.6], ox: 0.21 }, // examace school
  { pos: [-15, 12.5, -17], at: [-2.6, 4.5, -5.2], ox: -0.21 }, // solar observatory
  { pos: [18, 7, 13.5], at: [5.2, 1.5, 2.4], ox: 0.21 }, // client gallery
  { pos: [-30, 26, 22], at: [0.5, -1.2, 0], ox: -0.2 }, // experience: high sunset view
  { pos: [26, 10.5, 15], at: [5.5, 1.2, -1.8], ox: 0.2 }, // contact: night, lighthouse
]

/* ------------------------------------------------------------------ island layout */

const PLOTS = [
  { key: 'lifeos', x: -4.5, z: 2.5, hw: 2, hd: 2, h: 1 },
  { key: 'examace', x: 3.5, z: -3.5, hw: 3, hd: 2, h: 1 },
  { key: 'solar', x: -2.5, z: -5.2, hw: 2, hd: 2, h: 3.5 },
  { key: 'client', x: 5, z: 2.4, hw: 2, hd: 2, h: 1 },
  { key: 'w0', x: -3.2, z: 5.6, hw: 1, hd: 1, h: 1 },
  { key: 'w1', x: -1.2, z: 6.2, hw: 1, hd: 1, h: 1 },
  { key: 'w2', x: 0.8, z: 6.4, hw: 1, hd: 1, h: 1 },
  { key: 'w3', x: 2.8, z: 6.2, hw: 1, hd: 1, h: 1 },
  { key: 'w4', x: 4.8, z: 5.6, hw: 1, hd: 1, h: 1 },
] as const
const PLAZA = { x: 0, z: 0.5 }
const ISLET = { x: 10.2, z: -3.2 }

export function createBlocksScene(canvas: HTMLCanvasElement, opts: BlocksOptions): BlocksScene | null {
  const small = window.innerWidth < 700
  const scene = new Scene()
  const disposables: { dispose: () => void }[] = []
  const keep = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x)

  const camera = new PerspectiveCamera(small ? 46 : 34, 1, 0.5, 260)
  const fog = new Fog('#cdeef8', 45, 120)
  scene.fog = fog

  /* ---------- lights */
  const hemi = new HemisphereLight('#dff2ff', '#a6b98e', 1.2)
  scene.add(hemi)
  const sun = new DirectionalLight('#fff', 2.5)
  sun.castShadow = !small
  sun.shadow.mapSize.set(2048, 2048)
  const sc = sun.shadow.camera
  sc.left = -16
  sc.right = 16
  sc.top = 16
  sc.bottom = -16
  sc.near = 1
  sc.far = 80
  sun.shadow.bias = -0.0006
  sun.shadow.normalBias = 0.02
  sun.shadow.radius = 3
  scene.add(sun, sun.target)

  let renderer: WebGLRenderer | null = null

  /* ---------- shared materials */
  const uNight = { value: 0 }
  const uTime = { value: 0 }
  const glowColor = new Color('#ffcf7a')

  const buildingMat = keep(new MeshLambertMaterial({ vertexColors: true, flatShading: true }))
  buildingMat.onBeforeCompile = (sh) => {
    sh.uniforms.uNight = uNight
    sh.uniforms.uGlow = { value: glowColor }
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float glow;\nvarying float vGlow;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = glow;')
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uNight;\nuniform vec3 uGlow;\nvarying float vGlow;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uGlow * vGlow * uNight * 1.6;')
  }

  /* ---------- island: one InstancedMesh of columns */
  const R = rand(7)
  const radiusAt = (a: number) => 8.6 + 1.0 * Math.sin(3 * a + 1.2) + 0.6 * Math.sin(5 * a + 2.1) + 0.35 * Math.sin(9 * a)
  type Cell = { x: number; z: number; h: number; color: string }
  const cells = new Map<string, Cell>()
  const GRASS = ['#7dc66a', '#74bd61', '#88cd73', '#7ac26a', '#82c96d']
  for (let x = -14; x <= 14; x++) {
    for (let z = -14; z <= 14; z++) {
      const d = Math.hypot(x, z)
      const a = Math.atan2(z, x)
      const r = radiusAt(a)
      const islet = Math.hypot(x - ISLET.x, z - ISLET.z)
      if (islet < 1.6) {
        cells.set(`${x},${z}`, { x, z, h: islet < 0.8 ? 1 : 0.5, color: islet < 0.8 ? '#a4a9b4' : '#e9d29b' })
        continue
      }
      if (islet < 2.6) {
        cells.set(`${x},${z}`, { x, z, h: -0.25, color: '#e6cf98' })
        continue
      }
      if (d < r) {
        const beach = d > r - 1.3
        let h = beach ? 0.5 : 1
        // the hill behind the plaza (observatory sits on top)
        const hd = Math.hypot(x + 2.5, z + 5.2)
        h += Math.max(0, Math.round(2.5 * clamp01(1.75 - hd / 2.2) * 2) / 2)
        // a softer rise in the north-east
        const hd2 = Math.hypot(x - 5, z + 7)
        if (!beach) h += Math.round(1.0 * clamp01(1.3 - hd2 / 2.4) * 2) / 2
        const color = beach ? (R() < 0.18 ? '#ecd5a0' : '#f2dca8') : GRASS[Math.floor(R() * GRASS.length)]
        cells.set(`${x},${z}`, { x, z, h, color })
      } else if (d < r + 1.6) {
        cells.set(`${x},${z}`, { x, z, h: -0.25, color: R() < 0.2 ? '#dcc690' : '#e6cf98' })
      }
    }
  }
  // flatten plots
  for (const p of PLOTS) {
    for (let x = Math.round(p.x - p.hw); x <= Math.round(p.x + p.hw); x++) {
      for (let z = Math.round(p.z - p.hd); z <= Math.round(p.z + p.hd); z++) {
        const c = cells.get(`${x},${z}`)
        if (c) {
          c.h = p.h
          if (c.color.startsWith('#f') || c.color.startsWith('#e')) c.color = GRASS[0]
        }
      }
    }
  }
  // paths from the plaza to every plot (L-shaped, sand-coloured)
  const PATH = '#ead9b0'
  const paint = (x: number, z: number) => {
    const c = cells.get(`${Math.round(x)},${Math.round(z)}`)
    if (c && c.h > 0) c.color = PATH
  }
  for (const p of PLOTS) {
    const tx = Math.round(p.x)
    const tz = Math.round(p.z + (p.key.startsWith('w') ? -1 : p.hd))
    for (let x = Math.min(PLAZA.x, tx); x <= Math.max(PLAZA.x, tx); x++) paint(x, Math.round(PLAZA.z))
    for (let z = Math.min(Math.round(PLAZA.z), tz); z <= Math.max(Math.round(PLAZA.z), tz); z++) paint(tx, z)
  }
  for (let x = -1; x <= 1; x++) for (let z = 0; z <= 2; z++) paint(x, z - 0.5)
  // dock path to the south-west beach
  for (let i = 0; i < 4; i++) paint(-5 - i * 0.6, 5.2 + i * 0.7)

  const BOTTOM = -0.8
  const list = [...cells.values()]
  const island = new InstancedMesh(keep(new BoxGeometry(1, 1, 1)), keep(new MeshLambertMaterial()), list.length)
  const islandMat = island.material as MeshLambertMaterial
  islandMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vH;\nvarying float vTop;\nvarying float vUp;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvH = (instanceMatrix * vec4(position, 1.0)).y;\nvTop = (instanceMatrix * vec4(0.0, 0.5, 0.0, 1.0)).y;\nvUp = normal.y;',
      )
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vH;\nvarying float vTop;\nvarying float vUp;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float side = 1.0 - step(0.5, vUp);
        float green = step(0.04, diffuseColor.g - (diffuseColor.r + diffuseColor.b) * 0.5);
        vec3 dirt = mix(vec3(0.34, 0.2, 0.11), vec3(0.52, 0.33, 0.18), clamp((vH + 0.6) / 4.0, 0.0, 1.0));
        vec3 under = mix(diffuseColor.rgb * 0.78, dirt, green);
        float lip = smoothstep(vTop - 0.2, vTop - 0.13, vH);
        vec3 sideCol = mix(under, diffuseColor.rgb * 0.9, lip);
        sideCol *= 0.72 + 0.28 * smoothstep(vTop - 1.6, vTop - 0.05, vH);
        diffuseColor.rgb = mix(diffuseColor.rgb, sideCol, side);`,
      )
  }
  const m4 = new Matrix4()
  const q = new Quaternion()
  const v = new Vector3()
  const s3 = new Vector3()
  list.forEach((c, i) => {
    const hgt = c.h - BOTTOM
    m4.compose(v.set(c.x, BOTTOM + hgt / 2, c.z), q.identity(), s3.set(1, hgt, 1))
    island.setMatrixAt(i, m4)
    island.setColorAt(i, tmpC.set(c.color))
  })
  island.castShadow = island.receiveShadow = true
  scene.add(island)

  /* ---------- rock underside + water slab */
  const rockGeo = new CylinderGeometry(14.3, 1.6, 9, 22, 6, false)
  {
    const pos = rockGeo.attributes.position
    const rr = rand(3)
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      if (y > 4.4) continue
      const k = 0.82 + rr() * 0.3
      pos.setX(i, pos.getX(i) * k)
      pos.setZ(i, pos.getZ(i) * k)
      pos.setY(i, y + (rr() - 0.5) * 0.5)
    }
    rockGeo.translate(0, -0.7 - 4.5, 0)
    rockGeo.computeVertexNormals()
    const n = pos.count
    const col = new Float32Array(n * 3)
    const a = new Color('#8a6b54')
    const b = new Color('#4e3d38')
    for (let i = 0; i < n; i++) {
      const t = clamp01((-pos.getY(i) - 0.7) / 9)
      tmpC.copy(a).lerp(b, t)
      col.set([tmpC.r, tmpC.g, tmpC.b], i * 3)
    }
    rockGeo.setAttribute('color', new BufferAttribute(col, 3))
  }
  const rock = new Mesh(keep(rockGeo), keep(new MeshLambertMaterial({ vertexColors: true, flatShading: true })))
  scene.add(rock)
  const rim = new Mesh(keep(new CylinderGeometry(14.3, 14.3, 0.75, 48, 1, true)), keep(new MeshLambertMaterial({ color: '#2f8fb8' })))
  rim.position.y = -0.32
  scene.add(rim)

  const waterGeo = new RingGeometry(0, 14.3, 64, 14)
  waterGeo.rotateX(-Math.PI / 2)
  const waterMat = keep(new MeshPhongMaterial({ color: '#3cb2dc', specular: '#ffffff', shininess: 70, flatShading: true, transparent: true, opacity: 0.84 }))
  waterMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float edge = smoothstep(14.0, 13.2, length(position.xz));
        transformed.y += edge * (0.07 * sin(position.x * 0.9 + uTime * 1.1) + 0.05 * sin(position.z * 1.3 - uTime * 0.8) + 0.03 * sin((position.x + position.z) * 2.1 + uTime * 1.7));`,
      )
  }
  const water = new Mesh(keep(waterGeo), waterMat)
  water.position.y = 0.02
  water.receiveShadow = true
  water.renderOrder = 2
  scene.add(water)

  /* ---------- buildings (one merged mesh each, so each can pop) */
  const parts: Record<string, BufferGeometry[]> = {}
  const halos: number[] = []
  const halo = (x: number, y: number, z: number) => halos.push(x, y, z)

  // LifeOS — a little house with its lights on
  parts.lifeos = [
    box(2.7, 0.18, 2.3, '#cfc5b1'),
    box(2.3, 1.3, 1.9, '#fff1d8', 0, 0.18),
    gable(2.75, 1.05, 2.3, '#ff6b4a', 0, 1.48),
    box(0.32, 0.8, 0.32, '#b4543c', 0.62, 1.6, -0.45),
    box(0.46, 0.78, 0.07, '#7a4a2e', 0, 0.18, 0.96),
    box(0.44, 0.44, 0.06, '#3b5470', -0.66, 0.66, 0.96, 1),
    box(0.44, 0.44, 0.06, '#3b5470', 0.66, 0.66, 0.96, 1),
    box(0.06, 0.44, 0.5, '#3b5470', 1.16, 0.66, 0, 1),
    box(0.06, 0.44, 0.5, '#3b5470', -1.16, 0.66, 0, 1),
    box(0.36, 0.36, 0.06, '#3b5470', 0, 1.7, 1.16, 1),
    box(0.9, 0.08, 0.5, '#e9dcc0', 0, 0.18, 1.25),
    box(0.08, 0.95, 0.08, '#2f3640', 1.45, 0.18, 1.25),
    box(0.2, 0.2, 0.2, '#fff2c4', 1.45, 1.1, 1.25, 1),
    box(0.5, 0.36, 0.5, '#6aa95a', -1.45, 0.18, 1.0),
  ]
  // ExamAce — a school with a clock tower
  {
    const p: BufferGeometry[] = [
      box(4.3, 0.18, 2.6, '#cfc5b1'),
      box(3.9, 1.5, 2.0, '#f3c55a', 0, 0.18),
      box(4.0, 0.14, 2.1, '#e3a93f', 0, 1.68),
      box(1.1, 2.4, 1.3, '#f7d685', 0, 0.18, 0.4),
      part(new ConeGeometry(0.92, 0.75, 4).rotateY(Math.PI / 4), '#55638a', 0, 2.58 + 0.37, 0.4),
      part(new CylinderGeometry(0.3, 0.3, 0.06, 14).rotateX(Math.PI / 2), '#fffdf6', 0, 2.05, 1.07),
      box(0.04, 0.2, 0.02, '#1d2433', 0, 2.03, 1.11),
      box(0.15, 0.04, 0.02, '#1d2433', 0.06, 2.03, 1.11),
      box(0.55, 0.72, 0.07, '#6d4a33', 0, 0.18, 1.06),
      box(0.05, 1.5, 0.05, '#e6e6e6', 1.7, 1.82, 0.7),
      box(0.55, 0.32, 0.03, '#ff6b4a', 1.98, 2.95, 0.7),
    ]
    for (const x of [-1.55, -0.95, 0.95, 1.55]) for (const y of [0.5, 1.08]) p.push(box(0.4, 0.36, 0.06, '#3b5470', x, y, 1.01, 1))
    p.push(box(0.34, 0.34, 0.06, '#3b5470', 0, 1.3, 1.06, 1))
    parts.examace = p
  }
  // Solar System — an observatory on the hill (the dome turns on its own)
  parts.solar = [
    cyl(1.25, 1.35, 1.45, 14, '#ece6da'),
    cyl(1.3, 1.3, 0.14, 14, '#7f8bab', 0, 1.42),
    box(0.5, 0.78, 0.07, '#4b5578', 0, 0, 1.3),
    box(0.28, 0.28, 0.06, '#3b5470', -0.75, 0.8, 1.04, 1),
    box(0.28, 0.28, 0.06, '#3b5470', 0.75, 0.8, 1.04, 1),
    box(0.06, 0.9, 0.06, '#2f3640', 1.85, 0, 0.9),
    part(new IcosahedronGeometry(0.2, 1), '#ffb547', 1.85, 1.05, 0.9, 1),
    part(new TorusGeometry(0.42, 0.025, 4, 24).rotateX(Math.PI / 2 - 0.3), '#2f3640', 1.85, 1.05, 0.9),
  ]
  const domeGeo = merge([
    part(new SphereGeometry(1.2, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), '#dde5ef', 0, 0, 0),
    box(0.42, 1.0, 1.05, '#26304c', 0, 0.1, 0.62),
    part(new CylinderGeometry(0.15, 0.19, 1.35, 8).rotateX(-0.95), '#3b4766', 0, 0.85, 0.75),
  ])
  // Client Portfolio — a white gallery with a sculpture outside
  parts.client = [
    box(3.4, 0.24, 2.7, '#e5e0d6'),
    box(3.0, 1.5, 2.2, '#fbfaf6', 0, 0.24),
    box(2.3, 1.05, 0.06, '#7fb2cf', 0, 0.42, 1.11, 0.75),
    box(0.16, 1.5, 0.16, '#fbfaf6', -1.3, 0.24, 1.22),
    box(0.16, 1.5, 0.16, '#fbfaf6', 1.3, 0.24, 1.22),
    box(3.5, 0.16, 2.7, '#2d3240', 0, 1.74),
    box(0.06, 0.4, 1.2, '#7fb2cf', 1.51, 0.75, 0, 0.75),
    box(0.4, 0.5, 0.4, '#e5e0d6', 1.95, 0, 1.55),
    part(new TorusGeometry(0.36, 0.12, 6, 14), '#ff6b4a', 1.95, 0.95, 1.55),
    box(0.7, 0.36, 0.06, '#ff6b4a', -0.9, 1.25, 1.13),
  ]
  // the five workshops
  SHOP_COLORS.forEach((roof, i) => {
    const p: BufferGeometry[] = [
      box(1.35, 0.14, 1.35, '#cfc5b1'),
      box(1.1, 0.86, 1.0, '#fff1d8', 0, 0.14),
      gable(1.42, 0.55, 1.25, roof, 0, 1.0),
      box(0.36, 0.56, 0.06, '#7a4a2e', -0.2, 0.14, 0.52),
      box(0.26, 0.24, 0.06, '#3b5470', 0.28, 0.48, 0.52, 1),
    ]
    if (i === 0) p.push(box(0.06, 0.9, 0.06, '#2f3640', 0.85, 0, 0.3), box(0.9, 0.6, 0.06, '#ffffff', 0.85, 0.9, 0.3, 0.3), box(0.9, 0.12, 0.07, roof, 0.85, 1.38, 0.3))
    if (i === 1) p.push(box(0.42, 1.5, 0.14, '#1d2433', 0.85, 0, 0.1), box(0.32, 1.1, 0.04, '#8ee6b5', 0.85, 0.28, 0.18, 0.9))
    if (i === 2) p.push(box(0.12, 0.3, 0.12, '#2f3640', 0, 1.42, 0), box(0.86, 0.56, 0.1, '#1d2433', 0, 1.7, 0), box(0.74, 0.44, 0.04, '#b9a6ff', 0, 1.76, 0.05, 0.9))
    if (i === 3)
      p.push(
        box(0.06, 1.2, 0.06, '#2f3640', 0.4, 1.0, -0.2),
        part(new CylinderGeometry(0.34, 0.06, 0.14, 12).rotateX(-0.6), '#e9e9ee', 0.4, 2.15, -0.1),
        part(new IcosahedronGeometry(0.14, 1), '#ffd27a', -0.6, 0.6, 0.55, 1),
      )
    if (i === 4) p.push(part(new IcosahedronGeometry(0.34, 0), roof, 0, 1.95, 0), box(0.08, 0.3, 0.08, '#2f3640', 0, 1.42, 0))
    parts[`w${i}`] = p
  })

  type Building = { key: string; mesh: Mesh; base: Vector3; hit: Box3; pop: number; vel: number; target: number; top: number }
  const buildings: Building[] = []
  const plotOf = (k: string) => PLOTS.find((p) => p.key === k)!
  let dome: Mesh | null = null
  SPOTS.forEach((s) => {
    const plot = plotOf(s.key)
    const g = keep(merge(parts[s.key]))
    const mesh = new Mesh(g, buildingMat)
    const y = plot.h
    mesh.position.set(plot.x, y, plot.z)
    mesh.castShadow = mesh.receiveShadow = true
    if (s.key === 'solar') {
      dome = new Mesh(keep(domeGeo), buildingMat)
      dome.position.y = 1.56
      dome.castShadow = true
      mesh.add(dome)
    }
    scene.add(mesh)
    const bb = g.boundingBox!
    const top = s.key === 'solar' ? 2.9 : bb.max.y
    buildings.push({
      key: s.key,
      mesh,
      base: mesh.position.clone(),
      hit: new Box3(bb.min.clone().add(mesh.position).addScalar(-0.15), new Vector3(bb.max.x, top, bb.max.z).add(mesh.position).addScalar(0.15)),
      pop: 0,
      vel: 0,
      target: 0,
      top,
    })
  })
  // halos for lamps and lit windows
  halo(-4.5 + 1.45, 1 + 1.2, 2.5 + 1.25)
  halo(-4.5, 1.7, 2.5 + 1.1)
  halo(3.5, 1.8, -3.5 + 1.2)
  halo(5, 1.0, 2.4 + 1.3)
  halo(-2.5 + 1.85, 3.5 + 1.05, -5.2 + 0.9)
  halo(2.8 - 0.6, 1.75, 6.2 + 0.55)

  /* ---------- decor: plaza, flag, dock, lighthouse, fences — one mesh */
  const decor: BufferGeometry[] = [
    box(0.07, 2.4, 0.07, '#e8e8e8', PLAZA.x + 0.9, 1, PLAZA.z - 0.6),
    box(0.8, 0.5, 0.04, '#ff6b4a', PLAZA.x + 1.33, 2.85, PLAZA.z - 0.6),
    cyl(0.55, 0.62, 0.24, 10, '#d9cfba', PLAZA.x - 0.3, 1, PLAZA.z + 0.3),
    cyl(0.32, 0.32, 0.12, 10, '#4fb3d9', PLAZA.x - 0.3, 1.24, PLAZA.z + 0.3),
    box(0.9, 0.12, 0.3, '#9a6a45', PLAZA.x - 1.6, 1.25, PLAZA.z + 1.5),
    box(0.08, 0.25, 0.25, '#5b4030', PLAZA.x - 1.95, 1, PLAZA.z + 1.5),
    box(0.08, 0.25, 0.25, '#5b4030', PLAZA.x - 1.25, 1, PLAZA.z + 1.5),
    box(0.08, 1.1, 0.08, '#2f3640', PLAZA.x + 1.5, 1, PLAZA.z + 1.6),
    box(0.2, 0.2, 0.2, '#fff2c4', PLAZA.x + 1.5, 2.1, PLAZA.z + 1.6, 1),
  ]
  halo(PLAZA.x + 1.5, 2.2, PLAZA.z + 1.6)
  // dock + posts
  for (let i = 0; i < 6; i++) {
    const t = i / 5
    const x = -6.4 - t * 2.6
    const z = 6.8 + t * 2.8
    decor.push(box(1.0, 0.1, 0.46, '#a5754c', x, 0.34, z))
  }
  decor.push(box(0.12, 0.8, 0.12, '#6b4a33', -9.1, -0.3, 9.4), box(0.12, 0.8, 0.12, '#6b4a33', -8.0, -0.3, 8.6))
  // lighthouse on the islet
  const lh = { x: ISLET.x, y: 1, z: ISLET.z }
  decor.push(
    cyl(0.5, 0.66, 2.8, 12, '#fbfaf6', lh.x, lh.y, lh.z),
    cyl(0.56, 0.6, 0.38, 12, '#e5533d', lh.x, lh.y + 0.7, lh.z),
    cyl(0.5, 0.53, 0.38, 12, '#e5533d', lh.x, lh.y + 1.7, lh.z),
    cyl(0.62, 0.62, 0.1, 12, '#2d3240', lh.x, lh.y + 2.8, lh.z),
    cyl(0.36, 0.36, 0.5, 8, '#fff1b8', lh.x, lh.y + 2.9, lh.z, 1.2),
    part(new ConeGeometry(0.5, 0.45, 10), '#e5533d', lh.x, lh.y + 3.62, lh.z),
  )
  halo(lh.x, lh.y + 3.15, lh.z)
  const decorMesh = new Mesh(keep(merge(decor)), buildingMat)
  decorMesh.castShadow = decorMesh.receiveShadow = true
  scene.add(decorMesh)

  // lighthouse beam (night only)
  const beamGeo = keep(new ConeGeometry(1.6, 9, 16, 1, true))
  beamGeo.translate(0, -4.5, 0)
  beamGeo.rotateZ(Math.PI / 2)
  const beamMat = keep(new MeshBasicMaterial({ color: '#fff1b8', transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, fog: false }))
  const beam = new Mesh(beamGeo, beamMat)
  beam.position.set(lh.x, lh.y + 3.15, lh.z)
  beam.visible = false
  scene.add(beam)

  /* ---------- trees (instanced) */
  const treeSpots: { x: number; z: number; y: number; s: number; round: boolean }[] = []
  const TR = rand(11)
  const nearPlot = (x: number, z: number) =>
    PLOTS.some((p) => Math.abs(x - p.x) < p.hw + 0.9 && Math.abs(z - p.z) < p.hd + 0.9) || Math.hypot(x - PLAZA.x, z - PLAZA.z) < 2.6
  const treeCount = small ? 22 : 38
  for (let tries = 0; tries < 900 && treeSpots.length < treeCount; tries++) {
    const x = Math.round((TR() - 0.5) * 20)
    const z = Math.round((TR() - 0.5) * 20)
    const c = cells.get(`${x},${z}`)
    if (!c || c.h < 1 || c.color === PATH || nearPlot(x, z) || treeSpots.some((t) => Math.hypot(t.x - x, t.z - z) < 1)) continue
    treeSpots.push({ x: x + (TR() - 0.5) * 0.3, z: z + (TR() - 0.5) * 0.3, y: c.h, s: 0.75 + TR() * 0.5, round: TR() < 0.45 })
  }
  const pines = treeSpots.filter((t) => !t.round)
  const rounds = treeSpots.filter((t) => t.round)
  const trunkMesh = new InstancedMesh(keep(new BoxGeometry(0.18, 0.6, 0.18).translate(0, 0.3, 0)), keep(new MeshLambertMaterial({ color: '#7a5236' })), treeSpots.length)
  const pineMesh = new InstancedMesh(keep(new ConeGeometry(0.62, 1.5, 6).translate(0, 1.15, 0)), keep(new MeshLambertMaterial({ flatShading: true })), pines.length)
  const roundMesh = new InstancedMesh(keep(new IcosahedronGeometry(0.62, 0).translate(0, 1.0, 0)), keep(new MeshLambertMaterial({ flatShading: true })), rounds.length)
  const PINE = ['#3f9a5a', '#358c52', '#4aa864']
  const ROUND = ['#5fb85a', '#6cc066', '#e6a24a', '#57ad55']
  treeSpots.forEach((t, i) => {
    m4.compose(v.set(t.x, t.y, t.z), q.setFromAxisAngle(v.set(0, 1, 0), TR() * 6), s3.setScalar(t.s))
    m4.setPosition(t.x, t.y, t.z)
    trunkMesh.setMatrixAt(i, m4)
  })
  pines.forEach((t, i) => {
    m4.compose(v.set(t.x, t.y, t.z), q.setFromAxisAngle(new Vector3(0, 1, 0), TR() * 6), s3.set(t.s, t.s * (0.9 + TR() * 0.4), t.s))
    pineMesh.setMatrixAt(i, m4)
    pineMesh.setColorAt(i, tmpC.set(PINE[i % PINE.length]))
  })
  rounds.forEach((t, i) => {
    m4.compose(v.set(t.x, t.y, t.z), q.setFromAxisAngle(new Vector3(0, 1, 0), TR() * 6), s3.setScalar(t.s))
    roundMesh.setMatrixAt(i, m4)
    roundMesh.setColorAt(i, tmpC.set(ROUND[i % ROUND.length]))
  })
  for (const m of [trunkMesh, pineMesh, roundMesh]) {
    m.castShadow = true
    m.receiveShadow = true
    scene.add(m)
  }

  /* ---------- clouds, birds, boat, stars, halos */
  const CL = rand(5)
  const cloudCount = small ? 6 : 11
  const cloudBits: { cx: number; cy: number; cz: number; ox: number; oy: number; oz: number; s: number; speed: number }[] = []
  for (let c = 0; c < cloudCount; c++) {
    const a = (c / cloudCount) * Math.PI * 2 + CL()
    // most clouds drift below the island (it floats above them), a few sit high and far
    const high = c % 3 === 0
    const r = high ? 30 + CL() * 8 : 16 + CL() * 9
    const cx = Math.cos(a) * r
    const cz = Math.sin(a) * r
    const cy = high ? 9 + CL() * 4 : -7 + CL() * 3.5
    const speed = 0.012 + CL() * 0.01
    const n = 3 + Math.floor(CL() * 3)
    for (let b = 0; b < n; b++) cloudBits.push({ cx, cy, cz, ox: (b - n / 2) * 0.9 + CL() * 0.3, oy: CL() * 0.5, oz: (CL() - 0.5) * 0.8, s: 0.55 + CL() * 0.55, speed })
  }
  const clouds = new InstancedMesh(keep(new IcosahedronGeometry(1, 0)), keep(new MeshLambertMaterial({ color: '#ffffff', flatShading: true, emissive: '#ffffff', emissiveIntensity: 0.25 })), cloudBits.length)
  scene.add(clouds)

  const birdGeo = new BufferGeometry()
  birdGeo.setAttribute('position', new Float32BufferAttribute([0, 0, 0.18, -0.5, 0.12, -0.1, 0, 0, -0.08, 0, 0, 0.18, 0.5, 0.12, -0.1, 0, 0, -0.08], 3))
  birdGeo.computeVertexNormals()
  const birdCount = small ? 4 : 7
  const birds = new InstancedMesh(keep(birdGeo), keep(new MeshBasicMaterial({ color: '#2b3245', side: DoubleSide })), birdCount)
  scene.add(birds)

  const boat = new Mesh(
    keep(
      merge([
        part(new CylinderGeometry(0.5, 0.32, 0.3, 4).rotateY(Math.PI / 4).scale(1, 1, 2.2), '#c2573c', 0, 0.15, 0),
        box(0.62, 0.06, 1.2, '#e9d3a7', 0, 0.3, 0),
        box(0.05, 1.3, 0.05, '#5b4030', 0, 0.3, 0.05),
        part(
          (() => {
            const s = new Shape()
            s.moveTo(0, 0)
            s.lineTo(0, 1.1)
            s.lineTo(0.75, 0)
            s.closePath()
            return new ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false }).rotateY(-Math.PI / 2)
          })(),
          '#fffaf0',
          0.02,
          0.45,
          0.1,
        ),
      ]),
    ),
    buildingMat,
  )
  boat.castShadow = true
  scene.add(boat)

  const skyGroup = new Group()
  scene.add(skyGroup)
  const skyMat = keep(
    new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { uTop: { value: new Color() }, uBottom: { value: new Color() }, uSun: { value: new Vector3(0, 1, 0) }, uSunCol: { value: new Color() } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 uTop; uniform vec3 uBottom; uniform vec3 uSun; uniform vec3 uSunCol; varying vec3 vDir;
        void main(){ vec3 d = normalize(vDir); float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 c = mix(uBottom, uTop, smoothstep(0.5, 0.88, h));
          c = mix(c, mix(uBottom, uTop, 0.55), smoothstep(0.5, 0.15, h));
          float s = max(dot(d, normalize(uSun)), 0.0);
          c += uSunCol * (pow(s, 64.0) * 0.9 + pow(s, 6.0) * 0.18);
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
    }),
  )
  const sky = new Mesh(keep(new SphereGeometry(120, 32, 16)), skyMat)
  sky.renderOrder = -1
  skyGroup.add(sky)
  const starPos: number[] = []
  const SR = rand(9)
  for (let i = 0; i < (small ? 160 : 320); i++) {
    const a = SR() * Math.PI * 2
    const y = 0.15 + SR() * 0.85
    const r = Math.sqrt(1 - y * y)
    starPos.push(Math.cos(a) * r * 110, y * 110, Math.sin(a) * r * 110)
  }
  const starGeo = keep(new BufferGeometry())
  starGeo.setAttribute('position', new Float32BufferAttribute(starPos, 3))
  const starMat = keep(new PointsMaterial({ color: '#ffffff', size: small ? 1.6 : 2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }))
  const stars = new Points(starGeo, starMat)
  skyGroup.add(stars)

  const haloTex = keep(glowTexture())
  const haloGeo = keep(new BufferGeometry())
  haloGeo.setAttribute('position', new Float32BufferAttribute(halos, 3))
  const haloMat = keep(new PointsMaterial({ map: haloTex, size: 2.4, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, fog: false }))
  const haloPts = new Points(haloGeo, haloMat)
  scene.add(haloPts)

  /* ---------- camera spline */
  const stops = STOPS_DESK.map((s, i) => {
    if (!small) return s
    // phones: step back so the landmark fits above the card
    const p = new Vector3(...s.pos)
    const a = new Vector3(...s.at)
    p.sub(a).multiplyScalar(i === 0 ? 1.05 : i === 7 ? 1.2 : 1.5).add(a)
    return { pos: p.toArray() as [number, number, number], at: s.at, ox: 0 }
  })
  const posCurve = new CatmullRomCurve3(
    stops.map((s) => new Vector3(...s.pos)),
    false,
    'centripetal',
  )
  const atCurve = new CatmullRomCurve3(
    stops.map((s) => new Vector3(...s.at)),
    false,
    'centripetal',
  )
  const last = stops.length - 1

  /* ---------- per-frame state */
  const keyA = new Color()
  const keyB = new Color()
  const sunDir = new Vector3()
  const dA = new Vector3()
  const dB = new Vector3()
  const lerpKey = (field: 'top' | 'bottom' | 'sun' | 'hs' | 'hg', i: number, t: number, out: Color) =>
    out.copy(keyA.set(SKY[i][1][field])).lerp(keyB.set(SKY[i + 1][1][field]), t)
  const applyTime = (tod: number) => {
    let i = 0
    while (i < SKY.length - 2 && tod > SKY[i + 1][0]) i++
    const t = smooth(0, 1, (tod - SKY[i][0]) / (SKY[i + 1][0] - SKY[i][0]))
    const A = SKY[i][1]
    const B = SKY[i + 1][1]
    lerpKey('top', i, t, skyMat.uniforms.uTop.value)
    lerpKey('bottom', i, t, skyMat.uniforms.uBottom.value)
    lerpKey('sun', i, t, sun.color)
    skyMat.uniforms.uSunCol.value.copy(sun.color).multiplyScalar(1 - (A.night + (B.night - A.night) * t))
    lerpKey('hs', i, t, hemi.color)
    lerpKey('hg', i, t, hemi.groundColor)
    fog.color.copy(skyMat.uniforms.uBottom.value)
    sun.intensity = A.sunI + (B.sunI - A.sunI) * t
    hemi.intensity = A.hI + (B.hI - A.hI) * t
    sunDir.copy(dA.set(...A.dir)).lerp(dB.set(...B.dir), t).normalize()
    skyMat.uniforms.uSun.value.copy(sunDir)
    sun.position.copy(sunDir).multiplyScalar(30)
    const night = A.night + (B.night - A.night) * t
    uNight.value = night
    starMat.opacity = smooth(0.5, 1, night)
    haloMat.opacity = smooth(0.35, 0.9, night) * 0.9
    beamMat.opacity = smooth(0.6, 1, night) * 0.22
    beam.visible = night > 0.6
    if (sun.castShadow && renderer) renderer.shadowMap.needsUpdate = true
    opts.onTime?.(tod)
  }

  /* ---------- pointer + picking */
  const ray = new Raycaster()
  const ndc = new Vector2()
  let pointerDirty = false
  let hasPointer = false
  let hovered: string | null = null
  let highlighted: string | null = null
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    if (e.target !== canvas) {
      if (hovered && hasPointer) setHover(null)
      hasPointer = false
      return
    }
    const r = canvas.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    hasPointer = true
    pointerDirty = true
    if (!isRunning) stageRef?.invalidate()
  }
  const pickAt = () => {
    ray.setFromCamera(ndc, camera)
    let best: string | null = null
    let bestD = Infinity
    const hit = new Vector3()
    for (const b of buildings) {
      if (ray.ray.intersectBox(b.hit, hit)) {
        const d = hit.distanceTo(ray.ray.origin)
        if (d < bestD) {
          bestD = d
          best = b.key
        }
      }
    }
    return best
  }
  const setHover = (k: string | null) => {
    if (k === hovered) return
    hovered = k
    canvas.style.cursor = k ? 'pointer' : ''
    opts.onHover(k)
  }
  const onClick = (e: MouseEvent) => {
    const r = canvas.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    const k = pickAt()
    if (k) {
      const b = buildings.find((x) => x.key === k)!
      b.vel += 6
      opts.onPick(k)
    }
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  canvas.addEventListener('click', onClick)

  /* ---------- frame */
  const labelPos = new Vector3()
  const camPos = new Vector3()
  const camAt = new Vector3()
  let isRunning = false
  let stageRef: { invalidate: () => void } | null = null
  let lastU = -1
  let lastActive = -1
  let wasAnimating = true
  const frame = (dt: number, time: number, w: number, h: number, still: boolean) => {
    uTime.value = time
    const u = Math.max(0, Math.min(last, opts.progress()))
    const t = u / last
    posCurve.getPoint(t, camPos)
    atCurve.getPoint(t, camAt)
    camera.position.copy(camPos)
    camera.lookAt(camAt)
    // lens shift so the landmark sits beside its card
    const i0 = Math.floor(u)
    const i1 = Math.min(last, i0 + 1)
    const f = u - i0
    const ox = stops[i0].ox + (stops[i1].ox - stops[i0].ox) * f
    const oy = small ? 0.17 : 0
    camera.setViewOffset(w, h, -ox * w, oy * h, w, h)
    skyGroup.position.copy(camera.position)

    if (Math.abs(u - lastU) > 1e-4) {
      applyTime(t)
      lastU = u
    }
    const active = Math.round(u)
    if (active !== lastActive) {
      lastActive = active
      // the landmark you arrive at does a little hop
      for (const b of buildings) if (SPOTS.find((s) => s.key === b.key)?.stop === active && b.key[0] !== 'w') b.vel += 5
    }

    // pointer hover
    if (pointerDirty) {
      pointerDirty = false
      setHover(pickAt())
    }

    // springs: hovered / highlighted buildings pop up
    let animating = false
    for (const b of buildings) {
      b.target = b.key === hovered || b.key === highlighted ? 1 : 0
      if (still) {
        b.pop = b.target
        b.vel = 0
      } else {
        const acc = 170 * (b.target - b.pop) - 13 * b.vel
        b.vel += acc * dt
        b.pop += b.vel * dt
      }
      if (Math.abs(b.vel) > 0.002 || Math.abs(b.target - b.pop) > 0.002) animating = true
      const p = b.pop
      b.mesh.position.y = b.base.y + p * 0.35
      b.mesh.scale.set(1 + p * 0.04, 1 + p * 0.1, 1 + p * 0.04)
    }
    if (dome && !still) (dome as Mesh).rotation.y = time * 0.12
    if ((animating || wasAnimating) && sun.castShadow && renderer) renderer.shadowMap.needsUpdate = true
    wasAnimating = animating

    // ambient life
    if (!still) {
      const night = uNight.value
      let k = 0
      for (const c of cloudBits) {
        const a = time * c.speed
        const ca = Math.cos(a)
        const sa = Math.sin(a)
        const x = c.cx * ca - c.cz * sa
        const z = c.cx * sa + c.cz * ca
        m4.compose(v.set(x + c.ox, c.cy + c.oy, z + c.oz), q.identity(), s3.set(c.s * 1.3, c.s * 0.75, c.s))
        clouds.setMatrixAt(k++, m4)
      }
      clouds.instanceMatrix.needsUpdate = true
      for (let b = 0; b < birdCount; b++) {
        const a = time * 0.22 + b * 0.5
        const r = 9 + (b % 3) * 1.6
        const flap = Math.sin(time * 9 + b * 1.7)
        m4.compose(
          v.set(Math.cos(a) * r, 6.5 + (b % 2) * 0.9 + Math.sin(time * 0.7 + b) * 0.3, Math.sin(a) * r - 1),
          q.setFromAxisAngle(dA.set(0, 1, 0), -a),
          s3.set(night > 0.6 ? 0 : 0.6, (night > 0.6 ? 0 : 0.6) * (0.4 + flap * 0.6), night > 0.6 ? 0 : 0.6),
        )
        birds.setMatrixAt(b, m4)
      }
      birds.instanceMatrix.needsUpdate = true
      const ba = time * 0.05 + 2.2
      boat.position.set(Math.cos(ba) * 11.6, 0.05 + Math.sin(time * 1.6) * 0.05, Math.sin(ba) * 11.6)
      boat.rotation.set(Math.sin(time * 1.3) * 0.05, -ba, Math.sin(time * 1.1) * 0.06)
      if (beam.visible) beam.rotation.y = time * 0.9
    } else if (time === 0) {
      // reduced motion: compose a still frame once
      let k = 0
      for (const c of cloudBits) {
        m4.compose(v.set(c.cx + c.ox, c.cy + c.oy, c.cz + c.oz), q.identity(), s3.set(c.s * 1.3, c.s * 0.75, c.s))
        clouds.setMatrixAt(k++, m4)
      }
      clouds.instanceMatrix.needsUpdate = true
      for (let b = 0; b < birdCount; b++) {
        m4.makeScale(0, 0, 0)
        birds.setMatrixAt(b, m4)
      }
      birds.instanceMatrix.needsUpdate = true
      boat.position.set(-10.5, 0.05, 6)
      boat.rotation.y = 0.9
    }

    if (!renderer) return
    renderer.render(scene, camera)

    // DOM labels follow their buildings (writes only)
    for (let i = 0; i < buildings.length; i++) {
      const el = opts.labels[i]
      if (!el) continue
      const b = buildings[i]
      labelPos.set(b.mesh.position.x, b.mesh.position.y + b.top + 0.55, b.mesh.position.z).project(camera)
      const behind = labelPos.z > 1
      el.style.transform = `translate3d(${(((labelPos.x + 1) / 2) * w).toFixed(1)}px, ${(((1 - labelPos.y) / 2) * h).toFixed(1)}px, 0)`
      el.dataset.behind = behind ? '1' : ''
    }
  }

  const stage = createStage(canvas, (f) => frame(f.dt, f.time, f.width, f.height, f.still), {
    onResize: (w, h) => {
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    },
    renderer: { antialias: true, alpha: false },
  })
  if (!stage) {
    window.removeEventListener('pointermove', onMove)
    canvas.removeEventListener('click', onClick)
    disposables.forEach((d) => d.dispose())
    return null
  }
  stageRef = stage
  renderer = stage.renderer
  renderer.shadowMap.enabled = sun.castShadow
  lastU = -1
  renderer.shadowMap.type = PCFSoftShadowMap
  renderer.shadowMap.autoUpdate = false
  renderer.shadowMap.needsUpdate = true
  // createStage already drew one frame before shadows were configured: draw again
  stage.invalidate()
  isRunning = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return {
    highlight: (k) => {
      highlighted = k
      if (!isRunning) stage.invalidate()
    },
    invalidate: () => stage.invalidate(),
    dispose: () => {
      window.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('click', onClick)
      stage.dispose()
      disposables.forEach((d) => d.dispose())
      scene.traverse((o) => {
        const m = o as Mesh
        if (m.isMesh || (o as Points).isPoints) {
          ;(m.geometry as BufferGeometry | undefined)?.dispose()
          const mat = m.material as Material | Material[]
          if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
          else mat?.dispose()
        }
      })
      sun.shadow.dispose()
    },
  }
}
