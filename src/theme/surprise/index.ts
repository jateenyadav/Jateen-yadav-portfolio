// Lazy entry point of the surprise feature (loaded on first use, or on startup when a surprise is saved).
import './surprise.css'
import { BG_KEY, EVENT, STYLE_ID } from './dom'
import { loadFonts, ORIGINAL_STACKS } from './fonts'

const ORIGINAL_FONT_TOKENS = { '--f-display': ORIGINAL_STACKS.display, '--f-mono': ORIGINAL_STACKS.mono, '--f-serif': ORIGINAL_STACKS.serif }
import { buildTheme, type Recipe, type SurpriseTheme } from './recipes'
import * as seq from './sequence'
import { playEffect, resolveEffect, type Effect } from './effects'

export type { SurpriseTheme }
export type SurpriseInfo = { name: string; count: number; swatch: [string, string, string] }

type Ready = { theme: SurpriseTheme; count: number }

/** Load fonts for a recipe; if they don't arrive in time, use the original fonts instead. */
async function ready(recipe: Recipe, count: number): Promise<Ready> {
  const ok = await loadFonts(recipe.font)
  if (ok) return { theme: buildTheme(recipe), count }
  // fonts didn't arrive in time: show the look with the original fonts (not stored, so a reload retries)
  const theme = buildTheme(recipe)
  Object.assign(theme.tokens, ORIGINAL_FONT_TOKENS)
  return { theme, count }
}

/** Advance the sequence and prepare the next theme (fonts loaded). */
export async function next(): Promise<Ready> {
  const { recipe, count } = seq.next()
  return ready(recipe, count)
}

/** The saved current theme, ready to apply — or null. */
export async function restore(): Promise<Ready | null> {
  const cur = seq.current()
  return cur ? ready(cur.recipe, cur.count) : null
}

/** Warm the next theme's fonts while the menu is open (no state change). */
export function prefetchNext() {
  try {
    void loadFonts(seq.peekNext().font, 8000)
  } catch {
    // prefetch is best effort
  }
}

export const forget = () => seq.forget()

export const info = ({ theme, count }: Ready): SurpriseInfo => ({ name: theme.name, count, swatch: theme.swatch })

export function applySurprise(t: SurpriseTheme) {
  const root = document.documentElement
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  const decls = Object.entries(t.tokens)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
  style.textContent = `@media screen{html[data-surprise]{${decls}}}`
  root.dataset.surprise = t.code
  root.dataset.sxTone = t.tone
  root.dataset.sxPattern = t.pattern
  root.dataset.sxHover = t.hover
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.tokens['--paper'])
  try {
    localStorage.setItem(BG_KEY, t.tokens['--paper'])
  } catch {
    // not fatal
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { active: true } }))
}

export const effectFor = (t: SurpriseTheme): Effect => resolveEffect(t.effect)
export { playEffect }
