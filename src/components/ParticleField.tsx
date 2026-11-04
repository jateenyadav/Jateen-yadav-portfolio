import { useEffect, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Clock,
  Color,
  Group,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Sphere,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import { gsap, prefersReducedMotion } from '../lib/motion'

/*
  A fixed full-screen particle field that morphs between four shapes as the
  visitor scrolls (sections dispatch a `morph` event with the target index):
    0 sphere → 1 torus knot → 2 double helix → 3 wave terrain
  Every particle stores all four target positions as attributes; the vertex
  shader blends between neighbouring shapes with a per-particle delay, adds
  turbulence mid-morph, and pushes particles away from the cursor.
*/

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uMouse;
  uniform float uMouseStrength;

  attribute vec3 aS1;
  attribute vec3 aS2;
  attribute vec3 aS3;
  attribute vec2 aRand;

  varying float vAlpha;
  varying float vAccent;

  vec3 pick(float i, vec3 a0, vec3 a1, vec3 a2, vec3 a3) {
    return i < 0.5 ? a0 : (i < 1.5 ? a1 : (i < 2.5 ? a2 : a3));
  }

  void main() {
    float m = clamp(uMorph, 0.0, 3.0);
    float i = min(floor(m), 2.0);
    float f = m - i;

    // Stagger the morph per particle so shapes "pour" into each other.
    float t = clamp(f * 1.6 - aRand.x * 0.6, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);

    vec3 a = pick(i, position, aS1, aS2, aS3);
    vec3 b = pick(i + 1.0, position, aS1, aS2, aS3);
    vec3 p = mix(a, b, t);

    // Terrain ripples only when we're on the wave shape.
    float waveW = smoothstep(2.0, 3.0, m);
    p.y += waveW * (sin(p.x * 0.9 + uTime * 0.8) * 0.32 + cos(p.z * 1.4 + uTime * 0.6) * 0.22);

    // Gentle breathing + mid-morph turbulence.
    float breathe = sin(uTime * 0.7 + aRand.x * 6.2831) * 0.035;
    p += normalize(p + 0.0001) * breathe * (1.0 - waveW);
    float turb = sin(t * 3.14159);
    p += vec3(
      sin(aRand.x * 41.0 + uTime * 0.9),
      cos(aRand.x * 29.0 + uTime * 1.1),
      sin(aRand.x * 17.0 - uTime * 0.8)
    ) * turb * 0.42;

    vec4 world = modelMatrix * vec4(p, 1.0);

    // Cursor repulsion in world space.
    vec2 d = world.xy - uMouse.xy;
    float dist = length(d);
    float force = smoothstep(1.5, 0.0, dist) * uMouseStrength;
    world.xy += normalize(d + 0.0001) * force * 0.65;
    world.z += force * 0.5;

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aRand.y * uPixelRatio / -mv.z;

    vAlpha = 0.28 + 0.6 * aRand.y + force * 0.6;
    vAccent = step(0.74, aRand.x) + force * 1.5;
  }
`

const fragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  uniform float uDim;
  varying float vAlpha;
  varying float vAccent;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = pow(smoothstep(0.5, 0.0, d), 1.7);
    vec3 col = mix(uColorA, uColorB, clamp(vAccent, 0.0, 1.0));
    gl_FragColor = vec4(col, a * vAlpha * uOpacity * uDim);
  }
`

// ---------------------------------------------------------------- shapes

function sphere(n: number, r: number) {
  const out = new Float32Array(n * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const rad = Math.sqrt(1 - y * y)
    const th = golden * i
    const shell = r * (0.92 + Math.random() * 0.16)
    out.set([Math.cos(th) * rad * shell, y * shell, Math.sin(th) * rad * shell], i * 3)
  }
  return out
}

function torusKnot(n: number, R = 1.55, tube = 0.42, p = 2, q = 3) {
  const out = new Float32Array(n * 3)
  const point = (u: number) => {
    const cu = Math.cos(u), su = Math.sin(u)
    const quOverP = (q / p) * u
    const cs = Math.cos(quOverP)
    return new Vector3(R * (2 + cs) * 0.5 * cu, R * (2 + cs) * su * 0.5, R * Math.sin(quOverP) * 0.5)
  }
  const T = new Vector3(), N = new Vector3(), B = new Vector3()
  for (let i = 0; i < n; i++) {
    const u = (i / n) * p * Math.PI * 2
    const P1 = point(u)
    const P2 = point(u + 0.01)
    T.subVectors(P2, P1)
    N.addVectors(P2, P1)
    B.crossVectors(T, N).normalize()
    N.crossVectors(B, T).normalize()
    const a = Math.random() * Math.PI * 2
    const rr = tube * Math.sqrt(Math.random())
    const cx = -rr * Math.cos(a), cy = rr * Math.sin(a)
    out.set([P1.x + cx * N.x + cy * B.x, P1.y + cx * N.y + cy * B.y, P1.z + cx * N.z + cy * B.z], i * 3)
  }
  return out
}

function helix(n: number) {
  const out = new Float32Array(n * 3)
  const height = 5.2, radius = 1.05, turns = 3.2
  for (let i = 0; i < n; i++) {
    const r = Math.random()
    const t = Math.random()
    const ang = t * turns * Math.PI * 2
    const y = (t - 0.5) * height
    if (r < 0.78) {
      const strand = r < 0.39 ? 0 : Math.PI
      const jitter = 0.08
      out.set(
        [
          Math.cos(ang + strand) * radius + (Math.random() - 0.5) * jitter,
          y + (Math.random() - 0.5) * jitter,
          Math.sin(ang + strand) * radius + (Math.random() - 0.5) * jitter,
        ],
        i * 3,
      )
    } else {
      // rungs between the two strands
      const stepT = Math.round(t * 46) / 46
      const a2 = stepT * turns * Math.PI * 2
      const k = Math.random() * 2 - 1
      out.set([Math.cos(a2) * radius * k, (stepT - 0.5) * height, Math.sin(a2) * radius * k], i * 3)
    }
  }
  return out
}

function wave(n: number) {
  const out = new Float32Array(n * 3)
  const cols = Math.ceil(Math.sqrt(n * 2.2))
  const rows = Math.ceil(n / cols)
  for (let i = 0; i < n; i++) {
    const cx = i % cols, cz = Math.floor(i / cols)
    out.set([(cx / (cols - 1) - 0.5) * 13, 0, (cz / (rows - 1) - 0.5) * 6], i * 3)
  }
  return out
}

// Where the shape sits on screen per section (desktop), blended on the CPU.
const OFFSETS = [
  { x: 1.9, y: 0.1, rx: 0 },
  { x: 2.9, y: -0.2, rx: 0.2 },
  { x: 2.1, y: 0, rx: 0 },
  { x: 0, y: -1.3, rx: -0.55 },
]

export default function ParticleField() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' })
    } catch {
      return // no WebGL — the page still works without the field
    }

    const reduced = prefersReducedMotion()
    const small = window.innerWidth < 900
    const lowPower = (navigator.hardwareConcurrency || 4) <= 4
    const COUNT = small || lowPower ? 7000 : 16000

    const pixelRatio = Math.min(window.devicePixelRatio, 1.75)
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const scene = new Scene()
    const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 0, small ? 9.5 : 7)

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(sphere(COUNT, 2.1), 3))
    geometry.setAttribute('aS1', new BufferAttribute(torusKnot(COUNT), 3))
    geometry.setAttribute('aS2', new BufferAttribute(helix(COUNT), 3))
    geometry.setAttribute('aS3', new BufferAttribute(wave(COUNT), 3))
    const rand = new Float32Array(COUNT * 2)
    for (let i = 0; i < COUNT; i++) {
      rand[i * 2] = Math.random()
      rand[i * 2 + 1] = 0.45 + Math.random() * 1.0
    }
    geometry.setAttribute('aRand', new BufferAttribute(rand, 2))
    // Morphing moves points outside the sphere's bounds; never cull.
    geometry.boundingSphere = new Sphere(new Vector3(), 50)

    const uniforms = {
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uSize: { value: small ? 42 : 36 },
      uPixelRatio: { value: pixelRatio },
      uMouse: { value: new Vector3(99, 99, 0) },
      uMouseStrength: { value: 0 },
      uColorA: { value: new Color('#ecebe6') },
      uColorB: { value: new Color('#c5f03c') },
      uOpacity: { value: 0 },
      uDim: { value: 1 },
    }

    const material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })

    const points = new Points(geometry, material)
    const group = new Group()
    group.add(points)
    scene.add(group)

    // ---------------------------------------------------------- interaction
    const pointer = new Vector2(0, 0)
    const target = new Vector3(99, 99, 0)
    const tmp = new Vector3()
    let lastMove = -10

    const onPointer = (e: PointerEvent) => {
      pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
      tmp.set(pointer.x, pointer.y, 0.5).unproject(camera).sub(camera.position).normalize()
      const dist = -camera.position.z / tmp.z
      target.copy(camera.position).add(tmp.multiplyScalar(dist))
      lastMove = clock.getElapsedTime()
    }

    const onMorph = (e: Event) => {
      const idx = (e as CustomEvent<number>).detail
      gsap.to(uniforms.uMorph, { value: idx, duration: reduced ? 0 : 2.4, ease: 'power2.inOut', overwrite: true })
    }

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      if (reduced) render()
    }

    const onDim = (e: Event) => {
      const value = (e as CustomEvent<number>).detail
      gsap.to(uniforms.uDim, { value, duration: reduced ? 0 : 1.2, ease: 'power2.out', overwrite: true })
      if (reduced) render()
    }

    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('morph', onMorph)
    window.addEventListener('fieldopacity', onDim)
    window.addEventListener('resize', onResize)

    // ---------------------------------------------------------------- loop
    const clock = new Clock()
    const offset = { x: 0, y: 0, rx: 0 }

    const blendOffsets = (m: number) => {
      const i = Math.min(Math.floor(m), 2)
      const f = m - i
      const a = OFFSETS[i], b = OFFSETS[i + 1]
      const k = small ? 0 : 1
      offset.x = (a.x + (b.x - a.x) * f) * k
      offset.y = a.y + (b.y - a.y) * f
      offset.rx = a.rx + (b.rx - a.rx) * f
    }

    const render = () => renderer.render(scene, camera)

    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (document.hidden) return
      const t = clock.getElapsedTime()
      uniforms.uTime.value = t

      uniforms.uMouse.value.lerp(target, 0.12)
      const active = t - lastMove < 1.2 ? 1 : 0
      uniforms.uMouseStrength.value += (active - uniforms.uMouseStrength.value) * 0.05

      blendOffsets(uniforms.uMorph.value)
      group.position.x += (offset.x - group.position.x) * 0.05
      group.position.y += (offset.y - group.position.y) * 0.05
      const waveW = Math.max(0, uniforms.uMorph.value - 2)
      group.rotation.y = t * 0.06 * (1 - waveW) + pointer.x * 0.18
      group.rotation.x += (offset.rx + -pointer.y * 0.12 - group.rotation.x) * 0.05
      render()
    }

    // Fade the field in once the loader clears.
    // This component is lazy-loaded, so the intro may already have happened.
    const onIntro = () => gsap.to(uniforms.uOpacity, { value: 1, duration: reduced ? 0 : 2.2, ease: 'power2.out' })
    if (document.documentElement.dataset.intro === 'done') onIntro()
    else window.addEventListener('intro', onIntro, { once: true })

    if (reduced) {
      uniforms.uOpacity.value = 1
      render()
    } else {
      tick()
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('morph', onMorph)
      window.removeEventListener('fieldopacity', onDim)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('intro', onIntro)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="webgl" aria-hidden="true" />
}
