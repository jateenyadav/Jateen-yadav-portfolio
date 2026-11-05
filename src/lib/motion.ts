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

/** `offset` is added to the target position (negative = stop above it, e.g. under a fixed nav). */
export function scrollToTarget(target: string | number, offset = 0) {
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.6, easing: (t: number) => 1 - Math.pow(1 - t, 4) })
    return
  }
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth'
  if (typeof target === 'number') {
    window.scrollTo({ top: target + offset, behavior })
    return
  }
  const el = document.querySelector(target)
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior })
}

export { gsap, ScrollTrigger, SplitText, useGSAP }
