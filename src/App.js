import React from 'react';
import Navigation from './components/Navigation';
import ChessboardHero from './components/ChessboardHero';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <Navigation />
        <ChessboardHero />
      </div>
    </ThemeProvider>
  );
}

export default App;
