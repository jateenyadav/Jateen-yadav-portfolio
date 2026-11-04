import { useRef, useState } from 'react'
import { gsap, useGSAP, SplitText, scrollToTarget, prefersReducedMotion } from '../lib/motion'
import { profile } from '../data/content'
import Magnetic from './Magnetic'

export default function Contact() {
  const root = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const split = SplitText.create('.contact__title', { type: 'lines,chars', mask: 'lines' })
      gsap.from(split.chars, {
        yPercent: 115,
        rotate: 4,
        duration: 1.3,
        ease: 'expo.out',
        stagger: 0.02,
        scrollTrigger: { trigger: '.contact__title', start: 'top 80%' },
      })
      gsap.from('.contact__row > *, .footer > *', {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: '.contact__row', start: 'top 92%' },
      })
      return () => split.revert()
    },
    { scope: root },
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      window.location.href = `mailto:${profile.email}`
    }
  }

  return (
    <section ref={root} id="contact" className="contact" data-morph="0" aria-labelledby="contact-title">
      <div className="eyebrow mono">(05) — Contact</div>

      <h2 id="contact-title" className="contact__title">
        Let's build
        <br />
        <span className="serif">something</span> real.
      </h2>

      <div>
        <div className="contact__row">
          <div>
            <button className="email-btn" onClick={copy} data-cursor={copied ? 'Copied' : 'Copy'}>
              {profile.email}
            </button>
            <span className="email-btn__hint mono" aria-live="polite">
              {copied ? 'Copied to clipboard ✓' : 'Click to copy · or '}
              {!copied && (
                <a href={`mailto:${profile.email}`} className="accent">
                  open mail
                </a>
              )}
            </span>
          </div>

          <div className="contact__aside">
            <span className="status-dot mono" style={{ display: 'inline-flex' }}>
              {profile.status} — {profile.location}
            </span>
            <div className="socials">
              {profile.socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="roll mono" data-text={s.label}>
                  <span>{s.label}</span>
                </a>
              ))}
              <a href={profile.resume} target="_blank" rel="noreferrer" className="roll mono" data-text="Resume">
                <span>Resume</span>
              </a>
            </div>
          </div>
        </div>

        <footer className="footer mono">
          <span>© {new Date().getFullYear()} {profile.name}</span>
          <span>Designed &amp; engineered by me — React · Three.js · GSAP</span>
          <Magnetic>
            <button className="roll" data-text="Back to top ↑" onClick={() => scrollToTarget(0)}>
              <span>Back to top ↑</span>
            </button>
          </Magnetic>
        </footer>
      </div>
    </section>
  )
}
