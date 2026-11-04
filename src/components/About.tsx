import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/motion'
import { statement, stats } from '../data/content'

const HIGHLIGHT = new Set(['architecture,', 'source', 'truth.', 'fast.'])

/** Big statement whose words light up as you scroll, then counting stats. */
export default function About() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      gsap.from('.eyebrow', { opacity: 0, x: -20, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: root.current, start: 'top 80%' } })

      gsap.to('.statement__text .w', {
        opacity: 1,
        stagger: 0.12,
        ease: 'none',
        scrollTrigger: { trigger: '.statement__text', start: 'top 78%', end: 'bottom 42%', scrub: true },
      })

      gsap.utils.toArray<HTMLElement>('.stat__value').forEach((el) => {
        const end = Number(el.dataset.value)
        const state = { v: 0 }
        gsap.to(state, {
          v: end,
          duration: 1.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
          onUpdate: () => {
            el.textContent = String(Math.round(state.v))
          },
        })
      })

      gsap.from('.stat', {
        y: 50,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '.stats', start: 'top 85%' },
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} id="about" className="section" data-morph="1">
      <div className="eyebrow mono">(01) — About</div>
      <p className="statement__text">
        {statement.split(' ').map((word, i) => (
          <span key={i} className={`w ${HIGHLIGHT.has(word) ? 'hl' : ''}`}>
            {word}&nbsp;
          </span>
        ))}
      </p>

      <div className="stats">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="stat__num">
              <span className="stat__value" data-value={s.value}>
                {s.value}
              </span>
              {s.suffix && <sup>{s.suffix}</sup>}
            </div>
            <div className="stat__label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
