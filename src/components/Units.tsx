import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/motion'
import { archive, profile, projects, type Project } from '../data/content'
import Barcode from './Barcode'
import Magnetic from './Magnetic'
import ScanImage from './ScanImage'
import StationBar from './StationBar'

function PhoneMock() {
  return (
    <div className="phone-stage">
      <div className="phone">
        <div className="phone__notch" />
        <div className="phone__screen">
          <div className="phone__hello">Good evening, Jateen</div>
          <div className="phone__card phone__card--accent">
            <span>Today</span>
            <b>3 reminders</b>
          </div>
          <div className="phone__card">
            <span>Workout</span>
            <b>Push · 45m</b>
          </div>
          <div className="phone__card">
            <span>Spent</span>
            <b>₹1,249</b>
          </div>
          <div className="phone__bubble">How much did I spend on food this week?</div>
          <div className="phone__bubble phone__bubble--ai">
            ₹2,310 across 7 orders — 18% less than last week.
            <small>RAG · 7 sources</small>
          </div>
        </div>
      </div>
    </div>
  )
}

function Unit({ p }: { p: Project }) {
  const live = p.links.find((l) => l.label === 'Live')?.href ?? p.links[0]?.href
  const serial = `${profile.model}-U${p.index}-${p.id.toUpperCase()}`
  return (
    <article className="unit" aria-labelledby={`u-${p.id}`}>
      <div className="unit__bar mono">
        <span>
          Unit {p.index} / 0{projects.length}
        </span>
        <span className="unit__bar-title">{p.title}</span>
        <span>{p.status}</span>
      </div>
      <div className="unit__grid">
        <a className="unit__visual" href={live} target="_blank" rel="noreferrer" data-cursor="Open" aria-label={`Open ${p.title}`}>
          {p.visual === 'phone' ? (
            <ScanImage>
              <PhoneMock />
            </ScanImage>
          ) : (
            <ScanImage src={p.image} alt={`${p.title} screenshot`} />
          )}
        </a>

        <div className="label">
          <div className="label__head mono">
            <span>{serial}</span>
            <span className={`stamp stamp--${p.stamp.toLowerCase().replace(/\s+/g, '')}`}>{p.stamp}</span>
          </div>
          <h3 id={`u-${p.id}`} className="label__title">
            {p.title}
          </h3>
          <p className="label__kind serif">{p.kind}</p>
          <p className="label__summary">{p.summary}</p>
          <ul className="label__points">
            {p.points.map((pt) => (
              <li key={pt}>{pt}</li>
            ))}
          </ul>
          <div className="label__field mono">
            <span>Components</span>
            <div className="chips">
              {p.stack.map((s) => (
                <span className="chip" key={s}>
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="label__foot">
            <div className="label__code">
              <Barcode value={serial} height={34} />
              <span className="mono">{serial}</span>
            </div>
            <div className="label__links">
              {p.links.map((l) => (
                <Magnetic key={l.href}>
                  <a className={`btn btn--sm ${l.label === 'Live' ? 'btn--accent' : ''}`} href={l.href} target="_blank" rel="noreferrer">
                    {l.label} ↗
                  </a>
                </Magnetic>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Units() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.utils.toArray<HTMLElement>('.label').forEach((label) => {
        gsap.from(label.children, { opacity: 0, y: 16, duration: 0.5, ease: 'power3.out', stagger: 0.05, scrollTrigger: { trigger: label, start: 'top 80%' } })
        const stamp = label.querySelector('.stamp')
        if (stamp) {
          gsap.from(stamp, { scale: 2.4, opacity: 0, rotate: -24, duration: 0.35, ease: 'back.out(2)', delay: 0.5, scrollTrigger: { trigger: label, start: 'top 80%' } })
        }
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} id="work" className="stn">
      <StationBar code="03" name="Units shipped" state="QA passed" extra={`${projects.length} units`} />
      <h2 className="h2">
        Units <span className="serif">shipped</span>
      </h2>
      <div className="units">
        {projects.map((p) => (
          <Unit key={p.id} p={p} />
        ))}
      </div>

      <div className="bench">
        <div className="bench__head mono">Bench tests — early prototypes</div>
        <ul>
          {archive.map((a) => (
            <li key={a.title}>
              <a href={a.href} target="_blank" rel="noreferrer" data-cursor="Visit">
                <span className="bench__title">{a.title}</span>
                <span className="bench__note">{a.note}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
