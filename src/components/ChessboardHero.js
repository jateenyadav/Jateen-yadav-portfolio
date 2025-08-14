import React, { useState, useEffect, useRef } from 'react';
import './ChessboardHero.css';

// Import certificate PDF
import calartsIICP from '../assets/Coursera calarts.pdf';

// Import social media icons
import whatsappIcon from '../assets/whatsapp.png';
import instagramIcon from '../assets/instagram.png';
import linkedinIcon from '../assets/linkedin.png';
import githubIcon from '../assets/github.png';
import gmailIcon from '../assets/gmail.png';
import phoneIcon from '../assets/phone.png';

const ChessboardHero = () => {
  const [hoveredSquare, setHoveredSquare] = useState(null);
  const [boardSize, setBoardSize] = useState({ rows: 8, cols: 10 });
  const [smokingSquares, setSmokingSquares] = useState(new Set());
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
    interests: []
  });
  const heroRef = useRef(null);
  const experienceRef = useRef(null);

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
        const newSmokingSquares = new Set();
        const totalSquares = boardSize.rows * boardSize.cols;
        const progress = Math.min((scrollPosition - 200) / 800, 1);
        const squaresToSmoke = Math.floor(progress * totalSquares);
        
        for (let i = 0; i < squaresToSmoke; i++) {
          const randomSquare = Math.floor(Math.random() * totalSquares);
          newSmokingSquares.add(randomSquare);
        }
        setSmokingSquares(newSmokingSquares);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [boardSize]);

  const getWebDevContent = (row, col) => {
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

  const isNearby = (targetRow, targetCol, currentRow, currentCol) => {
    const distance = Math.abs(targetRow - currentRow) + Math.abs(targetCol - currentCol);
    return distance <= 2 && distance > 0;
  };

  const getSquareStyle = (row, col, index) => {
    const baseStyle = {};
    
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

  const getSquareOpacity = (col) => {
    const progress = col / (boardSize.cols - 1);
    return 0.7 + (progress * 0.3);
  };

  const openProject = (projectUrl) => {
    window.open(projectUrl, '_blank');
  };

  const openCertificate = (certType) => {
    const certificates = {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInterestChange = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e) => {
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
    const mailtoLink = `mailto:jateen.yadav1@gmail.com?subject=Portfolio Contact from ${formData.name}&body=${encodeURIComponent(emailContent)}`;
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
    {
      title: "3D Solar System",
      description: "Interactive 3D solar system built with Three.js, featuring realistic planetary movements and stunning visual effects.",
      url: "https://3d-solar-galaxy.netlify.app/",
      technologies: ["Three.js", "JavaScript", "WebGL", "CSS3"],
    },
    {
      title: "Crypto Dashboard",
      description: "Crypto dashboard featuring real-time data collection and visualization, API integration, and dynamic updates using React.",
      url: "https://lambent-platypus-3a1299.netlify.app/",
      technologies: ["React", "JavaScript", "API Integration"],
    },
    {
      title: "Community Platform",
      description: "Coder community platform connecting users with shared interests and real-time messaging features.",
      url: "https://community4you.netlify.app/",
      technologies: ["React", "Firebase", "CSS3", "JavaScript"],
    },
    {
      title: "Find a Meal by Ingredients",
      description: "Discover meals by entering ingredients, featuring React, Bootstrap, and API integration with YouTube for cooking videos.",
      url: "https://rainbow-marshmallow-32efec.netlify.app/",
      technologies: ["React", "Bootstrap", "API Integration"],
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
                <span className="chess-rank">Software Engineer | Frontend & App Developer</span>
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
                  I'm a passionate <strong>Software Engineer</strong> with 2+ years of professional experience 
                  creating interactive, real-time web applications and cross-platform mobile solutions. 
                  Currently working as a <strong>Junior Research Engineer at Hitachi India</strong>, where I 
                  develop cutting-edge dashboards and mobile applications for international clients.
                </p>
                <p>
                  My expertise lies in transforming complex business requirements into elegant, user-friendly 
                  interfaces using <strong>React.js, JavaScript, Flutter, and modern web technologies</strong>. 
                  I specialize in data visualization, real-time dashboard development, and cross-platform 
                  mobile applications that drive business insights and improve user experience.
                </p>
                <p>
                  Beyond technical skills, I bring leadership experience as the Vice-President of Youth Red Cross 
                  Society, where I led community health initiatives and blood donation campaigns. I believe in 
                  using technology to create meaningful impact and deliver solutions that solve real-world problems.
                </p>
              </div>
              <div className="about-stats">
                <div className="stat-item">
                  <span className="stat-number">2+</span>
                  <span className="stat-label">Years Experience</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">20+</span>
                  <span className="stat-label">Projects Delivered</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">8</span>
                  <span className="stat-label">Core Technologies</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Client Satisfaction</span>
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
                <h3>Junior Research Engineer</h3>
                <span className="company">Hitachi India Pvt. Ltd.</span>
                <span className="duration">Sept 2023 – Present</span>
              </div>
              <div className="card-content">
                <h4>Web Development</h4>
                <p>Designed and delivered interactive, real-time data visualisation React dashboards for overseas clients, driving key business insights and decision-making. Enhanced dashboard performance using modern JavaScript libraries and optimized rendering techniques.</p>
                <h4>Mobile Development</h4>
                <p>Engineered cross-platform mobile dashboards using Flutter and Dart. Integrated Firebase for robust authentication, cloud data storage, and real-time synchronization across multiple devices.</p>
                <div className="skills-used">
                <span className="skill-tag">Web Development</span>
                <span className="skill-tag">Android Development & Deployment</span>
                <span className="skill-tag">iOS Development & Deployment</span>
                  <span className="skill-tag">ReactJS</span>
                  <span className="skill-tag">Flutter</span>
                  <span className="skill-tag">JavaScript</span>
                  <span className="skill-tag">Redux.js</span>
                  <span className="skill-tag">Dart</span>
                  <span className="skill-tag">Firebase</span>
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
                <h3>Research & Development Intern</h3>
                <span className="company">Hitachi India Pvt. Ltd.</span>
                <span className="duration">Feb 2023 – May 2023</span>
              </div>
              <div className="card-content">
                <p>Developed a comprehensive React dashboard to visualize real-time machine status on assembly lines. Engineered multi-layered data visualizations using Chart.js, Fusion Charts, and Plotly JS, improving operational efficiency by 35%.</p>
                <div className="skills-used">
                  <span className="skill-tag">JavaScript</span>
                  <span className="skill-tag">React</span>
                  <span className="skill-tag">Redux</span>
                  <span className="skill-tag">Chart.js</span>
                  <span className="skill-tag">Bootstrap</span>
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h3>Frontend Engineering Intern</h3>
                <span className="company">Acadlift.com</span>
                <span className="duration">Jun 2022 – Jul 2022</span>
              </div>
              <div className="card-content">
                <p>Built and integrated reusable React components to enhance scalability and maintainability of client-facing web applications. Improved code reusability by 40% and received recognition for proactive problem-solving approach.</p>
                <div className="skills-used">
                  <span className="skill-tag">ReactJS</span>
                  <span className="skill-tag">JavaScript</span>
                  <span className="skill-tag">HTML5</span>
                  <span className="skill-tag">CSS3</span>
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h3>Frontend Development & Analytics Intern</h3>
                <span className="company">GoPerspective Technologies LLP</span>
                <span className="duration">Sep 2021 – Oct 2021</span>
              </div>
              <div className="card-content">
                <p>Collaborated with ML and Analytics team to transform complex datasets into actionable visualizations. Built prototype UI components to represent data insights, improving data interpretation efficiency.</p>
                <div className="skills-used">
                  <span className="skill-tag">Python</span>
                  <span className="skill-tag">Data Visualization</span>
                  <span className="skill-tag">Analytics</span>
                  <span className="skill-tag">UI/UX</span>
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h3>UI/UX Design Intern</h3>
                <span className="company">iSchoolConnect Technologies</span>
                <span className="duration">Apr 2021 – May 2021</span>
              </div>
              <div className="card-content">
                <p>Designed schematic UI layouts for annual fest and workshop portal. Led logo development for multiple regional teams, ensuring cohesive branding across 5+ portals and improving brand recognition.</p>
                <div className="skills-used">
                  <span className="skill-tag">UI Design</span>
                  <span className="skill-tag">Logo Design</span>
                  <span className="skill-tag">Adobe Creative Suite</span>
                  <span className="skill-tag">Branding</span>
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
                    <div className="project-icon">{project.icon}</div>
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
              <h3>Frontend Technologies</h3>
              <div className="skill-items">
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="ReactJS" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">ReactJS</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '90%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="JavaScript" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">JavaScript</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '90%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" alt="HTML5" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">HTML5</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '99%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" alt="CSS3" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">CSS3</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '95%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/threejs/threejs-original.svg" alt="Three.js" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Three.js</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '75%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redux/redux-original.svg" alt="Redux" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Redux</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '95%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="skill-category">
              <h3>Mobile & Backend</h3>
              <div className="skill-items">
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg" alt="Flutter" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Flutter</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '85%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg" alt="Dart" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Dart</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '80%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg" alt="Firebase" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Firebase</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '90%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="skill-category">
              <h3>SupportingTools & Libraries</h3>
              <div className="skill-items">
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg" alt="Bootstrap" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Bootstrap</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '95%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/chartjs/chartjs-original.svg" alt="Chart.js" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Chart.js</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '88%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" alt="Git" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Git</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '90%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-line.svg" alt="Adobe Creative Suite" style={{width: '20px', height: '20px', filter: 'invert(50%) sepia(100%) saturate(500%) hue-rotate(180deg) brightness(90%) contrast(100%)'}} /></span>
                    <span className="skill-name">Adobe Creative Suite</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '62%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon">CD</span>
                    <span className="skill-name">Cordova</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '80%'}}></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-name-container">
                    <span className="skill-icon"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" alt="Tailwind CSS" style={{width: '20px', height: '20px'}} /></span>
                    <span className="skill-name">Tailwind CSS</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-progress" style={{width: '92%'}}></div>
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
                    rows="5" 
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
            <a href="mailto:jateen.yadav1@gmail.com" className="social-link gmail" title="Email">
              <img src={gmailIcon} alt="Gmail" className="social-icon" />
            </a>
            <a href="https://wa.me/918398986788" className="social-link whatsapp" title="WhatsApp">
              <img src={whatsappIcon} alt="WhatsApp" className="social-icon" />
            </a>
            <a href="https://instagram.com/jateen_yadav" className="social-link instagram" title="Instagram">
              <img src={instagramIcon} alt="Instagram" className="social-icon" />
            </a>
            <a href="https://linkedin.com/in/jateen-yadav-9012a9213" className="social-link linkedin" title="LinkedIn">
              <img src={linkedinIcon} alt="LinkedIn" className="social-icon" />
            </a>
            <a href="https://github.com/jateenyadav" className="social-link github" title="GitHub">
              <img src={githubIcon} alt="GitHub" className="social-icon" />
            </a>
            <a href="tel:+918398986788" className="social-link phone" title="Call">
              <img src={phoneIcon} alt="Phone" className="social-icon" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChessboardHero;
