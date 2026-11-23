import '@fontsource-variable/bricolage-grotesque/wdth.css'
import '@fontsource-variable/geist-mono/wght.css'
import css from './orbit.css?inline'
import { useThemeStyles } from '../../theme/useThemeStyles'
import OrbitPage from './OrbitPage'

export const fonts = ['700 1em "Bricolage Grotesque Variable"', '400 1em "Bricolage Grotesque Variable"', '400 1em "Geist Mono Variable"']

/** "Orbit": a 3D solar system — Jateen is the sun, his five kinds of work are planets you fly to. */
export default function OrbitTheme() {
  useThemeStyles(css, 'orbit')
  return <OrbitPage />
}
