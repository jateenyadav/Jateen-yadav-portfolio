import { useEffect, useRef, useState } from 'react'
import { codeSegments, codeStream } from '../../../data/code'
import { prefersReducedMotion } from '../../../lib/motion'

/*
  Station 00 — the print head.
  The photo is sampled into a grid; each cell becomes a halftone ink dot
  sized by how dark that pixel is. A print head sweeps down and prints the
  grid row by row. Every cell is also mapped to one character of Jateen's
  real source code (codeStream) — the loupe under the cursor magnifies the
  dots into those characters and names the file + line it is reading.
*/

// Original colours — also the fallback when the page's tokens can't be read.
const INK = '#141413'
const PAPER = '#efede6'
const ACCENT = '#ff4f1a'

const triplet = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

/** Ink/paper/accent as the page currently styles this element (surprise themes change them). */
function readPalette(el: Element) {
  const cs = getComputedStyle(el)
  const get = (name: string, fallback: string) => {
    const v = cs.getPropertyValue(name).trim()
    return /^#[0-9a-f]{6}$/i.test(v) ? v : fallback
  }
  const ink = get('--ink', INK)
  const accent = get('--accent', ACCENT)
  return { ink, paper: get('--paper', PAPER), accent, inkRgb: triplet(ink), accentRgb: triplet(accent) }
}
const PRINT_MS = 3400

const pad = (n: number, w = 3) => String(n).padStart(w, '0')
const hint =
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
    ? 'tap the portrait to read it'
    : 'hover the portrait to read it'

function locate(index: number) {
  for (const seg of codeSegments) {
    if (index >= seg.start && index < seg.end) {
      let line = seg.lines[0]?.[1] ?? 1
      for (const [at, no] of seg.lines) {
        if (at > index) break
        line = no
      }
      return `${seg.repo}/${seg.path} · L${line}`
    }
  }
  return ''
}

export default function PrintPortrait({ src }: { src: string }) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const fileTag = useRef<HTMLSpanElement>(null)
  const [run, setRun] = useState(0)
  const [done, setDone] = useState(false)
  const [px, setPx] = useState(0)

  useEffect(() => {
    const wrap = box.current
    const el = canvas.current
    if (!wrap || !el) return
    const ctx = el.getContext('2d')
    if (!ctx) return

    const reduced = prefersReducedMotion()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const dots = document.createElement('canvas')
    const dctx = dots.getContext('2d')!
    const img = new Image()
    img.decoding = 'async'
    img.src = src

    let size = 0
    let cell = 7
    let cols = 0
    let rows = 0
    let dark = new Float32Array(0)
    let printed = 0
    let head = -1
    let raf = 0
    let pending = 0
    let startAt = 0
    let disposed = false
    const lens = { x: 0, y: 0, on: false }
    let pal = readPalette(wrap)
    const len = codeStream.length

    const layout = () => {
      size = Math.max(200, Math.round(wrap.clientWidth))
      cell = size < 460 ? 5 : 6
      cols = Math.floor(size / cell)
      rows = cols
      for (const c of [el, dots]) {
        c.width = Math.round(size * dpr)
        c.height = Math.round(size * dpr)
      }
      el.style.width = el.style.height = `${size}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const sample = document.createElement('canvas')
      sample.width = cols
      sample.height = rows
      const sctx = sample.getContext('2d', { willReadFrequently: true })!
      sctx.drawImage(img, 0, 0, cols, rows)
      const data = sctx.getImageData(0, 0, cols, rows).data
      // Luminance → ink coverage. A contrast stretch keeps skin mid-tones light
      // so eyes, brows, beard and hair carry the likeness.
      const raw = new Float32Array(cols * rows)
      for (let i = 0; i < cols * rows; i++) {
        const l = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255
        const d = Math.min(1, Math.max(0, (1 - l - 0.16) / 0.72))
        raw[i] = Math.pow(d, 1.3)
      }
      // Unsharp mask: push each cell away from its neighbourhood average to crisp up features.
      dark = new Float32Array(cols * rows)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let sum = 0
          let n = 0
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const rr = r + dy, cc = c + dx
              if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue
              sum += raw[rr * cols + cc]
              n++
            }
          }
          const i = r * cols + c
          dark[i] = Math.min(1, Math.max(0, raw[i] + 0.75 * (raw[i] - sum / n)))
        }
      }
      setPx(cols * rows)
    }

    const printRow = (r: number) => {
      dctx.fillStyle = pal.ink
      dctx.beginPath()
      for (let c = 0; c < cols; c++) {
        const d = dark[r * cols + c]
        if (d < 0.035) continue
        const rad = cell * 0.52 * Math.sqrt(d)
        const x = c * cell + cell / 2
        const y = r * cell + cell / 2
        dctx.moveTo(x + rad, y)
        dctx.arc(x, y, rad, 0, Math.PI * 2)
      }
      dctx.fill()
    }

    const reprintAll = () => {
      dctx.clearRect(0, 0, size, size)
      for (let r = 0; r < printed; r++) printRow(r)
    }

    const drawLens = () => {
      const R = size < 460 ? 78 : 124
      const Z = 2.15
      const { x: lx, y: ly } = lens
      ctx.save()
      ctx.beginPath()
      ctx.arc(lx, ly, R, 0, Math.PI * 2)
      ctx.clip()
      ctx.fillStyle = pal.paper
      ctx.fillRect(lx - R, ly - R, R * 2, R * 2)

      const sr = R / Z
      const c0 = Math.max(0, Math.floor((lx - sr) / cell))
      const c1 = Math.min(cols - 1, Math.ceil((lx + sr) / cell))
      const r0 = Math.max(0, Math.floor((ly - sr) / cell))
      const r1 = Math.min(printed - 1, Math.ceil((ly + sr) / cell))
      ctx.font = `600 ${(cell * Z * 0.98).toFixed(1)}px "JetBrains Mono Variable", ui-monospace, monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const i = r * cols + c
          const d = dark[i]
          const ch = codeStream[i % len]
          if (ch === ' ') continue
          const sx = c * cell + cell / 2
          const sy = r * cell + cell / 2
          const a = d < 0.035 ? 0.1 : 0.22 + 0.78 * d
          ctx.fillStyle = d < 0.035 ? `rgba(${pal.inkRgb},${a})` : `rgba(${pal.inkRgb},${a.toFixed(2)})`
          ctx.fillText(ch, lx + (sx - lx) * Z, ly + (sy - ly) * Z)
        }
      }
      ctx.restore()

      // loupe ring + registration ticks
      ctx.strokeStyle = pal.accent
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(lx, ly, R, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        ctx.moveTo(lx + dx * (R - 8), ly + dy * (R - 8))
        ctx.lineTo(lx + dx * (R + 10), ly + dy * (R + 10))
      }
      ctx.stroke()

      const cc = Math.min(cols - 1, Math.max(0, Math.floor(lx / cell)))
      const rc = Math.min(rows - 1, Math.max(0, Math.floor(ly / cell)))
      if (fileTag.current) fileTag.current.textContent = `reading ${locate((rc * cols + cc) % len)}`
    }

    const render = () => {
      pending = 0
      ctx.clearRect(0, 0, size, size)
      ctx.drawImage(dots, 0, 0, size, size)
      if (head >= 0) {
        const y = Math.min(size, head * cell + cell / 2)
        const g = ctx.createLinearGradient(0, y - 36, 0, y)
        g.addColorStop(0, `rgba(${pal.accentRgb},0)`)
        g.addColorStop(1, `rgba(${pal.accentRgb},0.16)`)
        ctx.fillStyle = g
        ctx.fillRect(0, y - 36, size, 36)
        ctx.fillStyle = pal.accent
        ctx.fillRect(0, y - 1, size, 2)
        // carriage
        const cx = ((performance.now() / 3) % (size + 40)) - 20
        ctx.fillRect(cx - 10, y - 5, 20, 10)
      }
      if (lens.on && printed > 0) drawLens()
    }
    const requestRender = () => {
      if (!pending) pending = requestAnimationFrame(render)
    }

    const setReadout = (rowsDone: number) => {
      if (!readout.current) return
      readout.current.textContent =
        rowsDone >= rows
          ? `RENDER COMPLETE · ${cols}×${rows} · ${(cols * rows).toLocaleString('en-IN')} PX`
          : `PRINTING · ROW ${pad(rowsDone)}/${pad(rows)} · ${(rowsDone * cols).toLocaleString('en-IN')} PX`
    }

    const tick = (now: number) => {
      if (disposed) return
      const t = Math.min(1, (now - startAt) / PRINT_MS)
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      const target = Math.min(rows, Math.floor(eased * rows) + 1)
      while (printed < target) printRow(printed++)
      head = printed < rows ? printed : -1
      setReadout(printed)
      render()
      if (printed < rows) raf = requestAnimationFrame(tick)
      else {
        head = -1
        render()
        setDone(true)
      }
    }

    const begin = () => {
      if (disposed) return
      layout()
      printed = 0
      dctx.clearRect(0, 0, size, size)
      if (reduced) {
        printed = rows
        reprintAll()
        setReadout(rows)
        render()
        setDone(true)
        return
      }
      startAt = performance.now()
      raf = requestAnimationFrame(tick)
    }

    const toLocal = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      lens.x = e.clientX - r.left
      lens.y = e.clientY - r.top
    }
    const onMove = (e: PointerEvent) => {
      toLocal(e)
      lens.on = true
      requestRender()
    }
    const onLeave = () => {
      lens.on = false
      if (fileTag.current) fileTag.current.textContent = hint
      requestRender()
    }

    // a surprise theme changed the colours: reprint what is already on the sheet in the new ink
    const onSurprise = () => {
      pal = readPalette(wrap)
      if (cols) {
        reprintAll()
        requestRender()
      }
    }
    window.addEventListener('jy:surprise', onSurprise)

    const ro = new ResizeObserver(() => {
      if (!img.complete || !cols) return
      const before = size
      layout()
      if (Math.abs(before - size) > 1) {
        if (printed >= rows || reduced) printed = rows
        printed = Math.min(printed, rows)
        reprintAll()
        requestRender()
      }
    })

    setDone(false)
    Promise.all([img.decode().catch(() => undefined), document.fonts?.ready]).then(begin)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerdown', onMove)
    el.addEventListener('pointerleave', onLeave)
    ro.observe(wrap)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      cancelAnimationFrame(pending)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerdown', onMove)
      el.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('jy:surprise', onSurprise)
      ro.disconnect()
    }
  }, [src, run])

  return (
    <figure className="print">
      <div className="print__sheet">
        <span className="crop crop--tl" aria-hidden="true" />
        <span className="crop crop--tr" aria-hidden="true" />
        <span className="crop crop--bl" aria-hidden="true" />
        <span className="crop crop--br" aria-hidden="true" />
        <span className="reg reg--l" aria-hidden="true" />
        <span className="reg reg--r" aria-hidden="true" />
        <div ref={box} className="print__canvas">
          <canvas
            ref={canvas}
            role="img"
            aria-label="Portrait of Jateen Yadav printed as halftone dots; each dot is a character of his own source code"
            data-cursor="Read"
          />
        </div>
      </div>
      <figcaption className="print__meta mono">
        <span ref={readout}>PRINTING · ROW 000</span>
        <span ref={fileTag} className="print__file">
          {hint}
        </span>
        <button className="print__again" onClick={() => setRun((n) => n + 1)} disabled={!done}>
          ↻ Reprint
        </button>
      </figcaption>
      <p className="print__caption">
        <span className="mono">FIG. 00</span> Jateen, printed from {px ? px.toLocaleString('en-IN') : '—'} pixels of his own code.
      </p>
    </figure>
  )
}
