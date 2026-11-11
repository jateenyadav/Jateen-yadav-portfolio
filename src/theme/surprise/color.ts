/** Colour maths for generated themes: OKLCH ↔ sRGB, WCAG contrast, contrast repair. */

export type Lch = [number, number, number]

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const enc = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055)
const dec = (x: number) => (x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4))

function lchToLinear([L, C, h]: Lch): [number, number, number] {
  const hr = (h * Math.PI) / 180
  const a = C * Math.cos(hr)
  const b = C * Math.sin(hr)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const inGamut = (rgb: number[]) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4)

/** OKLCH → #rrggbb, reducing chroma (same L and hue) until the colour fits sRGB. */
export function lch(L: number, C: number, h: number): string {
  L = clamp01(L)
  h = ((h % 360) + 360) % 360
  let rgb = lchToLinear([L, C, h])
  if (!inGamut(rgb)) {
    let lo = 0
    let hi = C
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2
      if (inGamut(lchToLinear([L, mid, h]))) lo = mid
      else hi = mid
    }
    rgb = lchToLinear([L, lo, h])
  }
  return toHex(rgb.map((v) => enc(clamp01(v))))
}

function toHex(rgb: number[]): string {
  return '#' + rgb.map((v) => Math.round(clamp01(v) * 255).toString(16).padStart(2, '0')).join('')
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export const hexToRgbTriplet = (hex: string) => hexToRgb(hex).join(',')
export const rgba = (hex: string, a: number) => `rgba(${hexToRgbTriplet(hex)}, ${a})`

/** #rrggbb → OKLCH. */
export function toLch(hex: string): Lch {
  const [r, g, b] = hexToRgb(hex).map((v) => dec(v / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const C = Math.hypot(A, B)
  const h = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360
  return [L, C, h]
}

/** Mix two colours in OKLab: t = 0 → a, t = 1 → b. */
export function mix(a: string, b: string, t: number): string {
  const [L1, C1, h1] = toLch(a)
  const [L2, C2, h2] = toLch(b)
  const a1 = C1 * Math.cos((h1 * Math.PI) / 180)
  const b1 = C1 * Math.sin((h1 * Math.PI) / 180)
  const a2 = C2 * Math.cos((h2 * Math.PI) / 180)
  const b2 = C2 * Math.sin((h2 * Math.PI) / 180)
  const A = a1 + (a2 - a1) * t
  const B = b1 + (b2 - b1) * t
  return lch(L1 + (L2 - L1) * t, Math.hypot(A, B), (Math.atan2(B, A) * 180) / Math.PI)
}

/** Shift a colour's OKLCH lightness. */
export function lighten(hex: string, dL: number): string {
  const [L, C, h] = toLch(hex)
  return lch(L + dL, C, h)
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => dec(v / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const x = luminance(a)
  const y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

const meets = (fg: string, bgs: string[], min: number) => bgs.every((bg) => contrast(fg, bg) >= min)

/**
 * Move fg's lightness away from the backgrounds until it reaches `min` contrast with every one.
 * Last resort is pure black/white, so the result always passes (for any sane min ≤ 7).
 */
export function ensureContrast(fg: string, bgs: string[], min: number): string {
  if (meets(fg, bgs, min)) return fg
  const avgBg = bgs.reduce((s, b) => s + luminance(b), 0) / bgs.length
  const darker = avgBg > 0.18
  const [L0, C, h] = toLch(fg)
  for (let i = 1; i <= 100; i++) {
    const L = L0 + (darker ? -i : i) * 0.01
    if (L < 0 || L > 1) break
    const c = lch(L, C, h)
    if (meets(c, bgs, min)) return c
  }
  const bw = darker ? '#000000' : '#ffffff'
  if (meets(bw, bgs, min)) return bw
  return contrast('#000000', bgs[0]) > contrast('#ffffff', bgs[0]) ? '#000000' : '#ffffff'
}

export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}
