import { useRef, useState } from 'react'
import { gsap, useGSAP, SplitText, prefersReducedMotion } from '../lib/motion'
import { capabilities } from '../data/content'

/** Hover (or tap) a row: an accent panel floods up from below and the detail unfolds. */
export default function Capabilities() {
  const root = useRef<HTMLElement>(null)
  const [open, setOpen] = useState<number | null>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const split = SplitText.create('.caps-title', { type: 'chars', mask: 'chars' })
      gsap.from(split.chars, {
        yPercent: 110,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.025,
        scrollTrigger: { trigger: '.caps-title', start: 'top 85%' },
      })
      gsap.from('.cap', {
        y: 60,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: '.caps', start: 'top 85%' },
      })
      return () => split.revert()
    },
    { scope: root },
  )

  return (
    <section ref={root} className="section" data-morph="2" aria-labelledby="caps-title">
      <div className="eyebrow mono">(02) — What I do</div>
      <h2 id="caps-title" className="h2 caps-title" style={{ marginBottom: 'clamp(32px, 5vw, 64px)' }}>
        Capabilities
      </h2>
      <ul className="caps">
        {capabilities.map((c, i) => (
          <li key={c.title} className={`cap ${open === i ? 'is-open' : ''}`}>
            <button className="cap__head" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              <span className="cap__idx mono">0{i + 1}</span>
              <span className="cap__title">{c.title}</span>
              <span className="cap__tag">{c.tagline}</span>
              <span className="cap__plus" aria-hidden="true">
                +
              </span>
            </button>
            <div className="cap__body">
              <div>
                <p>{c.detail}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
