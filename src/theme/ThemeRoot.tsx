import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import { flushSync } from 'react-dom'
import { DEFAULT_THEME, initialThemeId, persistTheme, themeById, type ThemeModule } from './registry'
import ThemeSwitcher from './ThemeSwitcher'
import { clearSurprise, peekSaved } from './surprise/dom'
import type { SurpriseInfo } from './surprise'

type Active = { id: string; Page: ComponentType }
type Origin = { x: number; y: number }

const modules = new Map<string, Promise<ThemeModule>>()

/** Loads a theme's code once; the promise is reused for every later switch. */
function loadTheme(id: string): Promise<ThemeModule> {
  let p = modules.get(id)
  if (!p) {
    p = themeById(id).load()
    p.catch(() => modules.delete(id)) // allow a retry after a network blip
    modules.set(id, p)
  }
  return p
}

/** The surprise feature lives in its own chunk, fetched on first use. */
const loadSurprise = () => import('./surprise')

/** Give a theme's web fonts a short head start so the reveal doesn't flash fallback type. */
async function warmFonts(mod: ThemeModule) {
  if (!mod.fonts?.length || !document.fonts) return
  const load = Promise.all(mod.fonts.map((f) => document.fonts.load(f).catch(() => [])))
  await Promise.race([load, new Promise((r) => setTimeout(r, 700))])
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const hasThemeParam = () => {
  try {
    return new URLSearchParams(window.location.search).has('theme')
  } catch {
    return false
  }
}

/**
 * Run a DOM update inside a View Transition and reveal the new page with `play`
 * (default: a circle growing from the switcher). Falls back to an instant swap.
 */
async function runTransition(update: () => void, play: (() => void) | null, fx?: string) {
  if (!document.startViewTransition || reducedMotion()) {
    update()
    return
  }
  const root = document.documentElement
  if (fx) root.dataset.sxFx = fx
  try {
    const transition = document.startViewTransition(update)
    await transition.ready
    play?.()
    await transition.finished
  } finally {
    delete root.dataset.sxFx
  }
}

function circleReveal(origin?: Origin) {
  const x = origin?.x ?? window.innerWidth / 2
  const y = origin?.y ?? window.innerHeight / 2
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  document.documentElement.animate(
    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
    { duration: 750, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
  )
}

export default function ThemeRoot() {
  const [active, setActive] = useState<Active | null>(null)
  const [surprise, setSurprise] = useState<SurpriseInfo | null>(null)
  const [failed, setFailed] = useState(false)
  const busy = useRef(false)

  useEffect(() => {
    let alive = true
    const start = async (id: string) => {
      const mod = await loadTheme(id)
      await warmFonts(mod)
      // A saved surprise look is applied before the page mounts, so GSAP measures the final fonts.
      let info: SurpriseInfo | null = null
      if (id === 'assembly' && !hasThemeParam() && peekSaved()) {
        try {
          const sx = await loadSurprise()
          const saved = await sx.restore()
          if (saved && alive) {
            sx.applySurprise(saved.theme)
            info = sx.info(saved)
          }
        } catch {
          clearSurprise() // fall back to the original look
        }
      }
      if (alive) {
        setSurprise(info)
        setActive({ id, Page: mod.default })
      }
    }
    const id = initialThemeId()
    start(id).catch(() => (id !== DEFAULT_THEME ? start(DEFAULT_THEME) : Promise.reject()).catch(() => alive && setFailed(true)))
    return () => {
      alive = false
    }
  }, [])

  // `data-skin` (not data-theme: the chess skin uses that for its own dark/light switch).
  // The boot colour only covers the first paint; once a skin is mounted its own CSS owns the page.
  useLayoutEffect(() => {
    if (!active) return
    const meta = themeById(active.id)
    const root = document.documentElement
    root.dataset.skin = meta.id
    root.style.removeProperty('background-color')
    // a surprise sets its own paper colour as the browser UI colour — don't overwrite it
    if (!root.dataset.surprise) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', meta.themeColor)
  }, [active])

  const switchTo = useCallback(
    async (id: string, origin?: Origin) => {
      // picking the current skin again only matters when it is wearing a surprise (→ back to the original)
      if (busy.current || (id === active?.id && !surprise)) return
      busy.current = true
      try {
        const mod = await loadTheme(id)
        await warmFonts(mod)
        persistTheme(id)
        const changing = id !== active?.id

        const apply = () => {
          clearSurprise()
          flushSync(() => {
            setSurprise(null)
            if (changing) setActive({ id, Page: mod.default })
          })
          if (changing) window.scrollTo(0, 0) // every theme starts at its own top
        }
        if (surprise) loadSurprise().then((sx) => sx.forget()).catch(() => undefined)
        await runTransition(apply, () => circleReveal(origin))
      } catch {
        // a failed download leaves the current theme in place
      } finally {
        busy.current = false
      }
    },
    [active?.id, surprise],
  )

  const surpriseMe = useCallback(
    async (origin?: Origin) => {
      if (busy.current) return
      busy.current = true
      try {
        const sx = await loadSurprise()
        const mod = await loadTheme('assembly')
        await warmFonts(mod)
        const next = await sx.next()
        persistTheme('assembly')
        const changing = active?.id !== 'assembly'

        const apply = () => {
          sx.applySurprise(next.theme) // tokens first: a freshly mounted page measures the new fonts
          flushSync(() => {
            setSurprise(sx.info(next))
            if (changing) setActive({ id: 'assembly', Page: mod.default })
          })
          if (changing) window.scrollTo(0, 0)
        }
        const fx = sx.effectFor(next.theme)
        const o = origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        await runTransition(apply, () => sx.playEffect(fx, o), fx)
      } catch {
        // anything failing leaves the current look in place
      } finally {
        busy.current = false
      }
    },
    [active?.id],
  )

  if (failed) {
    return (
      <p className="theme-error">
        This page didn’t load properly. <a href={window.location.pathname}>Reload</a>
      </p>
    )
  }

  return (
    <>
      {active ? <active.Page key={active.id} /> : <div className="theme-loading" aria-busy="true" aria-label="Loading" />}
      {active && (
        <ThemeSwitcher
          current={active.id}
          surprise={surprise}
          onSelect={switchTo}
          onSurprise={surpriseMe}
          onOpen={() => loadSurprise().then((sx) => sx.prefetchNext()).catch(() => undefined)}
        />
      )}
    </>
  )
}
