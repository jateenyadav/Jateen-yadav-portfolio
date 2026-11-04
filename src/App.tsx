import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { ScrollTrigger, initSmoothScroll, destroySmoothScroll, getLenis, setMorph, setFieldOpacity } from './lib/motion'
import Loader from './components/Loader'
import Cursor from './components/Cursor'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import About from './components/About'
import Capabilities from './components/Capabilities'
import Work from './components/Work'
import Experience from './components/Experience'
import Contact from './components/Contact'

// Three.js is the heaviest dependency — load it after first paint.
const ParticleField = lazy(() => import('./components/ParticleField'))

export default function App() {
  const [ready, setReady] = useState(false)

  const onLoaded = useCallback(() => {
    document.body.classList.remove('is-loading')
    document.documentElement.dataset.intro = 'done'
    window.dispatchEvent(new Event('intro'))
    setReady(true)
  }, [])

  useEffect(() => {
    document.body.classList.add('is-loading')
    initSmoothScroll()?.stop()
    return () => destroySmoothScroll()
  }, [])

  useEffect(() => {
    if (!ready) return
    // Release scroll, then wire each section to a particle shape.
    getLenis()?.start()
    const triggers = Array.from(document.querySelectorAll<HTMLElement>('[data-morph]')).map((section) =>
      ScrollTrigger.create({
        trigger: section,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (!self.isActive) return
          setMorph(Number(section.dataset.morph))
          setFieldOpacity(Number(section.dataset.field ?? 1))
        },
      }),
    )
    // Fonts + images change layout; recompute every trigger once they settle.
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh)
    return () => {
      triggers.forEach((t) => t.kill())
      window.removeEventListener('load', refresh)
    }
  }, [ready])

  return (
    <>
      <Suspense fallback={null}>
        <ParticleField />
      </Suspense>
      <div className="grain" aria-hidden="true" />
      <Cursor />
      <Loader onDone={onLoaded} />
      <Nav ready={ready} />
      <main>
        <Hero ready={ready} />
        <Marquee />
        <About />
        <Capabilities />
        <Work />
        <Experience />
        <Contact />
      </main>
    </>
  )
}
