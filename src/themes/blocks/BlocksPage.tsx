import { useEffect, useRef, useState } from 'react'
import { archive, experience, hero, modules, profile, projects, stats, statement } from '../../data/content'
import { gsap, ScrollTrigger, useGSAP, initSmoothScroll, destroySmoothScroll, scrollToTarget, prefersReducedMotion } from '../../lib/motion'
import { hasWebGL } from '../../shared/stage'
import type { BlocksScene } from './scene'
import { SHOP_COLORS, SPOTS, STOPS } from './spots'

const LANDMARK: Record<string, string> = { lifeos: 'The house', examace: 'The school', solar: 'The observatory', client: 'The gallery' }
const ROOF: Record<string, string> = { lifeos: '#ff6b4a', examace: '#f3c55a', solar: '#7f8bab', client: '#2d3240' }

const smooth = (x: number) => {
  // dwell: hold on each stop, then glide to the next
  const t = Math.min(1, Math.max(0, (x - 0.14) / 0.72))
  return t * t * (3 - 2 * t)
}

/** Clock chip text for a time-of-day 0..1 (06:00 → 22:30). */
const clock = (t: number) => {
  const mins = Math.round((6 * 60 + t * 16.5 * 60) / 5) * 5
  return `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

function IsoFallback() {
  // A drawn island for browsers without WebGL: iso cubes, back to front.
  const cubes: { x: number; y: number; h: number; c: string }[] = []
  for (let y = 0; y < 7; y++)
    for (let x = 0; x < 7; x++) {
      const d = Math.hypot(x - 3, y - 3)
      if (d > 3.3) continue
      const h = d < 1.2 ? 3 : d < 2.4 ? 2 : 1
      cubes.push({ x, y, h, c: d > 2.6 ? '#f2dca8' : '#7dc66a' })
    }
  const S = 26
  const iso = (x: number, y: number, z: number) => [200 + (x - y) * S, 130 + (x + y) * S * 0.5 - z * S * 0.62]
  return (
    <svg className="bk-fallback__art" viewBox="0 0 400 360" aria-hidden="true">
      <ellipse cx="200" cy="300" rx="190" ry="44" fill="#3cb2dc" opacity="0.85" />
      {cubes.map(({ x, y, h, c }) => {
        const [ax, ay] = iso(x, y, h)
        const [bx, by] = iso(x + 1, y, h)
        const [cx, cy] = iso(x + 1, y + 1, h)
        const [dx, dy] = iso(x, y + 1, h)
        const [, cy0] = iso(x + 1, y + 1, 0)
        const [, dy0] = iso(x, y + 1, 0)
        const [, by0] = iso(x + 1, y, 0)
        return (
          <g key={`${x}-${y}`}>
            <path d={`M${dx} ${dy}L${cx} ${cy}L${cx} ${cy0}L${dx} ${dy0}Z`} fill="#8a5a36" />
            <path d={`M${cx} ${cy}L${bx} ${by}L${bx} ${by0}L${cx} ${cy0}Z`} fill="#6e4528" />
            <path d={`M${ax} ${ay}L${bx} ${by}L${cx} ${cy}L${dx} ${dy}Z`} fill={c} stroke="rgba(0,0,0,.06)" />
          </g>
        )
      })}
      <g transform="translate(0 86)">
        <path d="M200 26 L226 46 L226 74 L174 74 L174 46 Z" fill="#fff1d8" />
        <path d="M168 48 L200 18 L232 48 Z" fill="#ff6b4a" />
        <rect x="192" y="56" width="16" height="18" fill="#3b5470" />
      </g>
    </svg>
  )
}

function LifeosMock() {
  // LifeOS has no screenshot: a designed phone showing what the app covers.
  const rows = [
    ['Notes', '3 new', '#4f8cff'],
    ['Reminders', 'next 18:30', '#ff6b4a'],
    ['Workout', 'push day', '#2fbf71'],
    ['Routines', '4 of 6', '#9b6bff'],
    ['Expenses', '₹ synced', '#f5b82e'],
  ]
  return (
    <div className="bk-phone" aria-hidden="true">
      <div className="bk-phone__screen">
        <p className="bk-phone__hi">Today</p>
        <ul>
          {rows.map(([a, b, c]) => (
            <li key={a} style={{ ['--c' as string]: c }}>
              <span>{a}</span>
              <em>{b}</em>
            </li>
          ))}
        </ul>
        <p className="bk-phone__ask">Ask about your week…</p>
      </div>
    </div>
  )
}

export default function BlocksPage() {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<BlocksScene | null>(null)
  const labels = useRef<(HTMLButtonElement | null)[]>([])
  const clockRef = useRef<HTMLSpanElement>(null)
  const [webgl, setWebgl] = useState<boolean | null>(null)

  // smooth scroll
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

  // scroll → camera progress. Section anchors are cached; each frame reads scrollY only.
  useEffect(() => {
    const el = root.current
    if (!el) return
    let anchors: number[] = []
    const measure = () => {
      const vh = window.innerHeight
      const max = document.documentElement.scrollHeight - vh
      const secs = [...el.querySelectorAll<HTMLElement>('[data-stop]')]
      anchors = secs.map((s, i) => {
        if (i === 0) return 0
        const r = s.getBoundingClientRect()
        const top = r.top + window.scrollY
        const a = s.dataset.anchor === 'top' ? top - vh * 0.1 : top + Math.min(r.height, vh * 1.4) / 2 - vh / 2
        return Math.min(max, Math.max(0, a))
      })
      for (let i = 1; i < anchors.length; i++) anchors[i] = Math.max(anchors[i], anchors[i - 1] + 1)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    ScrollTrigger.addEventListener('refresh', measure)
    const still = prefersReducedMotion()
    let active = -1
    const progress = () => {
      const y = window.scrollY
      let i = 0
      while (i < anchors.length - 2 && y >= anchors[i + 1]) i++
      const span = anchors[i + 1] - anchors[i]
      const f = span > 0 ? (y - anchors[i]) / span : 0
      let u = Math.min(anchors.length - 1, i + smooth(f))
      if (y >= anchors[anchors.length - 1]) u = anchors.length - 1
      const a = Math.round(u)
      if (a !== active) {
        active = a
        el.dataset.stop = String(a)
      }
      // reduced motion: cut between composed frames instead of flying
      return still ? a : u
    }
    ;(el as unknown as { __progress: () => number }).__progress = progress
    progress()
    const onScroll = () => {
      if (still) {
        progress()
        sceneRef.current?.invalidate()
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      ro.disconnect()
      ScrollTrigger.removeEventListener('refresh', measure)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // the island (three.js in its own chunk)
  useEffect(() => {
    let alive = true
    const c = canvas.current
    if (!c || !hasWebGL()) {
      setWebgl(false)
      return
    }
    let lastClock = ''
    import('./scene')
      .then(({ createBlocksScene }) => {
        if (!alive || !canvas.current || !root.current) return
        const el = root.current
        const s = createBlocksScene(canvas.current, {
          progress: () => (el as unknown as { __progress?: () => number }).__progress?.() ?? 0,
          labels: labels.current,
          onHover: (k) => {
            el.dataset.hover = k ?? ''
          },
          onPick: (k) => {
            const spot = SPOTS.find((x) => x.key === k)
            if (spot) scrollToTarget(`#bk-${STOPS[spot.stop]}`, spot.stop === 2 ? -40 : 0)
          },
          onTime: (t) => {
            const txt = clock(t)
            if (txt !== lastClock && clockRef.current) {
              lastClock = txt
              clockRef.current.textContent = txt
              el.dataset.night = t > 0.8 ? '1' : ''
            }
          },
        })
        sceneRef.current = s
        setWebgl(Boolean(s))
      })
      .catch(() => alive && setWebgl(false))
    return () => {
      alive = false
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('.bk-hero__name > span', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.09, delay: 0.15 })
      gsap.from('.bk-hero__line, .bk-hero__cta, .bk-hero__meta', { opacity: 0, y: 14, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.55 })
      // cards rise in as they arrive; scrubbed so they never lag behind the scroll
      gsap.utils.toArray<HTMLElement>('.bk-card').forEach((card) => {
        gsap.fromTo(card, { y: 60, rotate: card.dataset.side === 'right' ? 1.2 : -1.2 }, { y: 0, rotate: 0, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 60%', scrub: true } })
      })
    },
    { scope: root },
  )

  const go = (id: string, off = 0) => () => scrollToTarget(`#bk-${id}`, off)
  const highlight = (k: string | null) => () => sceneRef.current?.highlight(k)

  return (
    <div className="bk" ref={root} data-stop="0" data-webgl={webgl === false ? 'off' : webgl ? 'on' : undefined}>
      <canvas ref={canvas} className="bk-canvas" aria-hidden="true" />
      {webgl === false && (
        <div className="bk-fallback" aria-hidden="true">
          <IsoFallback />
        </div>
      )}

      <div className="bk-labels">
        {SPOTS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className={`bk-label bk-label--${s.kind}`}
            data-key={s.key}
            ref={(n) => {
              labels.current[i] = n
            }}
            onClick={() => scrollToTarget(`#bk-${STOPS[s.stop]}`, s.stop === 2 ? -40 : 0)}
            onPointerEnter={highlight(s.key)}
            onPointerLeave={highlight(null)}
          >
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <header className="bk-nav">
        <button type="button" className="bk-nav__me" onClick={() => scrollToTarget(0)}>
          <span className="bk-logo" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {profile.name}
        </button>
        <nav aria-label="Sections">
          <button type="button" onClick={go('about')}>
            About
          </button>
          <button type="button" onClick={go('skills', -40)}>
            Skills
          </button>
          <button type="button" onClick={go('lifeos')}>
            Work
          </button>
          <button type="button" onClick={go('log')}>
            Experience
          </button>
          <button type="button" onClick={go('contact')}>
            Contact
          </button>
        </nav>
        <a className="bk-nav__cv" href={profile.resume} target="_blank" rel="noreferrer">
          Résumé
        </a>
      </header>

      <div className="bk-clock" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="bk-clock__sun">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" />
        </svg>
        <svg viewBox="0 0 24 24" className="bk-clock__moon">
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
        </svg>
        <span ref={clockRef}>06:00</span>
      </div>

      <main>
        <section className="bk-sec bk-hero" id="bk-top" data-stop="0">
          <div className="bk-hero__copy">
            <p className="bk-hero__meta">
              <span className="bk-dot" aria-hidden="true" />
              {profile.status} · {profile.location}
            </p>
            <h1 className="bk-hero__name">
              <span>{profile.firstName}</span>
              <span>{profile.lastName}</span>
            </h1>
            <p className="bk-hero__line">{hero.line}</p>
            <div className="bk-hero__cta">
              <button type="button" className="bk-btn" onClick={go('about')}>
                Tour the island
              </button>
              <a className="bk-btn bk-btn--ghost" href={`mailto:${profile.email}`}>
                Email me
              </a>
            </div>
          </div>
          <p className="bk-hint">{webgl === false ? 'Four landmarks, five workshops — scroll to visit.' : 'Scroll to fly around. Hover or tap a building to visit it.'}</p>
        </section>

        <section className="bk-sec" id="bk-about" data-stop="1">
          <article className="bk-card bk-card--about" data-side="right" style={{ ['--roof' as string]: '#ff6b4a' }}>
            <div className="bk-card__who">
              <img src={profile.portrait} alt={`Portrait of ${profile.name}`} width="72" height="72" loading="lazy" />
              <div>
                <p className="bk-card__name">{profile.name}</p>
                <p className="bk-muted">{profile.roles.join(' · ')}</p>
              </div>
            </div>
            <h2 className="bk-statement">{statement}</h2>
            <dl className="bk-stats">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>
                    {s.value}
                    <small>{s.unit}</small>
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        </section>

        <section className="bk-sec" id="bk-skills" data-stop="2">
          <article className="bk-card bk-card--skills" data-side="left" style={{ ['--roof' as string]: '#4f8cff' }}>
            <h2 className="bk-h2">Five workshops</h2>
            <p className="bk-muted bk-lede">Each shed on the island builds one kind of thing.</p>
            <ul className="bk-shops">
              {modules.map((m, i) => (
                <li key={m.code} style={{ ['--c' as string]: SHOP_COLORS[i] }} onPointerEnter={highlight(`w${i}`)} onPointerLeave={highlight(null)}>
                  <span className="bk-shops__roof" aria-hidden="true" />
                  <div>
                    <h3>{m.title}</h3>
                    <p>{m.tagline}</p>
                    <ul className="bk-chips">
                      {m.stack.split(' · ').map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </section>

        {projects.map((p, i) => (
          <section className="bk-sec" id={`bk-${p.id}`} data-stop={3 + i} key={p.id}>
            <article
              className="bk-card bk-card--project"
              data-side={i % 2 === 0 ? 'right' : 'left'}
              style={{ ['--roof' as string]: ROOF[p.id] }}
              onPointerEnter={highlight(p.id)}
              onPointerLeave={highlight(null)}
            >
              <p className="bk-tag">
                <span>{LANDMARK[p.id]}</span>
                <span className="bk-stamp">{p.stamp}</span>
              </p>
              <h2 className="bk-h2">{p.title}</h2>
              <p className="bk-muted">
                {p.kind} — {p.status}
              </p>
              <div className="bk-shot">{p.image ? <img src={p.image} alt={`${p.title} screenshot`} loading="lazy" /> : <LifeosMock />}</div>
              <p className="bk-summary">{p.summary}</p>
              <ul className="bk-points">
                {p.points.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <ul className="bk-chips">
                {p.stack.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <div className="bk-links">
                {p.links.map((l, j) => (
                  <a key={l.href} className={j === 0 ? 'bk-btn' : 'bk-btn bk-btn--ghost'} href={l.href} target="_blank" rel="noreferrer">
                    {l.label === 'Live' ? 'Visit live' : 'Read the code'}
                  </a>
                ))}
              </div>
            </article>
            {p.id === 'client' && (
              <aside className="bk-card bk-card--more" data-side="left" style={{ ['--roof' as string]: '#7dc66a' }}>
                <h3>Smaller builds</h3>
                <ul>
                  {archive.map((a) => (
                    <li key={a.title}>
                      <a href={a.href} target="_blank" rel="noreferrer">
                        {a.title}
                      </a>
                      <span>{a.note}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </section>
        ))}

        <section className="bk-sec bk-sec--long" id="bk-log" data-stop="7" data-anchor="top">
          <article className="bk-card bk-card--log" data-side="right" style={{ ['--roof' as string]: '#ffb06e' }}>
            <h2 className="bk-h2">The road so far</h2>
            <ol className="bk-log">
              {experience.map((e) => (
                <li key={e.when}>
                  <p className="bk-when">
                    {e.when.replace('→', '–').replace('NOW', 'now')}
                    {e.state === 'RUNNING' && <span className="bk-stamp">Now</span>}
                  </p>
                  <h3>{e.role}</h3>
                  <p className="bk-muted">{e.company}</p>
                  <ul>
                    {e.points.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </article>
        </section>

        <section className="bk-sec bk-end" id="bk-contact" data-stop="8">
          <article className="bk-card bk-card--contact" data-side="left" style={{ ['--roof' as string]: '#ffcf7a' }}>
            <h2 className="bk-end__big">The lights are on. Say hello.</h2>
            <p className="bk-muted">
              {profile.status} · {profile.roles.join(' · ')}
            </p>
            <a className="bk-end__mail" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <ul className="bk-social">
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
            <p className="bk-foot">
              © 2026 {profile.name} · {profile.location}
            </p>
          </article>
        </section>
      </main>
    </div>
  )
}
