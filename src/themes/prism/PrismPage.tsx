import { useEffect, useRef, useState } from 'react'
import { archive, experience, hero, modules, profile, projects, spec, statement, stats } from '../../data/content'
import { destroySmoothScroll, gsap, initSmoothScroll, prefersReducedMotion, scrollToTarget, ScrollTrigger, useGSAP } from '../../lib/motion'
import { hasWebGL } from '../../shared/stage'
import { drawLifeOS } from './lifeosCard'
import type { PlateSpec, PrismScene } from './scene'
import ProjectMedia from '../../shared/ProjectMedia'

const NAV = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
]
const FONT = '"Schibsted Grotesk Variable", ui-sans-serif, system-ui, sans-serif'
const when = (w: string) => w.replace('→', '–').replace('NOW', 'now')

export default function PrismPage() {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const lifeos = useRef<HTMLCanvasElement>(null)
  const [gl, setGl] = useState<'wait' | 'on' | 'off'>('wait')

  // smooth scroll + one refresh once fonts have settled
  useEffect(() => {
    initSmoothScroll()
    return () => destroySmoothScroll()
  }, [])

  // the glass scene lives in its own chunk
  useEffect(() => {
    let alive = true
    let scene: PrismScene | null = null
    let ro: ResizeObserver | null = null
    let timer = 0
    const page = root.current
    if (lifeos.current) drawLifeOS(lifeos.current, FONT)
    if (!canvas.current || !page || !hasWebGL()) {
      setGl('off')
      return
    }
    const boot = async () => {
      const [{ createPrismScene }] = await Promise.all([import('./scene'), document.fonts?.ready])
      if (!alive || !canvas.current) return
      if (lifeos.current) drawLifeOS(lifeos.current, FONT) // again, now that the font is in
      scene = createPrismScene(canvas.current)
      if (!scene) {
        setGl('off')
        return
      }
      const q = <T extends HTMLElement>(s: string) => Array.from(page.querySelectorAll<T>(s))
      const plates: PlateSpec[] = [
        ...q('[data-word]').map((el) => ({ el, kind: 'word' as const })),
        ...q<HTMLElement>('[data-shot]').map((el): PlateSpec => {
          const video = el.querySelector('video')
          if (video) return { el, kind: 'video', video }
          return el.dataset.shot === 'lifeos' ? { el, kind: 'canvas', canvas: lifeos.current! } : { el, kind: 'image', src: el.dataset.shot }
        }),
      ]
      scene.setPlates(plates)
      scene.setAnchors(
        [page.querySelector<HTMLElement>('.p-hero')!, ...NAV.map((n) => page.querySelector<HTMLElement>(`#${n.id} [data-word]`)!)],
        page.querySelector<HTMLElement>('#work .p-projects'),
        q('[data-shot]'),
      )
      setGl('on')
      ro = new ResizeObserver(() => {
        clearTimeout(timer)
        timer = window.setTimeout(() => scene?.measure(), 120)
      })
      ro.observe(page)
    }
    boot().catch(() => alive && setGl('off'))
    return () => {
      alive = false
      clearTimeout(timer)
      ro?.disconnect()
      scene?.dispose()
    }
  }, [])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('.p-hero__meta > *, .p-hero__foot > *', { opacity: 0, y: 14, duration: 1.1, ease: 'power3.out', stagger: 0.08, delay: 0.5 })
      // one quiet reveal per block, played once
      gsap.utils.toArray<HTMLElement>('.p-reveal').forEach((el) => {
        gsap.from(el, { opacity: 0, y: 24, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
      })
      // active nav item
      NAV.forEach((n) => {
        ScrollTrigger.create({
          trigger: `#${n.id}`,
          start: 'top 45%',
          end: 'bottom 45%',
          onToggle: (self) => root.current?.querySelector(`[data-nav="${n.id}"]`)?.toggleAttribute('data-on', self.isActive),
        })
      })
      document.fonts?.ready.then(() => ScrollTrigger.refresh())
    },
    { scope: root },
  )

  const go = (id: string) => scrollToTarget(`#${id}`, -40)

  return (
    <div className="prism" ref={root} data-gl={gl}>
      <canvas ref={canvas} className="p-canvas" aria-hidden="true" />
      <div className="p-fallback" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>

      <header className="p-nav">
        <button type="button" className="p-nav__me" onClick={() => scrollToTarget(0)}>
          {profile.name}
        </button>
        <nav aria-label="Sections">
          {NAV.map((n) => (
            <button key={n.id} type="button" data-nav={n.id} onClick={() => go(n.id)}>
              {n.label}
            </button>
          ))}
        </nav>
        <a className="p-nav__cv" href={profile.resume} target="_blank" rel="noreferrer">
          Résumé
        </a>
      </header>

      <main>
        <section className="p-hero" aria-label="Intro">
          <div className="p-hero__meta">
            <p className="p-status">
              <span aria-hidden="true" />
              {profile.status}
            </p>
            <p>{profile.roles.join(' / ')}</p>
          </div>
          <h1 className="p-hero__name">
            <span data-word>{profile.firstName}</span>
            <span data-word>{profile.lastName}</span>
          </h1>
          <div className="p-hero__foot">
            <p className="p-hero__line">{hero.line}</p>
            <div className="p-cta">
              <a className="p-btn" href={`mailto:${profile.email}`}>
                Email me
              </a>
              <button type="button" className="p-btn p-btn--quiet" onClick={() => go('work')}>
                See the work
              </button>
            </div>
          </div>
        </section>

        <section className="p-sec" id="about">
          <h2 className="p-h2">
            <span data-word>The hard middle</span>
          </h2>
          <div className="p-about">
            <p className="p-statement p-reveal">{statement}</p>
            <dl className="p-spec p-reveal">
              {spec.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <ul className="p-stats p-reveal">
            {stats.map((s) => (
              <li key={s.label}>
                <p className="p-stats__n">
                  {s.value}
                  <span>{s.unit}</span>
                </p>
                <p className="p-stats__l">{s.label}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="p-sec" id="skills">
          <h2 className="p-h2">
            <span data-word>Every screen</span>
          </h2>
          <ul className="p-mods">
            {modules.map((m) => (
              <li key={m.code} className="p-mod p-reveal">
                <div className="p-mod__head">
                  <h3>{m.title}</h3>
                  <p>{m.tagline}</p>
                </div>
                <ul className="p-chips">
                  {m.stack.split(' · ').map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <pre className="p-log">
                  {m.log.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </pre>
              </li>
            ))}
          </ul>
        </section>

        <section className="p-sec" id="work">
          <h2 className="p-h2">
            <span data-word>Selected work</span>
          </h2>
          <div className="p-projects">
            {projects.map((p, i) => (
              <article key={p.id} className="p-proj" data-flip={i % 2 === 1 || undefined}>
                <a className="p-shot" href={p.links[0].href} target="_blank" rel="noreferrer" data-shot={p.image ?? 'lifeos'} aria-label={`${p.title} — open`}>
                  {p.video || p.image ? <ProjectMedia p={p} alt="" /> : <canvas ref={lifeos} role="img" aria-label="LifeOS app preview" />}
                </a>
                <div className="p-proj__body p-reveal">
                  <p className="p-proj__idx">
                    {p.index} <span>{p.kind}</span>
                  </p>
                  <h3>{p.title}</h3>
                  <p className="p-proj__status">{p.status}</p>
                  <p className="p-proj__sum">{p.summary}</p>
                  <ul className="p-points">
                    {p.points.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <ul className="p-chips">
                    {p.stack.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  <p className="p-links">
                    {p.links.map((l) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
                        {l.label === 'Code' ? 'Source code' : 'Open live site'}
                      </a>
                    ))}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <div className="p-archive p-reveal">
            <h3>Also on the web</h3>
            <ul>
              {archive.map((a) => (
                <li key={a.title}>
                  <a href={a.href} target="_blank" rel="noreferrer">
                    <strong>{a.title}</strong>
                    <span>{a.note}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="p-sec" id="experience">
          <h2 className="p-h2">
            <span data-word>Experience</span>
          </h2>
          <ol className="p-exp">
            {experience.map((e) => (
              <li key={e.when} className="p-reveal">
                <p className="p-exp__when">{when(e.when)}</p>
                <div>
                  <h3>{e.role}</h3>
                  <p className="p-exp__co">{e.company}</p>
                  <ul className="p-points">
                    {e.points.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="p-sec p-end" id="contact">
          <h2 className="p-h2 p-h2--end">
            <span data-word>Let’s talk</span>
          </h2>
          <p className="p-end__lede">{profile.status}. Based in {profile.location}, working with teams in India, Japan and Europe.</p>
          <a className="p-end__mail" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <ul className="p-social">
            {profile.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
            <li>
              <a href={profile.resume} target="_blank" rel="noreferrer">
                Résumé (PDF)
              </a>
            </li>
          </ul>
          <p className="p-foot">
            © 2026 {profile.name} · {profile.location}
          </p>
        </section>
      </main>
    </div>
  )
}
