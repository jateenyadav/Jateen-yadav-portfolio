# Jateen Yadav — Portfolio v2

Personal portfolio of **Jateen Yadav**, Full Stack · Flutter · AI/LLM engineer.
Live: [jateenyadav.netlify.app](https://jateenyadav.netlify.app)

## What's inside

| Piece | How it works |
|---|---|
| **Morphing particle field** | ~16k GPU particles (Three.js + custom GLSL). Each particle stores four target shapes — sphere, torus knot, DNA helix, wave terrain — and the vertex shader blends between them with a per-particle stagger as you scroll. Cursor repulsion happens in world space. |
| **Smooth scroll + scroll choreography** | Lenis driven by GSAP's ticker, so ScrollTrigger and the scroll share one clock. Pinned horizontal project gallery, scrubbed word-by-word statement, timeline rail fill. |
| **Kinetic type** | GSAP SplitText with line masks for the hero, headings and contact. |
| **Micro-interactions** | Magnetic buttons, blend-mode cursor with contextual labels, text-roll links, accent-flood capability rows. |
| **Performance** | Three.js is lazy-loaded after first paint (main bundle ≈130 kB gzip), DPR capped at 1.75, fewer particles on small or low-core devices, render loop pauses in hidden tabs. |
| **Accessibility** | Respects `prefers-reduced-motion` (no smooth scroll, static field, content shown immediately), semantic landmarks, visible focus rings, keyboard-operable capability list. |

## Stack

React 19 · TypeScript · Vite · Three.js · GSAP (ScrollTrigger, SplitText) · Lenis

## Run it

```bash
npm install
npm run dev       # local dev server
npm run build     # type-check + production build → dist/
npm run shots     # refresh project screenshots (Playwright)
```

## Edit content

All copy — projects, experience, stats, links — lives in [`src/data/content.ts`](src/data/content.ts).

## Deploy

`netlify.toml` builds with `npm run build` and publishes `dist/` on Node 22.
