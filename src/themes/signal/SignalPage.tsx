import { useEffect, useRef, useState } from 'react'
import { archive, experience, hero, modules, profile, projects, spec, statement, stats } from '../../data/content'
import { gsap, ScrollTrigger, useGSAP, initSmoothScroll, destroySmoothScroll, scrollToTarget, prefersReducedMotion } from '../../lib/motion'
import { hasWebGL } from '../../shared/stage'
import type { Formation, SignalScene } from './scene'

/** One formation per "channel"; the DOM block with the same data-stage index sits beside it. */
const FORMATIONS: (Formation & { ch: string; glyph: string })[] = [
  { ch: 'Origin', glyph: 'JY', shape: 'mono', colors: ['#dfe6ff', '#7cf0d0'], yaw: -0.18 },
  { ch: 'Reach', glyph: 'IN·JP·EU', shape: 'globe', colors: ['#5cc8ff', '#e8ecff'], spin: 0.14, yaw: -1.2 },
  { ch: 'Screens', glyph: '</>', shape: 'devices', colors: ['#7cf0d0', '#dfe6ff'], yaw: -0.08 },
  { ch: 'Intelligence', glyph: 'AI', shape: 'brain', colors: ['#a98bff', '#ff7ac8'], spin: 0.1 },
  { ch: 'LifeOS', glyph: '01', shape: 'phone', colors: ['#7cf0d0', '#e8ecff'] },
  { ch: 'ExamAce', glyph: '02', shape: 'paper', colors: ['#ffc46b', '#fff3d6'] },
  { ch: 'Solar System', glyph: '03', shape: 'solar', colors: ['#ff9a5c', '#ffd28a'] },
  { ch: 'Client Portfolio', glyph: '04', shape: 'browser', colors: ['#ff7ac8', '#e8ecff'] },
  { ch: 'Timeline', glyph: '∿', shape: 'wave', colors: ['#8fb4ff', '#7cf0d0'], yaw: -0.12, scale: 0.8 },
  { ch: 'Dispatch', glyph: '@', shape: 'at', colors: ['#e8ecff', '#7cf0d0'] },
]

const NAV = [
  { label: 'About', to: '#sg-about' },
  { label: 'Modules', to: '#sg-modules' },
  { label: 'Work', to: '#sg-work' },
  { label: 'Experience', to: '#sg-log' },
  { label: 'Contact', to: '#sg-contact' },
]

const isSmall = () => window.innerWidth < 860
const focusY = () => (isSmall() ? 0.27 : 0.5)
const DISPLAY = '"Space Grotesk Variable", system-ui, sans-serif'

/** The empty column the particle formation occupies (and the CSS fallback when there's no WebGL). */
function Slot({ i }: { i: number }) {
  const f = FORMATIONS[i]
  return (
    <div className="sg-slot" data-slot={i} aria-hidden="true" style={{ ['--c' as string]: f.colors[0] }}>
      <div className="sg-slot__fb">
        <span className="sg-slot__glyph">{f.glyph}</span>
        <span className="sg-slot__ch">
          CH {String(i).padStart(2, '0')} · {f.ch}
        </span>
      </div>
    </div>
  )
}

function Label({ i, children }: { i: number; children: React.ReactNode }) {
  return (
    <p className="sg-label sg-rv" style={{ ['--c' as string]: FORMATIONS[i].colors[0] }}>
      <span className="sg-label__ch">CH {String(i).padStart(2, '0')}</span>
      <span>{children}</span>
    </p>
  )
}

function LifeCard() {
  const rows = ['Notes', 'Reminders', 'Workouts', 'Routines', 'Expenses']
  return (
    <div className="sg-life" aria-hidden="true">
      <div className="sg-life__phone">
        <div className="sg-life__bar">
          <span>LifeOS</span>
          <i />
        </div>
        <ul>
          {rows.map((r, i) => (
            <li key={r} style={{ ['--d' as string]: `${i * 0.08}s` }}>
              <b />
              {r}
            </li>
          ))}
        </ul>
        <div className="sg-life__ask">Ask about your week…</div>
      </div>
      <div className="sg-life__meta">
        <span>Web</span>
        <span>Android</span>
        <span>iOS</span>
      </div>
    </div>
  )
}

export default function SignalPage() {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const [webgl, setWebgl] = useState<boolean | null>(null)

  // anchors (document Y at which each formation is fully formed), cached; never measured in the frame loop
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
    if (a.length < 2) return 0
    if (y <= a[0]) return 0
    for (let i = 0; i < a.length - 1; i++) {
      if (y < a[i + 1]) {
        const raw = (y - a[i]) / Math.max(1, a[i + 1] - a[i])
        // hold each formation while its copy is read; morph in the middle stretch
        return i + Math.min(1, Math.max(0, (raw - 0.18) / 0.64))
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
    return () => {
      window.removeEventListener('load', refresh)
      window.removeEventListener('resize', measure)
      ScrollTrigger.removeEventListener('refresh', measure)
      destroySmoothScroll()
    }
  }, [])

  // the particle field — its own chunk
  useEffect(() => {
    let alive = true
    let scene: SignalScene | null = null
    let shown = -1
    const onStage = (i: number) => {
      if (i === shown || !readout.current) return
      shown = i
      readout.current.textContent = `CH ${String(i).padStart(2, '0')} · ${FORMATIONS[i].ch}`
      readout.current.style.setProperty('--c', FORMATIONS[i].colors[0])
    }
    if (!canvas.current || !hasWebGL()) {
      setWebgl(false)
      return
    }
    const reduce = prefersReducedMotion()
    const onScroll = () => scene?.invalidate()
    import('./scene')
      .then(({ createSignalScene }) => document.fonts?.ready.then(() => createSignalScene))
      .then((createSignalScene) => {
        if (!alive || !canvas.current || !createSignalScene) return
        scene = createSignalScene(canvas.current, FORMATIONS, {
          stage: () => stageAt(window.scrollY),
          layout: (w, h) => (w < 860 ? { x: 0.5, y: 0.27, size: Math.min(0.74, (h * 0.38) / Math.min(w, h)) } : { x: 0.73, y: 0.5, size: 0.64 }),
          font: DISPLAY,
          onStage,
        })
        setWebgl(Boolean(scene))
        if (scene && reduce) window.addEventListener('scroll', onScroll, { passive: true })
      })
      .catch(() => alive && setWebgl(false))
    return () => {
      alive = false
      window.removeEventListener('scroll', onScroll)
      scene?.dispose()
    }
  }, [])

  useGSAP(
    () => {
      // progress hairline under the nav, scrubbed straight from scroll
      gsap.fromTo(bar.current, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } })
      if (prefersReducedMotion()) return
      gsap.from('.sg-hero__name > span > span', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.15 })
      gsap.from('.sg-hero .sg-fade', { opacity: 0, y: 14, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.5 })
      ScrollTrigger.batch('.sg-rv', {
        start: 'top 88%',
        once: true,
        // a jump (nav, reload mid-page) can enter dozens at once: cap the total stagger
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: Math.min(0.06, 0.35 / els.length), overwrite: true }),
      })
      gsap.set('.sg-rv', { opacity: 0 })
      // stats count up once
      gsap.utils.toArray<HTMLElement>('.sg-stat__v').forEach((el) => {
        const to = Number(el.dataset.v)
        const o = { v: 0 }
        gsap.to(o, { v: to, duration: 1.4, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => (el.textContent = String(Math.round(o.v))) })
      })
    },
    { scope: root },
  )

  const go = (to: string) => scrollToTarget(to, isSmall() ? -8 : -40)

  return (
    <div className="sg" ref={root} data-webgl={webgl === false ? 'off' : webgl ? 'on' : undefined}>
      <canvas ref={canvas} className="sg-canvas" aria-hidden="true" />
      <div className="sg-veil" aria-hidden="true" />

      <header className="sg-nav">
        <button type="button" className="sg-nav__me" onClick={() => scrollToTarget(0)} aria-label="Back to top">
          <span className="sg-nav__mark">JY</span>
          <span className="sg-nav__read" ref={readout}>
            CH 00 · Origin
          </span>
        </button>
        <nav aria-label="Sections">
          {NAV.map((n) => (
            <button key={n.to} type="button" onClick={() => go(n.to)}>
              {n.label}
            </button>
          ))}
          <a className="sg-nav__cv" href={profile.resume} target="_blank" rel="noreferrer">
            Résumé
          </a>
        </nav>
        <span className="sg-nav__bar" ref={bar} aria-hidden="true" />
      </header>

      <main>
        {/* 00 — hero */}
        <section className="sg-block sg-hero" id="sg-top">
          <Slot i={0} />
          <div className="sg-copy">
            <p className="sg-label sg-fade" style={{ ['--c' as string]: FORMATIONS[0].colors[1] }}>
              <span className="sg-pulse" aria-hidden="true" />
              <span>{profile.status}</span>
            </p>
            <h1 className="sg-hero__name">
              <span>
                <span>{profile.firstName}</span>
              </span>
              <span>
                <span>{profile.lastName}</span>
              </span>
            </h1>
            <p className="sg-hero__roles sg-fade">
              {profile.roles.map((r) => (
                <span key={r}>{r}</span>
              ))}
            </p>
            <p className="sg-hero__line sg-fade">{hero.line}</p>
            <div className="sg-cta sg-fade">
              <a className="sg-btn" href={`mailto:${profile.email}`}>
                Email me
              </a>
              <button type="button" className="sg-btn sg-btn--ghost" onClick={() => go('#sg-work')}>
                See the work
              </button>
            </div>
            <p className="sg-hint sg-fade">
              <span aria-hidden="true">↓</span> {webgl === false ? 'Scroll — ten channels, one engineer.' : 'Scroll to retune the signal. Move the cursor through it.'}
            </p>
          </div>
        </section>

        {/* 01 — about + globe */}
        <section className="sg-block" id="sg-about" aria-labelledby="sg-about-h">
          <Slot i={1} />
          <div className="sg-copy">
            <Label i={1}>About · {profile.location}</Label>
            <h2 className="sg-h2 sg-rv" id="sg-about-h">
              {statement}
            </h2>
            <dl className="sg-spec sg-rv">
              {spec.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <ul className="sg-stats">
              {stats.map((s) => (
                <li key={s.label} className="sg-stat sg-rv">
                  <p>
                    <span className="sg-stat__v" data-v={s.value}>
                      {s.value}
                    </span>
                    <small>{s.unit}</small>
                  </p>
                  <span className="sg-stat__l">{s.label}</span>
                  <i style={{ ['--p' as string]: s.value / s.max }} aria-hidden="true" />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 02 / 03 — modules */}
        <div id="sg-modules">
          {[modules.slice(0, 3), modules.slice(3)].map((group, g) => (
            <section className="sg-block" key={g} aria-labelledby={`sg-mod-h${g}`}>
              <Slot i={2 + g} />
              <div className="sg-copy">
                <Label i={2 + g}>{g === 0 ? 'Modules 01–03 · Every screen' : 'Modules 04–05 · Intelligence & depth'}</Label>
                <h2 className="sg-h2 sg-h2--big sg-rv" id={`sg-mod-h${g}`}>
                  {g === 0 ? 'One architecture, three kinds of screen.' : 'Features you can talk to — and see in 3D.'}
                </h2>
                <ol className="sg-mods">
                  {group.map((m) => (
                    <li key={m.code} className="sg-mod sg-rv">
                      <header>
                        <span className="sg-mod__code">{m.code}</span>
                        <h3>{m.title}</h3>
                      </header>
                      <p className="sg-mod__tag">{m.tagline}</p>
                      <p className="sg-mod__stack">{m.stack}</p>
                      <pre className="sg-mod__log">{m.log.join('\n')}</pre>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          ))}
        </div>

        {/* 04–07 — projects */}
        <div id="sg-work">
          {projects.map((p, k) => (
            <section className="sg-block sg-proj" key={p.id} aria-labelledby={`sg-p-${p.id}`}>
              <Slot i={4 + k} />
              <div className="sg-copy">
                {k === 0 && <p className="sg-kicker sg-rv">Selected work · 4 units</p>}
                <Label i={4 + k}>
                  {p.index} · {p.kind}
                </Label>
                <h2 className="sg-proj__t sg-rv" id={`sg-p-${p.id}`}>
                  {p.title}
                </h2>
                <p className="sg-proj__status sg-rv">
                  <span className="sg-pulse" aria-hidden="true" />
                  {p.status}
                </p>
                <p className="sg-proj__sum sg-rv">{p.summary}</p>
                <div className="sg-proj__media sg-rv">
                  {p.image ? (
                    <a href={p.links[0].href} target="_blank" rel="noreferrer" className="sg-shot" aria-label={`${p.title} — open live site`}>
                      <img src={p.image} alt={`${p.title} screenshot`} loading="lazy" decoding="async" width={1200} height={750} />
                    </a>
                  ) : (
                    <LifeCard />
                  )}
                </div>
                <ul className="sg-proj__pts sg-rv">
                  {p.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
                <ul className="sg-chips sg-rv" aria-label="Stack">
                  {p.stack.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <div className="sg-links sg-rv">
                  {p.links.map((l) => (
                    <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="sg-btn sg-btn--sm">
                      {l.label} <span aria-hidden="true">↗</span>
                    </a>
                  ))}
                </div>
                {k === projects.length - 1 && (
                  <div className="sg-archive sg-rv">
                    <p className="sg-kicker">Archive</p>
                    <ul>
                      {archive.map((a) => (
                        <li key={a.href}>
                          <a href={a.href} target="_blank" rel="noreferrer">
                            <span>{a.title}</span>
                            <small>{a.note}</small>
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

        {/* 08 — experience */}
        <section className="sg-block" id="sg-log" aria-labelledby="sg-log-h">
          <Slot i={8} />
          <div className="sg-copy">
            <Label i={8}>Experience · since 2019</Label>
            <h2 className="sg-h2 sg-h2--big sg-rv" id="sg-log-h">
              Six peaks on the timeline.
            </h2>
            <ol className="sg-log">
              {experience.map((e) => (
                <li key={e.when} className="sg-rv" data-state={e.state}>
                  <p className="sg-log__when">
                    <span>{e.when}</span>
                    <b>{e.state}</b>
                  </p>
                  <h3>{e.role}</h3>
                  <p className="sg-log__co">{e.company}</p>
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

        {/* 09 — contact */}
        <section className="sg-block sg-contact" id="sg-contact" aria-labelledby="sg-contact-h">
          <Slot i={9} />
          <div className="sg-copy">
            <Label i={9}>Dispatch · {profile.status}</Label>
            <h2 className="sg-h2 sg-h2--big sg-rv" id="sg-contact-h">
              Send a signal.
            </h2>
            <a className="sg-mail sg-rv" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <div className="sg-cta sg-rv">
              <a className="sg-btn" href={profile.resume} target="_blank" rel="noreferrer">
                Download résumé
              </a>
              {profile.socials.map((s) => (
                <a key={s.href} className="sg-btn sg-btn--ghost" href={s.href} target="_blank" rel="noreferrer">
                  {s.label} <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
            <footer className="sg-foot sg-rv">
              <span>
                {profile.name} · {profile.location}
              </span>
              <span>Built with React, Three.js & {FORMATIONS.length} particle formations</span>
            </footer>
          </div>
        </section>
      </main>
    </div>
  )
}
