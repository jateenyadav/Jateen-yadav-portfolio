# JY-2026 — Jateen, assembled.

Portfolio of **Jateen Yadav** — Full Stack · Flutter · AI/LLM engineer.
Live: [jateenyadav.netlify.app](https://jateenyadav.netlify.app)

The site is an **assembly line** (a nod to the real-time factory dashboards I build at Hitachi) crossed with a **print shop**. Every section is a station on the line; a unit travels down the conveyor rail as you scroll.

| Station | What happens |
|---|---|
| **00 · Print head** | My photo is sampled into a grid and printed row by row as halftone ink dots (Canvas 2D). Every dot is also one character of my real source code from GitHub — the loupe under your cursor magnifies the dots into that code and names the file + line it's reading. |
| **01 · Spec sheet** | A machine spec plate, a statement that inks in word by word, stepped counters. |
| **02 · Modules** | Control-panel rows — hover a module to run it and its log types out. |
| **03 · Units shipped** | Each project gets a QA shipping label with a generated barcode and a stamp; screenshots print in line by line. |
| **04 · Service log** | Experience on continuous-feed green-bar printer paper, tractor holes and all. |
| **05 · Dispatch** | A thermal receipt prints out of a slot: 1 × full-stack engineer, ship to your team. |

## How the portrait works

1. `public/portrait.jpg` is drawn onto an off-screen canvas at grid resolution (84×84 desktop, 66×66 mobile).
2. Luminance → ink coverage with a contrast stretch and an unsharp mask, so eyes, brows and beard carry the likeness.
3. Each cell becomes a dot whose radius ∝ √coverage; rows are printed progressively behind an animated print head.
4. `src/data/code.ts` holds ~17.5k characters pulled from my public repos (`Me-Assistant`, `Exam-AI`). Cell *i* maps to character *i*, so the loupe shows real, readable code and resolves the exact file + line.

## Stack

React 19 · TypeScript · Vite · Canvas 2D · GSAP (ScrollTrigger, SplitText) · Lenis. No WebGL needed — the main bundle is ~141 kB gzip.

Respects `prefers-reduced-motion` (portrait prints instantly, no smooth scroll, logs shown in full).

## Run it

```bash
npm install
npm run dev       # local dev server
npm run build     # type-check + production build → dist/
npm run shots     # refresh project screenshots (Playwright)
```

## Edit content

All copy lives in [`src/data/content.ts`](src/data/content.ts). Swap `public/portrait.jpg` for a new photo (square, plain light background works best).
