// Recipe → full theme. A recipe is six numbers; every palette is built in OKLCH and then repaired
// with ensureContrast, so every theme passes the readability rules by construction.
import { contrast, ensureContrast, lch, lighten, mix, rgba } from './color'
import { fontTokens } from './fonts'
import { patternTokens, PATTERN_IDS, HOVERS } from './patterns'
import { EFFECTS, type Effect } from './effects'

export type Recipe = { family: number; font: number; pattern: number; hover: number; effect: number; hue: number }
export type Tone = 'light' | 'dark'

type C3 = [number, number, number] // [L, C, hue offset]  (offset added to recipe hue; `fixed` means absolute)
type Family = {
  name: string
  tone: Tone
  paper: C3
  paper2: C3
  sheet: C3
  ink: C3
  accent: C3
  /** Which token's hue offset names the theme. */
  nameFrom: 'accent' | 'paper' | 'ink'
  /** Hue is absolute (not relative to the recipe hue) for these tokens. */
  fixed?: Partial<Record<'paper' | 'paper2' | 'sheet' | 'ink' | 'accent', true>>
}

/** Index = recipe.family. Keep exactly 11 (see sequence.ts). */
export const FAMILIES: Family[] = [
  { name: 'Press', tone: 'light', paper: [0.945, 0.014, 50], paper2: [0.91, 0.016, 50], sheet: [0.972, 0.008, 50], ink: [0.19, 0.012, 50], accent: [0.64, 0.2, 0], nameFrom: 'accent' },
  { name: 'Riso', tone: 'light', paper: [0.93, 0.045, 0], paper2: [0.895, 0.05, 0], sheet: [0.96, 0.03, 0], ink: [0.3, 0.1, 180], accent: [0.62, 0.22, 40], nameFrom: 'paper' },
  {
    name: 'Gazette', tone: 'light', paper: [0.935, 0.01, 90], paper2: [0.9, 0.012, 90], sheet: [0.965, 0.006, 90], ink: [0.17, 0.004, 90], accent: [0.52, 0.15, 0], nameFrom: 'accent',
    fixed: { paper: true, paper2: true, sheet: true, ink: true },
  },
  { name: 'Candy', tone: 'light', paper: [0.965, 0.03, 30], paper2: [0.93, 0.04, 30], sheet: [0.985, 0.015, 30], ink: [0.28, 0.11, 0], accent: [0.66, 0.19, 150], nameFrom: 'ink' },
  {
    name: 'Brutal', tone: 'light', paper: [1, 0, 0], paper2: [0.955, 0, 0], sheet: [1, 0, 0], ink: [0, 0, 0], accent: [0.63, 0.25, 0], nameFrom: 'accent',
    fixed: { paper: true, paper2: true, sheet: true, ink: true },
  },
  { name: 'Clay', tone: 'light', paper: [0.9, 0.035, 20], paper2: [0.865, 0.04, 20], sheet: [0.935, 0.025, 20], ink: [0.25, 0.04, 20], accent: [0.55, 0.13, 180], nameFrom: 'paper' },
  { name: 'Midnight', tone: 'dark', paper: [0.17, 0.025, 0], paper2: [0.21, 0.03, 0], sheet: [0.205, 0.028, 0], ink: [0.95, 0.01, 0], accent: [0.8, 0.16, 120], nameFrom: 'accent' },
  { name: 'Blueprint', tone: 'dark', paper: [0.32, 0.1, 0], paper2: [0.36, 0.1, 0], sheet: [0.355, 0.1, 0], ink: [0.96, 0.02, 0], accent: [0.88, 0.13, 180], nameFrom: 'paper' },
  { name: 'Terminal', tone: 'dark', paper: [0.14, 0.015, 0], paper2: [0.18, 0.02, 0], sheet: [0.17, 0.02, 0], ink: [0.9, 0.1, 0], accent: [0.82, 0.17, 50], nameFrom: 'ink' },
  { name: 'Velvet', tone: 'dark', paper: [0.24, 0.035, 0], paper2: [0.28, 0.04, 0], sheet: [0.27, 0.04, 0], ink: [0.93, 0.03, 40], accent: [0.78, 0.14, 60], nameFrom: 'paper' },
  { name: 'Duotone', tone: 'dark', paper: [0.4, 0.15, 0], paper2: [0.44, 0.15, 0], sheet: [0.43, 0.15, 0], ink: [0.98, 0.01, 0], accent: [0.9, 0.15, 180], nameFrom: 'paper' },
]

const HUE_NAMES = [
  'Raspberry', 'Crimson', 'Vermilion', 'Tangerine', 'Amber', 'Saffron', 'Citron', 'Chartreuse',
  'Lime', 'Clover', 'Jade', 'Mint', 'Teal', 'Lagoon', 'Cyan', 'Azure',
  'Cobalt', 'Indigo', 'Iris', 'Violet', 'Orchid', 'Magenta', 'Fuchsia', 'Rose',
]
export const hueName = (h: number) => HUE_NAMES[Math.floor((((h % 360) + 360) % 360) / 15) % 24]

export type SurpriseTheme = {
  code: string
  recipe: Recipe
  name: string
  tone: Tone
  tokens: Record<string, string>
  pattern: string
  hover: string
  effect: Effect
  swatch: [string, string, string]
}

export const SIZES = { family: FAMILIES.length, font: 7, pattern: PATTERN_IDS.length, hover: HOVERS.length, effect: EFFECTS.length }

export const encode = (r: Recipe) => [r.family, r.font, r.pattern, r.hover, r.effect, r.hue].join('.')

export function decode(code: unknown): Recipe | null {
  if (typeof code !== 'string' || !/^\d{1,3}(\.\d{1,3}){5}$/.test(code)) return null
  const [family, font, pattern, hover, effect, hue] = code.split('.').map(Number)
  const r = { family, font, pattern, hover, effect, hue }
  const ok =
    family < SIZES.family && font < SIZES.font && pattern < SIZES.pattern && hover < SIZES.hover && effect < SIZES.effect && hue < 360
  return ok ? r : null
}

/** Accent hue of a recipe — used to keep surprises from looking like the original orange theme. */
export const accentHue = (r: Recipe) => {
  const f = FAMILIES[r.family]
  return f.fixed?.accent ? f.accent[2] : (r.hue + f.accent[2]) % 360
}

export function buildTheme(r: Recipe): SurpriseTheme {
  const f = FAMILIES[r.family]
  const dark = f.tone === 'dark'
  const col = (k: 'paper' | 'paper2' | 'sheet' | 'ink' | 'accent') => {
    const [L, C, o] = f[k]
    return lch(L, C, f.fixed?.[k] ? o : r.hue + o)
  }

  const paper = col('paper')
  const paper2 = col('paper2')
  const sheet = col('sheet')
  // 1. ink: ≥7 on paper and sheet, ≥6 on paper-2
  let ink = ensureContrast(col('ink'), [paper, sheet], 7)
  ink = ensureContrast(ink, [paper2], 6)
  // 2–3. secondary inks
  const ink2 = ensureContrast(mix(ink, paper, 0.32), [paper, sheet], 4.5)
  const ink3 = ensureContrast(mix(ink, paper, 0.52), [paper], 3.5)
  // 4. accent stands out on every paper
  const accent = ensureContrast(col('accent'), [paper, paper2, sheet], 3)
  // 5. ok green
  const ok = ensureContrast(dark ? lch(0.78, 0.15, 150) : lch(0.55, 0.14, 150), [paper], 3)
  // 6. text on accent
  // pure black or white always reaches ≥4.5 on any colour, so this can't fail
  const onAccent =
    [ink, paper].find((c) => contrast(c, accent) >= 4.5) ??
    (contrast('#000000', accent) >= contrast('#ffffff', accent) ? '#000000' : '#ffffff')

  const shadow = dark ? '#000000' : ink
  const log = ensureContrast(mix(paper, ink, 0.12), [ink], 7)
  const logpaper = dark ? paper2 : lighten(sheet, 0.01)
  const ledger = ensureContrast(mix(logpaper, ok, 0.1), [ink], 7)
  const receipt = dark ? lighten(paper2, 0.03) : lighten(sheet, 0.015)
  const slot = dark ? lch(0.09, 0, 0) : mix(ink, paper, 0.2)
  const patAlpha = dark ? 0.17 : 0.14

  const tokens: Record<string, string> = {
    '--paper': paper,
    '--paper-2': paper2,
    '--sheet': sheet,
    '--ink': ink,
    '--ink-2': ink2,
    '--ink-3': ink3,
    '--rule': rgba(ink, dark ? 0.2 : 0.16),
    '--accent': accent,
    '--ok': ok,
    '--sx-on-accent': onAccent,
    '--sx-glass': rgba(paper, 0.92),
    '--sx-page-ink': ink,
    // the switcher is an ink-coloured chip with paper text; its muted text and lines follow paper
    '--sx-tsw-muted': rgba(paper, 0.62),
    '--sx-tsw-line': rgba(paper, 0.14),
    '--sx-shadow-18': rgba(shadow, 0.18),
    '--sx-shadow-35': rgba(shadow, 0.35),
    '--sx-shadow-45': rgba(shadow, 0.45),
    '--sx-shadow-50': rgba(shadow, 0.5),
    '--sx-accent-10': rgba(accent, 0.1),
    '--sx-accent-22': rgba(accent, 0.22),
    '--sx-accent-45': rgba(accent, 0.45),
    '--sx-ok-18': rgba(ok, 0.18),
    '--sx-ok-20': rgba(ok, 0.2),
    '--sx-log': log,
    '--sx-logpaper': logpaper,
    '--sx-ledger': ledger,
    '--sx-receipt': receipt,
    '--sx-slot': slot,
    ...fontTokens(r.font),
    ...patternTokens(r.pattern, rgba(ink, patAlpha), ink, patAlpha),
  }
  if (dark) {
    const printPaper = lch(0.95, 0.012, r.hue)
    const printInk = ensureContrast(lch(0.2, 0.02, r.hue), [printPaper], 7)
    tokens['--sx-print-paper'] = printPaper
    tokens['--sx-print-ink'] = printInk
    tokens['--sx-print-rule'] = rgba(printInk, 0.16)
  }

  const nameHue = f.fixed?.[f.nameFrom] ? f[f.nameFrom][2] : r.hue + f[f.nameFrom][2]
  return {
    code: encode(r),
    recipe: r,
    name: `${hueName(nameHue)} ${f.name}`,
    tone: f.tone,
    tokens,
    pattern: PATTERN_IDS[r.pattern],
    hover: HOVERS[r.hover],
    effect: EFFECTS[r.effect],
    swatch: [paper, ink, accent],
  }
}
