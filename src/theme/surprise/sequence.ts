// The never-repeat sequence. Each visitor gets a random salt that shuffles every list; click n takes
// item (n mod size) from each. The sizes 11, 7, 5, 4 and 9 are pairwise coprime, so by the Chinese
// Remainder Theorem the first 11·7·5·4·9 = 13,860 recipes are all different, and two neighbours
// differ in every field. The hue walks the golden angle, so themes keep changing after that too.
import { hueDistance } from './color'
import { accentHue, decode, encode, SIZES, type Recipe } from './recipes'
import { STATE_KEY } from './dom'

type State = { v: 1; salt: number; n: number; cur: string | null }

let memory: State | null = null // used when localStorage is blocked (private mode)

const randomSalt = () => crypto.getRandomValues(new Uint32Array(1))[0]
const fresh = (): State => ({ v: 1, salt: randomSalt(), n: 0, cur: null })

function valid(s: unknown): s is State {
  const o = s as State
  return (
    !!o && o.v === 1 && Number.isInteger(o.salt) && o.salt >= 0 && o.salt <= 0xffffffff &&
    Number.isInteger(o.n) && o.n >= 0 && (o.cur === null || typeof o.cur === 'string')
  )
}

export function load(): State {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    const s = raw ? JSON.parse(raw) : null
    if (valid(s)) return s
  } catch {
    if (memory) return memory
  }
  return memory ?? (memory = fresh())
}

function save(s: State) {
  memory = s
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(s))
  } catch {
    // private mode: the in-memory copy still prevents repeats for this visit
  }
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffled(n: number, rnd: () => number): number[] {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const perms = new Map<number, { family: number[]; font: number[]; pattern: number[]; hover: number[]; effect: number[]; hue0: number }>()
function permsFor(salt: number) {
  let p = perms.get(salt)
  if (!p) {
    const rnd = mulberry32(salt)
    p = {
      family: shuffled(SIZES.family, rnd),
      font: shuffled(SIZES.font, rnd),
      pattern: shuffled(SIZES.pattern, rnd),
      hover: shuffled(SIZES.hover, rnd),
      effect: shuffled(SIZES.effect, rnd),
      hue0: rnd() * 360,
    }
    perms.set(salt, p)
  }
  return p
}

export function recipeAt(n: number, salt: number): Recipe {
  const p = permsFor(salt)
  return {
    family: p.family[n % SIZES.family],
    font: p.font[n % SIZES.font],
    pattern: p.pattern[n % SIZES.pattern],
    hover: p.hover[n % SIZES.hover],
    effect: p.effect[n % SIZES.effect],
    hue: Math.round(p.hue0 + n * 137.508) % 360,
  }
}

/** A Press palette with an orange accent looks too much like the original theme: not a new look. */
export const looksLikeOriginal = (r: Recipe) => r.family === 0 && hueDistance(accentHue(r), 38) < 30

function indexFrom(n: number, salt: number): number {
  while (looksLikeOriginal(recipeAt(n, salt))) n++
  return n
}

/** Advance the visitor's sequence and return the new recipe. */
export function next(): { recipe: Recipe; count: number } {
  const s = load()
  const i = indexFrom(s.n, s.salt)
  const recipe = recipeAt(i, s.salt)
  save({ ...s, n: i + 1, cur: encode(recipe) })
  return { recipe, count: i + 1 }
}

/** The recipe the next click will produce (no state change) — used to prefetch its fonts. */
export function peekNext(): Recipe {
  const s = load()
  return recipeAt(indexFrom(s.n, s.salt), s.salt)
}

export function current(): { recipe: Recipe; count: number } | null {
  const s = load()
  const recipe = decode(s.cur)
  return recipe ? { recipe, count: s.n } : null
}

/** Back to the original look: keep the counter so the next surprise is still new. */
export function forget() {
  const s = load()
  if (s.cur !== null) save({ ...s, cur: null })
}
