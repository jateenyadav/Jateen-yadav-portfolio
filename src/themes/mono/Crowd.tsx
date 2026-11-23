import { useEffect, useMemo, useRef } from 'react'

/**
 * The footer crowd: ink-line people drawn from code (seeded, so it is the same every
 * visit). Their eyes follow the pointer; the one in the middle — blazer, beard, curly
 * hair — is Jateen, and he waves now and then.
 *
 * Performance: no infinite CSS animations. One small JS timer (only while the crowd is
 * on screen) triggers a single blink or a wave; eye tracking runs once per frame at most,
 * from a cached position.
 */

const W = 1600
const H = 600
const INK = 'var(--k)'
const PAPER = 'var(--crowd-paper)'
const MID = 'var(--crowd-mid)'
const SW = 2.4

type Hair = 'crop' | 'side' | 'curly' | 'long' | 'bun' | 'pony' | 'afro' | 'bald' | 'beanie' | 'cap' | 'bob' | 'quiff'
type Top = 'tee' | 'vneck' | 'hoodie' | 'shirt' | 'stripes' | 'turtle' | 'jacket' | 'dots' | 'overall' | 'blazer'
type Prop = 'none' | 'wave' | 'phone' | 'coffee' | 'peace' | 'thumb'

type Person = {
  key: string
  x: number
  y: number
  s: number
  row: number
  hair: Hair
  top: Top
  prop: Prop
  lanyard: boolean
  glasses: 0 | 1 | 2
  beard: 0 | 1 | 2
  mouth: number
  brows: number
  earring: boolean
  freckles: boolean
  tilt: number
  me?: boolean
}

function rng(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const HAIRS: Hair[] = ['crop', 'side', 'curly', 'long', 'bun', 'pony', 'afro', 'bald', 'beanie', 'cap', 'bob', 'quiff']
const TOPS: Top[] = ['tee', 'vneck', 'hoodie', 'shirt', 'stripes', 'turtle', 'jacket', 'dots', 'overall']

function makeCrowd(): Person[] {
  const r = rng(2026)
  const people: Person[] = []
  const rows = [
    { y: 258, s: 0.74, n: 14, jitter: 14 },
    { y: 352, s: 0.92, n: 11, jitter: 18 },
    { y: 462, s: 1.1, n: 9, jitter: 20 },
  ]
  // shuffle-bag so neighbours rarely repeat a hairstyle or top
  let hb: Hair[] = []
  let tb: Top[] = []
  const nextHair = () => {
    if (!hb.length) hb = [...HAIRS].sort(() => r() - 0.5)
    return hb.pop() as Hair
  }
  const nextTop = () => {
    if (!tb.length) tb = [...TOPS].sort(() => r() - 0.5)
    return tb.pop() as Top
  }
  rows.forEach((row, ri) => {
    const gap = W / row.n
    for (let i = 0; i < row.n; i++) {
      const x = gap * (i + 0.5) + (ri % 2 ? gap * 0.22 : -gap * 0.12) + (r() - 0.5) * row.jitter
      // keep the middle clear for the main character
      if (ri === 2 && Math.abs(x - W / 2) < 170) continue
      if (ri === 1 && Math.abs(x - W / 2) < 120) continue
      const hair = nextHair()
      const pr = r()
      const prop: Prop = ri === 0 ? (pr < 0.18 ? 'wave' : 'none') : pr < 0.1 ? 'wave' : pr < 0.19 ? 'phone' : pr < 0.29 ? 'coffee' : pr < 0.35 ? 'peace' : pr < 0.4 ? 'thumb' : 'none'
      people.push({
        key: `${ri}-${i}`,
        x,
        y: row.y + (r() - 0.5) * 18,
        s: row.s * (0.93 + r() * 0.14),
        row: ri,
        hair,
        top: nextTop(),
        prop,
        lanyard: r() < 0.14,
        glasses: r() < 0.3 ? (r() < 0.5 ? 1 : 2) : 0,
        beard: hair === 'long' || hair === 'bob' || hair === 'bun' || hair === 'pony' ? 0 : r() < 0.22 ? 1 : r() < 0.15 ? 2 : 0,
        mouth: Math.floor(r() * 4),
        brows: Math.floor(r() * 3),
        earring: r() < 0.18,
        freckles: r() < 0.12,
        tilt: (r() - 0.5) * 9,
      })
    }
  })
  people.push({
    key: 'me',
    x: W / 2,
    y: 318,
    s: 1.36,
    row: 3,
    hair: 'curly',
    top: 'blazer',
    prop: 'wave',
    lanyard: false,
    glasses: 0,
    beard: 1,
    mouth: 0,
    brows: 1,
    earring: false,
    freckles: false,
    tilt: 0,
    me: true,
  })
  return people
}

/* ---------------------------------------------------------------- parts */

const TORSO = 'M-12 40 C-12 52 -22 58 -42 63 C-64 69 -75 84 -77 114 L-81 560 L81 560 L77 114 C75 84 64 69 42 63 C22 58 12 52 12 40 Z'
const HEAD = 'M0 -37 C21 -37 31 -21 31 0 C31 22 19 39 0 39 C-19 39 -31 22 -31 0 C-31 -21 -21 -37 0 -37 Z'

const topFill = (t: Top) =>
  t === 'stripes' ? 'url(#crowd-stripes)' : t === 'dots' ? 'url(#crowd-dots)' : t === 'jacket' || t === 'blazer' ? INK : t === 'hoodie' || t === 'turtle' ? MID : PAPER

function BackHair({ v }: { v: Hair }) {
  switch (v) {
    case 'long':
      return <path d="M-35 -4 C-42 -54 42 -54 35 -4 L41 86 C22 96 -22 96 -41 86 Z" fill={INK} />
    case 'bob':
      return <path d="M-37 -6 C-44 -56 44 -56 37 -6 L39 32 C26 38 -26 38 -39 32 Z" fill={INK} />
    case 'pony':
      return <path d="M22 -26 C52 -18 56 26 40 70 C36 40 30 14 16 -4 Z" fill={INK} />
    case 'afro':
      return (
        <g fill={INK}>
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2
            return <circle key={i} cx={Math.cos(a) * 34} cy={-12 + Math.sin(a) * 30} r={17} />
          })}
          <circle cx="0" cy="-12" r="36" />
        </g>
      )
    case 'bun':
      return <circle cx="0" cy="-44" r="14" fill={INK} />
    default:
      return null
  }
}

function FrontHair({ v, me }: { v: Hair; me?: boolean }) {
  if (me) {
    // dense curls with volume on top, like the photo
    const curls: [number, number, number][] = [
      [-28, -12, 10], [-27, -26, 12], [-18, -36, 13], [-5, -42, 14], [9, -41, 14], [21, -34, 13], [29, -22, 12], [30, -8, 9],
      [-12, -28, 11], [3, -30, 11], [16, -26, 10], [-22, -18, 8], [24, -14, 8],
    ]
    return (
      <g fill={INK}>
        {curls.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
        <path d="M-26 -16 Q-17 -6 -8 -15 Q2 -6 12 -16 Q20 -8 27 -16" stroke={PAPER} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.55" />
      </g>
    )
  }
  switch (v) {
    case 'crop':
      return <path d="M-31 2 C-35 -44 35 -44 31 2 C28 -16 18 -25 0 -25 C-18 -25 -28 -16 -31 2 Z" fill={INK} />
    case 'side':
      return <path d="M-31 8 C-39 -42 31 -54 32 0 C27 -18 8 -29 -12 -22 C-20 -16 -26 -5 -31 8 Z" fill={INK} />
    case 'curly':
      return (
        <g fill={INK}>
          {[-26, -15, -3, 9, 20, 28].map((cx, i) => (
            <circle key={i} cx={cx} cy={-22 - Math.cos((cx / 30) * 1.3) * 12} r={11} />
          ))}
          {[-16, 0, 16].map((cx) => (
            <circle key={cx} cx={cx} cy={-38} r={11} />
          ))}
        </g>
      )
    case 'long':
      return <path d="M-32 10 C-36 -44 34 -48 32 8 C26 -10 14 -22 -2 -24 C-6 -12 -18 -2 -32 10 Z" fill={INK} />
    case 'bun':
      return <path d="M-31 0 C-34 -44 34 -44 31 0 C24 -20 -24 -20 -31 0 Z" fill={INK} />
    case 'pony':
      return <path d="M-31 0 C-34 -44 34 -44 31 0 C22 -14 6 -22 -8 -20 C-18 -16 -26 -10 -31 0 Z" fill={INK} />
    case 'afro':
      return <path d="M-30 -4 C-26 -26 26 -26 30 -4 C20 -16 -20 -16 -30 -4 Z" fill={INK} />
    case 'bald':
      return (
        <g fill="none" stroke={INK} strokeWidth={SW * 0.8} strokeLinecap="round">
          <path d="M-14 -30 Q-6 -34 2 -33" />
          <path d="M-30 -2 Q-31 -10 -29 -16 M30 -2 Q31 -10 29 -16" strokeWidth={SW * 2.2} />
        </g>
      )
    case 'beanie':
      return (
        <g>
          <path d="M-33 -6 C-35 -56 35 -56 33 -6 Z" fill={MID} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M-12 -44 L-14 -14 M0 -47 L0 -14 M12 -44 L14 -14" stroke={INK} strokeWidth={SW * 0.7} fill="none" />
          <rect x="-35" y="-17" width="70" height="15" rx="6" fill={PAPER} stroke={INK} strokeWidth={SW} />
          <circle cx="0" cy="-54" r="8" fill={PAPER} stroke={INK} strokeWidth={SW} />
        </g>
      )
    case 'cap':
      return (
        <g>
          <path d="M-32 -6 C-33 -50 33 -50 32 -6 Z" fill={INK} />
          <path d="M-36 -8 C-20 -14 20 -14 50 -4 C40 2 20 2 -30 -2 Z" fill={INK} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <circle cx="0" cy="-43" r="3" fill={PAPER} />
          <path d="M-14 -40 Q0 -20 14 -40" stroke={PAPER} strokeWidth="1.4" fill="none" opacity="0.6" />
        </g>
      )
    case 'bob':
      return <path d="M-33 -2 C-34 -46 34 -46 33 -2 L28 -8 C20 -12 10 -16 -2 -16 C-14 -14 -24 -10 -33 -2 Z" fill={INK} />
    case 'quiff':
      return <path d="M-31 2 C-36 -36 -20 -56 6 -58 C30 -58 40 -40 31 2 C28 -18 16 -26 -2 -26 C-16 -26 -26 -16 -31 2 Z" fill={INK} />
  }
}

function Torso({ t, lanyard }: { t: Top; lanyard: boolean }) {
  const fill = topFill(t)
  const line = t === 'jacket' || t === 'blazer' ? PAPER : INK
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {t === 'hoodie' && <path d="M-40 66 C-40 30 40 30 40 66 Z" fill={MID} stroke={INK} strokeWidth={SW} />}
      <path d={TORSO} fill={fill} stroke={INK} strokeWidth={SW} />
      {/* arms hanging at the sides */}
      <path d="M-58 124 C-60 220 -61 330 -61 560 M58 124 C60 220 61 330 61 560" fill="none" stroke={line} strokeWidth={SW * 0.8} opacity={t === 'jacket' || t === 'blazer' ? 0.5 : 1} />
      {t === 'tee' && <path d="M-15 47 Q0 66 15 47" fill="none" stroke={INK} strokeWidth={SW} />}
      {(t === 'stripes' || t === 'dots') && <path d="M-15 47 Q0 64 15 47" fill={PAPER} stroke={INK} strokeWidth={SW} />}
      {t === 'vneck' && <path d="M-15 46 L0 74 L15 46" fill={PAPER} stroke={INK} strokeWidth={SW} />}
      {t === 'hoodie' && (
        <g fill="none" stroke={INK} strokeWidth={SW}>
          <path d="M-16 50 Q0 66 16 50" />
          <path d="M-8 60 L-10 104 M8 60 L10 104" />
          <circle cx="-10" cy="106" r="2.4" fill={INK} />
          <circle cx="10" cy="106" r="2.4" fill={INK} />
        </g>
      )}
      {t === 'shirt' && (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M0 62 L0 560" fill="none" />
          <path d="M-13 42 L-26 66 L-3 60 Z M13 42 L26 66 L3 60 Z" fill={PAPER} />
          {[92, 124, 156].map((y) => (
            <circle key={y} cx="6" cy={y} r="2.2" fill={INK} stroke="none" />
          ))}
          <path d="M-46 120 L-26 120 L-26 140 L-46 140 Z" fill="none" strokeWidth={SW * 0.8} />
        </g>
      )}
      {t === 'turtle' && (
        <g stroke={INK} strokeWidth={SW} fill={MID}>
          <path d="M-17 26 L17 26 L19 58 Q0 64 -19 58 Z" />
          <path d="M-17 38 Q0 42 17 38 M-18 48 Q0 52 18 48" fill="none" strokeWidth={SW * 0.7} />
        </g>
      )}
      {t === 'jacket' && (
        <g strokeWidth={SW}>
          <path d="M-16 46 L0 120 L16 46 Z" fill={PAPER} stroke={INK} />
          <path d="M-15 47 Q0 62 15 47" fill="none" stroke={INK} />
          <path d="M-18 46 L-30 74 L-12 100 M18 46 L30 74 L12 100" fill="none" stroke={PAPER} strokeWidth={SW * 0.8} />
          <path d="M-4 150 L-4 560" stroke={PAPER} strokeWidth={SW * 0.7} opacity="0.6" />
        </g>
      )}
      {t === 'overall' && (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M-15 47 Q0 64 15 47" fill="none" />
          <path d="M-32 126 L32 126 L34 560 L-34 560 Z" fill={MID} />
          <path d="M-28 126 L-42 66 M28 126 L42 66" fill="none" strokeWidth={SW * 2.4} />
          <circle cx="-26" cy="134" r="3" fill={PAPER} />
          <circle cx="26" cy="134" r="3" fill={PAPER} />
          <path d="M-14 150 L14 150 L14 172 L-14 172 Z" fill="none" strokeWidth={SW * 0.8} />
        </g>
      )}
      {t === 'blazer' && (
        <g strokeWidth={SW}>
          <path d="M-15 44 L0 128 L15 44 Z" fill={PAPER} stroke={INK} />
          <path d="M-13 42 L-24 66 L-4 60 Z M13 42 L24 66 L4 60 Z" fill={PAPER} stroke={INK} />
          <path d="M-16 46 L-34 74 L-15 98 L0 128 M16 46 L34 74 L15 98 L0 128" fill="none" stroke={PAPER} strokeWidth={SW * 0.9} opacity="0.75" />
          <path d="M-52 130 L-34 130" stroke={PAPER} strokeWidth={SW * 0.8} opacity="0.6" />
          <path d="M-50 130 L-45 121 L-40 130 Z" fill={PAPER} />
          <circle cx="0" cy="170" r="3.4" fill={PAPER} />
        </g>
      )}
      {lanyard && (
        <g stroke={INK} strokeWidth={SW * 0.9} fill="none">
          <path d="M-17 52 L-5 140 M17 52 L5 140" />
          <rect x="-16" y="140" width="32" height="40" rx="3" fill={PAPER} />
          <path d="M-9 152 L9 152 M-9 160 L4 160" strokeWidth={SW * 0.7} />
          <circle cx="0" cy="170" r="3" fill={INK} stroke="none" />
        </g>
      )}
    </g>
  )
}

function Face({ p }: { p: Person }) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {p.beard === 1 && (
        <path
          d={p.me ? 'M-31 0 C-31 34 -16 50 0 50 C16 50 31 34 31 0 C27 16 16 20 0 20 C-16 20 -27 16 -31 0 Z' : 'M-30 4 C-29 34 -15 46 0 46 C15 46 29 34 30 4 C24 18 14 22 0 22 C-14 22 -24 18 -30 4 Z'}
          fill={INK}
        />
      )}
      {/* eyes: outer group follows the pointer, inner group blinks */}
      <g className="crowd__eyes">
        <g transform="translate(0 -2)">
          <g className="crowd__lid">
            <circle cx="-11" cy="0" r="3.5" fill={INK} />
            <circle cx="11" cy="0" r="3.5" fill={INK} />
          </g>
        </g>
      </g>
      {p.brows === 0 && <path d="M-18 -13 L-5 -14 M5 -14 L18 -13" stroke={INK} strokeWidth={SW} />}
      {p.brows === 1 && <path d="M-18 -12 Q-11 -18 -4 -14 M4 -14 Q11 -18 18 -12" stroke={INK} strokeWidth={p.me ? SW * 1.5 : SW} fill="none" />}
      {p.glasses === 1 && (
        <g fill="none" stroke={INK} strokeWidth={SW}>
          <circle cx="-11" cy="-2" r="9" />
          <circle cx="11" cy="-2" r="9" />
          <path d="M-2 -3 Q0 -5 2 -3 M-20 -4 L-30 -6 M20 -4 L30 -6" />
        </g>
      )}
      {p.glasses === 2 && (
        <g fill="none" stroke={INK} strokeWidth={SW}>
          <rect x="-21" y="-10" width="18" height="14" rx="3" />
          <rect x="3" y="-10" width="18" height="14" rx="3" />
          <path d="M-3 -4 L3 -4 M-21 -6 L-30 -7 M21 -6 L30 -7" />
        </g>
      )}
      <path d="M-1 4 Q-6 13 1 14" fill="none" stroke={INK} strokeWidth={SW * 0.85} />
      {p.freckles && (
        <g fill={INK}>
          {[-19, -15, -21, 15, 19, 17].map((x, i) => (
            <circle key={i} cx={x} cy={i % 3 === 1 ? 10 : 7} r="1.1" />
          ))}
        </g>
      )}
      {p.me ? (
        <path d="M-8 26 Q0 31 8 26" stroke={PAPER} strokeWidth={SW} fill="none" />
      ) : p.beard === 1 ? (
        <path d="M-7 28 Q0 31 7 28" stroke={PAPER} strokeWidth={SW} fill="none" />
      ) : (
        <>
          {p.beard === 2 && <path d="M-12 21 Q0 14 12 21 Q0 19 -12 21 Z" fill={INK} stroke={INK} strokeWidth={SW} />}
          {p.mouth === 0 && <path d="M-9 23 Q0 31 9 23" fill="none" stroke={INK} strokeWidth={SW} />}
          {p.mouth === 1 && <path d="M-10 21 Q0 35 10 21 Z" fill={INK} stroke={INK} strokeWidth={SW * 0.8} />}
          {p.mouth === 2 && <path d="M-5 25 Q0 27 5 25" fill="none" stroke={INK} strokeWidth={SW} />}
          {p.mouth === 3 && <ellipse cx="0" cy="25" rx="3.6" ry="4.6" fill={INK} />}
        </>
      )}
    </g>
  )
}

/** An open hand, fingers up; origin at the wrist. */
function OpenHand({ fill }: { fill: string }) {
  const fingers = 'M-8 -14 L-11 -34 M-2 -16 L-3 -39 M4 -16 L5 -38 M9 -13 L12 -31 M-11 -4 L-22 -16'
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d={fingers} stroke={INK} strokeWidth="10.6" fill="none" />
      <path d={fingers} stroke={fill} strokeWidth="5.8" fill="none" />
      <path d="M-13 0 C-14 -12 -10 -20 0 -20 C10 -20 14 -12 13 -2 C12 6 6 8 0 8 C-6 8 -12 6 -13 0 Z" fill={fill} stroke={INK} strokeWidth={SW} />
    </g>
  )
}

function Fist({ fill, up }: { fill: string; up?: 'peace' | 'thumb' }) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {up === 'peace' && (
        <>
          <path d="M-4 -14 L-10 -38 M4 -14 L10 -38" stroke={INK} strokeWidth="10.6" fill="none" />
          <path d="M-4 -14 L-10 -38 M4 -14 L10 -38" stroke={fill} strokeWidth="5.8" fill="none" />
        </>
      )}
      {up === 'thumb' && (
        <>
          <path d="M-8 -12 L-10 -32" stroke={INK} strokeWidth="11" fill="none" />
          <path d="M-8 -12 L-10 -32" stroke={fill} strokeWidth="6.2" fill="none" />
        </>
      )}
      <rect x="-14" y="-18" width="28" height="24" rx="10" fill={fill} stroke={INK} strokeWidth={SW} />
      <path d="M-6 -18 L-6 -10 M2 -18 L2 -10" stroke={INK} strokeWidth={SW * 0.7} />
    </g>
  )
}

/** A sleeve as a thick outlined stroke (two passes: outline then fill). */
function Sleeve({ d, fill }: { d: string; fill: string }) {
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={INK} strokeWidth="30" />
      <path d={d} stroke={fill} strokeWidth="25" />
    </g>
  )
}

function PropLayer({ p }: { p: Person }) {
  const sleeve = topFill(p.top) === 'url(#crowd-stripes)' || topFill(p.top) === 'url(#crowd-dots)' ? PAPER : topFill(p.top)
  const skin = PAPER
  switch (p.prop) {
    case 'wave':
      return (
        <g>
          <Sleeve d={p.me ? 'M60 110 C80 70 90 30 92 -18' : 'M60 112 C78 72 88 36 92 -10'} fill={sleeve} />
          <g transform={p.me ? 'translate(93 -26)' : 'translate(93 -18)'}>
            <g className="crowd__hand">
              <g transform="rotate(12)">
                <OpenHand fill={skin} />
              </g>
            </g>
          </g>
        </g>
      )
    case 'peace':
    case 'thumb':
      return (
        <g>
          <Sleeve d="M-60 114 C-78 80 -84 50 -82 14" fill={sleeve} />
          <g transform="translate(-82 2) rotate(-8)">
            <Fist fill={skin} up={p.prop} />
          </g>
        </g>
      )
    case 'phone':
      return (
        <g>
          <Sleeve d="M58 128 C62 80 54 40 44 18" fill={sleeve} />
          <g transform="translate(42 4) rotate(-14)">
            <rect x="-15" y="-44" width="30" height="52" rx="5" fill={INK} />
            <rect x="-11" y="-39" width="22" height="38" rx="2" fill={PAPER} opacity="0.92" />
            <circle cx="0" cy="-20" r="5" fill="none" stroke={INK} strokeWidth="1.6" />
            <Fist fill={skin} />
          </g>
        </g>
      )
    case 'coffee':
      return (
        <g>
          <Sleeve d="M-62 150 C-50 158 -34 150 -20 140" fill={sleeve} />
          <g transform="translate(-12 128)">
            <path d="M-12 -30 L12 -30 L9 8 L-9 8 Z" fill={PAPER} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <rect x="-14" y="-36" width="28" height="7" rx="2" fill={INK} />
            <rect x="-11" y="-18" width="22" height="10" fill={MID} stroke={INK} strokeWidth={SW * 0.7} />
            <rect x="-16" y="-8" width="20" height="18" rx="8" fill={skin} stroke={INK} strokeWidth={SW} />
          </g>
        </g>
      )
    default:
      return null
  }
}

function Figure({ p }: { p: Person }) {
  const cls = p.me ? 'crowd__p crowd__me' : 'crowd__p'
  return (
    <g className={cls} data-row={p.row} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${p.s.toFixed(3)})`}>
      <g className="crowd__in">
        <g transform={`rotate(${p.tilt.toFixed(1)} 0 60)`}>
          <BackHair v={p.hair} />
          <Torso t={p.top} lanyard={p.lanyard} />
          <path d="M-11 22 L-12 50 Q0 56 12 50 L11 22 Z" fill={PAPER} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <ellipse cx="-29" cy="4" rx="6.5" ry="9.5" fill={PAPER} stroke={INK} strokeWidth={SW} />
          <ellipse cx="29" cy="4" rx="6.5" ry="9.5" fill={PAPER} stroke={INK} strokeWidth={SW} />
          {p.earring && <circle cx="-29" cy="16" r="2.6" fill="none" stroke={INK} strokeWidth="1.8" />}
          <path d={HEAD} fill={PAPER} stroke={INK} strokeWidth={SW} />
          <Face p={p} />
          <FrontHair v={p.hair} me={p.me} />
          <PropLayer p={p} />
        </g>
      </g>
    </g>
  )
}

export default function Crowd() {
  const svg = useRef<SVGSVGElement>(null)
  const people = useMemo(makeCrowd, [])
  // back rows first, then the main character, then the front row
  const ordered = useMemo(() => [...people].sort((a, b) => (a.me ? 1.5 : a.row) - (b.me ? 1.5 : b.row) || a.y - b.y), [people])

  useEffect(() => {
    const el = svg.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const groups = Array.from(el.querySelectorAll<SVGGElement>('.crowd__p'))
    const eyes = groups.map((g) => g.querySelector<SVGGElement>('.crowd__eyes'))
    const pos = ordered.map((p) => ({ x: p.x, y: p.y + -2 * p.s }))
    const me = el.querySelector<SVGGElement>('.crowd__me')

    // cached geometry: document position + scale, refreshed on resize only
    let docTop = 0
    let left = 0
    let k = 1
    let offY = 0
    const measure = () => {
      const r = el.getBoundingClientRect()
      docTop = r.top + window.scrollY
      left = r.left
      // preserveAspectRatio "xMidYMax slice": scale to cover, anchored bottom
      k = Math.max(r.width / W, r.height / H)
      left = r.left + (r.width - W * k) / 2
      offY = r.height - H * k
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)

    let inView = false
    let frame = 0
    let px = window.innerWidth / 2
    let py = 0
    const update = () => {
      frame = 0
      const top = docTop - window.scrollY + offY
      for (let i = 0; i < pos.length; i++) {
        const ex = left + pos[i].x * k
        const ey = top + pos[i].y * k
        const dx = px - ex
        const dy = py - ey
        const d = Math.hypot(dx, dy) || 1
        const m = Math.min(4, d / 50)
        eyes[i]?.setAttribute('transform', `translate(${((dx / d) * m).toFixed(1)} ${((dy / d) * m).toFixed(1)})`)
      }
    }
    const onMove = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      if (inView && !frame) frame = requestAnimationFrame(update)
    }

    // one blink or one wave at a time, only while on screen
    let timer = 0
    let tick = 0
    const life = () => {
      tick++
      const g = groups[Math.floor(Math.random() * groups.length)]
      g.classList.remove('is-blink')
      requestAnimationFrame(() => g.classList.add('is-blink'))
      if (tick % 5 === 0 && me) {
        me.classList.remove('is-wave')
        requestAnimationFrame(() => me.classList.add('is-wave'))
      }
    }
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting
      el.classList.toggle('is-on', inView)
      if (inView) {
        measure()
        if (!reduce && !timer) {
          timer = window.setInterval(life, 1100)
          if (me) me.classList.add('is-wave')
        }
      } else {
        window.clearInterval(timer)
        timer = 0
      }
    })
    io.observe(el)
    const onEnd = (e: AnimationEvent) => (e.target as Element).closest('.crowd__p')?.classList.remove(e.animationName.includes('wave') ? 'is-wave' : 'is-blink')
    el.addEventListener('animationend', onEnd)
    if (!reduce) window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.clearInterval(timer)
      io.disconnect()
      ro.disconnect()
      el.removeEventListener('animationend', onEnd)
      window.removeEventListener('pointermove', onMove)
    }
  }, [ordered])

  const meP = people.find((p) => p.me)!

  return (
    <svg ref={svg} className="crowd" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" role="img" aria-label="A hand-drawn crowd of people; Jateen stands in the middle, waving">
      <defs>
        <pattern id="crowd-stripes" width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill={PAPER} />
          <rect width="14" height="5.5" fill="var(--crowd-ink)" />
        </pattern>
        <pattern id="crowd-dots" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill={PAPER} />
          <circle cx="3" cy="3" r="1.8" fill="var(--crowd-ink)" />
          <circle cx="9" cy="9" r="1.8" fill="var(--crowd-ink)" />
        </pattern>
        <radialGradient id="crowd-halo">
          <stop offset="0" stopColor="var(--crowd-halo)" stopOpacity="1" />
          <stop offset="1" stopColor="var(--crowd-halo)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={meP.x} cy={meP.y + 20} rx="260" ry="220" fill="url(#crowd-halo)" />
      {ordered.map((p) => (
        <Figure key={p.key} p={p} />
      ))}
      <g className="crowd__tag" transform={`translate(${meP.x - 250} ${meP.y - 150})`} aria-hidden="true">
        <text x="0" y="0">that’s me</text>
        <path d="M118 -4 C150 -18 178 -6 188 30" fill="none" stroke="var(--crowd-ink)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M176 22 L188 33 L195 18" fill="none" stroke="var(--crowd-ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
