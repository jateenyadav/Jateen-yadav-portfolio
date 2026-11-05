import '@fontsource-variable/archivo/wdth.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource-variable/jetbrains-mono'
import css from './assembly.css?inline'
import { useThemeStyles } from '../../theme/useThemeStyles'
import AssemblyPage from './AssemblyTheme'

export const fonts = ['850 1em "Archivo Variable"', 'italic 400 1em "Instrument Serif"', '400 1em "JetBrains Mono Variable"']

/** "JY-2026 — Jateen, assembled": assembly line × print shop. */
export default function AssemblyTheme() {
  useThemeStyles(css, 'assembly')
  return <AssemblyPage />
}
