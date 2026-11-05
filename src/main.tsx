import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'lenis/dist/lenis.css'
import './theme/switcher.css'
import ThemeRoot from './theme/ThemeRoot'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeRoot />
  </StrictMode>,
)
