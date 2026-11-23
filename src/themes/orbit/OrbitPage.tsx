import { useEffect, useRef, useState } from 'react'
import { archive, experience, hero, modules, profile, projects } from '../../data/content'
import { gsap, ScrollTrigger, useGSAP, initSmoothScroll, destroySmoothScroll, scrollToTarget, prefersReducedMotion } from '../../lib/motion'
import { hasWebGL } from '../../shared/stage'
import type { OrbitScene, PlanetDef } from './scene'
import ProjectMedia from '../../shared/ProjectMedia'

/** One planet per module (same order as `modules`). */
const PLANETS: PlanetDef[] = [
  // Web — an ocean world
  { color: '#0d3b5c', color2: '#2f8f7f', color3: '#d9e8d0', atmo: '#58c8ff', radius: 1.0, orbit: 6.2, speed: 0.06, phase: 3.6, kind: 0, tilt: 0.3 },
  // Mobile — warm dusty rock with a moon
  { color: '#7a2e1f', color2: '#d9774a', color3: '#f3c08a', atmo: '#ff8a5c', radius: 0.9, orbit: 8.8, speed: 0.045, phase: 1.9, kind: 3, moon: true, tilt: 0.1 },
  // Desktop — ice
  { color: '#2b3f8a', color2: '#9fb4ff', color3: '#eef2ff', atmo: '#8ea6ff', radius: 1.2, orbit: 11.6, speed: 0.035, phase: 2.2, kind: 2, tilt: -0.25 },
  // AI / LLM — a banded giant
  { color: '#5a3a1a', color2: '#e8c27a', color3: '#fff1cf', atmo: '#ffcf7a', radius: 1.7, orbit: 15.2, speed: 0.025, phase: 1.45, kind: 1, moon: true, tilt: 0.12 },
  // 3D / WebGL — ringed
  { color: '#3c1d4f', color2: '#d68ac4', color3: '#ffe0f2', atmo: '#ff8fd6', radius: 1.25, orbit: 19.6, speed: 0.018, phase: 4.2, kind: 1, ring: true, tilt: 0.42 },
]
/** CSS accent per planet (also used by the fallback, rail and cards). */
const ACCENT = ['#6fd3ff', '#ff9a6b', '#a9b9ff', '#ffd27a', '#ff9ad8']
/** Which planet each project belongs to (by its main module). */
const PROJECT_PLANET: Record<string, number> = { lifeos: 1, examace: 3, tinylm: 3, solar: 4, client: 0 }

const COUNT: Record<number, string> = { 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven' }

const go = (target: string) => scrollToTarget(target, 0)
const tourStop = (i: number) => {
  // scroll so stop i is at the middle of its dwell
  const el = document.querySelector<HTMLElement>('.o-tour')
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY
  const range = el.offsetHeight - window.innerHeight
  scrollToTarget(top + range * ((i + 0.72) / modules.length))
}

function Arrow() {
  return (
    <svg className="o-arrow" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 12 L12 4 M5.5 4 H12 V10.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

/** Designed card for LifeOS (no screenshot): a phone with its modules orbiting. */
function LifeCard() {
  return (
    <div className="o-life" aria-hidden="true">
      <div className="o-life__ring" />
      <div className="o-life__phone">
        <span className="o-life__notch" />
        <p className="o-life__hi">Good evening</p>
        <ul>
          <li>
            <i style={{ ['--c' as string]: ACCENT[0] }} />
            Notes <b>12</b>
          </li>
          <li>
            <i style={{ ['--c' as string]: ACCENT[1] }} />
            Workout <b>45m</b>
          </li>
          <li>
            <i style={{ ['--c' as string]: ACCENT[3] }} />
            Spent <b>₹840</b>
          </li>
        </ul>
        <p className="o-life__ask">Ask about your week…</p>
      </div>
    </div>
  )
}

export default function OrbitPage() {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const labels = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<OrbitScene | null>(null)
  const scroll = useRef({ hero: 0, tour: 0, after: 0 })
  const [webgl, setWebgl] = useState<boolean>(() => hasWebGL())
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    initSmoothScroll()
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh)
    return () => {
      window.removeEventListener('load', refresh)
      destroySmoothScroll()
    }
  }, [])

  // three.js lives in its own chunk
  useEffect(() => {
    if (!webgl || !canvas.current) return
    let alive = true
    let onMove: ((e: PointerEvent) => void) | null = null
    import('./scene')
      .then(({ createOrbitScene }) => {
        if (!alive || !canvas.current) return
        const s = createOrbitScene(canvas.current, PLANETS)
        if (!s) {
          setWebgl(false)
          return
        }
        sceneRef.current = s
        s.setScroll(scroll.current)
        if (labels.current) s.bindLabels(Array.from(labels.current.children) as HTMLElement[], labels.current)
        root.current?.classList.add('is-live')
        onMove = (e: PointerEvent) => {
          if (e.pointerType !== 'mouse') return
          s.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1)
        }
        window.addEventListener('pointermove', onMove, { passive: true })
      })
      .catch(() => alive && setWebgl(false))
    return () => {
      alive = false
      if (onMove) window.removeEventListener('pointermove', onMove)
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [webgl])

  useGSAP(
    () => {
      const reduce = prefersReducedMotion()
      const push = () => sceneRef.current?.setScroll(scroll.current)

      if (!reduce) {
        const tl = gsap.timeline({ delay: 0.15 })
        tl.from('.o-hero__name .o-ln > span', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.08 })
          .from('.o-hero__kicker, .o-hero__line, .o-hero__cta, .o-hero__foot', { opacity: 0, y: 14, duration: 0.9, ease: 'power3.out', stagger: 0.07 }, 0.35)
          .from('.o-top', { opacity: 0, y: -10, duration: 0.8, ease: 'power3.out' }, 0.2)
          .from('.o-sky, .o-fallback', { opacity: 0, duration: 1.6, ease: 'power2.out' }, 0)
      }

      ScrollTrigger.create({
        trigger: '.o-hero',
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => {
          scroll.current.hero = self.progress
          push()
        },
      })

      // cards cross-fade on the same scroll as the camera (no React state, no remounts)
      const n = modules.length
      const cards = gsap.utils.toArray<HTMLElement>('.o-card')
      const steps = gsap.utils.toArray<HTMLElement>('.o-rail li')
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
      cards.forEach((card, i) => {
        const inner = card.querySelectorAll('.o-card__fx')
        if (reduce) {
          tl.set(card, { autoAlpha: 1 }, i).set(card, { autoAlpha: 0 }, i + 1 - 0.001)
          return
        }
        const at = i === 0 ? 0.12 : i + 0.2
        tl.fromTo(card, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, at)
        tl.fromTo(inner, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.04, ease: 'power2.out' }, at + 0.05)
        if (i < n - 1) tl.to(card, { autoAlpha: 0, y: -40, duration: 0.2, ease: 'power2.in' }, i + 1)
      })
      steps.forEach((li, i) => {
        tl.fromTo(li, { '--on': 0 }, { '--on': 1, duration: 0.15 }, i === 0 ? 0.12 : i + 0.2)
        if (i < n - 1) tl.to(li, { '--on': 0, duration: 0.15 }, i + 1.05)
      })
      tl.to({}, { duration: 0.001 }, n)
      ScrollTrigger.create({
        trigger: '.o-tour',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          scroll.current.tour = self.progress
          tl.progress(self.progress)
          push()
        },
        onLeaveBack: () => {
          scroll.current.tour = 0
          tl.progress(0)
          push()
        },
      })

      ScrollTrigger.create({
        trigger: '.o-after',
        start: 'top bottom',
        end: 'bottom bottom',
        onUpdate: (self) => {
          scroll.current.after = self.progress
          push()
        },
        onLeaveBack: () => {
          scroll.current.after = 0
          push()
        },
      })

      // the veil dims the world behind long-form sections (cheap: a fixed gradient's opacity)
      gsap.fromTo('.o-veil', { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: '.o-after', start: 'top bottom', end: 'top 30%', scrub: true } })
      gsap.to('.o-veil', { opacity: 0.25, ease: 'none', scrollTrigger: { trigger: '#contact', start: 'top 70%', end: 'top 10%', scrub: true } })

      if (!reduce) {
        gsap.utils.toArray<HTMLElement>('.o-rise').forEach((el) => {
          gsap.from(el, { y: 36, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
        })
      }
    },
    { scope: root },
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard blocked: the address is visible to select
    }
  }

  return (
    <div className="orbit" ref={root} data-webgl={webgl ? undefined : 'off'}>
      {webgl ? (
        <canvas ref={canvas} className="o-sky" aria-hidden="true" />
      ) : (
        <div className="o-fallback" aria-hidden="true">
          <div className="o-fallback__sun" />
          {PLANETS.map((p, i) => (
            <div key={i} className="o-fallback__orbit" style={{ ['--r' as string]: `${(p.orbit * 3.7).toFixed(1)}vmin`, ['--c' as string]: ACCENT[i], ['--a' as string]: `${(p.phase * 57.3).toFixed(0)}deg`, ['--s' as string]: `${(p.radius * 3).toFixed(1)}vmin` }}>
              <i />
            </div>
          ))}
        </div>
      )}
      <div className="o-veil" aria-hidden="true" />

      {webgl && (
        <div ref={labels} className="o-labels">
          {modules.map((m, i) => (
            <button key={m.code} type="button" style={{ ['--c' as string]: ACCENT[i] }} onClick={() => tourStop(i)}>
              <span>{m.title}</span>
            </button>
          ))}
        </div>
      )}

      <header className="o-top">
        <button type="button" className="o-top__me" onClick={() => go('#top')}>
          <span className="o-sun" aria-hidden="true" />
          <span className="o-top__name">{profile.name}</span>
        </button>
        <nav aria-label="Sections">
          <button type="button" onClick={() => tourStop(0)}>
            Skills
          </button>
          <button type="button" onClick={() => go('#work')}>
            Work
          </button>
          <button type="button" onClick={() => go('#log')}>
            Experience
          </button>
          <button type="button" onClick={() => go('#contact')}>
            Contact
          </button>
          <a className="o-top__cv" href={profile.resume} target="_blank" rel="noreferrer">
            Résumé
          </a>
        </nav>
      </header>

      <main>
        <section className="o-hero" id="top">
          <p className="o-hero__kicker">
            <span className="o-pulse" aria-hidden="true" />
            {profile.status} · {profile.location}
          </p>
          <h1 className="o-hero__name">
            <span className="o-ln">
              <span>{profile.firstName}</span>
            </span>
            <span className="o-ln">
              <span>{profile.lastName}</span>
            </span>
          </h1>
          <p className="o-hero__line">{hero.line}</p>
          <div className="o-hero__cta">
            <button type="button" className="o-btn" onClick={() => tourStop(0)}>
              Fly through my skills <Arrow />
            </button>
            <a className="o-btn o-btn--ghost" href={`mailto:${profile.email}`}>
              Email me
            </a>
          </div>
          <p className="o-hero__foot">
            <span className="o-scroll" aria-hidden="true" />
            <span>I’m the sun. The five planets are what I build — scroll to visit each one.</span>
          </p>
        </section>

        <section className="o-tour" id="skills" aria-label="What I build">
          <div className="o-tour__stick">
            <div className="o-cards">
              {modules.map((m, i) => (
                <article key={m.code} className="o-card" style={{ ['--c' as string]: ACCENT[i] }}>
                  <p className="o-card__step o-card__fx">
                    <span>Planet {i + 1}</span>
                    <span>of {modules.length}</span>
                  </p>
                  <h2 className="o-card__fx">{m.title}</h2>
                  <p className="o-card__tag o-card__fx">{m.tagline}</p>
                  <ul className="o-chips o-card__fx">
                    {m.stack.split(' · ').map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  <pre className="o-term o-card__fx">
                    {m.log.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </pre>
                </article>
              ))}
            </div>
            <ol className="o-rail" aria-label="Planets">
              {modules.map((m, i) => (
                <li key={m.code} style={{ ['--c' as string]: ACCENT[i] }}>
                  <button type="button" onClick={() => tourStop(i)}>
                    <i aria-hidden="true" />
                    <span>{m.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <div className="o-after">
          <section className="o-sec" id="work">
            <header className="o-head o-rise">
              <p className="o-eyebrow">Launched</p>
              <h2 className="o-h2">Things I’ve put into orbit</h2>
              <p className="o-head__aside">{COUNT[projects.length] ?? projects.length} products, each tagged with the planet it grew from.</p>
            </header>
            <div className="o-work">
              {projects.map((p) => {
                const pi = PROJECT_PLANET[p.id] ?? 0
                return (
                  <article key={p.id} className="o-proj o-rise" style={{ ['--c' as string]: ACCENT[pi] }}>
                    <a className="o-proj__img" href={p.links[0].href} target="_blank" rel="noreferrer" aria-label={`${p.title} — ${p.links[0].label}`}>
                      {p.video || p.image ? <ProjectMedia p={p} alt="" /> : <LifeCard />}
                    </a>
                    <div className="o-proj__body">
                      <p className="o-proj__meta">
                        <span className="o-proj__planet">
                          <i aria-hidden="true" />
                          {modules[pi].title}
                        </span>
                        <span>{p.status}</span>
                      </p>
                      <h3>{p.title}</h3>
                      <p className="o-proj__kind">{p.kind}</p>
                      <p className="o-proj__sum">{p.summary}</p>
                      <ul className="o-chips o-chips--sm">
                        {p.stack.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                      <p className="o-proj__links">
                        {p.links.map((l) => (
                          <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
                            {l.label} <Arrow />
                          </a>
                        ))}
                      </p>
                    </div>
                  </article>
                )
              })}
            </div>
            <div className="o-archive o-rise">
              <p className="o-eyebrow">Smaller moons</p>
              <ul>
                {archive.map((a) => (
                  <li key={a.title}>
                    <a href={a.href} target="_blank" rel="noreferrer">
                      <span className="o-archive__t">{a.title}</span>
                      <span className="o-archive__n">{a.note}</span>
                      <Arrow />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="o-sec" id="log">
            <header className="o-head o-rise">
              <p className="o-eyebrow">Flight log</p>
              <h2 className="o-h2">Where I’ve worked</h2>
              <a className="o-head__aside o-link" href={profile.resume} target="_blank" rel="noreferrer">
                Full résumé (PDF) <Arrow />
              </a>
            </header>
            <ol className="o-log">
              {experience.map((e, i) => (
                <li key={e.when} className="o-rise" data-now={i === 0 || undefined}>
                  <p className="o-log__when">{e.when.replace('→', '–').replace('NOW', 'now')}</p>
                  <span className="o-log__node" aria-hidden="true" />
                  <div className="o-log__body">
                    <h3>{e.role}</h3>
                    <p className="o-log__co">{e.company}</p>
                    <ul>
                      {e.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="o-sec o-end" id="contact">
            <p className="o-eyebrow o-rise">Contact</p>
            <h2 className="o-end__big o-rise">Let’s build the next one.</h2>
            <p className="o-end__lede o-rise">Whether it’s a full-time role or a freelance project, my inbox is open.</p>
            <div className="o-end__mail o-rise">
              <a href={`mailto:${profile.email}`}>
                {profile.email} <Arrow />
              </a>
              <button type="button" onClick={copy} aria-label="Copy email address">
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <ul className="o-social o-rise">
              {profile.socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer">
                    {s.label} <Arrow />
                  </a>
                </li>
              ))}
              <li>
                <a href={profile.resume} target="_blank" rel="noreferrer">
                  Résumé (PDF) <Arrow />
                </a>
              </li>
            </ul>
            <footer className="o-foot">
              <span>© 2026 {profile.name}</span>
              <span>{profile.location}</span>
              <button type="button" onClick={() => go('#top')}>
                Back to the top ↑
              </button>
            </footer>
          </section>
        </div>
      </main>
    </div>
  )
}
