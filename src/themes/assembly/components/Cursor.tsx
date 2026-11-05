import { useEffect, useRef } from 'react'
import { gsap, isFinePointer } from '../../../lib/motion'

/**
 * Registration-mark crosshair with live pixel coordinates.
 * Elements with data-cursor="Label" swap the coordinates for a label.
 */
export default function Cursor() {
  const root = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || !isFinePointer()) return
    document.documentElement.classList.add('has-cursor')
    const xTo = gsap.quickTo(el, 'x', { duration: 0.18, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.18, ease: 'power3.out' })
    let hoverLabel = ''
    let px = -1
    let py = -1
    gsap.set(el, { opacity: 0 }) // stays hidden until the pointer actually moves

    const coords = () => `x ${String(Math.round(px)).padStart(4, '0')} · y ${String(Math.round(py)).padStart(4, '0')}`
    const sync = (t: Element | null) => {
      const labelled = t?.closest<HTMLElement>('[data-cursor]')
      const link = t?.closest('a, button')
      hoverLabel = labelled?.dataset.cursor ?? (link ? 'Click' : '')
      el.classList.toggle('is-hover', Boolean(hoverLabel))
      if (label.current) label.current.textContent = hoverLabel ? `[ ${hoverLabel} ]` : coords()
    }

    const move = (e: PointerEvent) => {
      if (px < 0) gsap.to(el, { opacity: 1, duration: 0.2 })
      px = e.clientX
      py = e.clientY
      xTo(px)
      yTo(py)
      if (label.current && !hoverLabel) label.current.textContent = coords()
    }
    const over = (e: PointerEvent) => sync(e.target as Element | null)
    // Scrolling moves content under a still pointer — re-check what it's over.
    const onScroll = () => {
      if (px >= 0) sync(document.elementFromPoint(px, py))
    }
    const leave = () => gsap.to(el, { opacity: 0, duration: 0.2 })
    const enter = () => px >= 0 && gsap.to(el, { opacity: 1, duration: 0.2 })

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', over, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    document.documentElement.addEventListener('pointerenter', enter)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      window.removeEventListener('scroll', onScroll)
      document.documentElement.removeEventListener('pointerleave', leave)
      document.documentElement.removeEventListener('pointerenter', enter)
    }
  }, [])

  return (
    <div ref={root} className="xhair" aria-hidden="true">
      <span className="xhair__h" />
      <span className="xhair__v" />
      <span className="xhair__ring" />
      <span ref={label} className="xhair__label mono" />
    </div>
  )
}
