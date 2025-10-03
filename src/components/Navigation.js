import React, { useState } from 'react';
import './Navigation.css';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToContact = () => {
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const handleResumeView = () => {
    // Open resume in new tab for viewing
    window.open('/Jateen_yadav_resume.pdf', '_blank');
  };

  const handleResumeDownload = (e) => {
    e.stopPropagation(); // Prevent the main button click
    // Create download link
    const link = document.createElement('a');
    link.href = '/Jateen_yadav_resume.pdf';
    link.download = 'Jateen_yadav_resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-logo">
          <span className="logo-text">JY</span>
          <span className="logo-king">♔</span>
        </div>
        
        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <a href="#home" className="nav-link" onClick={() => scrollToSection('home')}>Home</a>
          <a href="#about" className="nav-link" onClick={() => scrollToSection('about')}>About</a>
          <a href="#experience" className="nav-link" onClick={() => scrollToSection('experience')}>Experience</a>
          <a href="#projects" className="nav-link" onClick={() => scrollToSection('projects')}>Projects</a>
          <a href="#education" className="nav-link" onClick={() => scrollToSection('education')}>Education</a>
          <a href="#contact" className="nav-link" onClick={() => scrollToSection('contact')}>Contact</a>
        </div>

        <div className="nav-actions">
          <button className="resume-btn" onClick={handleResumeView}>
            <span className="resume-text">Resume</span>
            <span className="separator">|</span>
            <div className="download-icon" onClick={handleResumeDownload} title="Download Resume">
              <img src="/download (1).png" alt="Download" className="download-img" />
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
  );
};

export default Navigation;
