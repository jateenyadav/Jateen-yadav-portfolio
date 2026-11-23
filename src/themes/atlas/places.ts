/**
 * Places on the globe. Every one comes from content.ts:
 * Gurugram (profile.location), Japan & Europe (teams he works with), JMIT Radaur (degree),
 * Dubai (the client portfolio's client), India (ExamAce: CBSE & JEE practice),
 * Sriharikota (India's launch site — the Solar System project features Indian space missions).
 */
export type Place = { id: string; name: string; lat: number; lon: number; group: Group }
export type Group = 'base' | 'teams' | 'work' | 'edu'

export const PLACES: Place[] = [
  { id: 'ggn', name: 'Gurugram', lat: 28.46, lon: 77.03, group: 'base' },
  { id: 'jp', name: 'Japan', lat: 36.2, lon: 138.25, group: 'teams' },
  { id: 'eu', name: 'Europe', lat: 50.1, lon: 8.7, group: 'teams' },
  { id: 'radaur', name: 'JMIT Radaur', lat: 30.03, lon: 77.15, group: 'edu' },
  { id: 'lifeos', name: 'LifeOS', lat: 28.46, lon: 77.03, group: 'work' },
  { id: 'examace', name: 'ExamAce', lat: 22.6, lon: 79.2, group: 'work' },
  { id: 'solar', name: 'Solar System', lat: 13.72, lon: 80.23, group: 'work' },
  { id: 'client', name: 'Client Portfolio', lat: 25.2, lon: 55.27, group: 'work' },
]

export const placeById = (id: string) => PLACES.find((p) => p.id === id)!

export type Arc = { id: string; from: string; to: string }
export const ARCS: Arc[] = [
  { id: 'jp', from: 'ggn', to: 'jp' },
  { id: 'eu', from: 'ggn', to: 'eu' },
  { id: 'client', from: 'ggn', to: 'client' },
  { id: 'examace', from: 'ggn', to: 'examace' },
  { id: 'solar', from: 'ggn', to: 'solar' },
  { id: 'study', from: 'radaur', to: 'ggn' },
]

/** One camera stop. Values not given fall back to "hidden". */
export type View = {
  lat: number
  lon: number
  /** camera distance from the globe centre (globe radius = 1) */
  dist: number
  /** shift of the globe on screen, as a fraction of the viewport */
  x: number
  y: number
  labels: Partial<Record<Group | string, number>>
  /** arc id → [opacity, drawn 0..1] */
  arcs: Partial<Record<string, [number, number]>>
}

const ALL_ROUTES: View['arcs'] = { jp: [1, 1], eu: [1, 1], client: [1, 1], examace: [0.8, 1], solar: [0.8, 1] }

export function views(phone: boolean): { hero: View; about: View; skills: View; work: Record<string, View>; log: Record<string, View>; contact: View } {
  const side = phone ? 0 : 0.24
  const py = phone ? -0.24 : 0
  const pd = phone ? 1.6 : 1
  return {
    hero: { lat: 32, lon: 80, dist: 4.3 * pd, x: phone ? 0 : 0.22, y: phone ? -0.3 : 0, labels: { base: 1, teams: 1 }, arcs: ALL_ROUTES },
    about: { lat: 20, lon: 60, dist: 4.0 * pd, x: side, y: py, labels: { base: 1, teams: 1 }, arcs: ALL_ROUTES },
    skills: { lat: 24, lon: 92, dist: 5.2 * pd, x: phone ? 0 : 0.3, y: py, labels: { base: 0.8, teams: 0.6 }, arcs: { jp: [0.55, 1], eu: [0.55, 1], client: [0.4, 1] } },
    work: {
      lifeos: { lat: 26, lon: 74, dist: 2.7 * pd, x: side, y: py, labels: { lifeos: 1, base: 0 }, arcs: {} },
      examace: { lat: 21, lon: 78, dist: 2.7 * pd, x: side, y: py, labels: { examace: 1, lifeos: 0.5 }, arcs: { examace: [1, 1] } },
      solar: { lat: 17, lon: 79, dist: 2.7 * pd, x: side, y: py, labels: { solar: 1, examace: 0.4, lifeos: 0.5 }, arcs: { solar: [1, 1], examace: [0.35, 1] } },
      client: { lat: 25, lon: 64, dist: 2.9 * pd, x: side, y: py, labels: { client: 1, lifeos: 0.5, solar: 0.4, examace: 0.4 }, arcs: { client: [1, 1], solar: [0.35, 1], examace: [0.35, 1] } },
    } as Record<string, View>,
    log: {
      radaur: { lat: 29.6, lon: 77.1, dist: 2.05 * pd, x: side, y: py, labels: { edu: 1, base: 0.7 }, arcs: {} },
      india: { lat: 27, lon: 77.5, dist: 2.4 * pd, x: side, y: py, labels: { edu: 0.8, base: 0.8 }, arcs: {} },
      ggn: { lat: 29.2, lon: 77.1, dist: 2.05 * pd, x: side, y: py, labels: { edu: 0.7, base: 1 }, arcs: { study: [1, 1] } },
      world: { lat: 36, lon: 78, dist: 4.1 * pd, x: side, y: py, labels: { base: 1, teams: 1, edu: 0 }, arcs: { jp: [1, 1], eu: [1, 1], study: [0.4, 1] } },
    } as Record<string, View>,
    contact: { lat: 30, lon: 80, dist: 3.9 * pd, x: phone ? 0 : 0.22, y: phone ? -0.18 : 0, labels: { base: 1, teams: 1, work: 0.5 }, arcs: ALL_ROUTES },
  }
}
