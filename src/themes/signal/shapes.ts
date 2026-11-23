/**
 * Target formations for the Signal particle field. Every shape returns N points
 * (x, y, z) inside roughly a 2.6 × 2.6 box centred on the origin. Points are
 * distributed over weighted "primitives" (edges, fills, clusters) so outlines read
 * crisply while fills stay airy.
 */

type Vec = [number, number, number]
type Sampler = (r: () => number) => Vec
type Prim = [weight: number, sample: Sampler]

/** Deterministic PRNG so every load draws the same formations. */
export function rng(seed = 7) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const gauss = (r: () => number) => {
  const u = Math.max(1e-6, r())
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2831853 * r())
}

function build(n: number, prims: Prim[], r: () => number): Float32Array {
  const out = new Float32Array(n * 3)
  const total = prims.reduce((a, p) => a + p[0], 0)
  const cum: number[] = []
  let acc = 0
  for (const p of prims) cum.push((acc += p[0] / total))
  for (let i = 0; i < n; i++) {
    const pick = r()
    let k = 0
    while (k < cum.length - 1 && pick > cum[k]) k++
    const v = prims[k][1](r)
    out[i * 3] = v[0]
    out[i * 3 + 1] = v[1]
    out[i * 3 + 2] = v[2]
  }
  return out
}

/* ---------- primitive helpers ---------- */

const jitter = (v: Vec, r: () => number, a: number): Vec => [v[0] + (r() - 0.5) * a, v[1] + (r() - 0.5) * a, v[2] + (r() - 0.5) * a]

/** A point on the outline of a rounded rectangle in the XY plane. */
function roundRectEdge(cx: number, cy: number, w: number, h: number, rad: number, z = 0): Sampler {
  const sw = w - 2 * rad
  const sh = h - 2 * rad
  const arc = (Math.PI / 2) * rad
  const per = 2 * sw + 2 * sh + 4 * arc
  return (r) => {
    let d = r() * per
    const hw = w / 2
    const hh = h / 2
    if (d < sw) return [cx - sw / 2 + d, cy + hh, z]
    d -= sw
    if (d < sh) return [cx + hw, cy + sh / 2 - d, z]
    d -= sh
    if (d < sw) return [cx + sw / 2 - d, cy - hh, z]
    d -= sw
    if (d < sh) return [cx - hw, cy - sh / 2 + d, z]
    d -= sh
    const q = Math.floor(d / arc)
    const a = ((d - q * arc) / arc) * (Math.PI / 2)
    const corners: [number, number, number][] = [
      [cx + sw / 2, cy + sh / 2, 0],
      [cx + sw / 2, cy - sh / 2, -Math.PI / 2],
      [cx - sw / 2, cy - sh / 2, Math.PI],
      [cx - sw / 2, cy + sh / 2, Math.PI / 2],
    ]
    const [ox, oy, a0] = corners[Math.min(3, q)]
    const ang = a0 + (Math.PI / 2 - a)
    return [ox + Math.cos(ang) * rad, oy + Math.sin(ang) * rad, z]
  }
}

/** Uniform fill of an axis-aligned rectangle (XY plane). */
const rectFill = (x0: number, y0: number, x1: number, y1: number, z = 0): Sampler => (r) => [x0 + (x1 - x0) * r(), y0 + (y1 - y0) * r(), z]

/** Horizontal line segment. */
const hline = (x0: number, x1: number, y: number, z = 0): Sampler => (r) => [x0 + (x1 - x0) * r(), y, z]

const segment = (a: Vec, b: Vec, spread = 0): Sampler => (r) => {
  const t = r()
  return jitter([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], r, spread)
}

const circleEdge = (cx: number, cy: number, rad: number, z = 0): Sampler => (r) => {
  const a = r() * Math.PI * 2
  return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, z]
}

const discFill = (cx: number, cy: number, rad: number, z = 0): Sampler => (r) => {
  const a = r() * Math.PI * 2
  const d = Math.sqrt(r()) * rad
  return [cx + Math.cos(a) * d, cy + Math.sin(a) * d, z]
}

const sphereSurf = (c: Vec, rad: number): Sampler => (r) => {
  const u = r() * 2 - 1
  const a = r() * Math.PI * 2
  const s = Math.sqrt(1 - u * u)
  return [c[0] + s * Math.cos(a) * rad, c[1] + u * rad, c[2] + s * Math.sin(a) * rad]
}

const cluster = (c: Vec, sigma: number): Sampler => (r) => [c[0] + gauss(r) * sigma, c[1] + gauss(r) * sigma, c[2] + gauss(r) * sigma]

/** Applies a transform (rotate about Y then X, then translate) to a sampler. */
function xf(s: Sampler, t: { rx?: number; ry?: number; rz?: number; at?: Vec; scale?: number }): Sampler {
  const cy = Math.cos(t.ry ?? 0)
  const sy = Math.sin(t.ry ?? 0)
  const cx = Math.cos(t.rx ?? 0)
  const sx = Math.sin(t.rx ?? 0)
  const cz = Math.cos(t.rz ?? 0)
  const sz = Math.sin(t.rz ?? 0)
  const k = t.scale ?? 1
  const [ax, ay, az] = t.at ?? [0, 0, 0]
  return (r) => {
    let [x, y, z] = s(r)
    x *= k
    y *= k
    z *= k
    // z
    let nx = x * cz - y * sz
    let ny = x * sz + y * cz
    x = nx
    y = ny
    // x
    ny = y * cx - z * sx
    let nz = y * sx + z * cx
    y = ny
    z = nz
    // y
    nx = x * cy + z * sy
    nz = -x * sy + z * cy
    return [nx + ax, y + ay, nz + az]
  }
}

/* ---------- text ---------- */

/** Samples glyph pixels from a 2D canvas; edges are favoured so letters read crisply. */
function textSampler(text: string, font: string, height: number, depth = 0.1): Prim[] {
  const W = 640
  const H = 360
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d', { willReadFrequently: true })
  if (!g) return [[1, sphereSurf([0, 0, 0], 1)]]
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  let size = 300
  g.font = `${font.replace('{s}', String(size))}`
  const m = g.measureText(text)
  size = Math.min(300, (size * (W * 0.92)) / Math.max(1, m.width))
  g.font = `${font.replace('{s}', String(size))}`
  g.fillText(text, W / 2, H / 2 + size * 0.04)
  const data = g.getImageData(0, 0, W, H).data
  const fill: number[] = []
  const edge: number[] = []
  let minY = H
  let maxY = 0
  let minX = W
  let maxX = 0
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && data[(y * W + x) * 4 + 3] > 128
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (!on(x, y)) continue
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      const isEdge = !on(x - 2, y) || !on(x + 2, y) || !on(x, y - 2) || !on(x, y + 2)
      ;(isEdge ? edge : fill).push(x, y)
    }
  }
  if (!fill.length && !edge.length) return [[1, sphereSurf([0, 0, 0], 1)]]
  const cxp = (minX + maxX) / 2
  const cyp = (minY + maxY) / 2
  const k = height / Math.max(1, maxY - minY)
  const pick = (arr: number[]): Sampler => (r) => {
    const i = Math.floor(r() * (arr.length / 2)) * 2
    return [(arr[i] + r() - cxp) * k, -(arr[i + 1] + r() - cyp) * k, (r() - 0.5) * depth]
  }
  const prims: Prim[] = []
  if (edge.length) prims.push([0.45, pick(edge)])
  if (fill.length) prims.push([0.55, pick(fill)])
  return prims
}

/* ---------- formations ---------- */

export type ShapeId = 'mono' | 'globe' | 'devices' | 'brain' | 'phone' | 'paper' | 'solar' | 'browser' | 'wave' | 'at'

export function makeShape(id: ShapeId, n: number, displayFont: string): Float32Array {
  const r = rng(id.length * 9973 + id.charCodeAt(0) * 131)
  switch (id) {
    case 'mono': {
      const glyph = textSampler('JY', `700 {s}px ${displayFont}`, 1.55, 0.18)
      // a faint orbit ring around the monogram — "the signal"
      return build(n, [...glyph.map(([w, s]) => [w * 0.86, s] as Prim), [0.14, xf(circleEdge(0, 0, 1.45), { rx: 1.25, ry: 0.2 })]], r)
    }
    case 'globe': {
      const R = 1.2
      const toXYZ = (lat: number, lon: number, rad = R): Vec => {
        const la = (lat * Math.PI) / 180
        const lo = (lon * Math.PI) / 180
        return [Math.cos(la) * Math.sin(lo) * rad, Math.sin(la) * rad, Math.cos(la) * Math.cos(lo) * rad]
      }
      const spots: Vec[] = [toXYZ(28.5, 77.1), toXYZ(35.7, 139.7), toXYZ(50.1, 8.7)] // Gurugram, Tokyo, Frankfurt
      const arc = (a: Vec, b: Vec): Sampler => (rr) => {
        const t = rr()
        const p: Vec = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
        const l = Math.hypot(p[0], p[1], p[2])
        const lift = R * (1 + 0.28 * Math.sin(Math.PI * t))
        return [(p[0] / l) * lift, (p[1] / l) * lift, (p[2] / l) * lift]
      }
      const lat: Sampler = (rr) => toXYZ((Math.floor(rr() * 11) - 5) * 15, rr() * 360)
      const lon: Sampler = (rr) => toXYZ(rr() * 180 - 90, Math.floor(rr() * 12) * 30)
      return build(
        n,
        [
          [0.26, lat],
          [0.18, lon],
          [0.2, sphereSurf([0, 0, 0], R)],
          ...spots.map((s) => [0.05, cluster(s, 0.035)] as Prim),
          [0.07, arc(spots[0], spots[1])],
          [0.06, arc(spots[0], spots[2])],
          [0.08, arc(spots[2], spots[1])],
        ],
        r,
      )
    }
    case 'devices': {
      const monitor = { rx: -0.08, ry: 0.18, at: [-0.25, 0.32, -0.35] as Vec }
      const laptop = { rx: 0, ry: 0.32, at: [-0.85, -0.62, 0.45] as Vec }
      const phone = { ry: -0.3, at: [1.1, -0.42, 0.55] as Vec }
      return build(
        n,
        [
          // monitor
          [0.16, xf(roundRectEdge(0, 0, 2.1, 1.28, 0.06), monitor)],
          [0.03, xf(segment([0, -0.64, 0], [0, -0.95, -0.05]), monitor)],
          [0.03, xf(hline(-0.38, 0.38, -0.97, -0.05), monitor)],
          [0.05, xf(hline(-0.92, 0.92, 0.45), monitor)],
          [0.08, xf(rectFill(-0.9, -0.5, -0.25, 0.3), monitor)],
          [0.05, xf(rectFill(-0.1, 0.05, 0.9, 0.3), monitor)],
          [0.04, xf(rectFill(-0.1, -0.5, 0.9, -0.12), monitor)],
          // laptop: screen + keyboard deck
          [0.11, xf(roundRectEdge(0, 0.36, 1.2, 0.74, 0.04), laptop)],
          [0.05, xf(rectFill(-0.5, 0.12, 0.5, 0.58), laptop)],
          [0.07, xf(xf(roundRectEdge(0, 0, 1.32, 0.78, 0.05), { rx: -1.25 }), { ...laptop, at: [laptop.at[0], laptop.at[1] - 0.02 - 0.0, laptop.at[2] + 0.38] })],
          [0.04, xf(xf(rectFill(-0.5, -0.12, 0.5, 0.25), { rx: -1.25 }), { ...laptop, at: [laptop.at[0], laptop.at[1] - 0.02, laptop.at[2] + 0.38] })],
          // phone
          [0.11, xf(roundRectEdge(0, 0, 0.5, 1.0, 0.08), phone)],
          [0.03, xf(hline(-0.07, 0.07, 0.43), phone)],
          [0.05, xf(rectFill(-0.18, 0.05, 0.18, 0.34), phone)],
          [0.03, xf(hline(-0.18, 0.18, -0.08), phone)],
          [0.03, xf(hline(-0.18, 0.1, -0.18), phone)],
          [0.03, xf(hline(-0.18, 0.14, -0.28), phone)],
        ],
        r,
      )
    }
    case 'brain': {
      // nodes inside two hemispheres, each wired to its nearest neighbours
      const nodes: Vec[] = []
      const rr = rng(42)
      while (nodes.length < 46) {
        const p: Vec = [(rr() * 2 - 1) * 1.45, (rr() * 2 - 1) * 1.0, (rr() * 2 - 1) * 0.95]
        const e = (p[0] / 1.45) ** 2 + (p[1] / 1.0) ** 2 + (p[2] / 0.95) ** 2
        if (e > 1 || Math.abs(p[0]) < 0.08) continue
        if (p[1] < -0.55 && Math.abs(p[0]) > 0.9) continue
        nodes.push(p)
      }
      const edges: [Vec, Vec][] = []
      nodes.forEach((a, i) => {
        const near = nodes
          .map((b, j) => [j, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])] as const)
          .filter(([j]) => j !== i)
          .sort((x, y) => x[1] - y[1])
          .slice(0, 3)
        near.forEach(([j]) => j > i && edges.push([a, nodes[j]]))
      })
      const shell: Sampler = (q) => {
        const p = sphereSurf([0, 0, 0], 1)(q)
        const side = p[0] < 0 ? -1 : 1
        return [p[0] * 1.5 + side * 0.06, p[1] * 1.05, p[2] * 1.0]
      }
      return build(
        n,
        [
          ...nodes.map((c) => [0.3 / nodes.length, cluster(c, 0.035)] as Prim),
          ...edges.map(([a, b]) => [0.56 / edges.length, segment(a, b, 0.012)] as Prim),
          [0.14, shell],
        ],
        r,
      )
    }
    case 'phone': {
      const t = { ry: -0.32, rx: 0.06 }
      return build(
        n,
        [
          [0.22, xf(roundRectEdge(0, 0, 1.08, 2.15, 0.18), t)],
          [0.03, xf(hline(-0.14, 0.14, 0.96), t)],
          // header + greeting
          [0.04, xf(hline(-0.4, 0.05, 0.78), t)],
          [0.03, xf(hline(-0.4, -0.1, 0.68), t)],
          // three cards: notes, reminders, money
          [0.1, xf(roundRectEdge(0, 0.38, 0.84, 0.36, 0.06), t)],
          [0.04, xf(rectFill(-0.34, 0.3, 0.1, 0.42), t)],
          [0.08, xf(roundRectEdge(-0.22, -0.08, 0.4, 0.42, 0.06), t)],
          [0.08, xf(roundRectEdge(0.22, -0.08, 0.4, 0.42, 0.06), t)],
          [0.05, xf(discFill(-0.22, -0.08, 0.09), t)],
          [0.04, xf(hline(0.08, 0.36, -0.08), t)],
          // AI chat bubble
          [0.1, xf(roundRectEdge(0.05, -0.55, 0.74, 0.3, 0.12), t)],
          [0.04, xf(hline(-0.22, 0.3, -0.55), t)],
          // tab bar
          [0.06, xf(hline(-0.44, 0.44, -0.84), t)],
          ...[-0.3, -0.1, 0.1, 0.3].map((x) => [0.02, xf(discFill(x, -0.92, 0.03), t)] as Prim),
          [0.07, xf(rectFill(-0.5, -1.02, 0.5, 1.02, -0.06), t)],
        ],
        r,
      )
    }
    case 'paper': {
      const t = { rz: 0.06, ry: 0.22 }
      const check: Sampler = (q) => {
        const a: Vec = [0.15, -0.48, 0.15]
        const b: Vec = [0.38, -0.75, 0.15]
        const c: Vec = [0.92, -0.08, 0.15]
        return q() < 0.35 ? segment(a, b, 0.03)(q) : segment(b, c, 0.03)(q)
      }
      const lines: Prim[] = [0.62, 0.5, 0.38].map((y, i) => [0.035, xf(hline(-0.6, 0.6 - i * 0.18, y), t)] as Prim)
      const mcq: Prim[] = []
      ;[0.12, -0.08, -0.28, -0.48].forEach((y, i) => {
        mcq.push([0.025, xf(circleEdge(-0.55, y, 0.055), t)])
        mcq.push([0.02, xf(hline(-0.42, -0.05 - (i % 2) * 0.12, y), t)])
        if (i === 1) mcq.push([0.02, xf(discFill(-0.55, y, 0.04), t)])
      })
      return build(
        n,
        [
          [0.2, xf(roundRectEdge(0, 0, 1.5, 2.0, 0.04), t)],
          [0.05, xf(hline(-0.6, 0.2, 0.84), t)],
          ...lines,
          ...mcq,
          [0.13, xf(check, t)],
          // stopwatch for the timed mode
          [0.1, xf(circleEdge(0.82, 0.86, 0.3, 0.2), t)],
          [0.02, xf(segment([0.82, 0.86, 0.2], [0.82, 1.06, 0.2]), t)],
          [0.02, xf(segment([0.82, 0.86, 0.2], [0.96, 0.82, 0.2]), t)],
          [0.03, xf(segment([0.82, 1.16, 0.2], [0.82, 1.24, 0.2], 0.02), t)],
          [0.12, xf(rectFill(-0.75, -1, 0.75, 1, -0.04), t)],
        ],
        r,
      )
    }
    case 'solar': {
      const orbit = (rad: number, tilt: number, spin: number): Sampler => xf(circleEdge(0, 0, rad), { rx: Math.PI / 2 - tilt, rz: spin })
      const planet = (rad: number, a: number, tilt: number, spin: number, size: number): Sampler => {
        const [x, y] = [Math.cos(a) * rad, Math.sin(a) * rad]
        return xf(sphereSurf([x, y, 0], size), { rx: Math.PI / 2 - tilt, rz: spin })
      }
      return build(
        n,
        [
          [0.22, sphereSurf([0, 0, 0], 0.34)],
          [0.06, cluster([0, 0, 0], 0.22)],
          [0.08, orbit(0.62, 0.5, -0.12)],
          [0.1, orbit(0.95, 0.5, -0.12)],
          [0.12, orbit(1.3, 0.5, -0.12)],
          [0.12, orbit(1.62, 0.5, -0.12)],
          [0.05, planet(0.62, 1.2, 0.5, -0.12, 0.06)],
          [0.07, planet(0.95, 3.6, 0.5, -0.12, 0.09)],
          [0.08, planet(1.3, 5.3, 0.5, -0.12, 0.12)],
          [0.06, planet(1.62, 2.3, 0.5, -0.12, 0.1)],
          [0.04, xf(circleEdge(0, 0, 0.2), { rx: 0.4, at: [Math.cos(2.3) * 1.62, Math.sin(2.3) * 1.62 * Math.cos(Math.PI / 2 - 0.5), -Math.sin(2.3) * 1.62 * Math.sin(Math.PI / 2 - 0.5)] })],
        ],
        r,
      )
    }
    case 'browser': {
      const t = { ry: 0.28, rx: -0.04 }
      const type = textSampler('Aa', `800 {s}px ${displayFont}`, 0.9, 0.04).map(([w, s]) => [w * 0.24, xf(s, { at: [-0.45, -0.08, 0.02] })] as Prim)
      return build(
        n,
        [
          [0.2, xf(roundRectEdge(0, 0, 2.5, 1.7, 0.07), t)],
          [0.05, xf(hline(-1.25, 1.25, 0.62), t)],
          ...[-1.1, -0.98, -0.86].map((x) => [0.015, xf(discFill(x, 0.73, 0.03), t)] as Prim),
          [0.03, xf(roundRectEdge(0.2, 0.73, 1.1, 0.1, 0.05), t)],
          ...type.map(([w, s]) => [w, xf(s, t)] as Prim),
          // theme toggle pill (dark / light)
          [0.06, xf(roundRectEdge(0.85, 0.4, 0.4, 0.18, 0.09), t)],
          [0.03, xf(discFill(0.92, 0.4, 0.06), t)],
          // copy column + image block
          [0.04, xf(hline(0.2, 1.05, 0.08), t)],
          [0.03, xf(hline(0.2, 0.85, -0.04), t)],
          [0.03, xf(hline(0.2, 0.95, -0.16), t)],
          [0.08, xf(roundRectEdge(0.62, -0.5, 0.86, 0.36, 0.04), t)],
          [0.08, xf(rectFill(-1.25, -0.85, 1.25, 0.85, -0.05), t)],
        ],
        r,
      )
    }
    case 'wave': {
      // a signal surface: six peaks along the timeline, the first (current role) the tallest
      const peaks = [1, 0.62, 0.45, 0.38, 0.34, 0.5]
      const h = (x: number, z: number) => {
        let y = 0
        peaks.forEach((amp, i) => {
          const px = -1.45 + i * 0.58
          y += amp * 0.75 * Math.exp(-((x - px) ** 2) / 0.03 - (z * z) / 0.5)
        })
        return y + Math.sin(x * 3 + z * 2) * 0.04
      }
      const row: Sampler = (q) => {
        const z = (Math.floor(q() * 22) / 21) * 1.8 - 0.9
        const x = q() * 3.3 - 1.65
        return [x, h(x, z) - 0.45, z]
      }
      const col: Sampler = (q) => {
        const x = (Math.floor(q() * 34) / 33) * 3.3 - 1.65
        const z = q() * 1.8 - 0.9
        return [x, h(x, z) - 0.45, z]
      }
      const markers: Prim[] = peaks.map((amp, i) => [0.012, cluster([-1.45 + i * 0.58, amp * 0.75 - 0.45 + 0.12, 0], 0.025)] as Prim)
      return build(n, [[0.62, xf(row, { rx: 0.32 })], [0.3, xf(col, { rx: 0.32 })], ...markers.map(([w, s]) => [w, xf(s, { rx: 0.32 })] as Prim)], r)
    }
    case 'at': {
      const glyph = textSampler('@', `600 {s}px ${displayFont}`, 1.9, 0.16)
      return build(n, [...glyph.map(([w, s]) => [w * 0.9, s] as Prim), [0.1, xf(circleEdge(0, 0, 1.45), { rx: 1.3, ry: -0.3 })]], r)
    }
  }
}
