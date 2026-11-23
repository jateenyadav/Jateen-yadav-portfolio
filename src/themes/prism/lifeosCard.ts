/**
 * LifeOS has no screenshot, so its card is drawn: a calm phone UI on a light field.
 * The same canvas is shown in the page (no WebGL) and used as the texture the glass refracts.
 */
export function drawLifeOS(c: HTMLCanvasElement, font: string) {
  const W = 1440
  const H = 900
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  if (!g) return
  const bg = g.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#dfe5ff')
  bg.addColorStop(0.55, '#eef0f4')
  bg.addColorStop(1, '#ffe6da')
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)

  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    g.beginPath()
    g.roundRect(x, y, w, h, r)
  }

  // left: the product name and what it holds
  g.fillStyle = '#121318'
  g.font = `700 120px ${font}`
  g.fillText('LifeOS', 110, 300)
  g.font = `500 38px ${font}`
  g.fillStyle = '#4b5060'
  g.fillText('Notes · reminders · workouts', 114, 380)
  g.fillText('routines · expenses — and an AI', 114, 432)
  g.fillText('that reads your own data.', 114, 484)
  ;['Web', 'Android', 'iOS'].forEach((t, i) => {
    const x = 114 + i * 170
    rr(x, 560, 150, 60, 30)
    g.fillStyle = i === 0 ? '#3f6bff' : '#ffffff'
    g.fill()
    g.fillStyle = i === 0 ? '#ffffff' : '#121318'
    g.font = `600 28px ${font}`
    g.fillText(t, x + 75 - g.measureText(t).width / 2, 600)
  })

  // right: a phone
  const px = 880
  const py = 90
  const pw = 400
  const ph = 760
  g.save()
  g.shadowColor = 'rgba(30, 40, 90, 0.22)'
  g.shadowBlur = 60
  g.shadowOffsetY = 30
  rr(px, py, pw, ph, 56)
  g.fillStyle = '#121318'
  g.fill()
  g.restore()
  rr(px + 14, py + 14, pw - 28, ph - 28, 44)
  g.fillStyle = '#f7f8fb'
  g.fill()
  g.fillStyle = '#121318'
  g.font = `700 34px ${font}`
  g.fillText('Today', px + 48, py + 104)
  const rows: [string, string, string][] = [
    ['Notes', 'Everything you wrote', '#3f6bff'],
    ['Reminders', 'What is due', '#ff7a59'],
    ['Workouts', 'What you trained', '#19b38a'],
    ['Routines', 'What you repeat', '#8f6bff'],
    ['Expenses', '₹ from payment alerts', '#121318'],
  ]
  rows.forEach(([t, s, col], i) => {
    const y = py + 140 + i * 92
    rr(px + 36, y, pw - 72, 76, 18)
    g.fillStyle = '#ffffff'
    g.fill()
    g.beginPath()
    g.arc(px + 72, y + 38, 12, 0, Math.PI * 2)
    g.fillStyle = col
    g.fill()
    g.fillStyle = '#121318'
    g.font = `600 24px ${font}`
    g.fillText(t, px + 100, y + 34)
    g.fillStyle = '#6a6f80'
    g.font = `500 20px ${font}`
    g.fillText(s, px + 100, y + 60)
  })
  // assistant bubble
  const by = py + ph - 140
  rr(px + 36, by, pw - 72, 90, 22)
  g.fillStyle = '#3f6bff'
  g.fill()
  g.fillStyle = '#ffffff'
  g.font = `600 22px ${font}`
  g.fillText('Ask LifeOS', px + 62, by + 38)
  g.font = `500 19px ${font}`
  g.fillStyle = 'rgba(255,255,255,0.82)'
  g.fillText('“What did I spend on food?”', px + 62, by + 66)
}
