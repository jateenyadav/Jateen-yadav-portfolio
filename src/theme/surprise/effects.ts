// Nine theme-switch effects, played on the new snapshot of a View Transition.
// Everything animates clip-path (or a mask, for halftone), so layout is never touched.
// Index = recipe.effect. Keep exactly 9 (see sequence.ts).

export const EFFECTS = ['circle', 'wipe-right', 'wipe-down', 'diagonal', 'blinds', 'shutters', 'diamond', 'split', 'halftone'] as const
export type Effect = (typeof EFFECTS)[number]

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'

/** n stripes, each p (0..1) revealed — one polygon, same point count for every p. */
function stripes(n: number, p: number, vertical: boolean): string {
  const pts: string[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 100
    const b = a + (p * 100) / n
    if (vertical) pts.push(`${a}% 0%`, `${a}% 100%`, `${b}% 100%`, `${b}% 0%`)
    else pts.push(`0% ${a}%`, `100% ${a}%`, `100% ${b}%`, `0% ${b}%`)
  }
  return `polygon(${pts.join(', ')})`
}

/** Halftone needs a registered custom property (@property); fall back to circle without it. */
export const resolveEffect = (e: Effect): Effect => (e === 'halftone' && !('CSSPropertyRule' in window) ? 'circle' : e)

function frames(e: Effect, x: number, y: number): [string, string] {
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  switch (e) {
    case 'wipe-right':
      return ['inset(0 100% 0 0)', 'inset(0 0 0 0)']
    case 'wipe-down':
      return ['inset(0 0 100% 0)', 'inset(0 0 0 0)']
    case 'diagonal':
      return ['polygon(0 0, 0 0, 0 0)', 'polygon(0 0, 200% 0, 0 200%)']
    case 'blinds':
      return [stripes(8, 0, false), stripes(8, 1, false)]
    case 'shutters':
      return [stripes(8, 0, true), stripes(8, 1, true)]
    case 'diamond':
      return ['polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)', 'polygon(50% -50%, 150% 50%, 50% 150%, -50% 50%)']
    case 'split':
      return ['inset(0 50% 0 50%)', 'inset(0 0 0 0)']
    default:
      return [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`]
  }
}

/** Play an effect on ::view-transition-new(root). Halftone is pure CSS (surprise.css), so nothing to do. */
export function playEffect(e: Effect, origin: { x: number; y: number }): void {
  if (e === 'halftone') return
  const [from, to] = frames(e, origin.x, origin.y)
  document.documentElement.animate(
    { clipPath: [from, to] },
    { duration: e === 'circle' ? 750 : 800, easing: EASE, pseudoElement: '::view-transition-new(root)' },
  )
}
