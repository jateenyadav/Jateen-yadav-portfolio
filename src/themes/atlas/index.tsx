import '@fontsource-variable/archivo/wght.css'
import bigShoulders from '@fontsource-variable/big-shoulders-display/files/big-shoulders-display-latin-wght-normal.woff2?url'
import rawCss from './atlas.css?inline'
import { useThemeStyles } from '../../theme/useThemeStyles'
import AtlasPage from './AtlasPage'

// the display face is declared in atlas.css (latin only — every heading is Latin text)
const css = rawCss.replace('__BIG_SHOULDERS__', bigShoulders)

export const fonts = ['800 1em "Big Shoulders Display Variable"', '400 1em "Archivo Variable"', '600 1em "Archivo Variable"']

/** "Atlas": a live dotted globe — arcs from Gurugram to the teams and places the work reaches. */
export default function AtlasTheme() {
  useThemeStyles(css, 'atlas')
  return <AtlasPage />
}
