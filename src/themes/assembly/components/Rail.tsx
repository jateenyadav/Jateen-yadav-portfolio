import { useEffect, useRef, useState } from 'react'
import { gsap, useGSAP, ScrollTrigger, scrollToTarget } from '../../../lib/motion'
import { stations } from '../../../data/content'

/**
 * The assembly line: a fixed conveyor on the left edge. The belt runs exactly
 * from the first station's LED to the last one's, fills with orange as the page
 * scrolls, and each station lights up while its section is on screen.
 */
export default function Rail() {
  const root = useRef<HTMLElement>(null)
  const belt = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)
  const [visited, setVisited] = useState(0)

  // Pin the belt's ends to the centres of the first and last LEDs.
  useEffect(() => {
    const rail = root.current
    if (!rail) return
    const place = () => {
      const leds = rail.querySelectorAll<HTMLElement>('.rail__led')
      if (leds.length < 2 || !belt.current) return
      const top = rail.getBoundingClientRect().top
      const first = leds[0].getBoundingClientRect()
      const last = leds[leds.length - 1].getBoundingClientRect()
      belt.current.style.top = `${first.top + first.height / 2 - top}px`
      belt.current.style.height = `${last.top + last.height / 2 - (first.top + first.height / 2)}px`
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(rail)
    document.fonts?.ready.then(place)
    return () => ro.disconnect()
  }, [])

  useGSAP(
    () => {
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => gsap.set(fill.current, { scaleY: self.progress }),
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
      <div ref={belt} className="rail__belt" aria-hidden="true">
        <span ref={fill} className="rail__fill" />
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
