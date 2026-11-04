import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)
ScrollTrigger.config({ ignoreMobileResize: true })

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const isFinePointer = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

let lenis: Lenis | null = null
const raf = (time: number) => lenis?.raf(time * 1000)

/** Smooth scroll driven by GSAP's ticker so ScrollTrigger and Lenis share one clock. */
export function initSmoothScroll(): Lenis | null {
  if (lenis || prefersReducedMotion()) return lenis
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, touchMultiplier: 1.1 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export function destroySmoothScroll() {
  gsap.ticker.remove(raf)
  lenis?.destroy()
  lenis = null
}

export const getLenis = () => lenis

export function scrollToTarget(target: string | number) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.6, easing: (t: number) => 1 - Math.pow(1 - t, 4) })
    return
  }
  if (typeof target === 'number') window.scrollTo({ top: target })
  else document.querySelector(target)?.scrollIntoView()
}

/** Particle-field shape index per section (see ParticleField). */
export function setMorph(index: number) {
  window.dispatchEvent(new CustomEvent<number>('morph', { detail: index }))
}

/** Dim the particle field behind text-heavy sections (1 = full strength). */
export function setFieldOpacity(value: number) {
  window.dispatchEvent(new CustomEvent<number>('fieldopacity', { detail: value }))
}

export { gsap, ScrollTrigger, SplitText, useGSAP }
