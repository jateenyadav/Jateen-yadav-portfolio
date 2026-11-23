import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, Vector3, Vector4 } from 'three'
import { createStage, type Stage } from '../../shared/stage'

/**
 * Flow — a raymarched cluster of smooth-union metaballs in liquid chrome.
 * One full-screen quad, rendered at a reduced pixel ratio and upscaled by the
 * browser. Ball targets come from scroll (exact, no lag); the pointer adds a
 * spring displacement on top, so stirring wobbles but scrolling never trails.
 */

export type Ball = [x: number, y: number, z: number, r: number]
/** A formation: six balls in local units (≈ −1…1), given time for idle motion. */
export type Formation = { balls: (t: number) => Ball[]; tint: string; /** smooth-union radius (× unit) */ k?: number }

export type FlowScene = { dispose: () => void; invalidate: () => void; hover: (i: number) => void }

const NB = 6

const FRAG = /* glsl */ `
precision highp float;
uniform vec4 uB[7];
uniform vec4 uBound;
uniform vec2 uRes;
uniform float uTime, uK, uTan, uSteps, uWob;
uniform vec3 uTint;
uniform vec3 uGlow;
varying vec2 vUv;

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

float map(vec3 p) {
  float d = 1e5;
  for (int i = 0; i < 7; i++) {
    vec4 b = uB[i];
    d = smin(d, length(p - b.xyz) - b.w, uK);
  }
  float w = sin(p.x * 7.0 + uTime * 1.1) * sin(p.y * 6.0 - uTime * 0.9) * sin(p.z * 5.0 + uTime * 0.7);
  return d + w * uWob;
}

vec3 normalAt(vec3 p, float t) {
  float e = 0.0015 * t;
  vec2 k = vec2(1.0, -1.0);
  return normalize(k.xyy * map(p + k.xyy * e) + k.yyx * map(p + k.yyx * e) + k.yxy * map(p + k.yxy * e) + k.xxx * map(p + k.xxx * e));
}

// a dark photo studio: overhead softbox, two strip lights, a tinted kicker and a horizon
vec3 env(vec3 r) {
  float y = r.y;
  vec3 c = mix(vec3(0.004, 0.004, 0.006), vec3(0.05, 0.05, 0.058), smoothstep(-0.3, 0.9, y));
  // overhead softbox (sharp-edged rectangle)
  c += vec3(1.0, 0.98, 0.95) * smoothstep(0.74, 0.79, y) * smoothstep(0.62, 0.5, abs(r.x)) * 2.6;
  float ang = atan(r.x, r.z);
  // two tall strip lights left/right-behind
  float strips = smoothstep(0.11, 0.05, abs(ang - 2.0)) + 0.7 * smoothstep(0.09, 0.04, abs(ang + 1.75));
  c += vec3(0.88, 0.93, 1.0) * strips * smoothstep(-0.35, -0.1, y) * smoothstep(0.75, 0.55, y) * 2.2;
  // a front window so faces facing us still catch something
  c += vec3(0.75) * smoothstep(0.1, 0.05, abs(ang - 0.0) - 0.35) * smoothstep(0.32, 0.36, y) * smoothstep(0.62, 0.58, y) * 0.55;
  // tinted kicker from low left
  c += uTint * pow(max(-r.x * 0.75 - r.y * 0.35, 0.0), 5.0) * 0.9;
  // horizon line + dark floor
  c += vec3(0.55) * exp(-abs(y + 0.04) * 70.0) * 0.6;
  c *= mix(0.55, 1.0, smoothstep(-0.6, 0.0, y));
  return c;
}

vec3 shade(vec3 p, vec3 rd, float t) {
  vec3 n = normalAt(p, t);
  float ndv = max(dot(n, -rd), 0.0);
  float fres = pow(1.0 - ndv, 3.0);
  vec3 r = reflect(rd, n);
  vec3 col = env(r);
  // thin-film iridescence: hue walks with view angle
  vec3 film = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + ndv * 1.25 + n.y * 0.22 + uTime * 0.025));
  col *= mix(vec3(0.95), film * 1.35, 0.22 + 0.55 * fres);
  col += film * fres * 0.06;
  col += uTint * fres * 0.18;
  float spec = pow(max(dot(r, normalize(vec3(-0.35, 0.85, 0.4))), 0.0), 80.0);
  col += vec3(1.0) * spec * 1.4;
  return col;
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  float aspect = uRes.x / uRes.y;
  vec3 ro = vec3(0.0, 0.0, 5.0);
  vec3 rd = normalize(vec3(uv.x * uTan * aspect, uv.y * uTan, -1.0));

  // background: near-black with a soft pool of light under the metal
  vec2 sp = vec2(uv.x * aspect, uv.y);
  float pool = exp(-dot(sp - uGlow.xy, sp - uGlow.xy) / (uGlow.z * uGlow.z));
  vec3 bg = vec3(0.00144, 0.00144, 0.0019) + uTint * pool * 0.006 + vec3(pool * 0.0025);
  vec3 col = bg;

  // bounding sphere: most pixels never march
  vec3 oc = ro - uBound.xyz;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - uBound.w * uBound.w;
  float h = b * b - c;
  if (h > 0.0) {
    h = sqrt(h);
    float t = max(-b - h, 0.0);
    float tEnd = -b + h;
    float minD = 1e5;
    float tMin = t;
    bool hit = false;
    for (int i = 0; i < 96; i++) {
      if (float(i) >= uSteps) break;
      vec3 p = ro + rd * t;
      float d = map(p);
      if (d < minD) { minD = d; tMin = t; }
      if (d < 0.0012 * t) { hit = true; break; }
      t += d * 0.92;
      if (t > tEnd) break;
    }
    float px = (2.0 * uTan / uRes.y) * tMin * 2.6;
    if (hit) {
      col = shade(ro + rd * t, rd, t);
    } else if (minD < px) {
      col = mix(shade(ro + rd * tMin, rd, tMin), bg, smoothstep(0.0, 1.0, minD / px));
    }
  }
  col = col / (1.0 + col * 0.35);
  gl_FragColor = vec4(pow(col, vec3(0.4545)), 1.0);
}
`

const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

export function createFlowScene(
  canvas: HTMLCanvasElement,
  formations: Formation[],
  opts: {
    stage: () => number
    /** Formation centre in screen fractions and its unit size as a fraction of the viewport half-height. */
    layout: (w: number, h: number) => { x: number; y: number; size: number }
  },
): FlowScene | null {
  const small = window.innerWidth < 700
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  // render at ~55% of the device resolution (never below 0.75 CSS px), cheaper on phones
  let scale = small ? Math.max(0.7, dpr * 0.42) : Math.max(0.8, dpr * 0.6)
  const fov = 36
  const tanH = Math.tan(((fov / 2) * Math.PI) / 180)
  const camZ = 5

  const scene = new Scene()
  const cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const balls = Array.from({ length: 7 }, () => new Vector4(0, 0, 0, 0))
  const mat = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uB: { value: balls },
      uBound: { value: new Vector4(0, 0, 0, 1) },
      uRes: { value: new Vector2(1, 1) },
      uTime: { value: 0 },
      uK: { value: 0.4 },
      uTan: { value: tanH },
      uSteps: { value: small ? 48 : 72 },
      uWob: { value: 0.012 },
      uTint: { value: new Vector3(0.78, 1, 0.35) },
      uGlow: { value: new Vector3(0, 0, 1) },
    },
  })
  const quad = new Mesh(new PlaneGeometry(2, 2), mat)
  quad.frustumCulled = false
  scene.add(quad)

  let halfH = tanH * camZ
  let halfW = halfH
  let center = [0, 0]
  let unit = 1
  const relayout = (w: number, h: number) => {
    halfH = tanH * camZ
    halfW = halfH * (w / h)
    const L = opts.layout(w, h)
    center = [(L.x * 2 - 1) * halfW, -(L.y * 2 - 1) * halfH]
    unit = halfH * L.size
    ;(mat.uniforms.uRes.value as Vector2).set(w, h)
  }

  const tints = formations.map((f) => {
    const n = parseInt(f.tint.slice(1), 16)
    return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
  })

  // pointer → world (z = 0.4 plane), critically damped
  const ptr = { tx: 0, ty: 0, x: 0, y: 0, on: 0, ton: 0, vx: 0, vy: 0, px: 0, py: 0 }
  const onMove = (e: PointerEvent) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1
    const ny = -(e.clientY / window.innerHeight) * 2 + 1
    const zf = (camZ - 0.4) / camZ
    ptr.tx = nx * halfW * zf
    ptr.ty = ny * halfH * zf
    if (ptr.ton === 0) {
      ptr.x = ptr.tx
      ptr.y = ptr.ty
    }
    ptr.ton = 1
  }
  const onLeave = () => (ptr.ton = 0)
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerdown', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  window.addEventListener('blur', onLeave)

  // per-ball spring displacement driven only by the pointer
  const off = Array.from({ length: NB }, () => ({ x: 0, y: 0, vx: 0, vy: 0 }))
  let hovered = -1
  const swell = new Float32Array(NB)
  const last = formations.length - 1
  const ease = (x: number) => x * x * (3 - 2 * x)

  // adaptive resolution: if frames run long, render fewer pixels
  let acc = 0
  let frames = 0
  const minScale = small ? 0.55 : 0.65

  let stage: Stage | null = null
  stage = createStage(
    canvas,
    ({ dt, time, still, width, height }) => {
      const s = Math.max(0, Math.min(last, opts.stage()))
      const i = Math.min(Math.max(0, last - 1), Math.floor(s))
      let bl = ease(Math.min(1, s - i))
      if (still) bl = bl < 0.5 ? 0 : 1
      const t = still ? 0 : time
      const A = formations[i].balls(t)
      const B = formations[Math.min(last, i + 1)].balls(t)

      const k = 1 - Math.exp(-dt * 12)
      ptr.x += (ptr.tx - ptr.x) * k
      ptr.y += (ptr.ty - ptr.y) * k
      ptr.on += (ptr.ton - ptr.on) * (1 - Math.exp(-dt * 5))
      const pvx = dt > 0 ? (ptr.x - ptr.px) / dt : 0
      const pvy = dt > 0 ? (ptr.y - ptr.py) / dt : 0
      ptr.px = ptr.x
      ptr.py = ptr.y

      let minX = 1e9
      let maxX = -1e9
      let minY = 1e9
      let maxY = -1e9
      let maxR = 0
      for (let j = 0; j < NB; j++) {
        const a = A[j]
        const b = B[j]
        const bx = center[0] + (a[0] + (b[0] - a[0]) * bl) * unit
        const by = center[1] + (a[1] + (b[1] - a[1]) * bl) * unit
        const bz = (a[2] + (b[2] - a[2]) * bl) * unit
        swell[j] += ((hovered === j ? 1 : 0) - swell[j]) * (1 - Math.exp(-dt * 8))
        const br = (a[3] + (b[3] - a[3]) * bl) * unit * (1 + swell[j] * 0.28)

        // stir: the pointer pushes and drags nearby balls; springs pull them home
        const o = off[j]
        if (!still && dt > 0) {
          const dx = bx + o.x - ptr.x
          const dy = by + o.y - ptr.y
          const d = Math.hypot(dx, dy) + 1e-4
          const reach = br + unit * 0.55
          const f = Math.max(0, 1 - d / reach) * ptr.on
          o.vx += ((dx / d) * f * 7 + pvx * f * 0.9) * unit * dt
          o.vy += ((dy / d) * f * 7 + pvy * f * 0.9) * unit * dt
          // under-damped spring → liquid wobble
          o.vx += (-o.x * 38 - o.vx * 7.5) * dt
          o.vy += (-o.y * 38 - o.vy * 7.5) * dt
          o.x += o.vx * dt
          o.y += o.vy * dt
        } else {
          o.x = o.y = o.vx = o.vy = 0
        }
        const x = bx + o.x
        const y = by + o.y
        // a zero-radius ball would still draw a single-pixel speck: park it far behind
        if (br < 0.001) balls[j].set(0, 0, -100, 0)
        else balls[j].set(x, y, bz, br)
        if (br > 0.001) {
          minX = Math.min(minX, x - br)
          maxX = Math.max(maxX, x + br)
          minY = Math.min(minY, y - br)
          maxY = Math.max(maxY, y + br)
          maxR = Math.max(maxR, Math.abs(bz) + br)
        }
      }
      // the cursor itself is a small droplet that merges when it gets close
      const cr = still ? 0 : unit * 0.13 * ptr.on
      if (cr < 0.001) balls[6].set(0, 0, -100, 0)
      else balls[6].set(ptr.x, ptr.y, 0.4, cr)

      const cx = (minX + maxX) / 2
      const cy = (minY + maxY) / 2
      let rad = Math.hypot((maxX - minX) / 2, (maxY - minY) / 2, maxR) + unit * 0.35
      if (cr > 0.001) {
        const dc = Math.hypot(ptr.x - cx, ptr.y - cy) + cr + 0.2
        if (dc < rad + unit * 0.6) rad = Math.max(rad, dc)
      }
      const u = mat.uniforms
      ;(u.uBound.value as Vector4).set(cx, cy, 0, rad)
      u.uTime.value = t
      const ka = formations[i].k ?? 0.42
      const kb = formations[Math.min(last, i + 1)].k ?? 0.42
      u.uK.value = unit * (ka + (kb - ka) * bl)
      u.uWob.value = still ? 0 : unit * 0.01
      const ta = tints[i]
      const tb = tints[Math.min(last, i + 1)]
      ;(u.uTint.value as Vector3).copy(ta).lerp(tb, bl)
      const aspect = width / Math.max(1, height)
      ;(u.uGlow.value as Vector3).set((cx / halfW) * aspect, cy / halfH - 0.12 * (unit / halfH), Math.max(0.3, (rad / halfH) * 1.1))
      stage?.renderer.render(scene, cam)

      // adapt resolution after warm-up
      if (!still && dt > 0) {
        acc += dt
        frames++
        if (acc > 1.2) {
          const avg = acc / frames
          if (avg > 0.0195 && scale > minScale) {
            scale = Math.max(minScale, scale - 0.12)
            stage?.renderer.setPixelRatio(scale)
            stage?.renderer.setSize(width, height, false)
          }
          acc = 0
          frames = 0
        }
      }
    },
    { onResize: relayout, renderer: { antialias: false, alpha: false, depth: false, stencil: false }, maxDpr: scale },
  )
  const st = stage as Stage | null
  if (!st) {
    mat.dispose()
    quad.geometry.dispose()
    return null
  }
  relayout(st.width(), st.height())

  return {
    invalidate: () => st.invalidate(),
    hover: (i: number) => {
      hovered = i
      st.invalidate()
    },
    dispose: () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
      st.dispose()
      quad.geometry.dispose()
      mat.dispose()
    },
  }
}
