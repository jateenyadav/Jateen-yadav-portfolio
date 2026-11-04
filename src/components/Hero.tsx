import { useEffect, useRef, useState } from 'react'
import { gsap, useGSAP, SplitText, scrollToTarget, prefersReducedMotion } from '../lib/motion'
import { hero, profile, ticker } from '../data/content'
import Magnetic from './Magnetic'
import PrintPortrait from './PrintPortrait'
import StationBar from './StationBar'

function useLocalTime(tz: string) {
  const fmt = () =>
    new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: tz }).format(new Date())
  const [time, setTime] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 1000)
    return () => clearInterval(id)
  })
  return time
}

export default function Hero() {
  const root = useRef<HTMLElement>(null)
  const time = useLocalTime(profile.timezone)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      // Letters are "stamped" onto the sheet one at a time, in random order.
      const split = SplitText.create('.hero__name', { type: 'chars' })
      const tl = gsap.timeline({ delay: 0.2 })
      tl.from(split.chars, { opacity: 0, scale: 1.6, duration: 0.18, ease: 'steps(2)', stagger: { each: 0.06, from: 'random' } })
        .from('.hero__model, .hero__line, .hero__cta > *, .hero__label > div', { opacity: 0, y: 14, duration: 0.6, ease: 'power3.out', stagger: 0.07 }, 0.3)
        .from('.annot', { opacity: 0, x: 16, duration: 0.6, ease: 'power3.out' }, 3.4)
      return () => split.revert()
    },
    { scope: root },
  )

  return (
    <section ref={root} id="top" className="stn hero">
      <StationBar code="00" name="Print head" state="Running" extra={`${profile.location} · ${time} IST`} />

      <div className="hero__grid">
        <div className="hero__left">
          <p className="hero__model mono">
            Model {profile.model} — {profile.roles.join(' · ')}
          </p>
          <h1 className="hero__name">
            <span className="block">{hero.title[0]}</span>
            <span className="block">{hero.title[1]}</span>
          </h1>
          <p className="hero__line">{hero.line}</p>
          <div className="hero__cta">
            <Magnetic>
              <a
                href="#work"
                className="btn btn--ink"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToTarget('#work')
                }}
              >
                Inspect the units <span aria-hidden="true">↓</span>
              </a>
            </Magnetic>
            <Magnetic>
              <a href={profile.resume} className="btn" target="_blank" rel="noreferrer">
                Download CV <span aria-hidden="true">↗</span>
              </a>
            </Magnetic>
          </div>
          <dl className="hero__label mono">
            <div>
              <dt>Origin</dt>
              <dd>{profile.location}</dd>
            </div>
            <div>
              <dt>Uptime</dt>
              <dd>3+ yrs production</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd className="ok">● Available</dd>
            </div>
          </dl>
        </div>

        <div className="hero__right">
          <PrintPortrait src={profile.portrait} />
          <span className="annot serif">{hero.note} ↘</span>
        </div>
      </div>

      <div className="ticker mono" aria-label="Status feed">
        <div className="ticker__track">
          {[...ticker, ...ticker].map((t, i) => (
            <span key={i} className="ticker__item">
              <i aria-hidden="true">■</i> {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
