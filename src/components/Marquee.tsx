import { useRef } from 'react'
import { gsap, useGSAP, ScrollTrigger, prefersReducedMotion } from '../lib/motion'
import { marqueeA, marqueeB } from '../data/content'

function Row({ items, outlineOdd }: { items: string[]; outlineOdd: boolean }) {
  // Content is rendered twice so a -50% translate loops seamlessly.
  const doubled = [...items, ...items]
  return (
    <div className="marquee__row">
      {doubled.map((t, i) => (
        <span key={i} className={`marquee__item ${(i % 2 === 1) === outlineOdd ? 'marquee__item--outline' : ''}`}>
          {t}
          <span className="marquee__star" aria-hidden="true">
            ✦
          </span>
        </span>
      ))}
    </div>
  )
}

/** Two counter-scrolling rows that speed up and skew with scroll velocity. */
export default function Marquee() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const [a, b] = gsap.utils.toArray<HTMLElement>('.marquee__row')
      const ta = gsap.to(a, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 })
      const tb = gsap.fromTo(b, { xPercent: -50 }, { xPercent: 0, duration: 42, ease: 'none', repeat: -1 })
      const skew = gsap.quickTo([a, b], 'skewX', { duration: 0.6, ease: 'power3.out' })

      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const v = self.getVelocity()
          const boost = 1 + Math.min(Math.abs(v) / 250, 5)
          gsap.to([ta, tb], { timeScale: boost * (self.direction === 1 ? 1 : -1), duration: 0.2, overwrite: true })
          gsap.to([ta, tb], { timeScale: 1, duration: 1.2, delay: 0.2, ease: 'power2.out', overwrite: false })
          skew(gsap.utils.clamp(-8, 8, v / -300))
        },
        onLeave: () => skew(0),
        onLeaveBack: () => skew(0),
      })
    },
    { scope: root },
  )

  return (
    <div ref={root} className="marquee" aria-label="Technologies I work with">
      <Row items={marqueeA} outlineOdd />
      <Row items={marqueeB} outlineOdd={false} />
    </div>
  )
}
