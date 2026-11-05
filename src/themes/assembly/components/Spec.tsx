import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/motion'
import { profile, spec, statement, stats } from '../../../data/content'
import Dotted from '../../../shared/Dotted'
import Barcode from './Barcode'
import StationBar from './StationBar'

// Only the repeated "one" and the payoff word are inked in accent.
const HIGHLIGHT = new Set(['one', 'truth.'])

export default function Spec() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.to('.spec__statement .w', {
        opacity: 1,
        stagger: 0.1,
        ease: 'none',
        scrollTrigger: { trigger: '.spec__statement', start: 'top 80%', end: 'bottom 50%', scrub: true },
      })
      gsap.from('.plate__row', {
        opacity: 0,
        x: -10,
        duration: 0.01,
        stagger: 0.08,
        scrollTrigger: { trigger: '.plate', start: 'top 75%' },
      })
      gsap.utils.toArray<HTMLElement>('.gauge').forEach((g) => {
        const num = g.querySelector<HTMLElement>('.gauge__num')!
        const end = Number(num.dataset.value)
        const st = { v: 0 }
        gsap.to(st, {
          v: end,
          duration: 1.4,
          ease: 'steps(12)',
          scrollTrigger: { trigger: g, start: 'top 88%' },
          onUpdate: () => {
            num.textContent = String(Math.round(st.v)).padStart(2, '0')
          },
        })
        gsap.from(g.querySelector('.gauge__fill'), { scaleX: 0, duration: 1.4, ease: 'steps(12)', scrollTrigger: { trigger: g, start: 'top 88%' } })
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} id="spec" className="stn">
      <StationBar code="01" name="Spec sheet" state="Verified" extra="Plate 01 / 01" />
      <h2 className="h2">
        Spec <span className="serif">sheet</span>
      </h2>
      <div className="spec">
        <p className="spec__statement">
          {statement.split(' ').map((word, i) => (
            <span key={i} className={`w ${HIGHLIGHT.has(word) ? 'hl' : ''}`}>
              {word}{' '}
            </span>
          ))}
        </p>

        <div className="plate">
          <span className="screw screw--tl" aria-hidden="true" />
          <span className="screw screw--tr" aria-hidden="true" />
          <span className="screw screw--bl" aria-hidden="true" />
          <span className="screw screw--br" aria-hidden="true" />
          <div className="plate__head mono">
            <span>Specification</span>
            <span>{profile.model}</span>
          </div>
          <dl className="plate__rows">
            {spec.map(([k, v]) => (
              <div className="plate__row" key={k}>
                <dt className="mono">{k}</dt>
                <dd>
                  <Dotted text={v} />
                </dd>
              </div>
            ))}
          </dl>
          <div className="plate__foot">
            <Barcode value="JY-2026-CSE-843" height={36} />
            <span className="mono">SN 2019-CSE · MADE IN INDIA</span>
          </div>
        </div>
      </div>

      <div className="gauges">
        {stats.map((s) => (
          <div className="gauge" key={s.label}>
            <div className="gauge__top">
              <span className="gauge__num" data-value={s.value}>
                {String(s.value).padStart(2, '0')}
              </span>
              <span className="gauge__unit mono">{s.unit}</span>
            </div>
            <div className="gauge__bar" aria-hidden="true">
              <span className="gauge__fill" style={{ width: `${(s.value / s.max) * 100}%` }} />
            </div>
            <div className="gauge__label mono">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
