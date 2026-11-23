import '@fontsource-variable/schibsted-grotesk/wght.css'
import '@fontsource-variable/geist-mono/wght.css'
import css from './mono.css?inline'
import { useThemeStyles } from '../../theme/useThemeStyles'
import MonoPage from './MonoPage'

export const fonts = ['750 1em "Schibsted Grotesk Variable"', '400 1em "Schibsted Grotesk Variable"', '400 1em "Geist Mono Variable"']

/** "Mono": black & white, one 3D card that carries the page, and a footer crowd that steals the show. */
export default function MonoTheme() {
  useThemeStyles(css, 'mono')
  return <MonoPage />
}
