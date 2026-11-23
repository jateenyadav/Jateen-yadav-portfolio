import '@fontsource-variable/schibsted-grotesk/wght.css'
import '@fontsource-variable/geist-mono/wght.css'
import css from './prism.css?inline'
import { useThemeStyles } from '../../theme/useThemeStyles'
import PrismPage from './PrismPage'

export const fonts = ['760 1em "Schibsted Grotesk Variable"', '500 1em "Schibsted Grotesk Variable"', '400 1em "Geist Mono Variable"']

/** "Prism": real glass floats over the page and bends the words and screenshots behind it. */
export default function PrismTheme() {
  useThemeStyles(css, 'prism')
  return <PrismPage />
}
