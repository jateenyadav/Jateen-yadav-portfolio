import { archive, experience, hero, modules, profile, projects, spec, statement } from '../../data/content'

/**
 * The terminal behind the Retro theme. No three.js here: it owns the text buffer, the
 * command set and a 2D canvas (the CRT texture). The page mirrors the same lines into
 * real DOM text (phones, no-WebGL, screen readers).
 */

export type Kind = 'out' | 'dim' | 'hi' | 'big' | 'cmd' | 'err'
export type Line = { text: string; kind: Kind }
export type Phosphor = 'green' | 'amber'

export const PHOSPHOR: Record<Phosphor, { fg: string; hi: string; dim: string; bg: string }> = {
  green: { fg: '#6dff9a', hi: '#dcffe6', dim: '#38a861', bg: '#03130a' },
  amber: { fg: '#ffb847', hi: '#fff0c8', dim: '#b8761c', bg: '#150b02' },
}

export const PROMPT = 'C:\\JY>'
export const COLS = 54
const ROWS = 19
const W = 1024
const H = 768
const PAD_X = 64
const PAD_Y = 58
const LINE_H = (H - PAD_Y * 2) / (ROWS + 1)
const FONT = '"IBM Plex Mono", ui-monospace, monospace'

type Task = { t: 'print'; line: Line } | { t: 'type'; text: string } | { t: 'wait'; ms: number }

const wrap = (text: string, cols: number): string[] => {
  if (text.length <= cols) return [text]
  const out: string[] = []
  const indent = text.match(/^\s*/)?.[0] ?? ''
  let rest = text
  while (rest.length > cols) {
    let cut = rest.lastIndexOf(' ', cols)
    if (cut <= indent.length) cut = cols
    out.push(rest.slice(0, cut))
    rest = indent + rest.slice(cut).trimStart()
  }
  out.push(rest)
  return out
}
const dots = (k: string, n = 13) => (k + ' ').padEnd(n, '.') + ' '
const bare = (href: string) => href.replace(/^https?:\/\//, '').replace(/\/$/, '')

/** Every command → lines. `open` and `resume` also act. */
function outputFor(cmd: string, arg: string, term: Terminal): Line[] {
  const L = (text: string, kind: Kind = 'out'): Line => ({ text, kind })
  const gap = L('')
  switch (cmd) {
    case 'help':
    case '?':
      return [
        L('COMMANDS', 'hi'),
        L('  about        who I am'),
        L('  skills       what I build with'),
        L('  projects     things I have launched'),
        L('  open 1-4     visit a project'),
        L('  experience   where I have worked'),
        L('  contact      how to reach me'),
        L('  resume       open the résumé (PDF)'),
        L('  theme amber  phosphor colour: amber | green'),
        L('  clear        clear the screen'),
      ]
    case 'about':
    case 'whoami':
      return [L('ABOUT.TXT', 'hi'), L(statement), gap, ...spec.map(([k, v]) => L(dots(k) + v, 'dim'))]
    case 'skills':
    case 'stack':
      return [
        L('SKILLS — five modules', 'hi'),
        ...modules.flatMap((m) => [L(`${m.code}  ${m.title.toUpperCase()}`, 'hi'), L(`  ${m.tagline}`), L(`  ${m.stack}`, 'dim')]),
      ]
    case 'projects':
    case 'work':
    case 'ls':
    case 'dir':
      return [
        L('PROJECTS', 'hi'),
        ...projects.flatMap((p) => [L(`${p.index}  ${p.title.toUpperCase()}  [${p.stamp}]`, 'hi'), L(`    ${p.kind} — ${p.status}`, 'dim')]),
        gap,
        L('More: ' + archive.map((a) => a.title).join(', '), 'dim'),
        L('Type OPEN 1 (to 4) to visit one.'),
      ]
    case 'open': {
      const n = Number.parseInt(arg, 10)
      const p = projects.find((x, i) => i + 1 === n || x.id === arg || x.title.toLowerCase() === arg)
      if (!p) return [L('usage: open 1-4', 'err')]
      term.act({ type: 'open', href: p.links[0].href })
      return [L(`Opening ${p.title} → ${bare(p.links[0].href)}`), L(p.summary, 'dim')]
    }
    case 'experience':
    case 'exp':
    case 'log':
      return [
        L('EXPERIENCE.LOG', 'hi'),
        ...experience.flatMap((e) => [L(`${e.when.replace('→', '-')}  ${e.state}`, 'dim'), L(e.role, 'hi'), L(`  ${e.company}`)]),
      ]
    case 'contact':
    case 'email':
      return [
        L('CONTACT', 'hi'),
        L(dots('Email', 11) + profile.email),
        ...profile.socials.map((s) => L(dots(s.label, 11) + bare(s.href), 'dim')),
        L(dots('Résumé', 11) + 'type RESUME', 'dim'),
        gap,
        L(profile.status + '.'),
      ]
    case 'resume':
    case 'cv':
      term.act({ type: 'open', href: profile.resume })
      return [L('Opening Jateen_Yadav_Resume.pdf …')]
    case 'theme':
    case 'color':
    case 'colour': {
      const want = arg === 'amber' || arg === 'green' ? arg : term.phosphor === 'green' ? 'amber' : 'green'
      term.setPhosphor(want)
      return [L(`Phosphor set to ${want}.`)]
    }
    case 'sudo':
      return [L('Permission granted to hire. Try CONTACT.')]
    case 'date':
      return [L(new Date().toDateString())]
    case '':
      return []
    default:
      return [L(`Bad command or file name: ${cmd}`, 'err'), L('Type HELP for the list.', 'dim')]
  }
}

export type TermAction = { type: 'open'; href: string } | { type: 'phosphor'; value: Phosphor } | { type: 'key'; ch: string }

export class Terminal {
  readonly canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  lines: Line[] = []
  private tasks: Task[] = []
  private partial: Line | null = null
  private partialFull = ''
  private typed = ''
  private typing = false
  input = ''
  phosphor: Phosphor = 'green'
  /** Bumped on every redraw; the WebGL scene uploads the texture when it changes. */
  version = 0
  private raf = 0
  private last = 0
  private waitLeft = 0
  private blink = true
  private blinkTimer = 0
  private listeners = new Set<() => void>()
  private actions = new Set<(a: TermAction) => void>()
  private announce = new Set<(text: string) => void>()
  private instant: boolean
  lastCommand = ''

  constructor(opts: { instant?: boolean } = {}) {
    this.instant = Boolean(opts.instant)
    this.canvas = document.createElement('canvas')
    this.canvas.width = W
    this.canvas.height = H
    this.ctx = this.canvas.getContext('2d')!
  }

  /** Starts the cursor blink (and resumes printing). Safe to call twice. */
  start() {
    if (!this.blinkTimer)
      this.blinkTimer = window.setInterval(() => {
        this.blink = !this.blink
        this.render()
      }, 530)
    if (this.tasks.length || this.partial) this.pump()
  }

  stop() {
    cancelAnimationFrame(this.raf)
    this.raf = 0
    window.clearInterval(this.blinkTimer)
    this.blinkTimer = 0
  }

  onChange(fn: () => void) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  onAction(fn: (a: TermAction) => void) {
    this.actions.add(fn)
    return () => this.actions.delete(fn)
  }
  onAnnounce(fn: (text: string) => void) {
    this.announce.add(fn)
    return () => this.announce.delete(fn)
  }
  act(a: TermAction) {
    this.actions.forEach((f) => f(a))
  }

  private booted = false
  boot() {
    if (this.booted) return
    this.booted = true
    const B = (text: string, kind: Kind = 'out'): Task => ({ t: 'print', line: { text, kind } })
    this.tasks.push(
      B(`${profile.model} PERSONAL COMPUTER    BIOS 1.0`, 'dim'),
      B('Memory test .......... 640K OK', 'dim'),
      { t: 'wait', ms: 220 },
      B('Loading PORTFOLIO.EXE', 'dim'),
      { t: 'wait', ms: 260 },
      B(''),
      B(profile.name.toUpperCase(), 'big'),
      B(''),
      B(profile.roles.join(' · ') + ' — ' + profile.location, 'hi'),
      B(hero.line),
      B(''),
      B('Type HELP and press ENTER — or just scroll.', 'dim'),
    )
    this.pump()
  }

  setPhosphor(p: Phosphor) {
    if (p === this.phosphor) return
    this.phosphor = p
    this.act({ type: 'phosphor', value: p })
    this.render()
  }

  setInput(v: string) {
    if (v.length > this.input.length) this.act({ type: 'key', ch: v[v.length - 1] })
    this.input = v.slice(0, 120)
    this.blink = true
    this.render()
  }

  /** The visitor pressed Enter. */
  submit(raw: string) {
    this.input = ''
    this.act({ type: 'key', ch: '\n' })
    this.exec(raw)
  }

  /** Scroll-driven: type the command on the keyboard, then run it. */
  run(cmd: string) {
    if (cmd === this.lastCommand && !this.typing) return
    this.lastCommand = cmd
    // a newer auto-command replaces anything still queued
    this.flush()
    this.tasks.push({ t: 'type', text: cmd })
    this.pump()
  }

  private flush() {
    if (this.partial) {
      this.lines.push({ ...this.partial, text: this.partialFull })
      this.partial = null
    }
    this.tasks = this.tasks.filter((t) => t.t !== 'wait')
    // finish pending prints instantly so nothing is lost
    for (const t of this.tasks) if (t.t === 'print') this.lines.push(t.line)
    this.tasks = []
    this.typing = false
    this.typed = ''
  }

  private exec(raw: string) {
    const text = raw.trim()
    const [c = '', ...rest] = text.split(/\s+/)
    const cmd = c.toLowerCase()
    const arg = rest.join(' ').toLowerCase()
    this.flush()
    this.lines.push({ text: `${PROMPT} ${text}`, kind: 'cmd' })
    this.lastCommand = cmd
    if (cmd === 'clear' || cmd === 'cls') {
      this.lines = []
      this.render()
      return
    }
    const out = outputFor(cmd, arg, this)
    this.announce.forEach((f) => f(out.map((l) => l.text).join('\n')))
    for (const line of out) this.tasks.push({ t: 'print', line })
    this.tasks.push({ t: 'print', line: { text: '', kind: 'out' } })
    this.pump()
  }

  private pump() {
    if (this.instant) {
      while (this.tasks.length) {
        const t = this.tasks.shift()!
        if (t.t === 'print') this.lines.push(t.line)
        if (t.t === 'type') this.exec(t.text)
      }
      this.trim()
      this.render()
      return
    }
    if (!this.raf) {
      this.last = performance.now()
      this.raf = requestAnimationFrame(this.tick)
    }
  }

  private tick = (now: number) => {
    this.raf = 0
    const dt = Math.min(64, now - this.last)
    this.last = now
    let budget = dt
    let changed = false
    while (budget > 0 && (this.tasks.length || this.partial)) {
      if (this.partial) {
        // print ~1400 chars/s: whole sections appear in well under a second
        const n = Math.max(1, Math.round(budget * 1.4))
        const cur = this.partial.text.length
        const next = Math.min(this.partialFull.length, cur + n)
        this.partial.text = this.partialFull.slice(0, next)
        budget -= (next - cur) / 1.4
        changed = true
        if (next >= this.partialFull.length) {
          this.lines.push({ ...this.partial })
          this.partial = null
          budget -= 14 // tiny line feed pause
        }
        continue
      }
      const t = this.tasks[0]
      if (t.t === 'wait') {
        if (this.waitLeft <= 0) this.waitLeft = t.ms
        this.waitLeft -= budget
        budget = 0
        if (this.waitLeft <= 0) this.tasks.shift()
        continue
      }
      if (t.t === 'print') {
        this.tasks.shift()
        if (!t.line.text) {
          this.lines.push(t.line)
          changed = true
          continue
        }
        this.partialFull = t.line.text
        this.partial = { text: '', kind: t.line.kind }
        continue
      }
      // typing a command key by key (~16 keys/s)
      this.typing = true
      if (this.waitLeft <= 0) this.waitLeft = 62
      this.waitLeft -= budget
      budget = 0
      if (this.waitLeft <= 0) {
        if (this.typed.length < t.text.length) {
          const ch = t.text[this.typed.length]
          this.typed += ch
          this.act({ type: 'key', ch })
          changed = true
        } else {
          this.tasks.shift()
          this.typing = false
          this.typed = ''
          this.act({ type: 'key', ch: '\n' })
          this.exec(t.text)
          return
        }
      }
    }
    this.trim()
    if (changed) this.render()
    if (this.tasks.length || this.partial) this.raf = requestAnimationFrame(this.tick)
    else this.raf = 0
  }

  private trim() {
    if (this.lines.length > 240) this.lines.splice(0, this.lines.length - 240)
  }

  /** Lines for the DOM mirror (completed lines + the one being printed). */
  snapshot(): Line[] {
    return this.partial ? [...this.lines, this.partial] : this.lines
  }

  private render() {
    const g = this.ctx
    const c = PHOSPHOR[this.phosphor]
    g.fillStyle = c.bg
    g.fillRect(0, 0, W, H)
    // visual rows, newest at the bottom
    type Row = { text: string; kind: Kind; h: number }
    const rows: Row[] = []
    const push = (l: Line) => {
      if (l.kind === 'big') {
        for (const t of wrap(l.text, Math.floor(COLS / 2))) rows.push({ text: t, kind: 'big', h: 2 })
        return
      }
      for (const t of wrap(l.text, COLS)) rows.push({ text: t, kind: l.kind, h: 1 })
    }
    // only wrap what can be visible
    const src = this.snapshot()
    for (let i = Math.max(0, src.length - ROWS * 2); i < src.length; i++) push(src[i])
    const prompt = this.typing ? this.typed : this.input
    const busy = Boolean(this.partial || (this.tasks.length && !this.typing))
    const inputRows = busy ? [] : wrap(`${PROMPT} ${prompt}`, COLS)
    let budget = ROWS - inputRows.length
    let start = rows.length
    while (start > 0 && budget - rows[start - 1].h >= 0) {
      budget -= rows[start - 1].h
      start--
    }
    let y = PAD_Y + LINE_H * 0.8
    g.textBaseline = 'alphabetic'
    const charW = (W - PAD_X * 2) / COLS
    const fs = Math.round(charW / 0.6)
    for (let i = start; i < rows.length; i++) {
      const r = rows[i]
      if (r.kind === 'big') {
        g.font = `700 ${Math.round((charW * 2) / 0.6)}px ${FONT}`
        g.fillStyle = c.hi
        y += LINE_H
        this.text(r.text, PAD_X, y, charW * 2)
        y += LINE_H
        continue
      }
      g.font = `${r.kind === 'hi' || r.kind === 'cmd' ? 600 : 500} ${fs}px ${FONT}`
      g.fillStyle = r.kind === 'dim' ? c.dim : r.kind === 'hi' ? c.hi : r.kind === 'err' ? '#ff6a5a' : c.fg
      this.text(r.text, PAD_X, y, charW)
      y += LINE_H
    }
    g.font = `600 ${fs}px ${FONT}`
    g.fillStyle = c.fg
    inputRows.forEach((t, i) => {
      this.text(t, PAD_X, y, charW)
      if (i === inputRows.length - 1 && this.blink) g.fillRect(PAD_X + g.measureText(t).width + 3, y - LINE_H * 0.66, charW * 0.85, LINE_H * 0.8)
      y += LINE_H
    })
    if (busy && this.blink) g.fillRect(PAD_X, y - LINE_H * 0.66, charW * 0.85, LINE_H * 0.8)
    this.version++
    this.listeners.forEach((f) => f())
  }

  private text(t: string, x: number, y: number, cw: number) {
    // IBM Plex Mono advances 0.6em, so the font size above keeps every row on the COLS grid
    this.ctx.fillText(t, x, y, cw * COLS)
  }

  /** Call once fonts are ready (the canvas draws with IBM Plex Mono). */
  refresh() {
    this.render()
  }

  dispose() {
    this.stop()
    this.listeners.clear()
    this.actions.clear()
    this.announce.clear()
  }
}
