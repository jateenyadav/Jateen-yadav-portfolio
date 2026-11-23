import { useEffect, useRef, useState } from 'react'
import type { Project } from '../data/content'

type Props = {
  p: Project
  className?: string
  /** Defaults to "<title> demo". Pass '' when the media is decorative (a nearby link already names it). */
  alt?: string
  width?: number
  height?: number
}

const quiet = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData))

/**
 * A project's real demo: a silent looping video that only downloads and plays while it is on
 * screen, with the poster frame as the fallback (reduced motion, data saver, no video).
 */
export default function ProjectMedia({ p, className, alt, width = 1280, height = 720 }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const [still] = useState(quiet)
  const label = alt ?? `${p.title} demo`

  useEffect(() => {
    const v = ref.current
    if (!v || still) return
    const io = new IntersectionObserver(
      ([e]) => {
        // skip clips a theme keeps hidden in place (e.g. stacked cards); the theme plays them when shown
        if (e.isIntersecting && (v.checkVisibility?.({ visibilityProperty: true }) ?? true)) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.2 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [still])

  if (!p.video || still) {
    return p.image ? <img className={className} src={p.image} alt={label} loading="lazy" decoding="async" width={width} height={height} /> : null
  }
  return (
    <video
      ref={ref}
      className={className}
      src={p.video}
      poster={p.image}
      width={width}
      height={height}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      aria-label={label}
      role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : true}
    />
  )
}
