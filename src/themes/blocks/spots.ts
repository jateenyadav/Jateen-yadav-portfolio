/**
 * Shared between the page and the (lazy) three.js scene — no three imports here,
 * so the theme chunk stays small.
 *
 * Camera stops, in page order. Each <section data-stop> on the page matches one.
 */
export const STOPS = ['top', 'about', 'skills', 'lifeos', 'examace', 'solar', 'client', 'log', 'contact'] as const

/** Pickable buildings, in the order the scene builds them. `stop` = the section it opens. */
export const SPOTS = [
  { key: 'lifeos', label: 'LifeOS', stop: 3, kind: 'project' },
  { key: 'examace', label: 'ExamAce', stop: 4, kind: 'project' },
  { key: 'solar', label: 'Solar System', stop: 5, kind: 'project' },
  { key: 'client', label: 'Client Portfolio', stop: 6, kind: 'project' },
  { key: 'w0', label: 'Web', stop: 2, kind: 'shop' },
  { key: 'w1', label: 'Mobile', stop: 2, kind: 'shop' },
  { key: 'w2', label: 'Desktop', stop: 2, kind: 'shop' },
  { key: 'w3', label: 'AI / LLM', stop: 2, kind: 'shop' },
  { key: 'w4', label: '3D / WebGL', stop: 2, kind: 'shop' },
] as const

/** Roof colour of each workshop (same order as content.modules). */
export const SHOP_COLORS = ['#4f8cff', '#2fbf71', '#9b6bff', '#ff6b4a', '#f5b82e']
