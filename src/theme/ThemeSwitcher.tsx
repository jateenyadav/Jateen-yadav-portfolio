import { useEffect, useId, useRef, useState } from 'react'
import { THEMES, themeById } from './registry'

type Props = {
  current: string
  onSelect: (id: string, origin: { x: number; y: number }) => void
}

/** Floating theme picker, shared by every theme. Themes restyle it through --tsw-* variables. */
export default function ThemeSwitcher({ current, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  // Shrink to an icon while the visitor scrolls down (it floats over content), grow back on the way up.
  useEffect(() => {
    let last = window.scrollY
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const y = window.scrollY
        if (Math.abs(y - last) > 6) setCompact(y > 240 && y > last)
        last = y
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    root.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  const pick = (id: string) => {
    setOpen(false)
    const r = button.current?.getBoundingClientRect()
    onSelect(id, r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: innerWidth / 2, y: innerHeight / 2 })
  }

  return (
    <div ref={root} className="tsw" data-open={open || undefined} data-compact={(compact && !open) || undefined}>
      {open && (
        <div className="tsw__panel" id={menuId} role="menu" aria-label="Choose a theme">
          <p className="tsw__title">Theme</p>
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={t.id === current}
              className="tsw__opt"
              onClick={() => pick(t.id)}
            >
              <span
                className="tsw__swatch"
                aria-hidden="true"
                style={{ ['--s1' as string]: t.swatch[0], ['--s2' as string]: t.swatch[1], ['--s3' as string]: t.swatch[2] }}
              />
              <span className="tsw__text">
                <span className="tsw__name">{t.name}</span>
                <span className="tsw__tag">{t.tagline}</span>
              </span>
              <span className="tsw__check" aria-hidden="true">
                {t.id === current ? '✓' : ''}
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        ref={button}
        type="button"
        className="tsw__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Theme: ${themeById(current).name}. Change theme`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="tsw__icon" aria-hidden="true" />
        <span className="tsw__label">Theme</span>
        <span className="tsw__current">{themeById(current).name}</span>
      </button>
    </div>
  )
}
