// The tiny, always-loaded half of the surprise feature: storage keys, a cheap "is one saved?"
// check and the code that turns a surprise off. Everything else lives in the lazy chunk (index.ts).

export const STATE_KEY = 'jy-surprise'
/** Paper colour of the active surprise, read by the boot script in index.html to avoid a flash. */
export const BG_KEY = 'jy-surprise-bg'
export const STYLE_ID = 'sx-tokens'
export const EVENT = 'jy:surprise'

/** Is a surprise theme saved as the visitor's current look? (Reads storage only.) */
export function peekSaved(): boolean {
  try {
    const s = JSON.parse(localStorage.getItem(STATE_KEY) ?? 'null')
    return Boolean(s && typeof s.cur === 'string' && s.cur)
  } catch {
    return false
  }
}

export const surpriseActive = () => Boolean(document.documentElement.dataset.surprise)

/** Remove every trace of the surprise look from the page. */
export function clearSurprise() {
  const root = document.documentElement
  if (!root.dataset.surprise) return
  document.getElementById(STYLE_ID)?.remove()
  delete root.dataset.surprise
  delete root.dataset.sxTone
  delete root.dataset.sxPattern
  delete root.dataset.sxHover
  try {
    localStorage.removeItem(BG_KEY)
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { active: false } }))
}
