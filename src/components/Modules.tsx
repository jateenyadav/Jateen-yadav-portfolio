import { useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/motion'
import { modules } from '../data/content'
import StationBar from './StationBar'

/** Control-panel rows. Hover / focus / tap a module to run it — its log types out. */
export default function Modules() {
  const root = useRef<HTMLElement>(null)
  const [running, setRunning] = useState<number | null>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('.mod', { opacity: 0, y: 24, duration: 0.6, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: '.mods', start: 'top 80%' } })
    },
    { scope: root },
  )

  return (
    <section ref={root} id="modules" className="stn">
      <StationBar code="02" name="Modules" state={`${modules.length} loaded`} extra="Hover a module to run it" />
      <h2 className="h2">
        Modules <span className="serif">loaded</span>
      </h2>
      <ul className="mods">
        {modules.map((m, i) => (
          <li
            key={m.code}
            className={`mod ${running === i ? 'is-running' : ''}`}
            onMouseEnter={() => setRunning(i)}
            onMouseLeave={() => setRunning((r) => (r === i ? null : r))}
          >
            <button className="mod__head" aria-expanded={running === i} onClick={() => setRunning(running === i ? null : i)} onFocus={() => setRunning(i)}>
              <span className="mod__led" aria-hidden="true" />
              <span className="mod__code mono">{m.code}</span>
              <span className="mod__title">{m.title}</span>
              <span className="mod__tag">{m.tagline}</span>
              <span className="mod__state mono">{running === i ? 'Running' : 'Idle'}</span>
            </button>
            <div className="mod__body">
              <div>
                <p className="mod__stack mono">{m.stack}</p>
                <ol className="mod__log mono" key={running === i ? 'on' : 'off'}>
                  {m.log.map((line, j) => (
                    <li key={line} style={{ ['--i' as string]: j, ['--n' as string]: line.length }}>
                      <span>{line}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
