import { useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/motion'
import { profile } from '../data/content'

type Props = { onDone: () => void }

/** Counter 000 → 100, then the whole screen wipes upward to reveal the site. */
export default function Loader({ onDone }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const count = useRef<HTMLSpanElement>(null)
  const [gone, setGone] = useState(false)

  useGSAP(
    () => {
      const reduced = prefersReducedMotion()
      let seen = false
      try {
        seen = sessionStorage.getItem('jy-seen') === '1'
        sessionStorage.setItem('jy-seen', '1')
      } catch {
        /* storage blocked — just play the full intro */
      }

      if (reduced) {
        onDone()
        setGone(true)
        return
      }

      const state = { v: 0 }
      const tl = gsap.timeline({ paused: true })

      tl.from('.loader__name .mask > span', { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.08 })
        .from('.loader__top > *', { opacity: 0, y: 10, duration: 0.6, stagger: 0.08 }, 0.1)
        .to(
          state,
          {
            v: 100,
            duration: seen ? 0.7 : 2.1,
            ease: 'power3.inOut',
            onUpdate: () => {
              if (count.current) count.current.textContent = String(Math.round(state.v)).padStart(3, '0')
            },
          },
          0.15,
        )
        .to('.loader__bar', { scaleX: 1, duration: seen ? 0.7 : 2.1, ease: 'power3.inOut' }, 0.15)
        .to('.loader__count, .loader__name .mask > span', { yPercent: -110, duration: 0.7, ease: 'expo.in', stagger: 0.04 })
        .add(() => onDone(), '-=0.15')
        .to(root.current, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=0.2')
        .add(() => setGone(true))

      // Wait for fonts so the reveal doesn't reflow mid-animation.
      const start = () => tl.play()
      if (document.fonts?.ready) document.fonts.ready.then(start)
      else start()
    },
    { scope: root },
  )

  if (gone) return null

  return (
    <div ref={root} className="loader" role="status" aria-label="Loading portfolio">
      <div className="loader__top mono">
        <span>(JY) — {profile.roles.join(' / ')}</span>
        <span>{profile.location}</span>
      </div>
      <div className="loader__bottom">
        <div className="loader__name">
          <span className="mask">
            <span>{profile.firstName}</span>
          </span>
          <span className="mask">
            <span className="serif accent">{profile.lastName}</span>
          </span>
        </div>
        <span className="mask">
          <span ref={count} className="loader__count">
            000
          </span>
        </span>
      </div>
      <div className="loader__bar" />
    </div>
  )
}
