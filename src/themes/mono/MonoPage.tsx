import { useEffect, useRef, useState, type FormEvent } from 'react'
import { archive, experience, modules, profile, projects, statement, type Project } from '../../data/content'
import { gsap, ScrollTrigger, useGSAP, initSmoothScroll, destroySmoothScroll, scrollToTarget, prefersReducedMotion } from '../../lib/motion'
import Crowd from './Crowd'

const MODE_KEY = 'jy-mono-mode'
const INTRO_KEY = 'jy-mono-intro'
const TYPED = '/AI & FULL-STACK DEVELOPMENT'
const links = [
  { id: 'about', label: 'About' },
  { id: 'stack', label: 'Stack' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
]

const readMode = (): 'dark' | 'light' => {
  try {
    return localStorage.getItem(MODE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

/** The intro plays once per browser session (not on every theme switch back). */
const introSeen = () => {
  try {
    return sessionStorage.getItem(INTRO_KEY) === '1'
  } catch {
    return false
  }
}

const go = (id: string) => scrollToTarget(`#${id}`, -24)

/** Desktop gets the pinned 3D deck; phones and reduced motion get a plain list. */
const deckQuery = '(min-width: 900px) and (prefers-reduced-motion: no-preference)'
function useDeck() {
  const [on, setOn] = useState(() => window.matchMedia(deckQuery).matches)
  useEffect(() => {
    const mq = window.matchMedia(deckQuery)
    const f = () => setOn(mq.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])
  return on
}

function Arrow() {
  return (
    <svg className="m-arrow" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 12 L12 4 M5.5 4 H12 V10.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function Nav({ mode, onMode }: { mode: string; onMode: () => void }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', close)
    window.addEventListener('pointerdown', close)
    return () => {
      window.removeEventListener('keydown', close)
      window.removeEventListener('pointerdown', close)
    }
  }, [open])
  return (
    <div className="m-nav" ref={box}>
      <div className="m-nav__pill">
        <button type="button" className="m-nav__name" onClick={() => scrollToTarget(0)}>
          {profile.firstName}
          <span className="m-nav__dot" aria-hidden="true" />
        </button>
        <button type="button" className="m-nav__icon" onClick={onMode} aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          {mode === 'dark' ? (
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i * Math.PI) / 4
                return <line key={i} x1={10 + Math.cos(a) * 6} y1={10 + Math.sin(a) * 6} x2={10 + Math.cos(a) * 8} y2={10 + Math.sin(a) * 8} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              })}
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M15.5 12.5 A6.5 6.5 0 1 1 7.5 4.5 A5 5 0 0 0 15.5 12.5 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <button type="button" className="m-nav__more" aria-expanded={open} aria-label="Menu" onClick={() => setOpen((o) => !o)}>
          <span />
          <span />
          <span />
        </button>
      </div>
      {open && (
        <nav className="m-nav__menu" aria-label="Sections">
          {links.map((l, i) => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                setOpen(false)
                go(l.id)
              }}
            >
              {l.label}
              <span className="m-nav__n">0{i + 1}</span>
            </button>
          ))}
          <a href={profile.resume} target="_blank" rel="noreferrer">
            Résumé <Arrow />
          </a>
        </nav>
      )}
    </div>
  )
}

/** The portrait as a real 3D card: depth layers in front, a designed back, a few px of thickness. */
function PortraitCard() {
  return (
    <div className="m-card" aria-hidden="false">
      <div className="m-card__tilt">
        <div className="m-card__body">
          <div className="m-card__edge" style={{ ['--z' as string]: '-2px' }} />
          <div className="m-card__edge" style={{ ['--z' as string]: '-4px' }} />
          <div className="m-card__edge" style={{ ['--z' as string]: '-6px' }} />
          <div className="m-card__face m-card__front">
            <img className="m-card__img" src={profile.portrait} alt={`Portrait of ${profile.name}`} />
            <span className="m-card__shade" />
            <span className="m-card__frame" />
            <span className="m-card__year">©2026</span>
            <span className="m-card__chip">{'{{ /AI & FULL-STACK }}'}</span>
            <span className="m-card__sig">{profile.name}</span>
          </div>
          <div className="m-card__face m-card__back">
            <span className="m-card__mono">JY</span>
            <span className="m-card__role">&lt; Software Engineer /&gt;</span>
            <span className="m-card__lines" />
            <span className="m-card__foot">
              {profile.location}
              <br />
              {profile.roles.join(' · ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function LifeOSArt() {
  return (
    <div className="m-life">
      <div className="m-life__phone">
        <span className="m-life__notch" />
        <p>LifeOS</p>
        <ul>
          <li>
            Notes <b>12</b>
          </li>
          <li>
            Workout <b>45m</b>
          </li>
          <li>
            Spent <b>₹840</b>
          </li>
        </ul>
        <span className="m-life__ask">Ask about your week…</span>
      </div>
      <span className="m-life__word">LifeOS</span>
    </div>
  )
}

function Shot({ p }: { p: Project }) {
  return p.image ? <img src={p.image} alt="" loading="lazy" /> : <LifeOSArt />
}

function ProjectText({ p, i }: { p: Project; i: number }) {
  return (
    <>
      <p className="m-pt__n">
        <span>{String(i + 1).padStart(2, '0')}</span> / {String(projects.length).padStart(2, '0')}
        <span className="m-pt__status">{p.status}</span>
      </p>
      <h3 className="m-pt__title">{p.title}</h3>
      <p className="m-pt__kind">{p.kind}</p>
      <p className="m-pt__sum">{p.summary}</p>
      <ul className="m-pt__points">
        {p.points.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <ul className="m-chips">
        {p.stack.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <p className="m-pt__links">
        {p.links.map((l) => (
          <a key={l.href} className={l.label === 'Live' ? 'm-btn' : 'm-btn m-btn--ghost'} href={l.href} target="_blank" rel="noreferrer">
            {l.label === 'Live' ? 'Open live site' : 'Read the code'} <Arrow />
          </a>
        ))}
      </p>
    </>
  )
}

/** Desktop: the card flips through the projects as you scroll (two faces, contents swapped while hidden). */
function Deck() {
  return (
    <div className="m-deck-wrap">
      <div className="m-deck-stick">
        <div className="m-deck">
          <div className="m-deck__body">
            <div className="m-card__edge" style={{ ['--z' as string]: '-2px' }} />
            <div className="m-card__edge" style={{ ['--z' as string]: '-4px' }} />
            {['a', 'b'].map((face) => (
              <div key={face} className={`m-deck__face m-deck__face--${face}`}>
                {projects.map((p, i) => (
                  <div key={p.id} className="m-deck__shot" data-i={i}>
                    <Shot p={p} />
                    <span className="m-deck__tag">
                      {p.title} <i>{p.stamp}</i>
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="m-deck__texts">
          {projects.map((p, i) => (
            <article key={p.id} className="m-pt" data-i={i}>
              <ProjectText p={p} i={i} />
            </article>
          ))}
        </div>
        <ol className="m-deck__bar" aria-hidden="true">
          {projects.map((p) => (
            <li key={p.id}>
              <i />
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function ProjectList() {
  return (
    <div className="m-plist">
      {projects.map((p, i) => (
        <article key={p.id} className="m-pl">
          <a className="m-pl__img" href={p.links[0].href} target="_blank" rel="noreferrer" aria-label={`${p.title} — open`}>
            <Shot p={p} />
          </a>
          <div className="m-pt m-pt--static">
            <ProjectText p={p} i={i} />
          </div>
        </article>
      ))}
    </div>
  )
}

function Timeline() {
  const n = experience.length
  const step = 340
  const d = experience
    .map((_, i) => {
      const x = i * step + 40
      return i === 0 ? `M${x} 40` : `C${x - step * 0.62} ${i % 2 ? -4 : 84} ${x - step * 0.38} ${i % 2 ? 84 : -4} ${x} 40`
    })
    .join(' ')
  return (
    <div className="m-tl">
      <div className="m-tl__track" style={{ ['--n' as string]: n }}>
        <svg className="m-tl__wire" viewBox={`0 0 ${n * step} 80`} preserveAspectRatio="none" aria-hidden="true">
          <path className="m-tl__ghost" d={d} />
          <path className="m-tl__path" d={d} pathLength={1} />
        </svg>
        {experience.map((j, i) => (
          <article key={j.when} className="m-tl__item" data-now={i === 0 || undefined}>
            <span className="m-tl__dot" aria-hidden="true" />
            <p className="m-tl__when">
              {j.when.replace('→', '–').replace('NOW', 'Present')}
              {i === 0 && <span className="m-tag">Now</span>}
            </p>
            <h3>{j.role}</h3>
            <p className="m-tl__co">{j.company}</p>
            <ul className="m-tl__notes">
              {j.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  )
}

function Contact() {
  const [copied, setCopied] = useState(false)
  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const name = String(f.get('name') || '').trim()
    const from = String(f.get('email') || '').trim()
    const msg = String(f.get('message') || '').trim()
    const subject = `Hello from ${name || 'your portfolio'}`
    const body = `${msg}\n\n— ${name}${from ? ` (${from})` : ''}`
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard blocked: the address is still visible to select
    }
  }
  return (
    <section className="m-sec m-contact" id="contact">
      <div className="m-contact__l">
        <h2 className="m-h2 m-h2--xl">Let’s talk.</h2>
        <p className="m-lede">Whether it’s a full-time role or a freelance project, my inbox is open.</p>
        <p className="m-mail">
          <a href={`mailto:${profile.email}`}>
            {profile.email} <Arrow />
          </a>
          <button type="button" className="m-copy" onClick={copy} aria-label="Copy email address">
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </p>
        <ul className="m-social">
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
      </div>
      <form className="m-form" onSubmit={send}>
        <label>
          <span>Your name</span>
          <input name="name" autoComplete="name" placeholder="What should I call you?" />
        </label>
        <label>
          <span>Email address</span>
          <input name="email" type="email" autoComplete="email" placeholder="you@company.com" />
        </label>
        <label className="m-form__wide">
          <span>What do you have in mind?</span>
          <textarea name="message" rows={4} placeholder="A little about the role or project…" required />
        </label>
        <div className="m-form__foot">
          <button type="submit" className="m-btn">
            Write the email <Arrow />
          </button>
          <span>Opens your mail app with this filled in.</span>
        </div>
      </form>
    </section>
  )
}

function Footer() {
  return (
    <footer className="m-foot">
      <div className="m-foot__top">
        <div>
          <p className="m-foot__brand">{profile.firstName}.</p>
          <p className="m-foot__small">
            Full-stack, Flutter
            <br />& AI developer.
          </p>
        </div>
        <div>
          <p className="m-foot__label">Explore</p>
          <ul className="m-foot__links">
            {links.map((l) => (
              <li key={l.id}>
                <button type="button" onClick={() => go(l.id)}>
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="m-foot__label">Get in touch</p>
          <a className="m-foot__mail" href={`mailto:${profile.email}`}>
            {profile.email} <Arrow />
          </a>
          <p className="m-foot__small">© 2026 {profile.name}</p>
        </div>
      </div>
      <div className="m-foot__bye">
        <p>See you around.</p>
        <button type="button" onClick={() => scrollToTarget(0)}>
          Back to top ↑
        </button>
      </div>
      <div className="m-foot__stage">
        <p className="m-foot__giant" aria-hidden="true">
          {profile.firstName.toUpperCase()}
        </p>
        <Crowd />
      </div>
    </footer>
  )
}

export default function MonoPage() {
  const [mode, setMode] = useState(readMode)
  const [intro, setIntro] = useState(() => !introSeen() && !prefersReducedMotion())
  const deck = useDeck()
  const root = useRef<HTMLDivElement>(null)
  const introTl = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    document.documentElement.dataset.mono = mode
    return () => {
      delete document.documentElement.dataset.mono
    }
  }, [mode])

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

  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(MODE_KEY, next)
    } catch {
      // not saved, still switches
    }
    const swap = () => setMode(next)
    if (document.startViewTransition && !prefersReducedMotion()) document.startViewTransition(swap)
    else swap()
  }

  const finishIntro = () => {
    try {
      sessionStorage.setItem(INTRO_KEY, '1')
    } catch {
      // fine
    }
    setIntro(false)
  }
  const skipIntro = () => introTl.current?.progress(1)

  // skip with any key / click / wheel
  useEffect(() => {
    if (!intro) return
    const skip = () => skipIntro()
    window.addEventListener('keydown', skip)
    window.addEventListener('wheel', skip, { passive: true })
    window.addEventListener('touchstart', skip, { passive: true })
    return () => {
      window.removeEventListener('keydown', skip)
      window.removeEventListener('wheel', skip)
      window.removeEventListener('touchstart', skip)
    }
  }, [intro])

  // ---- intro + hero (runs once on mount) ----
  useGSAP(
    () => {
      const reduce = prefersReducedMotion()
      const heroIn = (tl?: gsap.core.Timeline, at = 0) => {
        if (reduce) return
        const t = tl ?? gsap.timeline()
        t.from('.m-hero__hi .m-ln > span', { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.07 }, at)
        t.from('.m-hero__meta, .m-hero__role, .m-hero__now, .m-hero__pitch, .m-hero__cta', { y: 16, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05 }, at + 0.15)
      }

      if (!intro) {
        heroIn()
        return
      }
      const card = document.querySelector<HTMLElement>('.m-hero .m-card')
      const body = card?.querySelector<HTMLElement>('.m-card__body')
      if (!card || !body) {
        finishIntro()
        return
      }
      document.documentElement.classList.add('m-introing')
      const r = card.getBoundingClientRect()
      const target = Math.min(window.innerWidth * 0.52, 300)
      const s0 = target / r.width
      const dx = window.innerWidth / 2 - (r.left + r.width / 2)
      const dy = window.innerHeight / 2 - (r.top + r.height / 2)
      const typed = document.querySelector('.m-intro__typed')
      const counter = { n: 0 }

      const tl = gsap.timeline({
        onComplete: () => {
          document.documentElement.classList.remove('m-introing')
          gsap.set(card, { clearProps: 'transform,zIndex' })
          gsap.set(body, { rotationY: 0 })
          finishIntro()
        },
      })
      introTl.current = tl
      tl.set(card, { x: dx, y: dy, scale: s0, zIndex: 960 })
        .fromTo(body, { rotationY: -110, rotationX: 10, z: -260, opacity: 0 }, { rotationY: 0, rotationX: 0, z: 0, opacity: 1, duration: 0.85, ease: 'expo.out' }, 0)
        .from('.m-intro__year', { opacity: 0, x: -24, duration: 0.5, ease: 'power3.out' }, 0.1)
        .from('.m-intro__type', { opacity: 0, duration: 0.2 }, 0.12)
        .to(counter, { n: TYPED.length, duration: 0.8, ease: 'none', onUpdate: () => typed && (typed.textContent = TYPED.slice(0, Math.round(counter.n))) }, 0.15)
        .from('.m-intro__big .m-ln > span', { yPercent: 115, duration: 0.7, ease: 'expo.out', stagger: 0.08 }, 0.22)
        .to(body, { rotationY: 360, duration: 0.7, ease: 'power2.inOut' }, 0.9)
        .to('.m-intro__year, .m-intro__type, .m-intro__big, .m-intro__skip', { opacity: 0, duration: 0.28, ease: 'power1.in' }, 1.42)
        .to(card, { x: 0, y: 0, scale: 1, duration: 0.72, ease: 'expo.inOut' }, 1.52)
        .to('.m-intro', { backgroundColor: 'rgba(0,0,0,0)', duration: 0.4, ease: 'power1.out' }, 1.86)
      heroIn(tl, 1.8)
    },
    { scope: root },
  )

  // ---- scroll + pointer (re-run when the deck/list layout swaps) ----
  useGSAP(
    () => {
      const reduce = prefersReducedMotion()
      if (reduce) return

      // portrait card: pointer tilt (rAF-throttled by quickTo) + a lean back as the hero leaves
      const heroCard = document.querySelector<HTMLElement>('.m-hero .m-card__body')
      const tilt = document.querySelector<HTMLElement>('.m-hero .m-card__tilt')
      let onMove: ((e: PointerEvent) => void) | null = null
      if (heroCard && tilt) {
        const rx = gsap.quickTo(heroCard, 'rotationX', { duration: 0.6, ease: 'power3.out' })
        const ry = gsap.quickTo(heroCard, 'rotationY', { duration: 0.6, ease: 'power3.out' })
        onMove = (e: PointerEvent) => {
          if (e.pointerType !== 'mouse' || document.documentElement.classList.contains('m-introing')) return
          ry(((e.clientX / window.innerWidth) * 2 - 1) * 16)
          rx(-((e.clientY / window.innerHeight) * 2 - 1) * 12)
        }
        window.addEventListener('pointermove', onMove, { passive: true })
        gsap.to(tilt, { rotationX: 24, y: 60, scale: 0.94, ease: 'none', scrollTrigger: { trigger: '.m-hero', start: 'top top', end: 'bottom top', scrub: true } })
      }

      // statement words light up as it scrolls past
      gsap.fromTo('.m-say__w', { opacity: 0.14 }, { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '.m-say', start: 'top 78%', end: 'bottom 50%', scrub: true } })

      gsap.utils.toArray<HTMLElement>('.m-rise').forEach((el) => {
        gsap.from(el, { y: 28, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
      })

      // the deck: one card flips through the four projects
      if (deck) {
        const body = document.querySelector<HTMLElement>('.m-deck__body')
        const deckEl = document.querySelector<HTMLElement>('.m-deck')
        const shotsA = gsap.utils.toArray<HTMLElement>('.m-deck__face--a .m-deck__shot')
        const shotsB = gsap.utils.toArray<HTMLElement>('.m-deck__face--b .m-deck__shot')
        const texts = gsap.utils.toArray<HTMLElement>('.m-pt[data-i]')
        const bars = gsap.utils.toArray<HTMLElement>('.m-deck__bar i')
        const n = projects.length
        let a = -1
        let b = -1
        const sync = () => {
          const rot = Number(gsap.getProperty(body, 'rotationY')) || 0
          const na = Math.min(n - 1, 2 * Math.round(rot / 360))
          const nb = Math.min(n - 1, 2 * Math.floor((rot + 90) / 360) + 1)
          if (na !== a) {
            shotsA.forEach((s, i) => s.classList.toggle('is-on', i === na))
            a = na
          }
          if (nb !== b) {
            shotsB.forEach((s, i) => s.classList.toggle('is-on', i === nb))
            b = nb
          }
        }
        const tl = gsap.timeline({ defaults: { ease: 'none' }, onUpdate: sync })
        texts.forEach((t, i) => {
          if (i > 0) tl.fromTo(t, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.18, ease: 'power2.out' }, i - 0.3)
          if (i < n - 1) tl.to(t, { autoAlpha: 0, y: -30, duration: 0.14, ease: 'power2.in' }, i + 0.54)
          tl.fromTo(bars[i], { scaleX: 0 }, { scaleX: 1, duration: i === n - 1 ? 0.8 : 1 }, i === 0 ? 0 : i - 0.2)
        })
        for (let i = 0; i < n - 1; i++) {
          tl.to(body, { rotationY: 180 * (i + 1), duration: 0.42, ease: 'power2.inOut' }, i + 0.52)
          tl.to(deckEl, { z: -120, duration: 0.21, ease: 'power2.out' }, i + 0.52).to(deckEl, { z: 0, duration: 0.21, ease: 'power2.in' }, i + 0.73)
        }
        tl.to({}, { duration: 0.2 }, n - 0.2)
        sync()
        ScrollTrigger.create({ trigger: '.m-deck-wrap', start: 'top top', end: 'bottom bottom', scrub: true, animation: tl })
      } else {
        gsap.utils.toArray<HTMLElement>('.m-pl__img').forEach((el) => {
          gsap.from(el, { rotationX: 38, y: 40, opacity: 0, transformPerspective: 900, transformOrigin: '50% 100%', duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } })
        })
      }

      // experience: sideways on desktop, the connector draws itself
      const mm = gsap.matchMedia()
      mm.add('(min-width: 900px)', () => {
        const track = document.querySelector<HTMLElement>('.m-tl__track')
        if (!track) return
        const dist = () => Math.max(0, track.scrollWidth - (track.parentElement?.clientWidth ?? window.innerWidth))
        const tl = gsap.timeline({ defaults: { ease: 'none' } })
        tl.to(track, { x: () => -dist(), duration: 1 }, 0).fromTo('.m-tl__path', { strokeDashoffset: 1 }, { strokeDashoffset: 0.08, duration: 1 }, 0)
        ScrollTrigger.create({ trigger: '#experience', start: 'top top', end: () => `+=${dist() + window.innerHeight * 0.3}`, pin: true, scrub: true, animation: tl, invalidateOnRefresh: true })
      })

      // the footer is the main character: the crowd rises in as it arrives
      gsap.fromTo('.crowd', { yPercent: 16 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.m-foot__stage', start: 'top bottom', end: 'bottom bottom', scrub: true } })
      gsap.fromTo('.m-foot__giant', { yPercent: 40, opacity: 0.2 }, { yPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.m-foot__stage', start: 'top bottom', end: 'bottom bottom', scrub: true } })

      return () => {
        if (onMove) window.removeEventListener('pointermove', onMove)
        mm.revert()
      }
    },
    { scope: root, dependencies: [deck], revertOnUpdate: true },
  )

  const words = statement.split(' ')

  return (
    <div className="mono" ref={root}>
      {intro && (
        <div className="m-intro" onClick={skipIntro} aria-hidden="true">
          <span className="m-intro__year">©2026</span>
          <span className="m-intro__type">
            {'{{ '}
            <span className="m-intro__typed" />
            <span className="m-intro__caret" />
            {' }}'}
          </span>
          <p className="m-intro__big">
            <span className="m-ln">
              <span>&lt; Software</span>
            </span>
            <span className="m-ln">
              <span>Engineer /&gt;</span>
            </span>
          </p>
          <button type="button" className="m-intro__skip" onClick={skipIntro}>
            Skip intro
          </button>
        </div>
      )}
      <Nav mode={mode} onMode={toggleMode} />
      <main>
        <section className="m-hero" id="top">
          <p className="m-hero__meta">
            <span>©2026</span>
            <span>{'{{ /AI & FULL-STACK DEVELOPMENT }}'}</span>
          </p>
          <div className="m-hero__left">
            <h1 className="m-hero__hi">
              <span className="m-ln">
                <span>Hi, I’m</span>
              </span>
              <span className="m-ln">
                <span>{profile.firstName}.</span>
              </span>
            </h1>
            <p className="m-hero__role">
              Full-stack, Flutter
              <br />& AI developer.
            </p>
            <div className="m-hero__now">
              <span>Currently at</span>
              <strong>Hitachi India</strong>
              <span>{profile.location}</span>
            </div>
          </div>
          <PortraitCard />
          <div className="m-hero__right">
            <p className="m-hero__pitch">
              I build <strong>real-time dashboards</strong>, <strong>Flutter apps</strong> and <strong>AI features</strong> that share one backend, so teams ship to web, phone and desktop
              at once.
            </p>
            <div className="m-hero__cta">
              <button type="button" className="m-btn" onClick={() => go('projects')}>
                See the work <Arrow />
              </button>
              <a className="m-btn m-btn--ghost" href={profile.resume} target="_blank" rel="noreferrer">
                Résumé
              </a>
            </div>
          </div>
        </section>

        <section className="m-sec m-say" id="about">
          <p className="m-say__text">
            {words.map((w, i) => (
              <span key={i} className="m-say__w">
                {w}{' '}
              </span>
            ))}
          </p>
          <dl className="m-facts">
            <div className="m-rise">
              <dt>3+ yrs</dt>
              <dd>in production at Hitachi</dd>
            </div>
            <div className="m-rise">
              <dt>4</dt>
              <dd>Flutter apps on Play & TestFlight</dd>
            </div>
            <div className="m-rise">
              <dt>3</dt>
              <dd>platforms from one architecture</dd>
            </div>
            <div className="m-rise">
              <dt>JP · EU</dt>
              <dd>teams I ship with, from India</dd>
            </div>
          </dl>
        </section>

        <section className="m-sec" id="stack">
          <div className="m-sec__head">
            <h2 className="m-h2">Tech stack</h2>
            <p className="m-sec__aside">What I use day to day, grouped by where it runs.</p>
          </div>
          <div className="m-stack">
            {modules.map((m, i) => (
              <div key={m.code} className="m-stack__col m-rise">
                <p className="m-stack__n">0{i + 1}</p>
                <h3>{m.title}</h3>
                <p>{m.tagline}</p>
                <ul className="m-chips">
                  {m.stack.split(' · ').map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="m-sec m-work" id="projects">
          <div className="m-sec__head">
            <h2 className="m-h2">Featured projects</h2>
            <a className="m-sec__aside m-link" href={profile.socials[0].href} target="_blank" rel="noreferrer">
              All code on GitHub <Arrow />
            </a>
          </div>
          {deck ? <Deck /> : <ProjectList />}
          <ul className="m-archive">
            {archive.map((a) => (
              <li key={a.title}>
                <a href={a.href} target="_blank" rel="noreferrer">
                  <span>{a.title}</span>
                  <span className="m-archive__note">{a.note}</span>
                  <Arrow />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="m-sec m-exp" id="experience">
          <div className="m-sec__head">
            <h2 className="m-h2">Experience.</h2>
            <a className="m-sec__aside m-link" href={profile.resume} target="_blank" rel="noreferrer">
              Full résumé <Arrow />
            </a>
          </div>
          <Timeline />
        </section>

        <Contact />
      </main>
      <Footer />
    </div>
  )
}
