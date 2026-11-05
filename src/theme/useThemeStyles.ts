import { useInsertionEffect } from 'react'

/**
 * Mounts a theme's stylesheet only while the theme is on screen, so two themes'
 * global rules (body, :root tokens, cursor…) never fight. Import the CSS with
 * `?inline` and pass the string in. Insertion effects run before any layout
 * effect, so GSAP measures a fully styled page.
 */
export function useThemeStyles(css: string, id: string) {
  useInsertionEffect(() => {
    const el = document.createElement('style')
    el.dataset.skin = id
    el.textContent = css
    document.head.appendChild(el)
    return () => el.remove()
  }, [css, id])
}
