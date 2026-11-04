// All site copy lives here — edit this file to update the portfolio.
// Everything below is taken from Jateen's CV and public GitHub repos.

export const profile = {
  name: 'Jateen Yadav',
  firstName: 'Jateen',
  lastName: 'Yadav',
  model: 'JY-2026',
  roles: ['Full Stack', 'Flutter', 'AI / LLM'],
  location: 'Gurugram, India',
  timezone: 'Asia/Kolkata',
  email: 'jateen.yadav1@gmail.com',
  resume: '/Jateen_Yadav_Resume.pdf',
  portrait: '/portrait.jpg',
  status: 'Available for new roles',
  socials: [
    { label: 'GitHub', href: 'https://github.com/jateenyadav' },
    // NOTE: the CV says /in/jateen-yadav, the old site used /in/jateen-yadav-9012a9213 — keep whichever is correct.
    { label: 'LinkedIn', href: 'https://linkedin.com/in/jateen-yadav' },
    { label: 'Instagram', href: 'https://instagram.com/jateen_yadav' },
  ],
}

/** The assembly line — one station per section. */
export const stations = [
  { id: 'top', code: '00', name: 'Print' },
  { id: 'spec', code: '01', name: 'Spec' },
  { id: 'modules', code: '02', name: 'Modules' },
  { id: 'work', code: '03', name: 'Units' },
  { id: 'log', code: '04', name: 'Log' },
  { id: 'contact', code: '05', name: 'Dispatch' },
]

export const hero = {
  title: ['Jateen', 'Yadav'],
  line: 'Full-stack engineer. I assemble products for every screen — web, mobile, desktop — and wire them to AI.',
  note: 'that’s me — printed from my own code',
}

export const ticker = [
  'LifeOS — Google Play closed testing',
  'ExamAce — live on Vercel',
  '3+ yrs in production at Hitachi',
  'AWS Bedrock · MCP · RAG',
  'Flutter · React · Electron — one architecture',
  'Open to new roles — 2026',
]

export const statement =
  'I work in the hard middle — where a React dashboard, a Flutter app, an Electron client and an AI assistant all share one architecture, one backend and one source of truth.'

export const spec: [string, string][] = [
  ['Operator', 'Jateen Yadav'],
  ['Function', 'Full Stack · Flutter · AI / LLM'],
  ['In service', 'Since 2023 — Hitachi India'],
  ['Platforms', 'Web · Android · iOS · Desktop'],
  ['AI stack', 'AWS Bedrock · MCP · RAG · Ollama'],
  ['Origin', 'Gurugram, India (IST)'],
  ['Works with', 'Teams in India & Japan'],
]

// `unit` sits beside every number so all four gauges read the same way; `max` scales the bar.
export const stats = [
  { value: 3, unit: 'yrs+', max: 5, label: 'Uptime in production' },
  { value: 4, unit: 'apps+', max: 5, label: 'Full-stack units shipped' },
  { value: 4, unit: 'apps+', max: 5, label: 'Flutter on Play & TestFlight' },
  { value: 3, unit: 'OS', max: 5, label: 'Platforms from 1 architecture' },
]

export const modules = [
  {
    code: 'MOD-01',
    title: 'Web',
    tagline: 'Real-time dashboards & product frontends',
    stack: 'React · Next.js · TypeScript · Redux · Zustand',
    log: ['$ build dashboard --live machine-data', '✓ websockets → overseas client screens', '✓ lazy routes + webpack tuning → faster loads'],
  },
  {
    code: 'MOD-02',
    title: 'Mobile',
    tagline: 'Flutter apps that actually ship',
    stack: 'Flutter · Dart · Kotlin',
    log: ['$ flutter build appbundle --release', '✓ Google Play Console · Apple TestFlight', '✓ Kotlin service: payment notification → expense'],
  },
  {
    code: 'MOD-03',
    title: 'Desktop',
    tagline: 'One architecture, three platforms',
    stack: 'Electron · shared core',
    log: ['$ electron-builder --mac --win', '✓ same core as the Flutter mobile apps', '✓ fewer duplicate fixes, faster releases'],
  },
  {
    code: 'MOD-04',
    title: 'AI / LLM',
    tagline: 'Features you can talk to',
    stack: 'AWS Bedrock · MCP · LangChain · RAG · Ollama',
    log: ['> new ChatBedrockConverse({ temperature: 0.2, maxTokens: 800 })', '> mcp: token-scoped tools for AI assistants ✓', '> rag: answers cite their sources ✓'],
  },
  {
    code: 'MOD-05',
    title: '3D / WebGL',
    tagline: 'Interfaces with depth',
    stack: 'Three.js · WebGL',
    log: ['$ three --scene product-viz', '✓ interactive 3D demos for clients', '✓ less manual demo effort'],
  },
]

export type Project = {
  id: string
  index: string
  title: string
  kind: string
  status: string
  stamp: string
  summary: string
  points: string[]
  stack: string[]
  image?: string
  visual?: 'phone'
  links: { label: string; href: string }[]
}

export const projects: Project[] = [
  {
    id: 'lifeos',
    index: '01',
    title: 'LifeOS',
    kind: 'Cross-platform personal AI',
    status: 'In QA — Google Play closed testing',
    stamp: 'In QA',
    summary:
      'One app for your whole life — notes, reminders, workouts, routines and expenses — on web, Android and iOS, with an AI assistant that reads your own data.',
    points: [
      'React web + shared Flutter app on one backend',
      'Local-first AI (Ollama), optional OpenAI / Bedrock; RAG answers cite sources',
      'Kotlin: INR payment notifications → expenses (encrypted queue, retries, dedupe)',
      'bcrypt, hashed session tokens, rate limits, integer-paise money, tests on every layer',
    ],
    stack: ['React', 'Flutter', 'Kotlin', 'Node.js', 'MongoDB', 'Ollama', 'Bedrock'],
    visual: 'phone',
    links: [{ label: 'Code', href: 'https://github.com/jateenyadav/Me-Assistant' }],
  },
  {
    id: 'examace',
    index: '02',
    title: 'ExamAce',
    kind: 'AI exam practice platform',
    status: 'Live — Vercel',
    stamp: 'Live',
    summary:
      'AI-generated CBSE & JEE practice papers, camera-based grading of handwritten answers, a timed anti-cheating exam mode and performance analytics.',
    points: ['Gemini generation with automatic OpenRouter fallback', 'Photograph a handwritten answer → AI grades it', 'Anti-cheat timed mode + per-topic analytics'],
    stack: ['Next.js 14', 'TypeScript', 'Prisma', 'Zustand', 'Gemini'],
    image: '/shots/examace.jpg',
    links: [
      { label: 'Live', href: 'https://exam-ai-tau-bay.vercel.app' },
      { label: 'Code', href: 'https://github.com/jateenyadav/Exam-AI' },
    ],
  },
  {
    id: 'solar',
    index: '03',
    title: 'Solar System',
    kind: 'Interactive 3D in the browser',
    status: 'Live — Netlify',
    stamp: 'Live',
    summary: 'A real-time Three.js solar system with Indian space missions, orbiting planets, lighting and camera controls.',
    points: ['Three.js scene graph & orbital animation', 'Textured planets, labels, orbit controls'],
    stack: ['Three.js', 'WebGL', 'JavaScript'],
    image: '/shots/solar.jpg',
    links: [
      { label: 'Live', href: 'https://3d-solar-galaxy.netlify.app' },
      { label: 'Code', href: 'https://github.com/jateenyadav/3d-solar-system' },
    ],
  },
  {
    id: 'client',
    index: '04',
    title: 'Client Portfolio',
    kind: 'Freelance — marketing site',
    status: 'Live — delivered to client',
    stamp: 'Shipped',
    summary:
      'An animated single-page portfolio designed and built end to end for a Dubai-based marketing executive — two themes, typographic hero, motion throughout.',
    points: ['Designed + developed for a real client', 'Dark / light themes with persisted preference'],
    stack: ['HTML', 'CSS', 'JavaScript'],
    image: '/shots/client.jpg',
    links: [
      { label: 'Live', href: 'https://jateenyadav.github.io/client-portfolio/' },
      { label: 'Code', href: 'https://github.com/jateenyadav/client-portfolio' },
    ],
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
    when: '2023-09 → NOW',
    state: 'RUNNING',
    role: 'Full Stack Developer (Junior Research Engineer)',
    company: 'Hitachi India Pvt. Ltd. (via Randstad)',
    points: [
      'Real-time enterprise dashboards (React, Node.js, MongoDB) for overseas clients — live machine data, auth, analytics',
      'Electron desktop + Flutter mobile apps from one shared architecture',
      'Three.js / WebGL 3D product visualisations for client demos',
      'AI/LLM pipelines on AWS Bedrock; backend services exposed to AI assistants via MCP',
      'Production releases with global stakeholders, including teams in Japan',
    ],
  },
  {
    when: '2023-02 → 2023-05',
    state: 'PROMOTED',
    role: 'Software Engineering Intern',
    company: 'Hitachi India Pvt. Ltd.',
    points: ['React dashboard for factory operators: real-time machine states + production simulations on an assembly line', 'Converted to full-time within the year'],
  },
  {
    when: '2022-06 → 2022-07',
    state: 'DONE',
    role: 'Frontend Engineering Intern',
    company: 'Acadlift.com',
    points: ['Reusable React component library'],
  },
  {
    when: '2021-09 → 2021-10',
    state: 'DONE',
    role: 'Frontend & Analytics Intern',
    company: 'GoPerspective Technologies',
    points: ['ML dashboards with Python'],
  },
  {
    when: '2021-04 → 2021-05',
    state: 'DONE',
    role: 'Design Intern',
    company: 'iSchoolConnect Technologies',
    points: ['UI layout and logos for an event portal'],
  },
  {
    when: '2019 → 2023',
    state: 'BOOT',
    role: 'B.Tech, Computer Science & Engineering',
    company: 'Kurukshetra University (JMIT Radaur) · CGPA 8.43',
    points: ['Meta Front-End Developer certificate · Mozilla JavaScript Foundations'],
  },
]
