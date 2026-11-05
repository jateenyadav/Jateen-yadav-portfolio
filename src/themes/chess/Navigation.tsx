// Original chess-portfolio navigation — markup and behaviour unchanged; resume points at the current CV.
import { useState, type MouseEvent } from 'react'
import { useTheme } from './ThemeContext'
import { profile } from '../../data/content'

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
    setIsMenuOpen(false)
  }

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
    setIsMenuOpen(false)
  }

  const handleResumeView = () => {
    // Open resume in new tab for viewing
    window.open(profile.resume, '_blank')
  }

  const handleResumeDownload = (e: MouseEvent) => {
    e.stopPropagation() // Prevent the main button click
    // Create download link
    const link = document.createElement('a')
    link.href = profile.resume
    link.download = 'Jateen_Yadav_FullStack_Developer_Resume.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-logo">
          <span className="logo-text">JY</span>
          <span className="logo-king">♔</span>
        </div>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <a href="#home" className="nav-link" onClick={() => scrollToSection('home')}>
            Home
          </a>
          <a href="#about" className="nav-link" onClick={() => scrollToSection('about')}>
            About
          </a>
          <a href="#experience" className="nav-link" onClick={() => scrollToSection('experience')}>
            Experience
          </a>
          <a href="#projects" className="nav-link" onClick={() => scrollToSection('projects')}>
            Projects
          </a>
          <a href="#education" className="nav-link" onClick={() => scrollToSection('education')}>
            Education
          </a>
          <a href="#contact" className="nav-link" onClick={() => scrollToSection('contact')}>
            Contact
          </a>
          {/* Phones only (see skin.css): the bar is too narrow for these, so they live in the menu */}
          <div className="nav-menu-actions">
            <button className="resume-btn" onClick={handleResumeView}>
              <span className="resume-text">Resume</span>
              <span className="separator">|</span>
              <div className="download-icon" onClick={handleResumeDownload} title="Download Resume">
                <img src="/chess/download-icon.png" alt="Download" className="download-img" />
              </div>
            </button>
            <button className="hire-me-btn" onClick={scrollToContact}>
              <span className="hire-text">Hire Me</span>
            </button>
          </div>
        </div>

        <div className="nav-actions">
          <button
            className={`theme-toggle ${theme}`}
            onClick={toggleTheme}
            role="switch"
            aria-checked={theme === 'light'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="theme-toggle-track" aria-hidden="true">
              <span className="theme-toggle-half theme-toggle-half--dark"></span>
              <span className="theme-toggle-half theme-toggle-half--light"></span>
              <span className="theme-toggle-thumb">
                <span className="theme-toggle-queen">♛</span>
              </span>
            </span>
            <span className="theme-toggle-label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>

          <button className="resume-btn" onClick={handleResumeView}>
            <span className="resume-text">Resume</span>
            <span className="separator">|</span>
            <div className="download-icon" onClick={handleResumeDownload} title="Download Resume">
              <img src="/chess/download-icon.png" alt="Download" className="download-img" />
            </div>
          </button>

          <button className="hire-me-btn" onClick={scrollToContact}>
            <span className="hire-text">Hire Me</span>
          </button>
        </div>

        <div className="nav-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
