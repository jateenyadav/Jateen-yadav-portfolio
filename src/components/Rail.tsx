import { useRef, useState } from 'react'
import { gsap, useGSAP, ScrollTrigger, scrollToTarget } from '../lib/motion'
import { stations } from '../data/content'

/**
 * The assembly line: a fixed conveyor on the left edge. A unit travels down
 * it with page progress; each station lights up while its section is on screen.
 */
export default function Rail() {
  const root = useRef<HTMLElement>(null)
  const unit = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)
  const [visited, setVisited] = useState(0)

  useGSAP(
    () => {
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => gsap.set(unit.current, { top: `${self.progress * 100}%` }),
      })
      stations.forEach((s, i) => {
        const el = document.getElementById(s.id)
        if (!el) return
        ScrollTrigger.create({
          trigger: el,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (self) => {
            if (self.isActive) {
              setActive(i)
              setVisited((v) => Math.max(v, i))
            }
          },
        })
      })
    },
    { scope: root },
  )

  return (
    <nav ref={root} className="rail" aria-label="Sections">
      <div className="rail__belt" aria-hidden="true">
        <span ref={unit} className="rail__unit" />
      </div>
      <ol className="rail__list">
        {stations.map((s, i) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={`rail__stn ${i === active ? 'is-active' : ''} ${i <= visited ? 'is-done' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                scrollToTarget(`#${s.id}`)
              }}
              aria-current={i === active ? 'true' : undefined}
            >
              <span className="rail__led" aria-hidden="true" />
              <span className="rail__code">{s.code}</span>
              <span className="rail__name">{s.name}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
