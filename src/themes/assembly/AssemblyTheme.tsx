import { useEffect } from 'react'
import { ScrollTrigger, initSmoothScroll, destroySmoothScroll } from '../../lib/motion'
import Cursor from './components/Cursor'
import Nav from './components/Nav'
import Rail from './components/Rail'
import Hero from './components/Hero'
import Spec from './components/Spec'
import Modules from './components/Modules'
import Units from './components/Units'
import Logbook from './components/Logbook'
import Dispatch from './components/Dispatch'

export default function App() {
  useEffect(() => {
    initSmoothScroll()
    // Fonts + images change layout; recompute triggers once they settle.
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh)
    return () => {
      window.removeEventListener('load', refresh)
      destroySmoothScroll()
    }
  }, [])

  return (
    <>
      <Cursor />
      <Nav />
      <Rail />
      <main className="line">
        <Hero />
        <Spec />
        <Modules />
        <Units />
        <Logbook />
        <Dispatch />
      </main>
    </>
  )
}
