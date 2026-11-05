import { useRef, useState } from 'react'
import { gsap, useGSAP, ScrollTrigger, isFinePointer, prefersReducedMotion } from '../../../lib/motion'
import { modules } from '../../../data/content'
import StationBar from './StationBar'

/** Control-panel rows. Hover / focus / tap a module to run it — its log types out. */
export default function Modules() {
  const root = useRef<HTMLElement>(null)
  const [running, setRunning] = useState<number | null>(null)

  useGSAP(
    () => {
      // Phones have no hover: start the first module when the list scrolls in, so the panel isn't all "Idle".
      ScrollTrigger.create({ trigger: '.mods', start: 'top 70%', once: true, onEnter: () => !isFinePointer() && setRunning((r) => r ?? 0) })
      if (prefersReducedMotion()) return
      gsap.from('.mod', { opacity: 0, y: 24, duration: 0.6, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: '.mods', start: 'top 80%' } })
    },
    { scope: root },
  )

  return (
    <section ref={root} id="modules" className="stn">
      <StationBar code="02" name="Modules" state={`${modules.length} loaded`} extra="Hover or tap a module to run it" />
      <h2 className="h2">
        Modules <span className="serif">loaded</span>
      </h2>
      <ul className="mods">
        {modules.map((m, i) => (
          <li
            key={m.code}
            className={`mod ${running === i ? 'is-running' : ''}`}
            // Hover is mouse-only: a tap also fires enter + focus, which used to open then instantly close the row.
            onPointerEnter={(e) => e.pointerType === 'mouse' && setRunning(i)}
            onPointerLeave={(e) => e.pointerType === 'mouse' && setRunning((r) => (r === i ? null : r))}
          >
            <button
              className="mod__head"
              aria-expanded={running === i}
              onClick={() => setRunning((r) => (r === i ? null : i))}
              onFocus={(e) => e.currentTarget.matches(':focus-visible') && setRunning(i)}
            >
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
