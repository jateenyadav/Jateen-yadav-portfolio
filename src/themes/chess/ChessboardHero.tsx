// Original chess-portfolio page — markup, classes and behaviour unchanged.
// Only the content is refreshed: links, résumé, featured projects and the latest
// role details come from src/data/content.ts so every skin stays up to date.
import { useState, useEffect, useRef, type CSSProperties, type ChangeEvent, type FormEvent } from 'react';
import { profile, projects as sharedProjects } from '../../data/content';

// Import certificate PDF
import calartsIICP from './assets/coursera-calarts.pdf';

// Import social media icons
import whatsappIcon from './assets/whatsapp.png';
import instagramIcon from './assets/instagram.png';
import linkedinIcon from './assets/linkedin.png';
import githubIcon from './assets/github.png';
import gmailIcon from './assets/gmail.png';
import phoneIcon from './assets/phone.png';

const social = (label: string) => profile.socials.find((s) => s.label === label)?.href ?? '#';

// Icons for the projects added since the original site (same style as the 3D Solar System icon).
const NEW_PROJECT_ICONS: Record<string, { icon: string; fallbackIcon: string }> = {
  lifeos: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='14' y='14' width='72' height='72' rx='20' fill='%23667eea'/><rect x='26' y='26' width='48' height='48' rx='12' fill='%23764ba2'/><circle cx='50' cy='50' r='12' fill='%23ffffff'/></svg>",
    fallbackIcon: '🧠',
  },
  examace: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='22' y='12' width='56' height='76' rx='8' fill='%23ffffff'/><rect x='32' y='30' width='36' height='6' rx='3' fill='%23667eea'/><rect x='32' y='46' width='28' height='6' rx='3' fill='%23764ba2'/><circle cx='66' cy='70' r='14' fill='%23667eea'/><path d='M59 70l5 5 9-10' stroke='%23ffffff' stroke-width='5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>",
    fallbackIcon: '📝',
  },
};

const ChessboardHero = () => {
  const [hoveredSquare, setHoveredSquare] = useState<{ row: number; col: number } | null>(null);
  const [boardSize, setBoardSize] = useState({ rows: 8, cols: 10 });
  const [smokingSquares, setSmokingSquares] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
    interests: [] as string[]
  });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const updateBoardSize = () => {
      const width = window.innerWidth;
      if (width < 300) {
        setBoardSize({ rows: 6, cols: 8 });
      } else if (width < 768) {
        setBoardSize({ rows: 7, cols: 9 });
      } else {
        setBoardSize({ rows: 8, cols: 10 });
      }
    };

    updateBoardSize();
    window.addEventListener('resize', updateBoardSize);
    return () => window.removeEventListener('resize', updateBoardSize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;

      if (scrollPosition > 200) {
        const newSmokingSquares = new Set<number>();
        const totalSquares = boardSize.rows * boardSize.cols;
        const progress = Math.min((scrollPosition - 200) / 800, 1);
        const squaresToSmoke = Math.floor(progress * totalSquares);
        
        for (let i = 0; i < squaresToSmoke; i++) {
          const randomSquare = Math.floor(Math.random() * totalSquares);
          newSmokingSquares.add(randomSquare);
        }
        setSmokingSquares(newSmokingSquares);
      }

      setShowScrollTop(scrollPosition > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [boardSize]);

  const getWebDevContent = (row: number, col: number) => {
    const webDevItems = [
      { type: 'code', content: 'const dashboard = () => {\n  return <ReactDashboard />;\n};' },
      { type: 'code', content: 'const flutter = new\n  FlutterApp();\nfirebase.init();' },
      { type: 'code', content: '.responsive {\n  display: flex;\n  justify-content: center;\n}' },
      { type: 'code', content: 'npm install react\nnpm install firebase\nnpm run build' },
      { type: 'code', content: 'git add .\ngit commit -m "dashboard"\ngit push origin main' },
      { type: 'code', content: 'const [data, setData] = \n  useState(null);\nuseEffect(() => {});' },
      { type: 'code', content: 'import { Chart } from "chart.js";\nimport { useFirebase } from "hooks";' },
      { type: 'code', content: 'export default function\n  DashboardComponent() {\n  return <></>;\n}' },
      
      { type: 'icon', content: '♔\nReact' },
      { type: 'icon', content: '♕\nFlutter' },
      { type: 'icon', content: '♖\nFirebase' },
      { type: 'icon', content: '♗\nCharts' },
      { type: 'icon', content: '♘\nDesign' },
      { type: 'icon', content: '♙\nFast' },
      { type: 'icon', content: '♚\nRedux' },
      { type: 'icon', content: '♛\nAPI' },
      { type: 'icon', content: '♜\nAuth' },
      { type: 'icon', content: '♝\nData' },
      { type: 'icon', content: '♞\nCloud' },
      { type: 'icon', content: '♟\nGit' },
      
      { type: 'tech', content: 'HTML5\nCSS3\nJS' },
      { type: 'tech', content: 'React\nRedux\nHooks' },
      { type: 'tech', content: 'Flutter\nDart\nFirebase' },
      { type: 'tech', content: 'Chart.js\nPlotly\nFusion' },
      { type: 'tech', content: 'Bootstrap\nTailwind\nCSS' },
      { type: 'tech', content: 'Adobe\nPhotoshop\nXD' },
      { type: 'tech', content: 'Three.js\nCordova\nMobile' },
      { type: 'tech', content: 'Material UI\nGoogle Maps\nAPIs' }
    ];

    return webDevItems[(row * boardSize.cols + col) % webDevItems.length];
  };

  const isNearby = (targetRow: number, targetCol: number, currentRow: number, currentCol: number) => {
    const distance = Math.abs(targetRow - currentRow) + Math.abs(targetCol - currentCol);
    return distance <= 2 && distance > 0;
  };

  const getSquareStyle = (row: number, col: number, index: number): CSSProperties => {
    const baseStyle: CSSProperties = {};
    
    if (smokingSquares.has(index)) {
      const experienceSection = document.querySelector('.experience-section');
      const experienceRect = experienceSection?.getBoundingClientRect();
      const squareElement = document.querySelector(`[data-square="${index}"]`);
      
      if (experienceRect && squareElement) {
        const squareRect = squareElement.getBoundingClientRect();
        const targetX = experienceRect.left + experienceRect.width / 2 - squareRect.left;
        const targetY = experienceRect.top - squareRect.top;
        
        baseStyle.transform = `translate(${targetX}px, ${targetY}px) scale(0.1) rotate(${Math.random() * 360}deg)`;
        baseStyle.opacity = 0;
        baseStyle.transition = 'all 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        baseStyle.filter = 'blur(2px)';
      }
    }

    if (!hoveredSquare) return baseStyle;

    const isHovered = hoveredSquare.row === row && hoveredSquare.col === col;
    const isNear = isNearby(hoveredSquare.row, hoveredSquare.col, row, col);

    if (isHovered) {
      return {
        ...baseStyle,
        transform: `${baseStyle.transform || ''} translateZ(120px) rotateX(-30deg) rotateY(10deg) scale(1.15)`,
        boxShadow: '0 60px 120px rgba(0, 0, 0, 0.8), 0 0 0 4px rgba(255, 255, 255, 0.3)',
        zIndex: 100,
        filter: 'brightness(1.5) contrast(1.2)',
      };
    } else if (isNear && !smokingSquares.has(index)) {
      const distance = Math.abs(hoveredSquare.row - row) + Math.abs(hoveredSquare.col - col);
      const lift = Math.max(0, 60 - distance * 15);
      const tilt = Math.max(0, 15 - distance * 5);
      return {
        ...baseStyle,
        transform: `${baseStyle.transform || ''} translateZ(${lift}px) rotateX(-${tilt}deg) scale(${1 + lift * 0.002})`,
        boxShadow: `0 ${lift}px 60px rgba(0, 0, 0, 0.4)`,
        filter: `brightness(${1 + lift * 0.01})`,
      };
    }

    return baseStyle;
  };

  const getSquareOpacity = (col: number) => {
    const progress = col / (boardSize.cols - 1);
    return 0.7 + (progress * 0.3);
  };

  const openProject = (projectUrl: string) => {
    window.open(projectUrl, '_blank');
  };

  const openCertificate = (certType: string) => {
    const certificates: Record<string, string> = {
      mozilla: 'https://www.linkedin.com/learning/certificates/ed07f5881e001408df49b75d6a828f1921965cb8a46026615d95ac2c969d8d00?trk=share_certificate',
      meta: 'https://coursera.org/verify/MHQZHFTWRVUS',
      javascript1: 'https://www.linkedin.com/learning/certificates/02c538610dc21ae580401e59c769b3719f043747cb52918ad5adc1a42bfacd6e?trk=share_certificate',
      javascript2: 'https://www.linkedin.com/learning/certificates/88c1fb84bb52812453329b7cee45660efd09cd5da6de1251d121b5a11b0b22bc?trk=share_certificate',
      codepad: 'https://www.linkedin.com/learning/certificates/02c538610dc21ae580401e59c769b3719f043747cb52918ad5adc1a42bfacd6e?trk=share_certificate',
      calarts: 'https://www.coursera.org/account/accomplishments/verify/ERMSKZ7QF3EV'
    };

    if (certificates[certType] === 'pdf') {
      window.open(calartsIICP, '_blank');
    } else if (certificates[certType]) {
      window.open(certificates[certType], '_blank');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInterestChange = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Create email content
    const emailContent = `
      Name: ${formData.name}
      Email: ${formData.email}
      Company: ${formData.company}
      Message: ${formData.message}
      Interests: ${formData.interests.join(', ')}
    `;

    // Using mailto for now - you can replace this with your preferred email service
    const mailtoLink = `mailto:${profile.email}?subject=Portfolio Contact from ${formData.name}&body=${encodeURIComponent(emailContent)}`;
    window.location.href = mailtoLink;

    // Reset form
    setFormData({
      name: '',
      email: '',
      company: '',
      message: '',
      interests: []
    });
  };

  const projects = [
    // Newest work first, straight from the shared content file
    ...sharedProjects
      .filter((p) => p.id in NEW_PROJECT_ICONS)
      .map((p) => ({
        title: p.title,
        ...NEW_PROJECT_ICONS[p.id],
        description: p.summary,
        url: p.links.find((l) => l.label === 'Live')?.href ?? p.links[0].href,
        technologies: p.stack,
      })),
    {
      title: "3D Solar System",
      icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='35' fill='%23FFD700'/><circle cx='50' cy='50' r='25' fill='%23FFA500'/><circle cx='50' cy='50' r='15' fill='%23FF8C00'/></svg>",
      fallbackIcon: "🪐",
      description: "Interactive 3D solar system built with Three.js, featuring realistic planetary movements and stunning visual effects.",
      url: "https://3d-solar-galaxy.netlify.app/",
      technologies: ["Three.js", "JavaScript", "WebGL", "CSS3"],
    },
    {
      title: "Crypto Dashboard",
      icon: "https://crypchecker.netlify.app/coin.svg",
      fallbackIcon: "📈",
      description: "Crypto dashboard featuring real-time data collection and visualization, API integration, and dynamic updates using React.",
      url: "https://crypchecker.netlify.app/",
      technologies: ["React", "JavaScript", "API Integration"],
    },
    {
      title: "Community Platform",
      icon: "https://community4you.netlify.app/community.png",
      fallbackIcon: "💬",
      description: "Coder community platform connecting users with shared interests and real-time messaging features.",
      url: "https://community4you.netlify.app/",
      technologies: ["React", "Firebase", "CSS3", "JavaScript"],
    },
    {
      title: "Find a Meal by Ingredients",
      icon: "https://find-my-meal.netlify.app/burger.png",
      fallbackIcon: "🍳",
      description: "Full-stack recipe explorer powered by TheMealDB. Search by name or ingredient, save favorites via a REST API, scale servings, and switch dark mode.",
      url: "https://find-my-meal.netlify.app/",
      technologies: ["Vanilla JS", "Express", "Node.js", "TheMealDB API"],
    }
  ];

  return (
    <div className="portfolio-container">
      {/* Hero Section */}
      <div id="home" className="chessboard-hero" ref={heroRef}>
        <div className="chessboard-container">
          <div 
            className="chessboard"
            style={{
              gridTemplateRows: `repeat(${boardSize.rows}, 1fr)`,
              gridTemplateColumns: `repeat(${boardSize.cols}, 1fr)`
            }}
          >
            {Array.from({ length: boardSize.rows }, (_, row) =>
              Array.from({ length: boardSize.cols }, (_, col) => {
                const index = row * boardSize.cols + col;
                const isLight = (row + col) % 2 === 0;
                const opacity = getSquareOpacity(col);
                const content = getWebDevContent(row, col);
                
                return (
                  <div
                    key={`${row}-${col}`}
                    data-square={index}
                    className={`chess-square ${isLight ? 'light' : 'dark'} ${content.type} ${smokingSquares.has(index) ? 'smoking' : ''}`}
                    style={{
                      ...getSquareStyle(row, col, index),
                      opacity: smokingSquares.has(index) ? 0 : opacity,
                    }}
                    onMouseEnter={() => setHoveredSquare({ row, col })}
                    onMouseLeave={() => setHoveredSquare(null)}
                  >
                    <div className="square-content">
                      {content.content}
                    </div>
                    <div className="square-overlay"></div>
                    
                    {smokingSquares.has(index) && (
                      <div className="smoke-particles">
                        {Array.from({length: 5}, (_, i) => (
                          <div key={i} className="smoke-particle" style={{
                            animationDelay: `${i * 0.1}s`
                          }}></div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="hero-content">
            <div className="chess-name-container">
              <h1 className="chess-hero-name">
                <span className="chess-piece white-king">♔</span>
                <span className="name-text">JATEEN YADAV</span>
                <span className="chess-piece black-king">♔</span>
              </h1>
              <div className="chess-subtitle">
                <span className="chess-rank">Full Stack Developer | MERN, Cross-Platform &amp; AI Apps</span>
              </div>
            </div>
          </div>  
        </div>
      </div>

      {/* About Me Section */}
      <div id="about" className="chess-section about-section">
        <div className="section-container">
          <div className="section-header">
            <div className="chess-icon">♚</div>
            <h2 className="section-title">About Me</h2>
          </div>
          
          <div className="about-content">
            <div className="about-card">
              <div className="about-text">
                <p>
                  I'm a <strong>Full Stack Developer</strong> with around 3 years of professional experience
                  building React.js and Node.js applications for enterprise clients. Currently working as a
                  <strong> Full Stack Developer (Junior Research Engineer) at Hitachi India</strong>, where I
                  ship production dashboards, real-time data systems, and cross-platform apps across web,
                  mobile, and desktop.
                </p>
                <p>
                  My core stack is the <strong>MERN ecosystem (MongoDB, Express, React, Node)</strong> alongside
                  Next.js, TypeScript, and Flutter, and I build AI features with <strong>AWS Bedrock, MCP and RAG</strong>.
                  I focus on REST/GraphQL API development, performance
                  optimization, and unit testing with Jest &amp; React Testing Library — turning
                  complex business requirements into fast, reliable, production-grade software.
                </p>
                <p>
                  I've worked on real-time industrial dashboards handling 10,000+ concurrent data points
                  and cut UI response times by 35% through Redux refactors. I care about measurable impact
                  and shipping clean, maintainable code.
                </p>
              </div>
              <div className="about-stats">
                <div className="stat-item">
                  <span className="stat-number">3+</span>
                  <span className="stat-label">Years Experience</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">4+</span>
                  <span className="stat-label">Enterprise Dashboards</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">10k+</span>
                  <span className="stat-label">Concurrent Data Points</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">5</span>
                  <span className="stat-label">Internships</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Work Experience Section */}
      <div id="experience" className="chess-section experience-section" ref={experienceRef}>
        <div className="section-container">
          <div className="section-header">
            <div className="chess-icon">♕</div>
            <h2 className="section-title">Work Experience</h2>
          </div>
          
          <div className="content-grid">
            <div className="content-card">
              <div className="card-header">
                <h3>Full Stack Developer (Junior Research Engineer)</h3>
                <span className="company">Hitachi India Pvt. Ltd. (via Randstad)</span>
                <span className="duration">Sep 2023 – Present</span>
              </div>
              <div className="card-content">
                <h4>Full Stack &amp; Web</h4>
                <p>Architected and shipped 4+ full-stack dashboards in React.js and Node.js/Express.js for 3 enterprise clients, loading real-time industrial data in under 2 seconds. Built MERN applications handling 10,000+ concurrent data points; a Redux state refactor cut redundant API calls and improved UI response time by 35%.</p>
                <h4>Mobile &amp; Desktop</h4>
                <p>Built Flutter/Dart mobile apps consuming REST APIs with pixel-exact designs across Android and iOS, and packaged React projects as Android APKs via Apache Cordova. Developed 2 Electron desktop apps (Windows + macOS) with automated build scripts that reduced manual build-to-deploy time by 50%.</p>
                <h4>Backend &amp; Data</h4>
                <p>Built Node.js/Express.js services with MongoDB, Firebase Auth, and real-time Firestore sync, maintaining 99%+ data consistency across concurrent client sessions.</p>
                <h4>AI &amp; 3D</h4>
                <p>Built AI/LLM pipelines on AWS Bedrock and exposed backend services to AI assistants through MCP. Created Three.js/WebGL 3D product visualisations for client demos, and shipped production releases with global stakeholders, including teams in Japan and Europe.</p>
                <div className="skills-used">
                  <span className="skill-tag">React.js</span>
                  <span className="skill-tag">Node.js</span>
                  <span className="skill-tag">Express.js</span>
                  <span className="skill-tag">MongoDB</span>
                  <span className="skill-tag">Redux</span>
                  <span className="skill-tag">Flutter</span>
                  <span className="skill-tag">Electron</span>
                  <span className="skill-tag">Firebase</span>
                  <span className="skill-tag">Cordova</span>
                  <span className="skill-tag">AWS Bedrock</span>
                  <span className="skill-tag">MCP</span>
                  <span className="skill-tag">Three.js</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Internships Section */}
      <div className="chess-section internships-section">
        <div className="section-container">
          <div className="section-header">
            <div className="chess-icon">♗</div>
            <h2 className="section-title">Professional Internships</h2>
          </div>
          
          <div className="content-grid">
            <div className="content-card">
              <div className="card-header">
                <h3>Software Engineering Intern</h3>
                <span className="company">Hitachi India Pvt. Ltd.</span>
                <span className="duration">Feb 2023 – May 2023</span>
              </div>
              <div className="card-content">
                <p>Built a real-time machine monitoring dashboard (React.js + Redux) tracking 5+ production lines, removing manual data entry and cutting reporting delays by 40%. Rewrote Redux state logic and batched API calls, combined with Chart.js/Plotly.js rendering improvements, dropping dashboard load time by 30%.</p>
                <div className="skills-used">
                  <span className="skill-tag">React.js</span>
                  <span className="skill-tag">Redux</span>
                  <span className="skill-tag">Chart.js</span>
                  <span className="skill-tag">Plotly.js</span>
                  <span className="skill-tag">JavaScript</span>
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h3>Frontend Engineering Intern</h3>
                <span className="company">Acadlift.com (Igni eCommerce Pvt. Ltd.)</span>
                <span className="duration">Jun 2022 – Jul 2022</span>
              </div>
              <div className="card-content">
                <p>Built a React.js component library of 15+ components with REST API hooks, cutting code duplication by 40% across 3 parallel development streams. Shipped 4 frontend modules across agile sprints in a team of 6; standardized components cut release time by 20% per cycle.</p>
                <div className="skills-used">
                  <span className="skill-tag">React.js</span>
                  <span className="skill-tag">REST APIs</span>
                  <span className="skill-tag">JavaScript</span>
                  <span className="skill-tag">Agile</span>
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h3>Frontend Development &amp; Analytics Intern</h3>
                <span className="company">GoPerspective Technologies LLP</span>
                <span className="duration">Sep 2021 – Oct 2021</span>
              </div>
              <div className="card-content">
                <p>Built analytics dashboards that pulled ML model outputs via REST APIs, saving 3 stakeholder teams 50% of their weekly manual reporting time. Cleaned 50,000+ row datasets in Python and designed UI prototypes that let non-technical users read model results without assistance.</p>
                <div className="skills-used">
                  <span className="skill-tag">Python</span>
                  <span className="skill-tag">REST APIs</span>
                  <span className="skill-tag">Data Visualization</span>
                  <span className="skill-tag">UI Prototyping</span>
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h3>Design &amp; Analytics Intern</h3>
                <span className="company">iSchoolConnect Technologies Pvt. Ltd.</span>
                <span className="duration">Apr 2021 – May 2021</span>
              </div>
              <div className="card-content">
                <p>Designed UI layouts for 5+ event portals, standardizing component structure and cutting design revision rounds per release from 4 to 2. Produced 20+ assets (banners, social graphics, landing graphics) for 3 product launches across digital channels.</p>
                <div className="skills-used">
                  <span className="skill-tag">UI Design</span>
                  <span className="skill-tag">Adobe Creative Suite</span>
                  <span className="skill-tag">Branding</span>
                  <span className="skill-tag">Visual Design</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects & Skills Section */}
      <div id="projects" className="chess-section skills-section">
        <div className="section-container">
          <div className="section-header">
            <div className="chess-icon">♖</div>
            <h2 className="section-title">Projects</h2>
          </div>
          
          {/* Projects Grid */}
          <div className="projects-container">
            <div className="projects-grid">
              {projects.map((project, index) => (
                <div key={index} className="project-card" onClick={() => openProject(project.url)}>
                  <div className="project-header">
                    <div className="project-icon">
                      <img
                        src={project.icon}
                        alt={`${project.title} icon`}
                        className="project-favicon"
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.style.display = 'none';
                          const fallback = img.nextSibling as HTMLElement | null;
                          if (fallback) {
                            fallback.style.display = 'inline';
                          }
                        }}
                      />
                      <span className="project-favicon-fallback" style={{ display: 'none' }}>
                        {project.fallbackIcon}
                      </span>
                    </div>
                    <h3>{project.title}</h3>
                  </div>
                  <div className="project-content">
                    <p>{project.description}</p>
                    <div className="project-technologies">
                      {project.technologies.map((tech, i) => (
                        <span key={i} className="tech-tag">{tech}</span>
                      ))}
                    </div>
                    <div className="project-link">
                      <span>Click to View Project</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Section Below Projects */}
          <div className="section-header skills-header">
            <div className="chess-icon">♘</div>
            <h2 className="section-title">Technical Skills</h2>
          </div>
          
          <div className="skills-container">
            <div className="skill-category">
              <h3>Frontend</h3>
              <div className="skill-items">
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="React.js" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">React.js</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '95%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" alt="Next.js" style={{width: '20px', height: '20px', filter: 'invert(1)'}} /></span>
                    <span className="skill-name">Next.js</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '85%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" alt="TypeScript" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">TypeScript</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '85%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="JavaScript" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">JavaScript (ES6+)</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '95%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redux/redux-original.svg" alt="Redux" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Redux</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '90%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" alt="Tailwind CSS" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Tailwind CSS</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '90%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="skill-category">
              <h3>Backend &amp; Database</h3>
              <div className="skill-items">
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" alt="Node.js" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Node.js</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '90%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" alt="Express.js" style={{width: '20px', height: '20px', filter: 'invert(1)'}} /></span>
                    <span className="skill-name">Express.js</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '88%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" alt="MongoDB" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">MongoDB</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '88%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg" alt="GraphQL" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">GraphQL</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '78%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg" alt="Firebase" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Firebase</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '88%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" alt="SQL" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">REST APIs &amp; SQL</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '85%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="skill-category">
              <h3>Mobile &amp; Testing</h3>
              <div className="skill-items">
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg" alt="Flutter" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Flutter / Dart</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '85%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jest/jest-plain.svg" alt="Jest" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Jest / RTL</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '85%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" alt="Docker" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Docker (basics)</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '60%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/npm/devicon@2.16.0/icons/amazonwebservices/amazonwebservices-original-wordmark.svg" alt="AWS" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">AWS (basics)</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '60%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" alt="Git" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Git / GitHub</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '92%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" alt="Python" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Python</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '75%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Education & Certifications Section */}
      <div id="education" className="chess-section courses-section">
        <div className="section-container">
          <div className="section-header">
            <div className="chess-icon">♙</div>
            <h2 className="section-title">Education & Certifications</h2>
          </div>
          
          <div className="content-grid">
            <div className="content-card education-card">
              <div className="card-header">
                <h3>Bachelor of Technology</h3>
                <span className="company">Computer Science Engineering</span>
                <span className="institution">JMIT Radaur (Kurukshetra University)</span>
                <span className="duration">2019 - 2023</span>
              </div>
              <div className="card-content">
                <p>Graduated with <strong>8.43 CGPA</strong>. Specialized in software engineering, data structures, algorithms, and web technologies. Active participant in technical societies and cultural events.</p>
                <div className="education-highlights">
                  <div className="highlight-item">
                    <span className="highlight-label">CGPA:</span>
                    <span className="highlight-value">8.43/10</span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-label">Specialization:</span>
                    <span className="highlight-value">Web Technologies</span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-label">Leadership:</span>
                    <span className="highlight-value">VP, Youth Red Cross Society</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="content-card certificate-card" onClick={() => openCertificate('mozilla')}>
              <div className="card-header">
                <h3>JavaScript Foundations Professional Certificate</h3>
                <span className="company">Mozilla</span>
                <span className="platform">via LinkedIn Learning</span>
              </div>
              <div className="card-content">
                <p>Advanced JavaScript concepts, modern development patterns, and professional-grade coding practices certified by Mozilla through LinkedIn Learning platform.</p>
                <div className="certificate-preview">
                  <div className="certificate-badge">Mozilla Certified</div>
                  <div className="view-certificate">Click to View Certificate</div>
                </div>
                <div className="skills-used">
                  <span className="skill-tag">ES6+</span>
                  <span className="skill-tag">Async/Await</span>
                  <span className="skill-tag">DOM Manipulation</span>
                  <span className="skill-tag">Modern JavaScript</span>
                </div>
              </div>
            </div>

            <div className="content-card certificate-card" onClick={() => openCertificate('meta')}>
              <div className="card-header">
                <h3>Introduction to Front-End Development</h3>
                <span className="company">Meta (Facebook)</span>
                <span className="platform">via Coursera</span>
              </div>
              <div className="card-content">
                <p>Comprehensive course covering modern front-end development technologies, React fundamentals, and best practices from Meta's engineering team.</p>
                <div className="certificate-preview">
                  <div className="certificate-badge">Meta Certified</div>
                  <div className="view-certificate">Click to View Certificate</div>
                </div>
                <div className="skills-used">
                  <span className="skill-tag">React</span>
                  <span className="skill-tag">JavaScript</span>
                  <span className="skill-tag">HTML/CSS</span>
                  <span className="skill-tag">Meta Best Practices</span>
                </div>
              </div>
            </div>

            <div className="content-card certificate-card" onClick={() => openCertificate('javascript2')}>
              <div className="card-header">
                <h3>JavaScript Essential Training</h3>
                <span className="company">LinkedIn Learning</span>
                <span className="platform">Codespaces Integration</span>
              </div>
              <div className="card-content">
                <p>Comprehensive JavaScript training covering fundamental concepts, advanced techniques, and practical applications in modern web development.</p>
                <div className="certificate-preview">
                  <div className="certificate-badge">LinkedIn Certified</div>
                  <div className="view-certificate">Click to View Certificate</div>
                </div>
                <div className="skills-used">
                  <span className="skill-tag">JavaScript Fundamentals</span>
                  <span className="skill-tag">ES6+</span>
                  <span className="skill-tag">Web APIs</span>
                  <span className="skill-tag">Best Practices</span>
                </div>
              </div>
            </div>

            <div className="content-card certificate-card" onClick={() => openCertificate('codepad')}>
              <div className="card-header">
                <h3>JavaScript Essentials Training</h3>
                <span className="company">LinkedIn Learning</span>
                <span className="platform">Codepad Integration</span>
              </div>
              <div className="card-content">
                <p>JavaScript training focusing on practical coding exercises, problem-solving techniques, and real-world application development.</p>
                <div className="certificate-preview">
                  <div className="certificate-badge">LinkedIn Certified</div>
                  <div className="view-certificate">Click to View Certificate</div>
                </div>
                <div className="skills-used">
                  <span className="skill-tag">Problem Solving</span>
                  <span className="skill-tag">Code Optimization</span>
                  <span className="skill-tag">JavaScript Patterns</span>
                  <span className="skill-tag">Debugging</span>
                </div>
              </div>
            </div>

            <div className="content-card certificate-card" onClick={() => openCertificate('calarts')}>
              <div className="card-header">
                <h3>Visual Elements of User Interface Design</h3>
                <span className="company">California Institute of the Arts</span>
                <span className="platform">via Coursera</span>
              </div>
              <div className="card-content">
                <p>UI/UX design principles, visual design fundamentals, and user-centered design methodologies from the prestigious California Institute of the Arts.</p>
                <div className="certificate-preview">
                  <div className="certificate-badge">CalArts Certified</div>
                  <div className="view-certificate">Click to View Certificate</div>
                </div>
                <div className="skills-used">
                  <span className="skill-tag">UI/UX Design</span>
                  <span className="skill-tag">Visual Design</span>
                  <span className="skill-tag">User Research</span>
                  <span className="skill-tag">Design Thinking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div id="contact" className="chess-section contact-section">
        <div className="section-container">
          <div className="section-header">
            <div className="chess-icon">♟</div>
            <h2 className="section-title">Let's Build Something Amazing Together</h2>
          </div>
          
          <div className="contact-content">
            <div className="contact-form-container">
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <input 
                    type="text" 
                    name="name"
                    placeholder="Your Name" 
                    className="form-input" 
                    value={formData.name}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="email" 
                    name="email"
                    placeholder="Your Email" 
                    className="form-input" 
                    value={formData.email}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="text" 
                    name="company"
                    placeholder="Your Company" 
                    className="form-input" 
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <textarea 
                    name="message"
                    placeholder="Tell me about your project..." 
                    className="form-textarea" 
                    rows={5} 
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>
                
                <div className="project-interests">
                  <h4>I'm interested in:</h4>
                  <div className="interest-options">
                    {['Web Development', 'Mobile App Development', 'Dashboard Development', 'UI/UX Design', 'Full-time Opportunity'].map((interest) => (
                      <label key={interest} className="interest-option">
                        <input 
                          type="checkbox" 
                          checked={formData.interests.includes(interest)}
                          onChange={() => handleInterestChange(interest)}
                        />
                        <span>{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <button type="submit" className="submit-button">
                  <span>Send Message</span>
                </button>
                <p className="form-note">This opens your email app with the message pre-filled. Prefer direct? Reach me at <a href={`mailto:${profile.email}`}>{profile.email}</a>.</p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-logo">
            <span className="footer-brand">JY</span>
            <span className="footer-king">♔</span>
          </div>
          
          <div className="footer-divider"></div>
          
          <div className="footer-credit">
            <span>Designed and built with ❤️ by Jateen Yadav</span>
          </div>
          
          <div className="social-links">
            <a href={`mailto:${profile.email}`} className="social-link gmail" title="Email">
              <img src={gmailIcon} alt="Gmail" className="social-icon" />
            </a>
            <a href="https://wa.me/918398986788" className="social-link whatsapp" title="WhatsApp">
              <img src={whatsappIcon} alt="WhatsApp" className="social-icon" />
            </a>
            <a href={social('Instagram')} className="social-link instagram" title="Instagram">
              <img src={instagramIcon} alt="Instagram" className="social-icon" />
            </a>
            <a href={social('LinkedIn')} className="social-link linkedin" title="LinkedIn">
              <img src={linkedinIcon} alt="LinkedIn" className="social-icon" />
            </a>
            <a href={social('GitHub')} className="social-link github" title="GitHub">
              <img src={githubIcon} alt="GitHub" className="social-icon" />
            </a>
            <a href="tel:+918398986788" className="social-link phone" title="Call">
              <img src={phoneIcon} alt="Phone" className="social-icon" />
            </a>
          </div>
        </div>
      </footer>

      <button
        className={`scroll-top-btn ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll back to top"
        title="Back to top"
      >
        <span aria-hidden="true">↑</span>
      </button>
    </div>
  );
};

export default ChessboardHero;
