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

        <button className="hire-me-btn" onClick={scrollToContact}>
          <span className="hire-text">Hire Me</span>
          {/* <span className="hire-icon"></span> */}
        </button>

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
