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
  {
    id: 'mono',
    name: 'Mono',
    tagline: 'Black & white, the footer steals the show',
    background: '#131313',
    themeColor: '#131313',
    swatch: ['#131313', '#f3f3f1', '#8f8f8b'],
    load: () => import('../themes/mono'),
  },
  {
    id: 'orbit',
    name: 'Orbit',
    tagline: 'A live 3D solar system you can fly through',
    background: '#060913',
    themeColor: '#060913',
    swatch: ['#060913', '#eef1ff', '#ffb547'],
    load: () => import('../themes/orbit'),
  },
  {
    id: 'signal',
    name: 'Signal',
    tagline: 'Particles that become your work',
    background: '#07080c',
    themeColor: '#07080c',
    swatch: ['#07080c', '#e8ecff', '#7cf0d0'],
    load: () => import('../themes/signal'),
  },
  {
    id: 'flow',
    name: 'Flow',
    tagline: 'Liquid metal you can stir',
    background: '#0d0d10',
    themeColor: '#0d0d10',
    swatch: ['#0d0d10', '#f1efe9', '#c8ff5a'],
    load: () => import('../themes/flow'),
  },
  {
    id: 'prism',
    name: 'Prism',
    tagline: 'Glass, light and refraction',
    background: '#eef0f4',
    themeColor: '#eef0f4',
    swatch: ['#eef0f4', '#121318', '#3f6bff'],
    load: () => import('../themes/prism'),
  },
  {
    id: 'atlas',
    name: 'Atlas',
    tagline: 'A live globe of where the work goes',
    background: '#050a12',
    themeColor: '#050a12',
    swatch: ['#050a12', '#e6f0ff', '#ffb000'],
    load: () => import('../themes/atlas'),
  },
  {
    id: 'blocks',
    name: 'Blocks',
    tagline: 'A tiny island built from projects',
    background: '#bfe3f2',
    themeColor: '#bfe3f2',
    swatch: ['#bfe3f2', '#1d2433', '#ff6b4a'],
    load: () => import('../themes/blocks'),
  },
  {
    id: 'retro',
    name: 'Retro',
    tagline: 'A 1980s terminal you can type into',
    background: '#0b0d0a',
    themeColor: '#0b0d0a',
    swatch: ['#0b0d0a', '#ece6d4', '#6dff9a'],
    load: () => import('../themes/retro'),
  },
]

export const DEFAULT_THEME = THEMES[0].id
const STORAGE_KEY = 'jy-theme'

export const themeById = (id: string): ThemeMeta => THEMES.find((t) => t.id === id) ?? THEMES[0]
const isTheme = (id: string | null | undefined): id is string => Boolean(id && THEMES.some((t) => t.id === id))

/** ?theme=chess (shareable link) → choice made earlier in this tab → Assembled. A new visit always opens on Assembled. */
export function initialThemeId(): string {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('theme')
    if (isTheme(fromUrl)) return fromUrl
    const saved = window.sessionStorage.getItem(STORAGE_KEY)
    if (isTheme(saved)) return saved
  } catch {
    // storage blocked (private mode) — fall through to the default
  }
  return DEFAULT_THEME
}

export function persistTheme(id: string) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, id)
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
