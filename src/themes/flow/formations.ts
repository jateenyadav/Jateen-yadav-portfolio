import type { Ball, Formation } from './scene'

/** Small idle orbit so the metal never sits dead still. */
const bob = (t: number, i: number, a = 0.05): [number, number, number] => [
  Math.sin(t * 0.55 + i * 1.7) * a,
  Math.cos(t * 0.47 + i * 2.3) * a,
  Math.sin(t * 0.39 + i * 0.9) * a,
]

const withBob = (base: Ball[], t: number, a?: number): Ball[] =>
  base.map((b, i) => {
    const [x, y, z] = bob(t, i, a)
    return [b[0] + x, b[1] + y, b[2] + z, b[3]]
  })

/** 0 — hero: every ball pooled into one drop. */
const drop = (r = 1): Formation['balls'] => (t) =>
  withBob(
    [
      [0, 0.04, 0, 0.56 * r],
      [0.42, -0.24, 0.12, 0.34 * r],
      [-0.4, -0.12, -0.1, 0.36 * r],
      [0.1, 0.5, 0, 0.26 * r],
      [-0.16, -0.5, 0.1, 0.27 * r],
      [0.34, 0.3, -0.2, 0.24 * r],
    ],
    t,
    0.12,
  )

/** 1 — about: two masses held together by a thin bridge ("the hard middle"). */
const bridge: Formation['balls'] = (t) =>
  withBob(
    [
      [-0.62, 0.38, 0, 0.46],
      [0.62, -0.38, 0, 0.46],
      [0, 0, 0.05, 0.15],
      [-0.31, 0.19, 0, 0.2],
      [0.31, -0.19, 0, 0.2],
      [0, 0, 0, 0.1],
    ],
    t,
    0.04,
  )

/** 2 — modules: five drops in a loose column, one per module. */
const five: Formation['balls'] = (t) =>
  withBob(
    [
      ...[0, 1, 2, 3, 4].map((i): Ball => [Math.cos((i - 2) * 0.55) * 0.4 - 0.2, 1.04 - i * 0.52, 0, 0.2]),
      [0.15, 0, -0.1, 0],
    ],
    t,
    0.03,
  )

/** 3–6 — projects: four drops; the one being read swells to the middle. */
const four = (k: number): Formation['balls'] => (t) => {
  const balls: Ball[] = [0, 1, 2, 3].map((j) => {
    if (j === k) return [0, 0, 0, 0.56]
    const a = ((j - k + 4) % 4) * (Math.PI / 2) + Math.PI * 0.75 + t * 0.12
    return [Math.cos(a) * 0.98, Math.sin(a) * 0.82, Math.sin(a) * 0.2, 0.17]
  })
  balls.push([0, 0, 0, 0], [0, 0, 0, 0])
  return withBob(balls, t, 0.035)
}

/** 7 — experience: a drip of six roles, the newest the largest. */
const drip: Formation['balls'] = (t) =>
  withBob(
    [0.22, 0.17, 0.15, 0.135, 0.125, 0.115].map((r, i): Ball => [-0.25 + i * 0.1 + Math.sin(i * 1.3) * 0.08, 1.0 - i * 0.41, 0, r]),
    t,
    0.03,
  )

export const FORMATIONS: (Formation & { name: string })[] = [
  { name: 'One drop', balls: drop(1.22), tint: '#c8ff5a' },
  { name: 'The hard middle', balls: bridge, tint: '#7ad7ff' },
  { name: 'Five modules', balls: five, tint: '#c8ff5a', k: 0.2 },
  { k: 0.34, name: 'LifeOS', balls: four(0), tint: '#7cf0b0' },
  { k: 0.34, name: 'ExamAce', balls: four(1), tint: '#ffcf5a' },
  { k: 0.34, name: 'Solar System', balls: four(2), tint: '#ff8a4c' },
  { k: 0.34, name: 'Client Portfolio', balls: four(3), tint: '#ff7ad1' },
  { name: 'Six roles', balls: drip, tint: '#9db4ff', k: 0.16 },
  { name: 'One drop', balls: drop(1.15), tint: '#c8ff5a' },
]
