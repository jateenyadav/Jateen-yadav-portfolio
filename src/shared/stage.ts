import { WebGLRenderer, type WebGLRendererParameters } from 'three'

/**
 * Shared WebGL stage for every 3D theme, so they all behave the same:
 * - pixel ratio capped (1.5 desktop, 1.25 phones)
 * - frame loop with a real delta, paused when the tab is hidden or the canvas is off screen
 * - resize handling
 * - reduced motion: render() is still called, but `still` is true so the theme draws a calm frame
 * Returns null when WebGL is unavailable; the theme must then show its CSS fallback.
 */

export type StageFrame = { dt: number; time: number; width: number; height: number; still: boolean }

export type Stage = {
  renderer: WebGLRenderer
  width: () => number
  height: () => number
  isSmall: () => boolean
  /** Render one frame now (e.g. after a change while reduced motion is on). */
  invalidate: () => void
  dispose: () => void
}

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function createStage(
  canvas: HTMLCanvasElement,
  onFrame: (f: StageFrame) => void,
  opts: { onResize?: (w: number, h: number) => void; renderer?: WebGLRendererParameters; maxDpr?: number } = {},
): Stage | null {
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', ...opts.renderer })
  } catch {
    return null
  }
  const still = reducedMotion()
  let w = 1
  let h = 1
  const small = () => window.innerWidth < 700
  const resize = () => {
    w = Math.max(1, canvas.clientWidth)
    h = Math.max(1, canvas.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.maxDpr ?? (small() ? 1.25 : 1.5)))
    renderer.setSize(w, h, false)
    opts.onResize?.(w, h)
    if (!raf) draw(0)
  }

  let raf = 0
  let last = 0
  let time = 0
  let visible = true
  const draw = (dt: number) => onFrame({ dt, time, width: w, height: h, still })
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop)
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
    last = now
    time += dt
    draw(dt)
  }
  const start = () => {
    if (raf || still || !visible || document.hidden) return
    last = 0
    raf = requestAnimationFrame(loop)
  }
  const stop = () => {
    cancelAnimationFrame(raf)
    raf = 0
  }

  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
    if (visible) start()
    else stop()
  })
  io.observe(canvas)
  const onVis = () => (document.hidden ? stop() : start())
  document.addEventListener('visibilitychange', onVis)

  resize()
  draw(0)
  start()

  return {
    renderer,
    width: () => w,
    height: () => h,
    isSmall: small,
    invalidate: () => {
      if (!raf) draw(0)
    },
    dispose: () => {
      stop()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      renderer.dispose()
    },
  }
}
