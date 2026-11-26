// All site copy lives here — every theme reads from this file, so edit once and all themes update.
// Everything below is taken from Jateen's CV and public GitHub repos.

export const profile = {
  name: 'Jateen Yadav',
  firstName: 'Jateen',
  lastName: 'Yadav',
  model: 'JY-2026',
  roles: ['Full Stack', 'Flutter', 'AI / LLM'],
  location: 'Gurugram, India',
  timezone: 'Asia/Kolkata',
  email: 'jateenyadav.dev@gmail.com',
  resume: '/Jateen_Yadav_Resume.pdf',
  portrait: '/portrait.jpg',
  status: 'Available for new roles',
  socials: [
    { label: 'GitHub', href: 'https://github.com/jateenyadav' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/jateen-yadav' },
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
  'LifeOS — live on web, Android in closed testing',
  'ExamAce — live on Vercel',
  'TinyLM — a language model trained from scratch',
  '3+ yrs in production at Hitachi',
  '7 open-source GenAI apps — RAG · agents · text-to-SQL',
  'AWS Bedrock · MCP · RAG',
  'Flutter · React · Electron — one architecture',
  'Open to new roles — 2026',
]

export const statement =
  'I work in the hard middle — where a React dashboard, a Flutter app, an Electron client and an AI assistant all share one architecture, one backend and one source of truth.'

export const spec: [string, string][] = [
  ['Operator', 'Jateen Yadav'],
  ['Function', 'Full Stack · Flutter · Generative AI'],
  ['In service', 'Since 2023 — Hitachi India'],
  ['Platforms', 'Web · Android · iOS · Desktop'],
  ['AI stack', 'AWS Bedrock · MCP · RAG · Agents'],
  ['Origin', 'Gurugram, India (IST)'],
  ['Works with', 'Teams in India, Japan & Europe'],
]

// `unit` sits beside every number so all four gauges read the same way; `max` scales the bar.
export const stats = [
  { value: 3, unit: 'yrs+', max: 5, label: 'Uptime in production' },
  { value: 15, unit: 'apps+', max: 20, label: 'Products shipped' },
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
    stack: 'AWS Bedrock · MCP · LangChain · RAG · Agents',
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
  /** Poster frame — also the fallback when the video can't play. */
  image?: string
  /** Real demo clip (silent, looping). */
  video?: string
  visual?: 'phone'
  links: { label: string; href: string }[]
}

export const projects: Project[] = [
  {
    id: 'lifeos',
    index: '01',
    title: 'LifeOS',
    kind: 'Cross-platform personal AI',
    status: 'Live on web — Android in closed testing',
    stamp: 'Live',
    summary:
      'One app for notes, workouts, routines and money — on web, Android and iOS — with an AI assistant that can act on your own data.',
    points: [
      'One Express + MongoDB API behind a React web app and a Flutter app',
      'Bank SMS & UPI alerts parsed on the phone, deduped by UTR — khata, splits, card dues',
      'LLM assistant with Groq → Gemini → OpenRouter fallback and tool calling',
      'bcrypt, hashed sessions, per-account rate limits, ~475 tests in CI',
    ],
    stack: ['React', 'Flutter', 'Kotlin', 'Node.js', 'MongoDB', 'Groq', 'Gemini'],
    image: '/media/lifeos.jpg',
    video: '/media/lifeos.mp4',
    links: [
      { label: 'Live', href: 'https://lifeos-jateen.netlify.app' },
      { label: 'Code', href: 'https://github.com/jateenyadav/lifeos-online' },
    ],
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
    points: [
      'Full papers generated section by section within serverless limits',
      'Photograph a handwritten answer → Gemini vision grades it',
      'Timed anti-cheat exam room, streamed AI tutor, spaced-repetition notebook',
      '85+ tests in CI',
    ],
    stack: ['Next.js 14', 'TypeScript', 'Prisma', 'MongoDB', 'Gemini', 'Groq'],
    image: '/media/examace.jpg',
    video: '/media/examace.mp4',
    links: [
      { label: 'Live', href: 'https://exam-ai-tau-bay.vercel.app' },
      { label: 'Code', href: 'https://github.com/jateenyadav/Exam-AI' },
    ],
  },
  {
    id: 'tinylm',
    index: '03',
    title: 'TinyLM',
    kind: 'A language model, trained from scratch',
    status: 'Live — runs in your browser',
    stamp: 'Live',
    summary:
      'A Llama-style language model I built end to end — own tokenizer, network and training loop — that writes short stories entirely in your browser. No server, no API key.',
    points: [
      'Byte-level BPE tokenizer + Llama-style network (RoPE, SwiGLU, RMSNorm)',
      '5.8M parameters, 68M tokens, 45 min on a laptop GPU — perplexity 5.93',
      'Exported to ONNX and 8-bit: a 7 MB model on transformers.js',
    ],
    stack: ['Python', 'PyTorch', 'Hugging Face', 'ONNX', 'transformers.js'],
    image: '/media/tinylm.jpg',
    video: '/media/tinylm.mp4',
    links: [
      { label: 'Live', href: 'https://tiny-lm-jateen.netlify.app' },
      { label: 'Code', href: 'https://github.com/jateenyadav/tiny-lm' },
    ],
  },
  {
    id: 'solar',
    index: '04',
    title: 'Solar System',
    kind: 'Interactive 3D in the browser',
    status: 'Live — Netlify',
    stamp: 'Live',
    summary: 'A real-time Three.js solar system with Indian space missions, orbiting planets, lighting and camera controls.',
    points: ['Three.js scene graph & orbital animation', 'Textured planets, labels, orbit controls'],
    stack: ['Three.js', 'WebGL', 'JavaScript'],
    image: '/media/solar.jpg',
    video: '/media/solar.mp4',
    links: [
      { label: 'Live', href: 'https://3d-solar-galaxy.netlify.app' },
      { label: 'Code', href: 'https://github.com/jateenyadav/3d-solar-system' },
    ],
  },
  {
    id: 'client',
    index: '05',
    title: 'Client Portfolio',
    kind: 'Freelance — marketing site',
    status: 'Live — delivered to client',
    stamp: 'Shipped',
    summary:
      'An animated single-page portfolio designed and built end to end for a Dubai-based marketing executive — two themes, typographic hero, motion throughout.',
    points: ['Designed + developed for a real client', 'Dark / light themes with persisted preference'],
    stack: ['HTML', 'CSS', 'JavaScript'],
    image: '/media/client.jpg',
    video: '/media/client.mp4',
    links: [
      { label: 'Live', href: 'https://jateenyadav.github.io/client-portfolio/' },
      { label: 'Code', href: 'https://github.com/jateenyadav/client-portfolio' },
    ],
  },
]

export const archive = [
  { title: 'AskDB', note: 'Plain English → SQL on in-browser Postgres', href: 'https://github.com/jateenyadav/ask-db' },
  { title: 'GraphMind', note: 'Knowledge-graph RAG over your documents', href: 'https://github.com/jateenyadav/graph-mind' },
  { title: 'TaskPilot', note: 'Desktop AI browser agent (Electron)', href: 'https://task-pilot-jateen.netlify.app' },
  { title: 'MinuteMate', note: 'Whisper meeting minutes + Q&A', href: 'https://github.com/jateenyadav/minute-mate' },
  { title: 'ReceiptLens', note: 'AI receipt reader + bill split', href: 'https://github.com/jateenyadav/receipt-lens' },
  { title: 'Mentora', note: 'AI tutor that remembers you', href: 'https://github.com/jateenyadav/mentora' },
  { title: 'Mohalla', note: 'Generative-agents neighbourhood', href: 'https://github.com/jateenyadav/mohalla' },
  { title: 'CryptoChecker', note: 'Real-time crypto prices', href: 'https://crypchecker.netlify.app' },
]

export const experience = [
  {
    when: '2023-09 → NOW',
    state: 'RUNNING',
    role: 'Full Stack Developer (Junior Research Engineer)',
    company: 'Hitachi India Pvt. Ltd. (via Randstad)',
    points: [
      'Real-time enterprise dashboards (React, Redux, Node.js, MongoDB, WebSockets) streaming live machine data to overseas clients',
      'Electron desktop + Flutter mobile apps on one shared architecture — each fix ships once',
      'GenAI on AWS Bedrock (LangChain, RAG); backend services exposed to AI assistants via MCP',
      'Three.js / WebGL 3D product demos; AWS deploys (EC2, S3); code splitting + Webpack tuning',
      'Production releases with teams in Japan and Europe',
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
    points: ['Meta Front-End Developer certificate · Mozilla JavaScript Foundations certificate'],
  },
]
