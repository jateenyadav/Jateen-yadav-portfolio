import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/motion'
import { experience, profile } from '../data/content'
import StationBar from './StationBar'

/** Experience printed on continuous-feed, green-bar computer paper. */
export default function Logbook() {
  const root = useRef<HTMLElement>(null)
  const today = new Date().toISOString().slice(0, 10)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.utils.toArray<HTMLElement>('.entry').forEach((entry) => {
        gsap.fromTo(
          entry,
          { clipPath: 'inset(0 0 100% 0)' },
          { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'steps(10)', scrollTrigger: { trigger: entry, start: 'top 82%' } },
        )
      })
      gsap.fromTo('.paper', { y: -40 }, { y: 40, ease: 'none', scrollTrigger: { trigger: '.paper', start: 'top bottom', end: 'bottom top', scrub: true } })
    },
    { scope: root },
  )

  return (
    <section ref={root} id="log" className="stn">
      <StationBar code="04" name="Service log" state="Since 2021" />
      <h2 className="h2">
        Service <span className="serif">log</span>
      </h2>
      <div className="paper">
        <div className="paper__head mono">
          <span>{profile.model} · SERVICE LOG</span>
          <span>PRINTED {today}</span>
          <span>PAGE 01/01</span>
        </div>
        {experience.map((e) => (
          <div className="entry" key={e.role + e.when}>
            <span className="entry__when mono">{e.when}</span>
            <span className={`entry__state mono state--${e.state.toLowerCase()}`}>{e.state}</span>
            <div className="entry__body">
              <h3 className="entry__role">{e.role}</h3>
              <div className="entry__company">{e.company}</div>
              <ul className="entry__points">
                {e.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
        <div className="paper__end mono">— END OF LOG · NEXT ENTRY: YOUR TEAM? —</div>
      </div>
    </section>
  )
}
