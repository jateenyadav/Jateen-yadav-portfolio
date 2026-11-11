// Seven font pairings for surprise themes. Fonts load on demand through the FontFace API under
// private family names, so nothing leaks into other skins. `size` (CSS size-adjust) was measured
// against the original fonts so every face fits the Assembled layout — it never scales a font up.
import bricolage from '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wdth-normal.woff2?url'
import geistMono from '@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2?url'
import newsreader from '@fontsource-variable/newsreader/files/newsreader-latin-wght-italic.woff2?url'
import bigShoulders from '@fontsource-variable/big-shoulders-display/files/big-shoulders-display-latin-wght-normal.woff2?url'
import spaceMono400 from '@fontsource/space-mono/files/space-mono-latin-400-normal.woff2?url'
import spaceMono700 from '@fontsource/space-mono/files/space-mono-latin-700-normal.woff2?url'
import playfair from '@fontsource-variable/playfair-display/files/playfair-display-latin-wght-italic.woff2?url'
import fraunces from '@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2?url'
import frauncesItalic from '@fontsource-variable/fraunces/files/fraunces-latin-wght-italic.woff2?url'
import plexMono400 from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2?url'
import plexMono700 from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-700-normal.woff2?url'
import spaceGrotesk from '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2?url'
import firaCode from '@fontsource-variable/fira-code/files/fira-code-latin-wght-normal.woff2?url'
import dmSerif from '@fontsource/dm-serif-display/files/dm-serif-display-latin-400-italic.woff2?url'
import anybody from '@fontsource-variable/anybody/files/anybody-latin-wdth-normal.woff2?url'
import martianMono from '@fontsource-variable/martian-mono/files/martian-mono-latin-wdth-normal.woff2?url'
import cormorant from '@fontsource-variable/cormorant/files/cormorant-latin-wght-italic.woff2?url'
import sora from '@fontsource-variable/sora/files/sora-latin-wght-normal.woff2?url'
import schibsted from '@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2?url'
import redHatMono from '@fontsource-variable/red-hat-mono/files/red-hat-mono-latin-wght-normal.woff2?url'

export type Face = { url: string; weight: string; stretch?: string; style?: 'normal' | 'italic' }
export type Role = { faces: Face[]; size: number }
export type Pairing = { id: string; display?: Role; mono?: Role; serif?: Role }

export const ORIGINAL_STACKS = {
  display: "'Archivo Variable', 'Arial Black', Arial, sans-serif",
  mono: "'JetBrains Mono Variable', ui-monospace, Menlo, monospace",
  serif: "'Instrument Serif', Georgia, serif",
}

const it = 'italic' as const

/** Order matters: index = recipe.font. Keep exactly 7 (see sequence.ts). */
export const PAIRINGS: Pairing[] = [
  {
    // every look changes the type: none of the sets is the original one
    id: 'swiss',
    display: { faces: [{ url: schibsted, weight: '400 900' }], size: 0.94 },
    mono: { faces: [{ url: geistMono, weight: '100 900' }], size: 1 },
    serif: { faces: [{ url: playfair, weight: '400 900', style: it }], size: 0.82 },
  },
  {
    id: 'grotesk',
    display: { faces: [{ url: bricolage, weight: '200 800', stretch: '75% 100%' }], size: 0.93 },
    mono: { faces: [{ url: geistMono, weight: '100 900' }], size: 1 },
    serif: { faces: [{ url: newsreader, weight: '200 800', style: it }], size: 0.87 },
  },
  {
    id: 'poster',
    display: { faces: [{ url: bigShoulders, weight: '100 900' }], size: 0.97 },
    mono: { faces: [{ url: spaceMono400, weight: '400' }, { url: spaceMono700, weight: '700' }], size: 0.98 },
    serif: { faces: [{ url: playfair, weight: '400 900', style: it }], size: 0.82 },
  },
  {
    id: 'editorial',
    display: { faces: [{ url: fraunces, weight: '100 900' }], size: 0.93 },
    mono: { faces: [{ url: plexMono400, weight: '400' }, { url: plexMono700, weight: '700' }], size: 1 },
    serif: { faces: [{ url: frauncesItalic, weight: '100 900', style: it }], size: 0.8 },
  },
  {
    id: 'tech',
    display: { faces: [{ url: spaceGrotesk, weight: '300 700' }], size: 0.92 },
    mono: { faces: [{ url: firaCode, weight: '300 700' }], size: 1 },
    serif: { faces: [{ url: dmSerif, weight: '400', style: it }], size: 0.8 },
  },
  {
    id: 'stretch',
    display: { faces: [{ url: anybody, weight: '100 900', stretch: '50% 150%' }], size: 0.86 },
    mono: { faces: [{ url: martianMono, weight: '100 800', stretch: '75% 112.5%' }], size: 0.86 },
    serif: { faces: [{ url: cormorant, weight: '300 700', style: it }], size: 0.99 },
  },
  {
    id: 'modern',
    display: { faces: [{ url: sora, weight: '100 800' }], size: 0.88 },
    mono: { faces: [{ url: redHatMono, weight: '300 700' }], size: 1 },
  },
]

type Kind = 'display' | 'mono' | 'serif'
const KINDS: Kind[] = ['display', 'mono', 'serif']
const LABEL: Record<Kind, string> = { display: 'JY Display', mono: 'JY Mono', serif: 'JY Serif' }

export const familyName = (kind: Kind, index: number) => `${LABEL[kind]} ${index}`

/** CSS font tokens for a pairing — custom face first, the original stack as fallback. */
export function fontTokens(index: number): Record<string, string> {
  const p = PAIRINGS[index] ?? PAIRINGS[0]
  const out: Record<string, string> = {}
  for (const k of KINDS) {
    out[`--f-${k}`] = p[k] ? `"${familyName(k, index)}", ${ORIGINAL_STACKS[k]}` : ORIGINAL_STACKS[k]
  }
  return out
}

type Desc = FontFaceDescriptors & { sizeAdjust?: string }
const cache = new Map<string, Promise<FontFace[]>>()

function loadPairing(index: number): Promise<FontFace[]> {
  const key = String(index)
  let p = cache.get(key)
  if (!p) {
    const pair = PAIRINGS[index]
    const faces: FontFace[] = []
    for (const k of KINDS) {
      const role = pair?.[k]
      if (!role) continue
      for (const f of role.faces) {
        const desc: Desc = { weight: f.weight, style: f.style ?? 'normal', display: 'swap' }
        if (f.stretch) desc.stretch = f.stretch
        if (role.size !== 1) desc.sizeAdjust = `${Math.round(role.size * 100)}%`
        faces.push(new FontFace(familyName(k, index), `url(${f.url}) format('woff2')`, desc))
      }
    }
    p = Promise.all(faces.map((f) => f.load())).then((loaded) => {
      loaded.forEach((f) => document.fonts.add(f))
      return loaded
    })
    p.catch(() => cache.delete(key))
    cache.set(key, p)
  }
  return p
}

/** Resolves true when the pairing's fonts are ready, false on failure or after `timeout` ms. */
export async function loadFonts(index: number, timeout = 1500): Promise<boolean> {
  if (!PAIRINGS[index]) return true
  try {
    return await Promise.race([
      loadPairing(index).then(() => true),
      new Promise<boolean>((r) => setTimeout(() => r(false), timeout)),
    ])
  } catch {
    return false
  }
}
