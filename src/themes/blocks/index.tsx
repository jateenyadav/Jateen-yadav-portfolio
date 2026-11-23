import '@fontsource-variable/anybody/standard.css'
import '@fontsource-variable/schibsted-grotesk/wght.css'
import css from './blocks.css?inline'
import { useThemeStyles } from '../../theme/useThemeStyles'
import BlocksPage from './BlocksPage'

export const fonts = ['800 1em "Anybody Variable"', '400 1em "Schibsted Grotesk Variable"', '600 1em "Schibsted Grotesk Variable"']

/** "Blocks": a tiny voxel island — each project is a landmark, each skill a workshop. */
export default function BlocksTheme() {
  useThemeStyles(css, 'blocks')
  return <BlocksPage />
}
