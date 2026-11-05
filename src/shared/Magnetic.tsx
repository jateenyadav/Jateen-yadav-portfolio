import { useEffect, useRef, type ReactNode } from 'react'
import { gsap, isFinePointer, prefersReducedMotion } from '../lib/motion'

type Props = { children: ReactNode; strength?: number }

/** Pulls its child toward the cursor while hovered, then springs back. */
export default function Magnetic({ children, strength = 0.35 }: Props) {
  const el = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = el.current
    if (!node || !isFinePointer() || prefersReducedMotion()) return
    const xTo = gsap.quickTo(node, 'x', { duration: 0.6, ease: 'power3.out' })
    const yTo = gsap.quickTo(node, 'y', { duration: 0.6, ease: 'power3.out' })

    const move = (e: PointerEvent) => {
      const r = node.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * strength)
      yTo((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const leave = () => {
      gsap.to(node, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.35)', overwrite: true })
    }
    node.addEventListener('pointermove', move)
    node.addEventListener('pointerleave', leave)
    return () => {
      node.removeEventListener('pointermove', move)
      node.removeEventListener('pointerleave', leave)
    }
  }, [strength])

  return (
    <span ref={el} className="magnetic">
      {children}
    </span>
  )
}
