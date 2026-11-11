import { useEffect, useId, useRef, useState } from 'react'
import { THEMES, themeById } from './registry'
import type { SurpriseInfo } from './surprise'

type Origin = { x: number; y: number }
type Props = {
  current: string
  /** The surprise look currently on, if any. */
  surprise: SurpriseInfo | null
  onSelect: (id: string, origin: Origin) => void
  onSurprise: (origin: Origin) => void
  /** Called when the menu opens (used to prefetch the next surprise). */
  onOpen?: () => void
}

/** Floating theme picker, shared by every theme. Themes restyle it through --tsw-* variables. */
export default function ThemeSwitcher({ current, surprise, onSelect, onSurprise, onOpen }: Props) {
  const [open, setOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const lookButton = useRef<HTMLButtonElement>(null)
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

  const centre = (el: HTMLElement | null): Origin => {
    const r = el?.getBoundingClientRect()
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: innerWidth / 2, y: innerHeight / 2 }
  }
  const pick = (id: string) => {
    setOpen(false)
    onSelect(id, centre(button.current))
  }
  const newLook = () => {
    setOpen(false)
    onSurprise(centre(lookButton.current))
  }
  const currentName = surprise ? surprise.name : themeById(current).name

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
              aria-checked={t.id === current && !surprise}
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
                {t.id === current && !surprise ? '✓' : ''}
              </span>
            </button>
          ))}
          {surprise && (
            <p className="tsw__now">
              Now wearing <strong>{surprise.name}</strong> · look No. {surprise.count}. Pick a theme above to go back.
            </p>
          )}
        </div>
      )}
      <div className="tsw__row">
        <button
          ref={lookButton}
          type="button"
          className="tsw__btn tsw__btn--look"
          aria-label="New look: give the page a brand-new random style"
          title="New colours, fonts & motion. Never the same twice"
          onPointerEnter={onOpen}
          onFocus={onOpen}
          onClick={newLook}
        >
          <span className="tsw__spark" aria-hidden="true">
            ✨
          </span>
          <span className="tsw__label">New look</span>
        </button>
        <button
          ref={button}
          type="button"
          className="tsw__btn"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-label={`Theme: ${currentName}. Change theme`}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="tsw__icon" aria-hidden="true" />
          <span className="tsw__label">Theme</span>
          <span className="tsw__current">{currentName}</span>
        </button>
      </div>
      <span className="tsw__sr" aria-live="polite">
        {surprise ? `New look: ${surprise.name}` : ''}
      </span>
    </div>
  )
}
