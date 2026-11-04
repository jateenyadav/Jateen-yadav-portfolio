import { useRef } from 'react'
import { gsap, useGSAP, ScrollTrigger, scrollToTarget } from '../lib/motion'
import { profile } from '../data/content'
import Magnetic from './Magnetic'

export default function Nav() {
  const nav = useRef<HTMLElement>(null)
  const bar = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          gsap.set(bar.current, { scaleX: self.progress })
          nav.current?.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 240)
        },
      })
    },
    { scope: nav },
  )

  return (
    <>
      <div ref={bar} className="progress" aria-hidden="true" />
      <header ref={nav} className="nav">
        <a
          href="#top"
          className="nav__mark"
          aria-label="Jateen Yadav — back to top"
          onClick={(e) => {
            e.preventDefault()
            scrollToTarget(0)
          }}
        >
          JY
        </a>
        <span className="nav__id mono">
          {profile.model} · {profile.name}
        </span>
        <div className="nav__right">
          <span className="status mono">
            <i aria-hidden="true" /> {profile.status}
          </span>
          <Magnetic>
            <a className="btn btn--sm btn--ink" href={profile.resume} target="_blank" rel="noreferrer">
              CV ↗
            </a>
          </Magnetic>
        </div>
      </header>
    </>
  )
}
