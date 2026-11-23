import { useEffect, useRef, useState } from 'react'
import { archive, experience, hero, modules, profile, projects, spec, statement, stats } from '../../data/content'
import { gsap, ScrollTrigger, useGSAP, initSmoothScroll, destroySmoothScroll, scrollToTarget, prefersReducedMotion } from '../../lib/motion'
import { hasWebGL } from '../../shared/stage'
import { FORMATIONS } from './formations'
import type { FlowScene } from './scene'
import ProjectMedia from '../../shared/ProjectMedia'

const NAV = [
  { label: 'About', to: '#fl-about' },
  { label: 'Skills', to: '#fl-skills' },
  { label: 'Work', to: '#fl-work' },
  { label: 'Experience', to: '#fl-exp' },
  { label: 'Contact', to: '#fl-contact' },
]

const isSmall = () => window.innerWidth < 860
const focusY = () => (isSmall() ? 0.26 : 0.5)
const pad = (n: number) => String(n).padStart(2, '0')

function Slot({ i }: { i: number }) {
  return <div className="fl-slot" data-slot={i} aria-hidden="true" />
}

function LifeCard() {
  return (
    <div className="fl-life" aria-hidden="true">
      <p className="fl-life__k">LifeOS / today</p>
      <p className="fl-life__big">
        Notes, reminders, workouts, routines <em>&amp;</em> expenses
      </p>
      <div className="fl-life__row">
        {['Web', 'Android', 'iOS'].map((p) => (
          <span key={p}>{p}</span>
        ))}
      </div>
      <p className="fl-life__ask">
        <span>AI</span> “What did I spend on food this week?”
      </p>
    </div>
  )
}

export default function FlowPage() {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const fig = useRef<HTMLSpanElement>(null)
  const sceneRef = useRef<FlowScene | null>(null)
  const [webgl, setWebgl] = useState<boolean | null>(null)

  const anchors = useRef<number[]>([])
  const measure = () => {
    const slots = root.current?.querySelectorAll<HTMLElement>('[data-slot]')
    if (!slots) return
    const vh = window.innerHeight
    const fy = focusY()
    anchors.current = Array.from(slots).map((el) => {
      const r = el.getBoundingClientRect()
      return Math.max(0, r.top + window.scrollY + r.height / 2 - vh * fy)
    })
    anchors.current[0] = 0
  }
  const stageAt = (y: number) => {
    const a = anchors.current
    if (a.length < 2 || y <= a[0]) return 0
    for (let i = 0; i < a.length - 1; i++) {
      if (y < a[i + 1]) {
        const raw = (y - a[i]) / Math.max(1, a[i + 1] - a[i])
        return i + Math.min(1, Math.max(0, (raw - 0.2) / 0.6))
      }
    }
    return a.length - 1
  }

  useEffect(() => {
    initSmoothScroll()
    const refresh = () => {
      ScrollTrigger.refresh()
      measure()
    }
    measure()
    document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh)
    window.addEventListener('resize', measure)
    ScrollTrigger.addEventListener('refresh', measure)
    // the figure caption follows the formation; text only changes when the stage does
    let shown = -1
    const onScroll = () => {
      const s = Math.round(stageAt(window.scrollY))
      if (s === shown || !fig.current) return
      shown = s
      fig.current.textContent = `Fig. ${pad(s + 1)} — ${FORMATIONS[s].name}`
      // the last block has its own footer in that corner
      fig.current.style.opacity = s === FORMATIONS.length - 1 ? '0' : ''
      sceneRef.current?.invalidate()
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('load', refresh)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', onScroll)
      ScrollTrigger.removeEventListener('refresh', measure)
      destroySmoothScroll()
    }
  }, [])

  useEffect(() => {
    let alive = true
    if (!canvas.current || !hasWebGL()) {
      setWebgl(false)
      return
    }
    const reduce = prefersReducedMotion()
    const onScroll = () => sceneRef.current?.invalidate()
    import('./scene')
      .then(({ createFlowScene }) => {
        if (!alive || !canvas.current) return
        const s = createFlowScene(canvas.current, FORMATIONS, {
          stage: () => stageAt(window.scrollY),
          layout: (w, h) => {
            if (w < 860) return { x: 0.5, y: 0.26, size: Math.min(0.42, (0.62 * w) / h) }
            return { x: 0.74, y: 0.5, size: 0.56 }
          },
        })
        sceneRef.current = s
        setWebgl(Boolean(s))
        if (s && reduce) window.addEventListener('scroll', onScroll, { passive: true })
      })
      .catch(() => alive && setWebgl(false))
    return () => {
      alive = false
      window.removeEventListener('scroll', onScroll)
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('.fl-hero__name .fl-line > span', { yPercent: 108, duration: 1.4, ease: 'expo.out', stagger: 0.09, delay: 0.1 })
      gsap.from('.fl-hero .fl-fade', { opacity: 0, y: 18, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.55 })
      gsap.set('.fl-rv', { opacity: 0, y: 30 })
      ScrollTrigger.batch('.fl-rv', {
        start: 'top 90%',
        once: true,
        // a jump (nav, reload mid-page) can enter dozens at once: cap the total stagger
        onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: Math.min(0.07, 0.35 / els.length), overwrite: true }),
      })
      // big project titles slide in from their own weight
      gsap.utils.toArray<HTMLElement>('.fl-proj__t').forEach((el) => {
        gsap.fromTo(el, { xPercent: -4 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 30%', scrub: true } })
      })
    },
    { scope: root },
  )

  const go = (to: string) => scrollToTarget(to, isSmall() ? -8 : -30)
  const hover = (i: number) => sceneRef.current?.hover(i)

  return (
    <div className="fl" ref={root} data-webgl={webgl === false ? 'off' : webgl ? 'on' : undefined}>
      <canvas ref={canvas} className="fl-canvas" aria-hidden="true" />
      <div className="fl-blob" aria-hidden="true">
        <i />
      </div>
      <div className="fl-grain" aria-hidden="true" />

      <header className="fl-nav">
        <button type="button" className="fl-nav__me" onClick={() => scrollToTarget(0)}>
          Jateen<em>Yadav</em>
        </button>
        <nav aria-label="Sections">
          {NAV.map((n, i) => (
            <button key={n.to} type="button" onClick={() => go(n.to)}>
              <sup>{pad(i + 1)}</sup>
              {n.label}
            </button>
          ))}
        </nav>
        <a className="fl-nav__cv" href={profile.resume} target="_blank" rel="noreferrer">
          Résumé <span aria-hidden="true">↗</span>
        </a>
      </header>

      <p className="fl-fig" aria-hidden="true">
        <span ref={fig}>Fig. 01 — One drop</span>
      </p>

      <main>
        {/* hero */}
        <section className="fl-block fl-hero" id="fl-top">
          <Slot i={0} />
          <div className="fl-hero__meta fl-fade">
            <span>Portfolio · 2026</span>
            <span>{profile.location}</span>
            <span className="fl-dot">{profile.status}</span>
          </div>
          <h1 className="fl-hero__name" aria-label={profile.name}>
            <span className="fl-line">
              <span>{profile.firstName}</span>
            </span>
            <span className="fl-line">
              <span>{profile.lastName}</span>
            </span>
          </h1>
          <div className="fl-hero__foot">
            <p className="fl-hero__roles fl-fade">
              {profile.roles.map((r, i) => (
                <span key={r}>
                  {i > 0 && <i aria-hidden="true">/</i>}
                  {r}
                </span>
              ))}
            </p>
            <p className="fl-hero__line fl-fade">{hero.line}</p>
            <div className="fl-cta fl-fade">
              <a className="fl-btn" href={`mailto:${profile.email}`}>
                Start a conversation
              </a>
              <button type="button" className="fl-btn fl-btn--ghost" onClick={() => go('#fl-work')}>
                Selected work
              </button>
            </div>
          </div>
          <p className="fl-hint fl-fade">{webgl === false ? 'Scroll' : 'Stir the metal with your cursor · scroll to reshape it'}</p>
        </section>

        {/* about */}
        <section className="fl-block" id="fl-about" aria-labelledby="fl-about-h">
          <Slot i={1} />
          <div className="fl-copy">
            <p className="fl-kick fl-rv">
              <span>01</span> About
            </p>
            <h2 className="fl-statement fl-rv" id="fl-about-h">
              {statement}
            </h2>
            <div className="fl-about__grid">
              <dl className="fl-spec fl-rv">
                {spec.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <ul className="fl-stats">
                {stats.map((s) => (
                  <li key={s.label} className="fl-rv">
                    <b>
                      {s.value}
                      <small>{s.unit}</small>
                    </b>
                    <span>{s.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* skills */}
        <section className="fl-block" id="fl-skills" aria-labelledby="fl-skills-h">
          <Slot i={2} />
          <div className="fl-copy">
            <p className="fl-kick fl-rv">
              <span>02</span> Skills — five modules, one core
            </p>
            <h2 className="fl-h2 fl-rv" id="fl-skills-h">
              What I <em>build</em>
            </h2>
            <ol className="fl-mods">
              {modules.map((m, i) => (
                <li key={m.code} className="fl-mod fl-rv" onPointerEnter={() => hover(i)} onPointerLeave={() => hover(-1)} onFocus={() => hover(i)} onBlur={() => hover(-1)} tabIndex={0}>
                  <span className="fl-mod__n">{pad(i + 1)}</span>
                  <div>
                    <h3>{m.title}</h3>
                    <p className="fl-mod__tag">{m.tagline}</p>
                    <p className="fl-mod__stack">{m.stack}</p>
                    <pre className="fl-mod__log">{m.log.join('\n')}</pre>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* work */}
        <div id="fl-work">
          {projects.map((p, k) => (
            <section className="fl-block fl-proj" key={p.id} aria-labelledby={`fl-p-${p.id}`} style={{ ['--tint' as string]: FORMATIONS[3 + k].tint }}>
              <Slot i={3 + k} />
              <div className="fl-copy">
                <p className="fl-kick fl-rv">
                  <span>03.{k + 1}</span> {k === 0 ? 'Selected work — ' : ''}
                  {p.kind}
                </p>
                <h2 className="fl-proj__t" id={`fl-p-${p.id}`}>
                  {p.title}
                </h2>
                <p className="fl-proj__status fl-rv">
                  <span className="fl-dot">{p.status}</span>
                </p>
                <p className="fl-proj__sum fl-rv">{p.summary}</p>
                <div className="fl-proj__media fl-rv">
                  {p.image ? (
                    <a className="fl-shot" href={p.links[0].href} target="_blank" rel="noreferrer" aria-label={`${p.title} — open live site`}>
                      <ProjectMedia p={p} alt="" />
                    </a>
                  ) : (
                    <LifeCard />
                  )}
                </div>
                <ul className="fl-proj__pts fl-rv">
                  {p.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
                <p className="fl-proj__stack fl-rv">{p.stack.join(' · ')}</p>
                <div className="fl-cta fl-rv">
                  {p.links.map((l, i) => (
                    <a key={l.href} className={`fl-btn${i ? ' fl-btn--ghost' : ''}`} href={l.href} target="_blank" rel="noreferrer">
                      {l.label} <span aria-hidden="true">↗</span>
                    </a>
                  ))}
                </div>
                {k === projects.length - 1 && (
                  <div className="fl-archive fl-rv">
                    <p className="fl-kick">
                      <span>03.5</span> More builds
                    </p>
                    <ul>
                      {archive.map((a) => (
                        <li key={a.href}>
                          <a href={a.href} target="_blank" rel="noreferrer">
                            <b>{a.title}</b>
                            <span>{a.note}</span>
                            <i aria-hidden="true">↗</i>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* experience */}
        <section className="fl-block" id="fl-exp" aria-labelledby="fl-exp-h">
          <Slot i={7} />
          <div className="fl-copy">
            <p className="fl-kick fl-rv">
              <span>04</span> Experience
            </p>
            <h2 className="fl-h2 fl-rv" id="fl-exp-h">
              Where it <em>ran</em>
            </h2>
            <ol className="fl-exp">
              {experience.map((e) => (
                <li key={e.when} className="fl-rv" data-state={e.state}>
                  <p className="fl-exp__when">
                    {e.when}
                    <b>{e.state}</b>
                  </p>
                  <h3>{e.role}</h3>
                  <p className="fl-exp__co">{e.company}</p>
                  <ul>
                    {e.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* contact */}
        <section className="fl-block fl-contact" id="fl-contact" aria-labelledby="fl-contact-h">
          <Slot i={8} />
          <div className="fl-copy">
            <p className="fl-kick fl-rv">
              <span>05</span> Contact — {profile.status}
            </p>
            <h2 className="fl-contact__h fl-rv" id="fl-contact-h">
              Let’s <em>make</em> something.
            </h2>
            <a className="fl-mail fl-rv" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <div className="fl-cta fl-rv">
              <a className="fl-btn" href={profile.resume} target="_blank" rel="noreferrer">
                Résumé (PDF)
              </a>
              {profile.socials.map((s) => (
                <a key={s.href} className="fl-btn fl-btn--ghost" href={s.href} target="_blank" rel="noreferrer">
                  {s.label} <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </div>
          <footer className="fl-foot">
            <span>© {new Date().getFullYear()} {profile.name}</span>
            <span>{profile.location} · IST</span>
            <span>Raymarched in your browser</span>
          </footer>
        </section>
      </main>
    </div>
  )
}
