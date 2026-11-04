import { useEffect, useRef, useState } from 'react'
import { gsap, useGSAP, SplitText, scrollToTarget, prefersReducedMotion } from '../lib/motion'
import { hero, profile } from '../data/content'
import Magnetic from './Magnetic'

function useLocalTime(tz: string) {
  const fmt = () =>
    new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(new Date())
  const [time, setTime] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 15000)
    return () => clearInterval(id)
  })
  return time
}

export default function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const time = useLocalTime(profile.timezone)

  useGSAP(
    () => {
      if (!title.current) return
      const reduced = prefersReducedMotion()
      const split = SplitText.create(title.current, { type: 'lines,chars', mask: 'lines', linesClass: 'hero-line' })

      if (reduced) return () => split.revert()

      gsap.set(split.chars, { yPercent: 115 })
      gsap.set('.hero__meta > *, .hero__intro, .hero__cta > *, .scroll-hint', { opacity: 0, y: 24 })

      if (!ready) return () => split.revert()

      const tl = gsap.timeline({ delay: 0.15 })
      tl.to(split.chars, {
        yPercent: 0,
        duration: 1.3,
        ease: 'expo.out',
        stagger: { each: 0.018, from: 'start' },
      })
        .to('.hero__meta > *', { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, 0.35)
        .to('.hero__intro, .hero__cta > *, .scroll-hint', { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, 0.7)

      // Scroll-out: the headline drifts up and dims as you leave the hero.
      gsap.to(title.current, {
        yPercent: -18,
        opacity: 0.25,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })

      return () => split.revert()
    },
    { dependencies: [ready], scope: root },
  )

  return (
    <section ref={root} id="top" className="hero" data-morph="0">
      <div className="hero__meta mono">
        <span>(JY) {hero.kicker}</span>
        <span>{profile.roles.join(' · ')}</span>
        <span>
          {profile.location} — {time} IST
        </span>
      </div>

      <h1 ref={title} className="hero__title" aria-label={`${hero.lineA} ${hero.lineB} ${hero.lineC}`}>
        <span className="block">{hero.lineA}</span>
        <span className="block indent">
          for <span className="serif">every screen</span>
        </span>
        <span className="block">{hero.lineC}</span>
      </h1>

      <div className="hero__foot">
        <p className="hero__intro">{hero.intro}</p>
        <div className="hero__cta">
          <Magnetic>
            <a
              href="#work"
              className="btn btn--solid"
              onClick={(e) => {
                e.preventDefault()
                scrollToTarget('#work')
              }}
            >
              See the work <span className="btn__arrow">↘</span>
            </a>
          </Magnetic>
          <Magnetic>
            <a href={`mailto:${profile.email}`} className="btn">
              Say hello <span className="btn__arrow">↗</span>
            </a>
          </Magnetic>
        </div>
      </div>

      <div className="scroll-hint mono" aria-hidden="true">
        <span>Scroll</span>
        <span className="scroll-hint__line" />
      </div>
    </section>
  )
}
