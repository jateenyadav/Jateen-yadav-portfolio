import '@fontsource-variable/anybody/wdth.css'
import '@fontsource-variable/geist-mono/wght.css'
import '@fontsource/instrument-serif/400-italic.css'
import css from './flow.css?inline'
import { useThemeStyles } from '../../theme/useThemeStyles'
import FlowPage from './FlowPage'

export const fonts = ['900 1em "Anybody Variable"', '500 1em "Anybody Variable"', 'italic 400 1em "Instrument Serif"', '400 1em "Geist Mono Variable"']

/** "Flow": raymarched liquid chrome that re-forms per section and can be stirred with the cursor. */
export default function FlowTheme() {
  useThemeStyles(css, 'flow')
  return <FlowPage />
}
