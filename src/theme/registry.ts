import type { ComponentType } from 'react'

/**
 * Every theme is a complete, self-contained skin over the same content (src/data).
 * To add a theme: create src/themes/<id>/index.tsx (default-export the page,
 * optionally export `fonts`), then add one entry below — and its id/background to
 * the boot script in index.html so the first paint uses the right colour.
 */
export type ThemeModule = {
  default: ComponentType
  /** CSS font shorthands to warm up before the theme is shown, e.g. '700 1em "Fraunces Variable"'. */
  fonts?: string[]
}

export type ThemeMeta = {
  id: string
  name: string
  tagline: string
  /** Page background, painted before the theme's code arrives (no flash). */
  background: string
  /** Mobile browser UI colour. */
  themeColor: string
  /** [background, ink, accent] — drawn as the preview in the switcher. */
  swatch: [string, string, string]
  load: () => Promise<ThemeModule>
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'assembly',
    name: 'Assembled',
    tagline: 'Print shop × assembly line',
    background: '#efede6',
    themeColor: '#efede6',
    swatch: ['#efede6', '#141413', '#ff4f1a'],
    load: () => import('../themes/assembly'),
  },
  {
    id: 'chess',
    name: 'Chess',
    tagline: 'The original chessboard portfolio',
    background: '#0f0f17',
    themeColor: '#0f0f17',
    swatch: ['#0f0f17', '#f4f5fb', '#667eea'],
    load: () => import('../themes/chess'),
  },
]

export const DEFAULT_THEME = THEMES[0].id
const STORAGE_KEY = 'jy-theme'

export const themeById = (id: string): ThemeMeta => THEMES.find((t) => t.id === id) ?? THEMES[0]
const isTheme = (id: string | null | undefined): id is string => Boolean(id && THEMES.some((t) => t.id === id))

/** ?theme=chess (shareable link) → last choice on this device → default. */
export function initialThemeId(): string {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('theme')
    if (isTheme(fromUrl)) return fromUrl
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (isTheme(saved)) return saved
  } catch {
    // storage blocked (private mode) — fall through to the default
  }
  return DEFAULT_THEME
}

export function persistTheme(id: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // not fatal: the choice just won't survive a reload
  }
  // keep a shared link pointing at what the visitor is looking at
  const url = new URL(window.location.href)
  if (url.searchParams.has('theme')) {
    url.searchParams.set('theme', id)
    window.history.replaceState(null, '', url)
  }
}
