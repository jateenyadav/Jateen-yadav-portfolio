import { useEffect, useRef } from 'react'
import { gsap, isFinePointer } from '../lib/motion'

/**
 * Two-part cursor (dot + trailing ring) using mix-blend-mode: difference.
 * Elements with data-cursor="Label" grow the ring and show the label;
 * other links/buttons get a medium ring.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!isFinePointer() || !dot.current || !ring.current) return
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3.out' })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3.out' })
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.5, ease: 'power3.out' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.5, ease: 'power3.out' })

    const move = (e: PointerEvent) => {
      dx(e.clientX)
      dy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)
    }

    const over = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null
      const labelled = el?.closest<HTMLElement>('[data-cursor]')
      const link = el?.closest('a, button')
      const r = ring.current!
      if (labelled) {
        r.classList.add('is-hover')
        r.classList.remove('is-link')
        if (label.current) label.current.textContent = labelled.dataset.cursor ?? ''
      } else if (link) {
        r.classList.add('is-link')
        r.classList.remove('is-hover')
      } else {
        r.classList.remove('is-hover', 'is-link')
      }
    }

    const down = () => gsap.to(ring.current, { scale: 0.85, duration: 0.2 })
    const up = () => gsap.to(ring.current, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' })
    const leave = () => gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.3 })
    const enter = () => gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.3 })

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', over, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    document.documentElement.addEventListener('pointerleave', leave)
    document.documentElement.addEventListener('pointerenter', enter)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.documentElement.removeEventListener('pointerleave', leave)
      document.documentElement.removeEventListener('pointerenter', enter)
    }
  }, [])

  return (
    <>
      <div ref={dot} className="cursor" aria-hidden="true" />
      <div ref={ring} className="cursor-ring" aria-hidden="true">
        <span ref={label} className="cursor-ring__label" />
      </div>
    </>
  )
}
