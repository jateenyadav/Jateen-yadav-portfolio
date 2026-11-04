import { useRef, useState } from 'react'
import { gsap, useGSAP, SplitText, scrollToTarget, prefersReducedMotion } from '../lib/motion'
import { profile } from '../data/content'
import Barcode from './Barcode'
import Magnetic from './Magnetic'
import StationBar from './StationBar'

const order = [
  ['1 × Full-stack engineer', '✓'],
  ['1 × Flutter developer', '✓'],
  ['1 × AI / LLM integrator', '✓'],
  ['1 × Three.js tinkerer', 'free'],
]

export default function Dispatch() {
  const root = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)
  const stamp = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: profile.timezone }).format(new Date())

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      // words + chars: chars animate, words keep the line from breaking mid-word
      const split = SplitText.create('.dispatch__title', { type: 'words,chars' })
      gsap.from(split.chars, {
        opacity: 0,
        scale: 1.6,
        duration: 0.16,
        ease: 'steps(2)',
        stagger: { each: 0.035, from: 'random' },
        scrollTrigger: { trigger: '.dispatch__title', start: 'top 80%' },
      })
      gsap.fromTo(
        '.receipt',
        { clipPath: 'inset(0 0 100% 0)', y: -30 },
        { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 2.2, ease: 'steps(34)', scrollTrigger: { trigger: '.slot', start: 'top 75%' } },
      )
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
    <section ref={root} id="contact" className="stn dispatch-stn">
      <StationBar code="05" name="Dispatch" state="Ready to ship" extra="Lead time: notice period" />
      <div className="dispatch">
        <div className="dispatch__left">
          <h2 className="dispatch__title">
            Ready to
            <br />
            ship to
            <br />
            <span className="accent">your team.</span>
          </h2>
          <button className="email" onClick={copy} data-cursor={copied ? 'Copied' : 'Copy'}>
            {profile.email}
          </button>
          <p className="email__hint mono" aria-live="polite">
            {copied ? 'Copied to clipboard ✓' : 'Click to copy · or '}
            {!copied && (
              <a href={`mailto:${profile.email}`} className="accent">
                open mail
              </a>
            )}
          </p>
          <div className="dispatch__links">
            {profile.socials.map((s) => (
              <Magnetic key={s.label}>
                <a className="btn btn--sm" href={s.href} target="_blank" rel="noreferrer">
                  {s.label} ↗
                </a>
              </Magnetic>
            ))}
            <Magnetic>
              <a className="btn btn--sm btn--ink" href={profile.resume} target="_blank" rel="noreferrer">
                CV ↗
              </a>
            </Magnetic>
          </div>
        </div>

        <div className="dispatch__right">
          <div className="slot" aria-hidden="true">
            <span />
          </div>
          <div className="receipt mono" role="note" aria-label="Dispatch receipt">
            <div className="receipt__brand">{profile.model}</div>
            <div className="receipt__center">DISPATCH TICKET</div>
            <div className="receipt__center">{stamp} IST</div>
            <hr />
            {order.map(([item, v]) => (
              <div className="receipt__row" key={item}>
                <span>{item}</span>
                <span>{v}</span>
              </div>
            ))}
            <hr />
            <div className="receipt__row">
              <span>LEAD TIME</span>
              <span>notice period</span>
            </div>
            <div className="receipt__row">
              <span>SHIP FROM</span>
              <span>Gurugram, IN</span>
            </div>
            <div className="receipt__row">
              <span>SHIP TO</span>
              <span>your team</span>
            </div>
            <hr />
            <div className="receipt__row receipt__total">
              <span>TOTAL</span>
              <span>1 Jateen</span>
            </div>
            <Barcode value={profile.email} height={42} />
            <div className="receipt__center">THANK YOU FOR VISITING</div>
          </div>
        </div>
      </div>

      <footer className="footer mono">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>Printed, not templated — React · TypeScript · Canvas · GSAP</span>
        <button className="footer__top" onClick={() => scrollToTarget(0)}>
          Back to STN-00 ↑
        </button>
      </footer>
    </section>
  )
}
