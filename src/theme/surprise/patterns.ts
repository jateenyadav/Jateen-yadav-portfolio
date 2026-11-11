// Five moving background patterns. Each one tiles seamlessly; the CSS layer drifts by exactly one
// tile per loop, so the motion never jumps. Index = recipe.pattern. Keep exactly 5 (see sequence.ts).

export type Pattern = { id: string; img: string; tw: number; th: number; mx: number; my: number; dur: number }

const svg = (w: number, h: number, body: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${body}</svg>`)}")`

type Build = (rgba: string, hex: string, alpha: number) => Pattern

export const PATTERNS: Build[] = [
  (c) => ({ id: 'dots', img: `radial-gradient(${c} 1.1px, transparent 1.4px)`, tw: 22, th: 22, mx: 22, my: 22, dur: 9 }),
  (c) => ({
    id: 'grid',
    img: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`,
    tw: 28, th: 28, mx: 28, my: 0, dur: 10,
  }),
  (c) => ({ id: 'hatch', img: `linear-gradient(45deg, transparent 45%, ${c} 45% 55%, transparent 55%)`, tw: 14, th: 14, mx: 14, my: 0, dur: 6 }),
  (_c, hex, a) => ({
    id: 'crosses',
    img: svg(36, 36, `<path d='M18 13v10M13 18h10' stroke='${hex}' stroke-opacity='${a}' stroke-width='1.2' fill='none'/>`),
    tw: 36, th: 36, mx: 36, my: 36, dur: 12,
  }),
  (_c, hex, a) => ({
    id: 'waves',
    img: svg(48, 20, `<path d='M0 10 Q12 2 24 10 T48 10' stroke='${hex}' stroke-opacity='${a}' stroke-width='1.2' fill='none'/>`),
    tw: 48, th: 20, mx: 48, my: 0, dur: 8,
  }),
]

export function patternTokens(index: number, rgba: string, hex: string, alpha: number): Record<string, string> {
  const p = (PATTERNS[index] ?? PATTERNS[0])(rgba, hex, alpha)
  return {
    '--sx-pat-img': p.img,
    '--sx-tw': `${p.tw}px`,
    '--sx-th': `${p.th}px`,
    '--sx-mx': `${p.mx}px`,
    '--sx-my': `${p.my}px`,
    '--sx-pat-dur': `${p.dur}s`,
  }
}

export const PATTERN_IDS = ['dots', 'grid', 'hatch', 'crosses', 'waves']
/** Index = recipe.hover. Keep exactly 4. */
export const HOVERS = ['lift', 'tilt', 'glow', 'wobble']
