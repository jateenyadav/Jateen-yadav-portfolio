import { useEffect, useRef, useState } from 'react'
import { archive, experience, hero, modules, profile, projects, spec, stats, statement } from '../../data/content'
import { gsap, ScrollTrigger, useGSAP, initSmoothScroll, destroySmoothScroll, scrollToTarget, prefersReducedMotion } from '../../lib/motion'
import { hasWebGL } from '../../shared/stage'
import type { RetroScene } from './scene'
import { PROMPT, Terminal, type Line, type Phosphor } from './terminal'

/** Section → the command the terminal runs when you scroll to it. */
const SECTIONS = [
  { id: 'top', cmd: '' },
  { id: 'about', cmd: 'about' },
  { id: 'skills', cmd: 'skills' },
  { id: 'work', cmd: 'projects' },
  { id: 'log', cmd: 'experience' },
  { id: 'contact', cmd: 'contact' },
]
const CHIPS = ['help', 'about', 'skills', 'projects', 'experience', 'contact']

const dwell = (x: number) => {
  const t = Math.min(1, Math.max(0, (x - 0.12) / 0.76))
  return t * t * (3 - 2 * t)
}

/** Mirrors terminal lines into real DOM text (phones, no-WebGL). Updates only the tail. */
function syncLines(el: HTMLElement, lines: Line[]) {
  const src = lines.slice(-160)
  const kids = el.children
  const first = src[0]
  if (src.length < kids.length || (kids.length && (kids[0] as HTMLElement & { __line?: Line }).__line !== first)) el.textContent = ''
  for (let i = Math.max(0, kids.length - 1); i < src.length; i++) {
    let p = kids[i] as (HTMLElement & { __line?: Line }) | undefined
    if (!p) {
      p = document.createElement('div') as HTMLElement & { __line?: Line }
      el.appendChild(p)
    }
    p.__line = src[i]
    p.className = `rt-ln rt-ln--${src[i].kind}`
    if (p.textContent !== src[i].text) p.textContent = src[i].text || ' '
  }
}

function CommandLine({ term, inputRef, id, compact }: { term: Terminal; inputRef?: React.RefObject<HTMLInputElement | null>; id: string; compact?: boolean }) {
  const [v, setV] = useState('')
  return (
    <form
      className={compact ? 'rt-cmd rt-cmd--flat' : 'rt-cmd'}
      onSubmit={(e) => {
        e.preventDefault()
        ;(term as Terminal & { __user?: boolean }).__user = true
        term.submit(v)
        ;(term as Terminal & { __user?: boolean }).__user = false
        setV('')
      }}
    >
      <label htmlFor={id}>{PROMPT}</label>
      <input
        id={id}
        ref={inputRef}
        value={v}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="go"
        placeholder="type help"
        aria-label="Terminal command"
        onChange={(e) => {
          setV(e.target.value)
          term.setInput(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') (e.target as HTMLInputElement).blur()
          if (e.key === 'Backspace') term.act({ type: 'key', ch: '\b' })
        }}
        onBlur={() => term.setInput('')}
        onFocus={(e) => term.setInput(e.target.value)}
      />
      <button type="submit" aria-label="Run command">
        ↵
      </button>
    </form>
  )
}

/** The flat CRT used on phones and when WebGL is missing: real DOM text, real input. */
function FlatCrt({ term }: { term: Terminal }) {
  const out = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const sync = () => {
      raf = 0
      if (!out.current) return
      syncLines(out.current, term.snapshot())
      out.current.scrollTop = out.current.scrollHeight
    }
    const off = term.onChange(() => {
      if (!raf) raf = requestAnimationFrame(sync)
    })
    sync()
    return () => {
      off()
      cancelAnimationFrame(raf)
    }
  }, [term])
  return (
    <div className="rt-flat">
      <div className="rt-flat__bezel">
        <div className="rt-flat__glass">
          <div className="rt-flat__out" ref={out} role="log" aria-live="polite" aria-label="Terminal output" />
          <CommandLine term={term} id="rt-flat-input" compact />
        </div>
      </div>
      <div className="rt-flat__chin" aria-hidden="true">
        <span>{profile.model}</span>
        <i />
      </div>
    </div>
  )
}

export default function RetroPage() {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<RetroScene | null>(null)
  const consoleInput = useRef<HTMLInputElement>(null)
  const sr = useRef<HTMLDivElement>(null)
  const [term] = useState(() => new Terminal({ instant: prefersReducedMotion() }))
  const [phone] = useState(() => window.matchMedia('(max-width: 760px)').matches)
  const [webgl, setWebgl] = useState<boolean | null>(phone ? false : null)
  const [phosphor, setPhosphorState] = useState<Phosphor>('green')
  const flat = phone || webgl === false

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

  // terminal: boot, actions, announcements
  useEffect(() => {
    const offAct = term.onAction((a) => {
      if (a.type === 'open') window.open(a.href, '_blank', 'noopener,noreferrer')
      if (a.type === 'phosphor') {
        setPhosphorState(a.value)
        sceneRef.current?.setPhosphor(a.value)
      }
      if (a.type === 'key') sceneRef.current?.press(a.ch)
    })
    const offAnn = term.onAnnounce((text) => {
      if ((term as Terminal & { __user?: boolean }).__user && sr.current) sr.current.textContent = text
    })
    term.start()
    // the canvas draws with IBM Plex Mono: wait for it, then boot
    let alive = true
    Promise.all([document.fonts.load('500 29px "IBM Plex Mono"'), document.fonts.load('700 58px "IBM Plex Mono"')])
      .catch(() => null)
      .then(() => {
        if (!alive) return
        term.refresh()
        term.boot()
      })
    return () => {
      alive = false
      offAct()
      offAnn()
      term.stop()
    }
  }, [term])

  // start typing anywhere → focus the command line
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || t.closest('input, textarea, select, [contenteditable]')) return
      if (!/^[a-z0-9]$/i.test(e.key)) return
      const input = (consoleInput.current ?? document.getElementById('rt-flat-input')) as HTMLInputElement | null
      input?.focus({ preventScroll: true })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // scroll → camera progress + the command each section prints
  useEffect(() => {
    const el = root.current
    if (!el) return
    let anchors: number[] = []
    const measure = () => {
      const vh = window.innerHeight
      const max = document.documentElement.scrollHeight - vh
      anchors = [...el.querySelectorAll<HTMLElement>('[data-stop]')].map((s, i) => {
        if (i === 0) return 0
        const r = s.getBoundingClientRect()
        const top = r.top + window.scrollY
        const a = s.dataset.anchor === 'top' ? top - vh * 0.15 : top + Math.min(r.height, vh * 1.3) / 2 - vh / 2
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
    let timer = 0
    const progress = () => {
      const y = window.scrollY
      let i = 0
      while (i < anchors.length - 2 && y >= anchors[i + 1]) i++
      const span = anchors[i + 1] - anchors[i]
      let u = Math.min(anchors.length - 1, i + dwell(span > 0 ? (y - anchors[i]) / span : 0))
      if (y >= anchors[anchors.length - 1]) u = anchors.length - 1
      const a = Math.round(u)
      if (a !== active) {
        active = a
        el.dataset.stop = String(a)
        // let the visitor settle before the terminal starts typing
        window.clearTimeout(timer)
        const cmd = SECTIONS[a]?.cmd
        if (cmd && !phone)
          timer = window.setTimeout(() => {
            if (!term.input) term.run(cmd)
          }, 260)
      }
      return still ? a : u
    }
    ;(el as unknown as { __progress: () => number }).__progress = progress
    const onScroll = () => {
      progress()
      if (still) sceneRef.current?.invalidate()
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      ro.disconnect()
      ScrollTrigger.removeEventListener('refresh', measure)
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(timer)
    }
  }, [term, phone])

  // the 3D computer (desktop only, own chunk)
  useEffect(() => {
    if (phone) return
    let alive = true
    if (!canvas.current || !hasWebGL()) {
      setWebgl(false)
      return
    }
    import('./scene')
      .then(({ createRetroScene }) => {
        if (!alive || !canvas.current || !root.current) return
        const el = root.current
        const s = createRetroScene(canvas.current, {
          term,
          progress: () => (el as unknown as { __progress?: () => number }).__progress?.() ?? 0,
          onScreenClick: () => consoleInput.current?.focus({ preventScroll: true }),
        })
        sceneRef.current = s
        if (s) s.setPhosphor(term.phosphor)
        setWebgl(Boolean(s))
      })
      .catch(() => alive && setWebgl(false))
    return () => {
      alive = false
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [term, phone])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('.rt-hero__name > span', { yPercent: 100, opacity: 0, duration: 0.9, ease: 'steps(6)', stagger: 0.12, delay: 0.3 })
      gsap.from('.rt-hero__line, .rt-hero__cta, .rt-hero__meta', { opacity: 0, duration: 0.5, ease: 'steps(4)', stagger: 0.1, delay: 0.8 })
      // paper feeds up out of the printer as it arrives
      gsap.utils.toArray<HTMLElement>('.rt-sheet').forEach((s) => {
        gsap.fromTo(s, { clipPath: 'inset(0 0 22% 0)' }, { clipPath: 'inset(0 0 0% 0)', ease: 'none', scrollTrigger: { trigger: s, start: 'top 95%', end: 'top 45%', scrub: true } })
      })
    },
    { scope: root },
  )

  const go = (id: string) => () => scrollToTarget(`#rt-${id}`, id === 'top' ? 0 : -70)
  const togglePhosphor = () => term.setPhosphor(phosphor === 'green' ? 'amber' : 'green')
  const runChip = (c: string) => () => {
    ;(term as Terminal & { __user?: boolean }).__user = true
    term.submit(c)
    ;(term as Terminal & { __user?: boolean }).__user = false
  }

  const pages = SECTIONS.length - 1
  const Head = ({ file, n }: { file: string; n: number }) => (
    <p className="rt-sheet__head" aria-hidden="true">
      <span>{file}</span>
      <span>
        PAGE {n} OF {pages}
      </span>
    </p>
  )

  return (
    <div className="rt" ref={root} data-stop="0" data-phosphor={phosphor} data-flat={flat || undefined} data-webgl={webgl === false ? 'off' : webgl ? 'on' : undefined}>
      {!phone && <canvas ref={canvas} className="rt-canvas" aria-hidden="true" />}
      <div className="rt-vignette" aria-hidden="true" />

      <header className="rt-bar">
        <button type="button" className="rt-bar__me" onClick={go('top')}>
          <span className="rt-bar__led" aria-hidden="true" />
          {profile.model}
        </button>
        <nav aria-label="Sections">
          {SECTIONS.slice(1).map((s) => (
            <button type="button" key={s.id} onClick={go(s.id)}>
              {s.id === 'log' ? 'Experience' : s.id[0].toUpperCase() + s.id.slice(1)}
            </button>
          ))}
        </nav>
        <button type="button" className="rt-bar__ph" onClick={togglePhosphor} aria-label={`Phosphor colour: ${phosphor}. Switch`}>
          <i aria-hidden="true" />
          {phosphor === 'green' ? 'Green' : 'Amber'}
        </button>
        <a className="rt-bar__cv" href={profile.resume} target="_blank" rel="noreferrer">
          Résumé
        </a>
      </header>

      {!flat && webgl && (
        <div className="rt-console">
          <CommandLine term={term} inputRef={consoleInput} id="rt-console-input" />
          <div className="rt-chips" role="group" aria-label="Quick commands">
            {CHIPS.map((c) => (
              <button type="button" key={c} onClick={runChip(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="rt-sr" aria-live="polite" ref={sr} />
      {flat && !phone && <FlatCrt term={term} />}

      <main>
        <section className="rt-sec rt-hero" id="rt-top" data-stop="0">
          <p className="rt-hero__meta">
            <span className="rt-cursor" aria-hidden="true" />
            {profile.status} · {profile.location}
          </p>
          <h1 className="rt-hero__name">
            <span>{profile.firstName}</span>
            <span>{profile.lastName}</span>
          </h1>
          <p className="rt-hero__line">{hero.line}</p>
          {phone && <FlatCrt term={term} />}
          <div className="rt-hero__cta">
            <button
              type="button"
              className="rt-btn"
              onClick={() => (consoleInput.current ?? (document.getElementById('rt-flat-input') as HTMLInputElement | null))?.focus()}
            >
              Type a command
            </button>
            <a className="rt-btn rt-btn--ghost" href={profile.resume} target="_blank" rel="noreferrer">
              Résumé (PDF)
            </a>
          </div>
          {!phone && <p className="rt-hint">{webgl === false ? 'Type HELP in the terminal.' : 'Click the screen and type HELP — or scroll, and it prints each page.'}</p>}
        </section>

        <section className="rt-sec" id="rt-about" data-stop="1">
          <article className="rt-sheet">
            <Head file="ABOUT.TXT" n={1} />
            <h2 className="rt-h2">About</h2>
            <p className="rt-lead">{statement}</p>
            <dl className="rt-spec">
              {spec.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <ul className="rt-stats">
              {stats.map((s) => (
                <li key={s.label}>
                  <b>
                    {s.value}
                    <small>{s.unit}</small>
                  </b>
                  <span>{s.label}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="rt-sec" id="rt-skills" data-stop="2">
          <article className="rt-sheet">
            <Head file="SKILLS.TXT" n={2} />
            <h2 className="rt-h2">Five modules</h2>
            <ol className="rt-mods">
              {modules.map((m) => (
                <li key={m.code}>
                  <p className="rt-mods__code">{m.code}</p>
                  <h3>{m.title}</h3>
                  <p>{m.tagline}</p>
                  <p className="rt-mods__stack">{m.stack}</p>
                  <pre>{m.log.join('\n')}</pre>
                </li>
              ))}
            </ol>
          </article>
        </section>

        <section className="rt-sec rt-sec--long" id="rt-work" data-stop="3" data-anchor="top">
          <article className="rt-sheet">
            <Head file="PROJECTS/" n={3} />
            <h2 className="rt-h2">Projects</h2>
            <ol className="rt-projects">
              {projects.map((p) => (
                <li key={p.id}>
                  <p className="rt-proj__no">
                    <span>{p.index}</span>
                    <span className="rt-stamp">{p.stamp}</span>
                  </p>
                  <h3>{p.title}</h3>
                  <p className="rt-dim">
                    {p.kind} — {p.status}
                  </p>
                  <div className="rt-print">
                    {p.image ? (
                      <img src={p.image} alt={`${p.title} screenshot`} loading="lazy" />
                    ) : (
                      <div className="rt-lifeos" aria-hidden="true">
                        <div>
                          <b>LifeOS</b>
                          {['Notes', 'Reminders', 'Workouts', 'Routines', 'Expenses'].map((x) => (
                            <span key={x}>[ ] {x}</span>
                          ))}
                          <em>&gt; ask your own data_</em>
                        </div>
                      </div>
                    )}
                  </div>
                  <p>{p.summary}</p>
                  <ul className="rt-points">
                    {p.points.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <p className="rt-dim rt-stack">{p.stack.join(' · ')}</p>
                  <p className="rt-links">
                    {p.links.map((l) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
                        {l.label === 'Live' ? 'Visit live' : 'Source code'} ↗
                      </a>
                    ))}
                  </p>
                </li>
              ))}
            </ol>
            <h3 className="rt-h3">Other files</h3>
            <ul className="rt-archive">
              {archive.map((a) => (
                <li key={a.title}>
                  <a href={a.href} target="_blank" rel="noreferrer">
                    {a.title}
                  </a>
                  <span>{a.note}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="rt-sec rt-sec--long" id="rt-log" data-stop="4" data-anchor="top">
          <article className="rt-sheet">
            <Head file="EXPERIENCE.LOG" n={4} />
            <h2 className="rt-h2">Experience</h2>
            <ol className="rt-log">
              {experience.map((e) => (
                <li key={e.when}>
                  <p className="rt-log__when">
                    <span>{e.when.replace('→', '–').replace('NOW', 'now')}</span>
                    <span className="rt-stamp">{e.state}</span>
                  </p>
                  <h3>{e.role}</h3>
                  <p className="rt-dim">{e.company}</p>
                  <ul className="rt-points">
                    {e.points.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </article>
        </section>

        <section className="rt-sec rt-end" id="rt-contact" data-stop="5">
          <article className="rt-sheet">
            <Head file="CONTACT.TXT" n={5} />
            <h2 className="rt-h2 rt-end__big">Let’s talk.</h2>
            <p className="rt-lead">{profile.status} — full-stack, Flutter and AI work.</p>
            <a className="rt-end__mail" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <ul className="rt-social">
              {profile.socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer">
                    {s.label} ↗
                  </a>
                </li>
              ))}
              <li>
                <a href={profile.resume} target="_blank" rel="noreferrer">
                  Résumé (PDF) ↗
                </a>
              </li>
            </ul>
            <p className="rt-foot">
              © 2026 {profile.name} · {profile.location} · END OF FILE
            </p>
          </article>
        </section>
      </main>
    </div>
  )
}
