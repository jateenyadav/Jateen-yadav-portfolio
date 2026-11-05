/** Decorative, deterministic barcode generated from a string (not a scannable symbology). */
export default function Barcode({ value, height = 44 }: { value: string; height?: number }) {
  const bars: { x: number; w: number }[] = []
  let x = 0
  const seed = [...value].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
  const add = (w: number, ink: boolean) => {
    if (ink) bars.push({ x, w })
    x += w
  }
  add(2, true); add(1, false); add(1, true); add(1, false) // start guard
  let s = seed
  for (let i = 0; i < value.length * 3 + 12; i++) {
    s = (s * 1103515245 + 12345) >>> 0
    add(1 + (s % 3), true)
    add(1 + ((s >> 3) % 3), false)
  }
  add(1, true); add(1, false); add(2, true) // end guard

  return (
    <svg className="barcode" viewBox={`0 0 ${x} ${height}`} preserveAspectRatio="none" role="img" aria-label={`Label ${value}`}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={height} />
      ))}
    </svg>
  )
}
