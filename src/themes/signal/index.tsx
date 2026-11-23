import '@fontsource-variable/space-grotesk/wght.css'
import '@fontsource-variable/martian-mono/wght.css'
import css from './signal.css?inline'
import { useThemeStyles } from '../../theme/useThemeStyles'
import SignalPage from './SignalPage'

export const fonts = ['600 1em "Space Grotesk Variable"', '400 1em "Space Grotesk Variable"', '500 1em "Martian Mono Variable"']

/** "Signal": one GPU particle field that re-forms into each part of the work as you scroll. */
export default function SignalTheme() {
  useThemeStyles(css, 'signal')
  return <SignalPage />
}
