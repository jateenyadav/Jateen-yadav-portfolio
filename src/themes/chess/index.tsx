// The original chess portfolio, restored as a skin. Stylesheets are the
// untouched originals, mounted in the same order the old app loaded them
// (index.css → Navigation.css → ChessboardHero.css → App.css) so the cascade matches.
import indexCss from './styles/index.css?inline'
import navigationCss from './styles/Navigation.css?inline'
import heroCss from './styles/ChessboardHero.css?inline'
import appCss from './styles/App.css?inline'
import skinCss from './skin.css?inline'
import { useThemeStyles } from '../../theme/useThemeStyles'
import { ThemeProvider } from './ThemeContext'
import Navigation from './Navigation'
import ChessboardHero from './ChessboardHero'

const css = [indexCss, navigationCss, heroCss, appCss, skinCss].join('\n')

export default function ChessTheme() {
  useThemeStyles(css, 'chess')
  return (
    <ThemeProvider>
      <div className="App">
        <Navigation />
        <ChessboardHero />
      </div>
    </ThemeProvider>
  )
}
