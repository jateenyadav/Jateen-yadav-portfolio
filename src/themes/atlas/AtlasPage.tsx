import { useEffect, useRef, useState } from 'react'
import { archive, experience, hero, modules, profile, projects, spec, statement, stats } from '../../data/content'
import { destroySmoothScroll, gsap, initSmoothScroll, prefersReducedMotion, scrollToTarget, ScrollTrigger, useGSAP } from '../../lib/motion'
import { hasWebGL } from '../../shared/stage'
import { PLACES, views, type View } from './places'
import type { AtlasScene, Stop } from './scene'
import ProjectMedia from '../../shared/ProjectMedia'

const NAV = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'work', label: 'Work' },
  { id: 'log', label: 'Flight log' },
  { id: 'contact', label: 'Contact' },
]

// where each project is pinned, and why (all from content.ts)
const PIN: Record<string, string> = {
  lifeos: 'Pinned at Gurugram — built at home base',
  examace: 'Pinned on India — practice papers for CBSE & JEE students',
  tinylm: 'Pinned at Gurugram — trained on a laptop at home, runs in any browser',
  solar: 'Pinned at Sriharikota — where India’s space missions launch',
  client: 'Pinned at Dubai — delivered to a Dubai-based client',
}
const LABEL_SUB: Record<string, string> = {
  ggn: 'Home base · IST',
  jp: 'Teams I ship with',
  eu: 'Teams I ship with',
  radaur: 'B.Tech, 2019–2023',
  lifeos: 'Web + Android',
  examace: 'CBSE & JEE',
  tinylm: 'Trained at home',
  solar: 'Indian space missions',
  client: 'Client site',
}

// the flight log runs oldest → newest, so it ends with the routes to Japan and Europe
const LOG = [...experience].reverse()
const logStop = (company: string, state: string) =>
  state === 'BOOT' ? 'radaur' : company.startsWith('Hitachi') ? (state === 'RUNNING' ? 'world' : 'ggn') : 'india'
const logPlace = (company: string, state: string) => {
  const k = logStop(company, state)
  return k === 'radaur' ? 'Radaur, Haryana' : k === 'ggn' ? 'Flight to Gurugram' : k === 'world' ? 'Routes to Japan & Europe' : null
}
const when = (w: string) => w.replace('→', '–').replace('NOW', 'now')
const coord = (lat: number, lon: number) => `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`

function Clock() {
  const el = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: profile.timezone })
    const tick = () => el.current && (el.current.textContent = fmt.format(new Date()))
    tick()
    const id = window.setInterval(tick, 15000)
    return () => window.clearInterval(id)
  }, [])
  return <span ref={el} />
}

function LifeOSCard() {
  return (
    <div className="a-lifeos" role="img" aria-label="LifeOS app preview">
      <div className="a-lifeos__phone">
        <p className="a-lifeos__h">Today</p>
        {['Notes', 'Reminders', 'Workouts', 'Routines', 'Expenses'].map((t) => (
          <p key={t} className="a-lifeos__row">
            <i />
            {t}
          </p>
        ))}
        <p className="a-lifeos__ask">Ask LifeOS about your own data</p>
      </div>
      <div className="a-lifeos__side">
        <strong>LifeOS</strong>
        <span>Web · Android · iOS</span>
      </div>
    </div>
  )
}

export default function AtlasPage() {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [gl, setGl] = useState<'wait' | 'on' | 'off'>('wait')
  const ggn = PLACES[0]

  useEffect(() => {
    initSmoothScroll()
    return () => destroySmoothScroll()
  }, [])

  useEffect(() => {
    let alive = true
    let scene: AtlasScene | null = null
    let ro: ResizeObserver | null = null
    let timer = 0
    const page = root.current
    if (!canvas.current || !page || !hasWebGL()) {
      setGl('off')
      return
    }
    import('./scene')
      .then(({ createAtlasScene }) => {
        if (!alive || !canvas.current) return
        scene = createAtlasScene(canvas.current)
        if (!scene) return setGl('off')
        const build = () => {
          const v = views(window.innerWidth < 700)
          const stops: Stop[] = []
          const add = (sel: string, view: View) => {
            const el = page.querySelector<HTMLElement>(sel)
            if (el) stops.push({ el, view })
          }
          add('.a-hero', v.hero)
          add('#about', v.about)
          add('#skills', v.skills)
          projects.forEach((p) => add(`[data-stop="${p.id}"]`, v.work[p.id]))
          LOG.forEach((e, i) => add(`[data-log="${i}"]`, v.log[logStop(e.company, e.state)]))
          add('#contact', v.contact)
          scene?.setStops(stops)
        }
        build()
        const labels: Record<string, HTMLElement> = {}
        page.querySelectorAll<HTMLElement>('[data-place]').forEach((el) => (labels[el.dataset.place!] = el))
        scene.setLabels(labels)
        setGl('on')
        let wasPhone = window.innerWidth < 700
        ro = new ResizeObserver(() => {
          clearTimeout(timer)
          timer = window.setTimeout(() => {
            const phone = window.innerWidth < 700
            if (phone !== wasPhone) {
              wasPhone = phone
              build()
            } else scene?.measure()
          }, 120)
        })
        ro.observe(page)
        document.fonts?.ready.then(() => scene?.measure())
      })
      .catch(() => alive && setGl('off'))
    return () => {
      alive = false
      clearTimeout(timer)
      ro?.disconnect()
      scene?.dispose()
    }
  }, [])

  useGSAP(
    () => {
      if (!prefersReducedMotion()) {
        gsap.from('.a-hero__name span', { yPercent: 100, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.25 })
        gsap.from('.a-hero__fade', { opacity: 0, y: 14, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.6 })
      }
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

  const go = (id: string) => scrollToTarget(`#${id}`, -24)

  return (
    <div className="atlas" ref={root} data-gl={gl}>
      <canvas ref={canvas} className="a-canvas" aria-hidden="true" />
      <div className="a-fallback" aria-hidden="true" />
      <div className="a-labels" aria-hidden="true">
        {PLACES.map((p) => (
          <span key={p.id} className="a-label" data-place={p.id} data-group={p.group}>
            <b>{p.name}</b>
            <small>{LABEL_SUB[p.id]}</small>
          </span>
        ))}
      </div>

      <header className="a-nav">
        <button type="button" className="a-nav__me" onClick={() => scrollToTarget(0)}>
          {profile.name}
        </button>
        <p className="a-nav__clock">
          <i aria-hidden="true" />
          Gurugram <Clock /> IST
        </p>
        <nav aria-label="Sections">
          {NAV.map((n) => (
            <button key={n.id} type="button" data-nav={n.id} onClick={() => go(n.id)}>
              {n.label}
            </button>
          ))}
        </nav>
        <a className="a-nav__cv" href={profile.resume} target="_blank" rel="noreferrer">
          Résumé
        </a>
      </header>

      <main>
        <section className="a-hero a-col" aria-label="Intro">
          <p className="a-coord a-hero__fade">
            {coord(ggn.lat, ggn.lon)} · {profile.location}
          </p>
          <h1 className="a-hero__name">
            <span>{profile.firstName}</span>
            <span>{profile.lastName}</span>
          </h1>
          <p className="a-hero__roles a-hero__fade">{profile.roles.join('  /  ')}</p>
          <p className="a-hero__line a-hero__fade">{hero.line}</p>
          <div className="a-cta a-hero__fade">
            <a className="a-btn" href={`mailto:${profile.email}`}>
              Email me
            </a>
            <button type="button" className="a-btn a-btn--ghost" onClick={() => go('work')}>
              See the work
            </button>
          </div>
          <dl className="a-board a-hero__fade" aria-label="Routes from Gurugram">
            <div>
              <dt>Japan</dt>
              <dd>Production releases with teams</dd>
            </div>
            <div>
              <dt>Europe</dt>
              <dd>Production releases with teams</dd>
            </div>
            <div>
              <dt>Dubai</dt>
              <dd>Client portfolio, delivered</dd>
            </div>
          </dl>
          <p className="a-hint a-hero__fade">{gl === 'off' ? 'Gurugram, India — working with teams in Japan and Europe.' : 'Drag the globe to spin it. Scroll to fly the routes.'}</p>
        </section>

        <section className="a-sec a-col" id="about">
          <h2 className="a-h2">The hard middle</h2>
          <p className="a-statement">{statement}</p>
          <ul className="a-stats">
            {stats.map((s) => (
              <li key={s.label}>
                <p>
                  {s.value}
                  <span>{s.unit}</span>
                </p>
                <small>{s.label}</small>
              </li>
            ))}
          </ul>
          <dl className="a-spec">
            {spec.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="a-sec a-col" id="skills">
          <h2 className="a-h2">Every screen, one core</h2>
          <ul className="a-mods">
            {modules.map((m) => (
              <li key={m.code} className="a-card">
                <h3>{m.title}</h3>
                <p className="a-mods__tag">{m.tagline}</p>
                <p className="a-mods__stack">{m.stack}</p>
                <pre className="a-log">
                  {m.log.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </pre>
              </li>
            ))}
          </ul>
        </section>

        <section className="a-sec" id="work">
          <div className="a-col">
            <h2 className="a-h2">Where the work lives</h2>
          </div>
          {projects.map((p) => (
            <article key={p.id} className="a-stop a-col" data-stop={p.id}>
              <div className="a-card a-proj">
                <a className="a-proj__media" href={p.links[0].href} target="_blank" rel="noreferrer" aria-label={`Open ${p.title}`}>
                  {p.video || p.image ? <ProjectMedia p={p} /> : <LifeOSCard />}
                </a>
                <p className="a-pin">
                  <i aria-hidden="true" />
                  {PIN[p.id]}
                </p>
                <div className="a-proj__head">
                  <h3>{p.title}</h3>
                  <span>{p.stamp}</span>
                </div>
                <p className="a-proj__kind">
                  {p.kind} · {p.status}
                </p>
                <p className="a-proj__sum">{p.summary}</p>
                <ul className="a-points">
                  {p.points.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <p className="a-proj__stack">{p.stack.join(' · ')}</p>
                <p className="a-links">
                  {p.links.map((l) => (
                    <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
                      {l.label === 'Code' ? 'Source code' : 'Open live site'}
                    </a>
                  ))}
                </p>
              </div>
            </article>
          ))}
          <div className="a-col a-archive">
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

        <section className="a-sec" id="log">
          <div className="a-col">
            <h2 className="a-h2">From Radaur to the world</h2>
            <p className="a-lede">Oldest first. Scroll and the globe flies each leg.</p>
          </div>
          {LOG.map((e, i) => {
            const place = logPlace(e.company, e.state)
            return (
              <article key={e.when} className="a-stop a-stop--log a-col" data-log={i}>
                <div className="a-card a-leg">
                  <p className="a-leg__top">
                    <span>{when(e.when)}</span>
                    {e.state === 'RUNNING' && <em>Now</em>}
                  </p>
                  <h3>{e.role}</h3>
                  <p className="a-leg__co">{e.company}</p>
                  {place && (
                    <p className="a-pin">
                      <i aria-hidden="true" />
                      {place}
                    </p>
                  )}
                  <ul className="a-points">
                    {e.points.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </article>
            )
          })}
        </section>

        <section className="a-sec a-end a-col" id="contact">
          <h2 className="a-h2 a-h2--big">Next stop: your team</h2>
          <p className="a-lede">
            {profile.status}. Based in {profile.location}, shipping production releases with teams in Japan and Europe.
          </p>
          <a className="a-mail" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <ul className="a-social">
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
          <p className="a-foot">
            © 2026 {profile.name} · {coord(ggn.lat, ggn.lon)}
          </p>
        </section>
      </main>
    </div>
  )
}
