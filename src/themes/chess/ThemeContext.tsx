// Original dark / light toggle of the chess portfolio — logic unchanged.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type Mode = 'dark' | 'light'

const ThemeContext = createContext<{ theme: Mode; toggleTheme: () => void }>({
  theme: 'dark',
  toggleTheme: () => {},
})

const getInitialTheme = (): Mode => {
  if (typeof window === 'undefined') return 'dark'

  const stored = window.localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored

  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches

  return prefersLight ? 'light' : 'dark'
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Mode>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    window.localStorage.setItem('theme', theme)
  }, [theme])

  // Leaving the chess skin: drop its dark/light attribute so other skins start clean.
  useEffect(() => () => document.documentElement.removeAttribute('data-theme'), [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)

export default ThemeContext
