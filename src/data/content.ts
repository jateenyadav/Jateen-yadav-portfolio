// All site copy lives here — edit this file to update the portfolio.
// Everything below is taken from Jateen's CV and public GitHub repos.

export const profile = {
  name: 'Jateen Yadav',
  firstName: 'Jateen',
  lastName: 'Yadav',
  roles: ['Full Stack', 'Flutter', 'AI / LLM'],
  location: 'Gurugram, India',
  timezone: 'Asia/Kolkata',
  email: 'jateen.yadav1@gmail.com',
  resume: '/Jateen_Yadav_Resume.pdf',
  status: 'Open to new roles',
  socials: [
    { label: 'GitHub', href: 'https://github.com/jateenyadav' },
    // NOTE: the CV says /in/jateen-yadav, the old site used /in/jateen-yadav-9012a9213 — keep whichever is correct.
    { label: 'LinkedIn', href: 'https://linkedin.com/in/jateen-yadav' },
    { label: 'Instagram', href: 'https://instagram.com/jateen_yadav' },
  ],
}

export const hero = {
  kicker: 'Portfolio — 2026',
  lineA: 'I build products',
  lineB: 'for every screen',
  lineC: 'and teach them to think.',
  intro:
    'Full-stack engineer at Hitachi with 3+ years shipping real-time dashboards, Flutter & Electron apps, and AI features on AWS Bedrock + MCP.',
}

export const statement =
  'I work in the hard middle — where a React dashboard, a Flutter app, an Electron client and an AI assistant all have to share one architecture, one backend and one source of truth. I ship it, measure it, and make it fast.'

export const stats = [
  { value: 3, suffix: '+', label: 'Years shipping production software' },
  { value: 4, suffix: '+', label: 'Full-stack apps built end to end' },
  { value: 4, suffix: '+', label: 'Flutter apps on Play Console & TestFlight' },
  { value: 3, suffix: '', label: 'Platforms from one shared architecture' },
]

export const marqueeA = ['React', 'TypeScript', 'Next.js', 'Node.js', 'Flutter', 'Three.js', 'WebGL', 'Electron', 'Kotlin', 'MongoDB']
export const marqueeB = ['AWS Bedrock', 'MCP', 'RAG', 'Ollama', 'OpenAI', 'Gemini', 'LangChain', 'Prisma', 'Docker', 'Redux']

export const capabilities = [
  {
    title: 'Web',
    tagline: 'Real-time dashboards & product frontends',
    detail:
      'React, Next.js, TypeScript, Redux / Zustand. Live machine data for overseas clients, lazy-loaded and Webpack-tuned for speed.',
  },
  {
    title: 'Mobile',
    tagline: 'Flutter apps that actually ship',
    detail:
      'Flutter + Dart for Android & iOS, native Kotlin services where it matters. Released through Google Play Console and TestFlight.',
  },
  {
    title: 'Desktop',
    tagline: 'One architecture, three platforms',
    detail:
      'Electron desktop clients built from the same shared architecture as the Flutter mobile apps — less duplicated logic, faster releases.',
  },
  {
    title: 'AI / LLM',
    tagline: 'Features you can talk to',
    detail:
      'AWS Bedrock pipelines, MCP servers so AI assistants can drive product features, RAG with source references, local-first Ollama.',
  },
  {
    title: '3D / WebGL',
    tagline: 'Interfaces with depth',
    detail:
      'Three.js and WebGL product visualisations for client demos — the particle field behind this page is one of them.',
  },
]

export type Project = {
  id: string
  index: string
  title: string
  kind: string
  status: string
  summary: string
  points: string[]
  stack: string[]
  image?: string
  visual?: 'phone'
  links: { label: string; href: string }[]
  accent: string
}

export const projects: Project[] = [
  {
    id: 'lifeos',
    index: '01',
    title: 'LifeOS',
    kind: 'Cross-platform personal AI',
    status: 'Google Play — closed testing',
    summary:
      'One app for your whole life — notes, reminders, workouts, routines and expenses — on web, Android and iOS, with an AI assistant that reads your own data.',
    points: [
      'React web + shared Flutter app on one backend',
      'Local-first AI (Ollama) with optional OpenAI / Bedrock; RAG answers cite their sources',
      'Kotlin service turns INR payment notifications into expenses — encrypted queue, retries, dedupe',
      'bcrypt, hashed session tokens, rate limits, integer-paise money storage, tests on every layer',
    ],
    stack: ['React', 'Flutter', 'Kotlin', 'Node.js', 'MongoDB', 'Ollama', 'Bedrock'],
    visual: 'phone',
    links: [{ label: 'Code', href: 'https://github.com/jateenyadav/Me-Assistant' }],
    accent: '#c5f03c',
  },
  {
    id: 'examace',
    index: '02',
    title: 'ExamAce',
    kind: 'AI exam practice platform',
    status: 'Live',
    summary:
      'AI-generated CBSE & JEE practice papers, camera-based evaluation of handwritten answers, a timed anti-cheating exam mode and performance analytics.',
    points: [
      'Gemini for generation with automatic OpenRouter fallback',
      'Photograph a handwritten answer → AI grades it',
      'Anti-cheat timed mode + per-topic analytics',
    ],
    stack: ['Next.js 14', 'TypeScript', 'Prisma', 'Zustand', 'Gemini', 'Vercel'],
    image: '/shots/examace.jpg',
    links: [
      { label: 'Live', href: 'https://exam-ai-tau-bay.vercel.app' },
      { label: 'Code', href: 'https://github.com/jateenyadav/Exam-AI' },
    ],
    accent: '#7aa2ff',
  },
  {
    id: 'solar',
    index: '03',
    title: 'Solar System',
    kind: 'Interactive 3D in the browser',
    status: 'Live',
    summary:
      'A real-time Three.js solar system with orbiting planets, lighting and camera controls — WebGL that runs smoothly in any browser.',
    points: ['Three.js scene graph & orbital animation', 'Textured planets, lighting, orbit controls'],
    stack: ['Three.js', 'WebGL', 'JavaScript'],
    image: '/shots/solar.jpg',
    links: [
      { label: 'Live', href: 'https://3d-solar-galaxy.netlify.app' },
      { label: 'Code', href: 'https://github.com/jateenyadav/3d-solar-system' },
    ],
    accent: '#ffb347',
  },
  {
    id: 'client',
    index: '04',
    title: 'Client Portfolio',
    kind: 'Freelance — marketing site',
    status: 'Live',
    summary:
      'An animated single-page portfolio designed and built end to end for a Dubai-based marketing executive — two themes, typographic hero, motion throughout.',
    points: ['Designed + developed for a real client', 'Dark / light themes with persisted preference'],
    stack: ['HTML', 'CSS', 'JavaScript', 'Motion'],
    image: '/shots/client.jpg',
    links: [
      { label: 'Live', href: 'https://jateenyadav.github.io/client-portfolio/' },
      { label: 'Code', href: 'https://github.com/jateenyadav/client-portfolio' },
    ],
    accent: '#ff6fb5',
  },
  {
    id: 'card',
    index: '05',
    title: 'Digital Card',
    kind: 'Installable PWA',
    status: 'Live',
    summary:
      'An offline-first digital business card you install to your home screen — Three.js particle background, QR connect and one-tap save-contact.',
    points: ['Service worker caches the full app shell, incl. bundled Three.js', 'Installable on Android & iOS'],
    stack: ['PWA', 'Three.js', 'Service Worker'],
    image: '/shots/card.jpg',
    links: [
      { label: 'Live', href: 'https://jateenyadav.github.io/digital-card/' },
      { label: 'Code', href: 'https://github.com/jateenyadav/digital-card' },
    ],
    accent: '#ff5a4e',
  },
]

export const archive = [
  { title: 'CryptoChecker', note: 'Real-time crypto prices', href: 'https://crypchecker.netlify.app' },
  { title: 'Community4You', note: 'Find communities + messaging', href: 'https://community4you.netlify.app' },
  { title: 'Find My Meal', note: 'Recipe search by ingredient', href: 'https://find-my-meal.netlify.app' },
  { title: 'Note-Vase', note: 'Minimal vanilla-JS notes', href: 'https://github.com/jateenyadav/Note-Vase' },
]

export const experience = [
  {
    role: 'Full Stack Developer',
    sub: 'Junior Research Engineer',
    company: 'Hitachi India Pvt. Ltd. (via Randstad)',
    period: 'Sep 2023 — Present',
    points: [
      'Real-time enterprise dashboards (React, Node.js, MongoDB) serving overseas clients with live machine data and analytics',
      'Electron desktop + Flutter mobile apps from one shared architecture',
      'Three.js / WebGL 3D product visualisations that cut manual demo effort',
      'AI/LLM pipelines on AWS Bedrock; backend services exposed to AI assistants via MCP',
      'Production releases with global stakeholders, including teams in Japan',
    ],
  },
  {
    role: 'Software Engineering Intern',
    sub: 'Converted to full-time',
    company: 'Hitachi India Pvt. Ltd.',
    period: 'Feb 2023 — May 2023',
    points: ['React dashboard for factory operators: real-time machine states + production simulations on an assembly line'],
  },
  {
    role: 'Frontend Engineering Intern',
    sub: '',
    company: 'Acadlift.com',
    period: 'Jun 2022 — Jul 2022',
    points: ['Reusable React component library'],
  },
  {
    role: 'Frontend & Analytics Intern',
    sub: '',
    company: 'GoPerspective Technologies',
    period: 'Sep 2021 — Oct 2021',
    points: ['ML dashboards with Python'],
  },
  {
    role: 'Design Intern',
    sub: '',
    company: 'iSchoolConnect Technologies',
    period: 'Apr 2021 — May 2021',
    points: ['UI layout and logos for an event portal'],
  },
]
