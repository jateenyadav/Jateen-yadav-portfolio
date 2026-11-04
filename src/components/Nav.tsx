import { useRef } from 'react'
import { gsap, useGSAP, ScrollTrigger, scrollToTarget } from '../lib/motion'
import { profile } from '../data/content'
import Magnetic from './Magnetic'

const links = [
  { href: '#work', label: 'Work' },
  { href: '#about', label: 'About' },
  { href: '#experience', label: 'Experience' },
  { href: '#contact', label: 'Contact' },
]

export default function Nav({ ready }: { ready: boolean }) {
  const nav = useRef<HTMLElement>(null)
  const bar = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      // Hide on scroll down, reveal on scroll up; drive the top progress bar.
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          gsap.set(bar.current, { scaleX: self.progress })
          const hidden = self.direction === 1 && self.scroll() > 240
          nav.current?.classList.toggle('is-hidden', hidden)
        },
      })
    },
    { scope: nav },
  )

  useGSAP(
    () => {
      if (!ready) return
      gsap.from('.nav > *', { y: -30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, delay: 0.5 })
    },
    { dependencies: [ready], scope: nav },
  )

  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    scrollToTarget(href)
  }

  return (
    <>
      <div ref={bar} className="progress" aria-hidden="true" />
      <header ref={nav} className="nav">
        <Magnetic strength={0.5}>
          <a href="#top" className="nav__logo" aria-label="Jateen Yadav — back to top" onClick={(e) => go(e, '#top')}>
            JY
          </a>
        </Magnetic>
        <nav aria-label="Primary">
          <ul className="nav__links">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="roll mono" data-text={l.label} onClick={(e) => go(e, l.href)}>
                  <span>{l.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="nav__right">
          <span className="status-dot mono">{profile.status}</span>
          <Magnetic>
            <a className="btn btn--sm btn--solid" href={profile.resume} target="_blank" rel="noreferrer">
              Resume <span className="btn__arrow">↗</span>
            </a>
          </Magnetic>
        </div>
      </header>
    </>
  )
}
