import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import { flushSync } from 'react-dom'
import { DEFAULT_THEME, initialThemeId, persistTheme, themeById, type ThemeModule } from './registry'
import ThemeSwitcher from './ThemeSwitcher'

type Active = { id: string; Page: ComponentType }

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

/** Give a theme's web fonts a short head start so the reveal doesn't flash fallback type. */
async function warmFonts(mod: ThemeModule) {
  if (!mod.fonts?.length || !document.fonts) return
  const load = Promise.all(mod.fonts.map((f) => document.fonts.load(f).catch(() => [])))
  await Promise.race([load, new Promise((r) => setTimeout(r, 700))])
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function ThemeRoot() {
  const [active, setActive] = useState<Active | null>(null)
  const [failed, setFailed] = useState(false)
  const busy = useRef(false)

  useEffect(() => {
    let alive = true
    const start = async (id: string) => {
      const mod = await loadTheme(id)
      await warmFonts(mod)
      if (alive) setActive({ id, Page: mod.default })
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
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', meta.themeColor)
  }, [active])

  const switchTo = useCallback(
    async (id: string, origin?: { x: number; y: number }) => {
      if (busy.current || id === active?.id) return
      busy.current = true
      try {
        const mod = await loadTheme(id)
        await warmFonts(mod)
        persistTheme(id)

        const apply = () => {
          flushSync(() => setActive({ id, Page: mod.default }))
          window.scrollTo(0, 0) // every theme starts at its own top
        }

        if (!document.startViewTransition || reducedMotion()) {
          apply()
          return
        }
        const transition = document.startViewTransition(apply)
        await transition.ready
        const x = origin?.x ?? window.innerWidth / 2
        const y = origin?.y ?? window.innerHeight / 2
        const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 750, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
        )
        await transition.finished
      } catch {
        // a failed download leaves the current theme in place
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
      {active && <ThemeSwitcher current={active.id} onSelect={switchTo} />}
    </>
  )
}
