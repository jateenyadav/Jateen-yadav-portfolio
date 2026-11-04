import { useRef, useState } from 'react'
import { gsap, useGSAP, SplitText, prefersReducedMotion } from '../lib/motion'
import { archive, projects, type Project } from '../data/content'
import Magnetic from './Magnetic'

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
      <div className="phone-float float-a" style={{ top: '16%', left: '8%' }}>
        <b>₹249</b> Swiggy → Food ✓
      </div>
      <div className="phone-float float-b" style={{ bottom: '18%', right: '7%' }}>
        Ollama · <b>local</b> first
      </div>
    </div>
  )
}

function ProjectCard({ p }: { p: Project }) {
  const [imgOk, setImgOk] = useState(true)
  const live = p.links.find((l) => l.label === 'Live')?.href ?? p.links[0]?.href

  return (
    <article className="project" style={{ ['--p-accent' as string]: p.accent }} aria-labelledby={`p-${p.id}`}>
      <a className="project__visual" href={live} target="_blank" rel="noreferrer" data-cursor={live ? 'Open' : undefined} aria-label={`Open ${p.title}`}>
        {p.visual === 'phone' ? (
          <PhoneMock />
        ) : (
          <>
            <div className="project__browser" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            {p.image && imgOk ? (
              <img className="project__img" src={p.image} alt={`${p.title} screenshot`} loading="lazy" onError={() => setImgOk(false)} />
            ) : (
              <div className="phone-stage" />
            )}
          </>
        )}
      </a>

      <div className="project__info">
        <div className="project__top mono">
          <span>{p.index} / 0{projects.length}</span>
          <span className="project__status">{p.status}</span>
        </div>
        <h3 id={`p-${p.id}`} className="project__title">
          {p.title}
        </h3>
        <div className="project__kind">{p.kind}</div>
        <p className="project__summary">{p.summary}</p>
        <ul className="project__points">
          {p.points.map((pt) => (
            <li key={pt}>{pt}</li>
          ))}
        </ul>
        <div className="chips">
          {p.stack.map((s) => (
            <span className="chip" key={s}>
              {s}
            </span>
          ))}
        </div>
        <div className="project__links">
          {p.links.map((l) => (
            <Magnetic key={l.href}>
              <a className={`btn btn--sm ${l.label === 'Live' ? 'btn--solid' : ''}`} href={l.href} target="_blank" rel="noreferrer">
                {l.label} <span className="btn__arrow">↗</span>
              </a>
            </Magnetic>
          ))}
        </div>
      </div>
    </article>
  )
}

/** Desktop: the section pins and the cards travel horizontally. Mobile: a simple stack. */
export default function Work() {
  const root = useRef<HTMLElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const counter = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const reduced = prefersReducedMotion()
      const split = SplitText.create('.work-title', { type: 'chars', mask: 'chars' })
      if (!reduced) {
        gsap.from(split.chars, {
          yPercent: 110,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.03,
          scrollTrigger: { trigger: '.work-title', start: 'top 85%' },
        })
        gsap.to('.float-a', { y: -14, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 })
        gsap.to('.float-b', { y: 12, duration: 3.1, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      }

      const mm = gsap.matchMedia()
      mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
        const el = track.current!
        const distance = () => el.scrollWidth - window.innerWidth
        const tween = gsap.to(el, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: pin.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })

        gsap.utils.toArray<HTMLElement>('.project', el).forEach((card, i) => {
          // Parallax the screenshot inside its frame as the card travels.
          const img = card.querySelector('.project__img, .phone')
          if (img) {
            gsap.fromTo(
              img,
              { xPercent: -5 },
              {
                xPercent: 5,
                ease: 'none',
                scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
              },
            )
          }
          gsap.from(card.querySelectorAll('.project__info > *'), {
            y: 40,
            opacity: 0,
            duration: 0.9,
            ease: 'expo.out',
            stagger: 0.05,
            scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 75%' },
          })
          gsap.to({}, {
            scrollTrigger: {
              trigger: card,
              containerAnimation: tween,
              start: 'left center',
              end: 'right center',
              onToggle: (self) => {
                if (self.isActive && counter.current) counter.current.textContent = `0${i + 1}`
              },
            },
          })
        })
      })

      mm.add('(max-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('.project').forEach((card) => {
          gsap.from(card, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 88%' } })
        })
      })

      return () => {
        mm.revert()
        split.revert()
      }
    },
    { scope: root },
  )

  return (
    <section ref={root} id="work" className="work" data-morph="3" aria-labelledby="work-title">
      <div className="work__head">
        <div>
          <div className="eyebrow mono" style={{ marginBottom: 20 }}>
            (03) — Selected work
          </div>
          <h2 id="work-title" className="h2 work-title">
            Things I've shipped
          </h2>
        </div>
        <span className="work__count mono">
          <span ref={counter}>01</span> / 0{projects.length}
          <span className="work__hint"> — scroll →</span>
        </span>
      </div>

      <div ref={pin} className="work__pin">
        <div ref={track} className="work__track">
          {projects.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      </div>

      <div className="archive">
        <div className="eyebrow mono">More experiments</div>
        <ul className="archive__list">
          {archive.map((a) => (
            <li key={a.title} className="archive__item">
              <a href={a.href} target="_blank" rel="noreferrer" data-cursor="Visit">
                <span className="archive__title">{a.title}</span>
                <span className="archive__note">{a.note}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
