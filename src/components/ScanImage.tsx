import { useRef, useState, type ReactNode } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/motion'

/** Reveals its content line by line behind an orange scan head, like a page coming out of a printer. */
export default function ScanImage({ src, alt, children }: { src?: string; alt?: string; children?: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const [ok, setOk] = useState(true)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 78%' } })
      tl.fromTo('.scan__content', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.6, ease: 'steps(28)' })
        .fromTo('.scan__head', { top: '0%', opacity: 1 }, { top: '100%', duration: 1.6, ease: 'steps(28)' }, 0)
        .to('.scan__head', { opacity: 0, duration: 0.3 })
    },
    { scope: root },
  )

  return (
    <div ref={root} className="scan">
      <div className="scan__content">
        {children ?? (src && ok ? <img src={src} alt={alt ?? ''} loading="lazy" onError={() => setOk(false)} /> : <div className="scan__blank" />)}
      </div>
      <span className="scan__head" aria-hidden="true" />
    </div>
  )
}
