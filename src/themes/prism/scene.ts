import {
  CanvasTexture,
  Color,
  CustomBlending,
  DoubleSide,
  ExtrudeGeometry,
  LatheGeometry,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NeutralToneMapping,
  OneMinusSrcAlphaFactor,
  SrcAlphaFactor,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  Vector2,
  VideoTexture,
  type BufferGeometry,
  type Texture,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { createStage, type StageFrame } from '../../shared/stage'

/**
 * Prism: a few pieces of real (transmissive) glass float over the page.
 * Key words and project screenshots are drawn into the 3D scene as planes that sit exactly
 * where their DOM boxes are, so the glass bends real content. Everything is a pure function
 * of scroll position, so the scene never trails behind the page.
 */

export type PlateSpec = { el: HTMLElement; kind: 'word' | 'image' | 'canvas' | 'video'; src?: string; canvas?: HTMLCanvasElement; video?: HTMLVideoElement }

export type PrismScene = {
  /** Section anchors (the element whose top defines each arrangement), hero first. */
  setAnchors: (els: HTMLElement[], work: HTMLElement | null, workImages: HTMLElement[]) => void
  setPlates: (plates: PlateSpec[]) => void
  /** Re-measure DOM boxes (after resize, fonts, layout change). */
  measure: () => void
  dispose: () => void
}

// [x, y] in viewport units (-1..1), z in world, scale, and base rotation (x, y, z)
type Pose = [number, number, number, number, number, number, number]
// objects: 0 lens, 1 torus, 2 prism, 3 sphere
const DESK: Pose[][] = [
  // hero — glass just past the name (it must stay readable)
  [
    [0.56, -0.26, 1.6, 1.0, 0.25, -0.35, 0],
    [0.38, 0.4, 1.3, 0.95, 0.5, 0.5, 0.2],
    [0.66, 0.42, 1.0, 0.95, 0.3, 0.6, -0.4],
    [0.72, -0.5, 2.0, 0.62, 0, 0, 0],
  ],
  // about — gathered to the right of the statement
  [
    [0.56, 0.28, 1.6, 0.95, 0.5, 0.6, 0.2],
    [0.84, -0.18, 1.2, 0.9, 1.1, -0.3, 0.5],
    [0.38, -0.55, 1.0, 0.8, 0.2, 1.4, 0.8],
    [0.7, 0.62, 2.2, 0.45, 0, 0, 0],
  ],
  // skills — a loose line across the heading
  [
    [-0.32, 0.38, 1.6, 0.85, 0.3, 0.9, 0.1],
    [0.12, 0.46, 1.2, 0.85, 1.4, 0.4, 0.3],
    [0.5, 0.36, 1.1, 0.85, 0.6, 1.0, 0.9],
    [0.8, 0.5, 2.0, 0.5, 0, 0, 0],
  ],
  // work — the lens is driven by the screenshots; the rest step aside
  [
    [0, 0, 1.6, 1, 0, 0, 0],
    [0.94, 0.7, 0.8, 0.6, 1.2, 0.9, 0.3],
    [-0.9, -0.74, 0.8, 0.5, 0.4, 2.0, 0.8],
    [0.9, -0.72, 2.2, 0.34, 0, 0, 0],
  ],
  // experience — along the left edge
  [
    [-0.7, 0.42, 1.6, 0.9, 0.35, -0.6, 0],
    [-0.25, 0.5, 1.2, 0.8, 0.8, 0.3, 0.4],
    [0.82, 0.3, 1.0, 0.8, 0.2, 2.6, -0.5],
    [-0.86, -0.5, 2.0, 0.5, 0, 0, 0],
  ],
  // contact — to the right of the heading, never over it
  [
    [0.34, 0.4, 1.7, 0.78, 0.2, 0.3, 0],
    [0.68, 0.16, 1.3, 0.95, 0.7, 0.2, 0.3],
    [0.5, 0.72, 1.0, 0.55, 0.3, 1.2, -0.3],
    [0.74, -0.12, 2.1, 0.6, 0, 0, 0],
  ],
]
const PHONE: Pose[][] = [
  [
    [0.5, 0.26, 1.6, 0.5, 0.25, -0.35, 0],
    [0.52, 0.62, 1.3, 0.5, 0.5, 0.5, 0.2],
    [-0.72, -0.04, 1.0, 0.4, 0.3, 0.6, -0.4],
    [-0.55, -0.5, 2.0, 0.3, 0, 0, 0],
  ],
  [
    [0.62, 0.42, 1.6, 0.48, 0.5, 0.6, 0.2],
    [-0.72, 0.72, 1.2, 0.42, 1.1, -0.3, 0.5],
    [0.78, -0.75, 1.0, 0.4, 0.2, 1.4, 0.8],
    [-0.75, -0.72, 2.2, 0.28, 0, 0, 0],
  ],
  [
    [-0.55, 0.52, 1.6, 0.45, 0.3, 0.9, 0.1],
    [0.2, 0.6, 1.2, 0.42, 1.4, 0.4, 0.3],
    [0.75, 0.36, 1.1, 0.38, 0.6, 1.0, 0.9],
    [0.8, -0.72, 2.0, 0.28, 0, 0, 0],
  ],
  [
    [0, 0, 1.6, 1, 0, 0, 0],
    [1.08, 0.8, 0.8, 0.36, 1.2, 0.9, 0.3],
    [-1.08, -0.8, 0.8, 0.36, 0.4, 2.0, 0.8],
    [1.02, -0.86, 2.2, 0.22, 0, 0, 0],
  ],
  [
    [0.68, 0.52, 1.6, 0.42, 0.35, -0.6, 0],
    [0.05, 0.62, 1.2, 0.38, 0.8, 0.3, 0.4],
    [-0.75, 0.5, 1.0, 0.34, 0.2, 2.6, -0.5],
    [0.8, -0.65, 2.0, 0.26, 0, 0, 0],
  ],
  [
    [0.55, 0.42, 1.7, 0.5, 0.2, 0.3, 0],
    [-0.62, 0.66, 1.3, 0.44, 0.7, 0.2, 0.3],
    [0.72, -0.1, 1.0, 0.36, 0.3, 1.2, -0.3],
    [-0.6, -0.55, 2.1, 0.3, 0, 0, 0],
  ],
]
// how fast each object turns per screen of scroll (scrubbed)
const SPIN = [
  [0.0, 0.5, 0.15],
  [0.35, 0.55, 0.1],
  [0.2, 0.7, 0.25],
  [0, 0.4, 0],
]

const CAM_Z = 10
const FOV = 30
const TAN = Math.tan(((FOV / 2) * Math.PI) / 180)

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function lensGeometry(): BufferGeometry {
  // biconvex lens with a rounded rim, turned on a lathe
  const pts: Vector2[] = []
  const R = 0.62
  const T = 0.2
  const n = 22
  for (let i = 0; i <= n; i++) {
    const r = (i / n) * R
    pts.push(new Vector2(r, -T * Math.sqrt(1 - (r / R) ** 2) - 0.035))
  }
  for (let i = 1; i < 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI
    pts.push(new Vector2(R + Math.cos(a) * 0.035, Math.sin(a) * 0.035))
  }
  for (let i = n; i >= 0; i--) {
    const r = (i / n) * R
    pts.push(new Vector2(r, T * Math.sqrt(1 - (r / R) ** 2) + 0.035))
  }
  const g = new LatheGeometry(pts, 72)
  g.rotateX(Math.PI / 2)
  return g
}

function prismGeometry(): BufferGeometry {
  const s = new Shape()
  const r = 0.5
  for (let i = 0; i < 3; i++) {
    const a = Math.PI / 2 + (i / 3) * Math.PI * 2
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  s.closePath()
  const g = new ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 5, curveSegments: 1 })
  g.center()
  g.computeVertexNormals()
  return g
}

const BG_FRAG = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uC[4];
uniform vec3 uP[4];
uniform float uAspect;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  vec3 col = uBase;
  for (int i = 0; i < 4; i++) {
    vec2 d = p - uP[i].xy;
    d.x *= uAspect;
    float f = exp(-dot(d, d) / (uP[i].z * uP[i].z));
    col = mix(col, uC[i], f * 0.85);
  }
  // a soft top light and a faint floor shade keep it from looking flat
  col += vec3(0.02) * smoothstep(-0.2, 1.0, p.y);
  col -= vec3(0.025) * smoothstep(0.2, -1.2, p.y);
  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`
const BG_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

/**
 * Plates must stay in the *opaque* list, or the transmission pass would not see them.
 * Custom blending (unlike NormalBlending) is honoured for non-transparent materials,
 * so they blend smoothly over the background while still being refracted.
 */
const BLEND = { transparent: false, blending: CustomBlending, blendSrc: SrcAlphaFactor, blendDst: OneMinusSrcAlphaFactor, depthWrite: false } as const

// rounded-corner image plate
const IMG_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform vec2 uSize;
uniform float uRadius;
uniform float uCover;
varying vec2 vUv;
void main() {
  vec2 q = abs(vUv - 0.5) * uSize - (uSize * 0.5 - uRadius);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  float a = clamp(0.5 - d, 0.0, 1.0);
  vec2 uv = vUv;
  uv.y = 0.5 + (uv.y - 0.5) * uCover;
  vec4 c = texture2D(uMap, uv);
  gl_FragColor = vec4(c.rgb, a);
  #include <colorspace_fragment>
}`

type Plate = {
  spec: PlateSpec
  mesh: Mesh
  tex: Texture | null
  top: number
  left: number
  w: number
  h: number
  key: string
}

export function createPrismScene(canvas: HTMLCanvasElement, opts: { onReady?: () => void } = {}): PrismScene | null {
  const small = window.innerWidth < 700
  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 60)
  camera.position.z = CAM_Z

  let vw = window.innerWidth
  let vh = window.innerHeight
  let anchors: HTMLElement[] = []
  let anchorY: number[] = [0]
  let workEl: HTMLElement | null = null
  let workRange: [number, number] = [Infinity, Infinity]
  let imageEls: HTMLElement[] = []
  let imageBoxes: { cx: number; cy: number; w: number; h: number }[] = []
  let plates: Plate[] = []
  let intro = 0
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }

  let ready = false
  const stage = createStage(canvas, (f) => ready && frame(f), {
    onResize: (w, h) => {
      if (!ready) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      vw = window.innerWidth
      vh = window.innerHeight
      sizeBackground()
      measure()
    },
    renderer: { antialias: true, alpha: false },
    maxDpr: small ? 1 : 1.5,
  })
  if (!stage) return null
  const { renderer } = stage
  renderer.toneMapping = NeutralToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.setClearColor('#eef0f4')

  const pmrem = new PMREMGenerator(renderer)
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.03)
  scene.environment = envRT.texture
  scene.environmentIntensity = 1.0
  pmrem.dispose()

  // background: soft colour pools that follow the glass, so refraction always has colour to bend
  const bgMat = new ShaderMaterial({
    vertexShader: BG_VERT,
    fragmentShader: BG_FRAG,
    uniforms: {
      uBase: { value: new Color('#eef0f4') },
      uC: { value: [new Color('#a9bbff'), new Color('#ffd4c2'), new Color('#cfc2ff'), new Color('#bfeedd')] },
      uP: { value: [0, 0, 0, 0].map(() => new Color(0, 0, 0.5)) },
      uAspect: { value: 1 },
    },
    depthWrite: false,
  })
  // Color is used as plain vec3 storage: r, g = centre in viewport units, b = radius
  const bgP = bgMat.uniforms.uP.value as Color[]
  const bg = new Mesh(new PlaneGeometry(1, 1), bgMat)
  bg.position.z = -6
  bg.renderOrder = -10
  scene.add(bg)
  const sizeBackground = () => {
    const hh = (CAM_Z - bg.position.z) * TAN
    bg.scale.set(hh * 2 * camera.aspect * 1.02, hh * 2 * 1.02, 1)
    bgMat.uniforms.uAspect.value = camera.aspect
  }
  sizeBackground()

  // glass
  const glassBase = {
    transmission: 1,
    roughness: 0.03,
    metalness: 0,
    ior: 1.52,
    thickness: 1.1,
    specularIntensity: 1,
    envMapIntensity: 1.1,
    dispersion: small ? 0 : 0.45,
    side: DoubleSide,
  }
  const mats = [
    new MeshPhysicalMaterial({ ...glassBase, thickness: 1.6, color: '#ffffff' }),
    new MeshPhysicalMaterial({ ...glassBase, thickness: 0.9, attenuationColor: new Color('#c9d6ff'), attenuationDistance: 1.6 }),
    new MeshPhysicalMaterial({ ...glassBase, thickness: 1.3, ior: 1.6, dispersion: small ? 0 : 0.9 }),
    new MeshPhysicalMaterial({ ...glassBase, thickness: 1.4, attenuationColor: new Color('#ffe0d0'), attenuationDistance: 2.2 }),
  ]
  const geos = [lensGeometry(), new TorusGeometry(0.44, 0.17, small ? 28 : 40, small ? 72 : 120), prismGeometry(), new SphereGeometry(0.42, small ? 40 : 64, small ? 24 : 40)]
  const glass = geos.map((g, i) => {
    const m = new Mesh(g, mats[i])
    m.renderOrder = 5
    scene.add(m)
    return m
  })

  // plates
  const loader = new TextureLoader()
  const plateGeo = new PlaneGeometry(1, 1)

  function drawWord(el: HTMLElement, w: number, h: number): CanvasTexture {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const c = document.createElement('canvas')
    c.width = Math.max(2, Math.ceil(w * dpr))
    c.height = Math.max(2, Math.ceil(h * dpr))
    const ctx = c.getContext('2d')!
    const cs = getComputedStyle(el)
    ctx.scale(dpr, dpr)
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    const ls = parseFloat(cs.letterSpacing)
    if ('letterSpacing' in ctx && !Number.isNaN(ls)) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${ls}px`
    ctx.fillStyle = el.dataset.ink || cs.getPropertyValue('--ink').trim() || '#121318'
    ctx.textBaseline = 'alphabetic'
    const m = ctx.measureText(el.textContent || '')
    const asc = m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent
    const desc = m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent
    const lh = parseFloat(cs.lineHeight) || h
    const y = (lh - (asc + desc)) / 2 + asc
    const pad = parseFloat(cs.paddingLeft) || 0
    ctx.fillText(el.textContent || '', pad, y)
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.minFilter = LinearFilter
    t.generateMipmaps = false
    return t
  }

  function buildPlate(spec: PlateSpec): Plate {
    let mesh: Mesh
    if (spec.kind === 'word') {
      mesh = new Mesh(plateGeo, new MeshBasicMaterial({ ...BLEND, toneMapped: false }))
    } else {
      mesh = new Mesh(
        plateGeo,
        new ShaderMaterial({
          vertexShader: BG_VERT,
          fragmentShader: IMG_FRAG,
          uniforms: { uMap: { value: null }, uSize: { value: new Vector2(1, 1) }, uRadius: { value: 14 }, uCover: { value: 1 } },
          ...BLEND,
        }),
      )
    }
    mesh.visible = false
    mesh.renderOrder = 0
    scene.add(mesh)
    const p: Plate = { spec, mesh, tex: null, top: 0, left: 0, w: 0, h: 0, key: '' }
    if (spec.kind === 'image' && spec.src) {
      loader.load(spec.src, (t) => {
        if (disposed) return t.dispose()
        t.colorSpace = SRGBColorSpace
        p.tex = t
        ;(mesh.material as ShaderMaterial).uniforms.uMap.value = t
        fitCover(p)
        mesh.visible = true
        spec.el.dataset.glready = ''
        stage?.invalidate()
      })
    } else if (spec.kind === 'video' && spec.video) {
      // the DOM <video> keeps playing (it only fades out once the plate is up); the plate samples it
      const v = spec.video
      const show = () => {
        if (disposed || p.tex) return
        const t = new VideoTexture(v)
        t.colorSpace = SRGBColorSpace
        p.tex = t
        ;(mesh.material as ShaderMaterial).uniforms.uMap.value = t
        fitCover(p)
        mesh.visible = true
        spec.el.dataset.glready = ''
        stage?.invalidate()
      }
      if (v.readyState >= 2) show()
      else v.addEventListener('loadeddata', show, { once: true })
      // the stage renders on demand, so ask for a frame whenever the video has a new one
      if ('requestVideoFrameCallback' in v) {
        const tick = () => {
          if (disposed) return
          if (p.tex && p.mesh.visible) stage?.invalidate()
          v.requestVideoFrameCallback(tick)
        }
        v.requestVideoFrameCallback(tick)
      }
    } else if (spec.kind === 'canvas' && spec.canvas) {
      const t = new CanvasTexture(spec.canvas)
      t.colorSpace = SRGBColorSpace
      p.tex = t
      ;(mesh.material as ShaderMaterial).uniforms.uMap.value = t
      mesh.visible = true
      spec.el.dataset.glready = ''
    }
    return p
  }

  function fitCover(p: Plate) {
    const src = p.tex?.image as { width: number; height: number; videoWidth?: number; videoHeight?: number } | undefined
    if (!src || !p.w) return
    const img = src.videoWidth ? { width: src.videoWidth, height: src.videoHeight! } : src
    const u = (p.mesh.material as ShaderMaterial).uniforms
    // cover: crop the image vertically if the box is wider than the image
    const boxR = p.w / p.h
    const imgR = img.width / img.height
    u.uCover.value = Math.min(1, imgR / boxR)
    u.uSize.value.set(p.w, p.h)
    const r = parseFloat(getComputedStyle(p.spec.el).borderTopLeftRadius) || 0
    u.uRadius.value = r
  }

  function measure() {
    const sy = window.scrollY
    vw = window.innerWidth
    vh = window.innerHeight
    for (const p of plates) {
      const r = p.spec.el.getBoundingClientRect()
      p.top = r.top + sy
      p.left = r.left
      p.w = r.width
      p.h = r.height
      if (p.spec.kind === 'word') {
        const key = `${Math.round(r.width)}x${Math.round(r.height)}|${getComputedStyle(p.spec.el).fontSize}`
        if (key !== p.key && r.width > 0) {
          p.key = key
          p.tex?.dispose()
          p.tex = drawWord(p.spec.el, r.width, r.height)
          const m = p.mesh.material as MeshBasicMaterial
          m.map = p.tex
          m.needsUpdate = true
          p.mesh.visible = true
          p.spec.el.dataset.glready = ''
        }
      } else fitCover(p)
    }
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh)
    anchorY = [0, ...anchors.slice(1).map((el) => Math.min(maxScroll, el.getBoundingClientRect().top + sy - vh * 0.3))]
    if (workEl) {
      const r = workEl.getBoundingClientRect()
      workRange = [r.top + sy, r.bottom + sy]
    }
    imageBoxes = imageEls.map((el) => {
      const r = el.getBoundingClientRect()
      return { cx: r.left + r.width / 2, cy: r.top + sy + r.height / 2, w: r.width, h: r.height }
    })
    stage?.invalidate()
  }

  // world size of one CSS pixel at depth z
  const pxToWorld = (z: number) => (2 * (CAM_Z - z) * TAN) / vh
  const placePlates = (sy: number) => {
    const k = pxToWorld(0)
    for (const p of plates) {
      const y = p.top - sy
      const on = y < vh + 40 && y + p.h > -40
      p.mesh.visible = on && Boolean(p.tex)
      if (!on) continue
      p.mesh.scale.set(p.w * k, p.h * k, 1)
      p.mesh.position.set((p.left + p.w / 2 - vw / 2) * k, -(y + p.h / 2 - vh / 2) * k, 0)
    }
  }

  // pointer (rAF-throttled by nature: we only store the value)
  const onMove = (e: PointerEvent) => {
    pointer.tx = (e.clientX / vw) * 2 - 1
    pointer.ty = (e.clientY / vh) * 2 - 1
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  // reduced motion: the loop is off, so draw a frame whenever the page scrolls
  const onScroll = () => stage?.invalidate()
  window.addEventListener('scroll', onScroll, { passive: true })

  const set = small ? PHONE : DESK
  const tmp: number[] = [0, 0, 0, 0, 0, 0, 0]

  function poseAt(sy: number, obj: number, out: number[]) {
    // hold each arrangement; blend into the next one during the last screen before its anchor
    let i = 0
    while (i < anchorY.length - 1 && sy >= anchorY[i + 1]) i++
    const a = set[Math.min(i, set.length - 1)][obj]
    const j = Math.min(i + 1, anchorY.length - 1, set.length - 1)
    const b = set[j][obj]
    const t = j === i ? 0 : smooth(anchorY[j] - vh * 0.85, anchorY[j] - vh * 0.05, sy)
    for (let k = 0; k < 7; k++) out[k] = a[k] + (b[k] - a[k]) * t
  }

  let disposed = false
  function frame(f: StageFrame) {
    if (disposed) return
    const sy = window.scrollY
    const still = f.still
    const time = still ? 0 : f.time
    if (!still) intro = Math.min(1, intro + f.dt / 1.8)
    else intro = 1
    const ie = 1 - Math.pow(1 - intro, 3)
    const kd = still ? 1 : 1 - Math.exp(-f.dt * 6)
    pointer.x += (pointer.tx - pointer.x) * kd
    pointer.y += (pointer.ty - pointer.y) * kd

    placePlates(sy)

    // how much the lens belongs to the screenshots right now
    const wWork = smooth(workRange[0] - vh * 0.7, workRange[0] - vh * 0.1, sy) * (1 - smooth(workRange[1] - vh * 0.9, workRange[1] - vh * 0.25, sy))
    const screens = sy / vh

    for (let o = 0; o < glass.length; o++) {
      const m = glass[o]
      poseAt(sy, o, tmp)
      let [x, y, z, s] = tmp
      const [rx, ry, rz] = [tmp[4], tmp[5], tmp[6]]
      // idle float
      const fl = still ? 0 : Math.sin(time * 0.6 + o * 1.7) * 0.025
      y += fl
      // intro: rise in from below, slightly smaller
      y -= (1 - ie) * (0.5 + o * 0.15)
      s *= 0.7 + 0.3 * ie
      const half = (CAM_Z - z) * TAN
      let wx = x * half * camera.aspect
      let wy = y * half
      // pointer parallax: nearer pieces move more
      wx += pointer.x * 0.06 * z
      wy -= pointer.y * 0.05 * z
      let scale = s * (small ? 1 : Math.min(1.15, Math.max(0.75, camera.aspect / 1.6)))

      if (o === 0 && wWork > 0.001 && imageBoxes.length) {
        // the lens glides over whichever screenshot is passing the middle of the screen
        const mid = sy + vh * 0.5
        let a = imageBoxes[0]
        let b = imageBoxes[0]
        for (let k = 0; k < imageBoxes.length; k++) {
          if (imageBoxes[k].cy <= mid) a = imageBoxes[k]
          if (imageBoxes[k].cy >= mid) {
            b = imageBoxes[k]
            break
          }
          b = imageBoxes[k]
        }
        const t = a === b ? 0 : smooth(a.cy + a.h * 0.25, b.cy - b.h * 0.25, mid)
        const within = a === b ? Math.max(-0.6, Math.min(0.6, (mid - a.cy) / Math.max(1, a.h))) : 0
        const cx = a.cx + (b.cx - a.cx) * t + within * a.w * 0.5
        const box = a.h + (b.h - a.h) * t
        const kz = pxToWorld(z)
        const lx = (cx - vw / 2) * kz
        // vertically the lens stays near the middle, but never leaves the screenshot it is on
        const cyOff = a.cy + (b.cy - a.cy) * t - mid
        const ly = -Math.max(-vh * 0.28, Math.min(vh * 0.28, cyOff)) * kz
        // a little smaller while in transit between two screenshots
        const ls = ((box * 0.36 * kz) / 0.62) * (0.8 + 0.2 * Math.abs(2 * t - 1))
        wx += (lx - wx) * wWork
        wy += (ly - wy) * wWork
        scale += (ls - scale) * wWork
      }

      m.position.set(wx, wy, z)
      m.scale.setScalar(scale)
      const sp = SPIN[o]
      m.rotation.set(
        rx + screens * sp[0] + pointer.y * 0.25 + (still ? 0 : time * 0.05 * (o === 0 ? 0 : 1)),
        ry + screens * sp[1] + pointer.x * 0.35 + (still ? 0 : time * 0.08),
        rz + screens * sp[2],
      )
      if (o === 0) {
        // the lens stays roughly face-on so it reads as a lens
        m.rotation.x = rx * (1 - wWork) + pointer.y * 0.2 + Math.sin(screens * 0.8) * 0.25 * (1 - wWork)
        m.rotation.y = ry * (1 - wWork) + pointer.x * 0.3 + Math.sin(screens * 0.6) * 0.3 * (1 - wWork)
      }
      // colour pools in the background follow each piece (in viewport units)
      const p = bgP[o]
      const halfO = (CAM_Z - m.position.z) * TAN
      p.r = m.position.x / (halfO * camera.aspect)
      p.g = m.position.y / halfO
      p.b = (0.32 + 0.1 * Math.sin(time * 0.4 + o)) * scale * (small ? 1.3 : 1)
    }

    renderer.render(scene, camera)
  }

  ready = true
  camera.aspect = stage.width() / stage.height()
  camera.updateProjectionMatrix()
  sizeBackground()

  return {
    setAnchors(els, work, imgs) {
      anchors = els
      workEl = work
      imageEls = imgs
      measure()
    },
    setPlates(list) {
      plates.forEach((p) => {
        scene.remove(p.mesh)
        p.tex?.dispose()
        ;(p.mesh.material as MeshBasicMaterial).dispose()
        delete p.spec.el.dataset.glready
      })
      plates = list.map(buildPlate)
      measure()
      opts.onReady?.()
    },
    measure,
    dispose() {
      disposed = true
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
      plates.forEach((p) => {
        p.tex?.dispose()
        ;(p.mesh.material as MeshBasicMaterial).dispose()
        delete p.spec.el.dataset.glready
      })
      plateGeo.dispose()
      geos.forEach((g) => g.dispose())
      mats.forEach((m) => m.dispose())
      bg.geometry.dispose()
      bgMat.dispose()
      envRT.dispose()
      stage.dispose()
    },
  }
}
