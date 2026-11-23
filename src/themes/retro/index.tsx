import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import '@fontsource/ibm-plex-mono/700.css'
import css from './retro.css?inline'
import { useThemeStyles } from '../../theme/useThemeStyles'
import RetroPage from './RetroPage'

export const fonts = ['400 1em "IBM Plex Mono"', '500 1em "IBM Plex Mono"', '700 1em "IBM Plex Mono"']

/** "Retro": a 1980s computer on a desk — its screen is a terminal you can type into. */
export default function RetroTheme() {
  useThemeStyles(css, 'retro')
  return <RetroPage />
}
