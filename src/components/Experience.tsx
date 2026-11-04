import { useRef } from 'react'
import { gsap, useGSAP, ScrollTrigger, SplitText, prefersReducedMotion } from '../lib/motion'
import { experience } from '../data/content'

/** Sticky heading on the left, a rail that fills with accent as you read down the timeline. */
export default function Experience() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.exp__fill', { scaleY: 1 })
        gsap.utils.toArray<HTMLElement>('.exp__item').forEach((el) => el.classList.add('is-active'))
        return
      }
      const split = SplitText.create('.exp-title', { type: 'chars', mask: 'chars' })
      gsap.from(split.chars, {
        yPercent: 110,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.03,
        scrollTrigger: { trigger: '.exp-title', start: 'top 85%' },
      })

      gsap.to('.exp__fill', {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.exp__list', start: 'top 60%', end: 'bottom 60%', scrub: true },
      })

      gsap.utils.toArray<HTMLElement>('.exp__item').forEach((item) => {
        ScrollTrigger.create({
          trigger: item,
          start: 'top 62%',
          onEnter: () => item.classList.add('is-active'),
          onLeaveBack: () => item.classList.remove('is-active'),
        })
        gsap.from(item.children, {
          y: 30,
          opacity: 0,
          duration: 1,
          ease: 'expo.out',
          stagger: 0.06,
          scrollTrigger: { trigger: item, start: 'top 82%' },
        })
      })
      return () => split.revert()
    },
    { scope: root },
  )

  return (
    <section ref={root} id="experience" className="section" data-morph="2" data-field="0.3" aria-labelledby="exp-title">
      <div className="eyebrow mono">(04) — Experience</div>
      <div className="exp">
        <div className="exp__sticky">
          <h2 id="exp-title" className="h2 exp-title">
            Experience
          </h2>
          <p style={{ color: '#c9c8c2', maxWidth: '34ch', marginTop: 24, fontSize: 'clamp(16px, 1.3vw, 19px)' }}>
            Intern to engineer at Hitachi in under a year — now shipping across web, mobile, desktop and AI for global clients.
          </p>
        </div>
        <div className="exp__list">
          <span className="exp__rail" aria-hidden="true" />
          <span className="exp__fill" aria-hidden="true" />
          <ol className="exp__ol">
          {experience.map((e) => (
            <li className="exp__item" key={e.role + e.period}>
              <div className="exp__period mono">{e.period}</div>
              <h3 className="exp__role">{e.role}</h3>
              <div className="exp__company">
                {e.company}
                {e.sub && (
                  <>
                    {' '}
                    · <span className="serif">{e.sub}</span>
                  </>
                )}
              </div>
              <ul className="exp__points">
                {e.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
