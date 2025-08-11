import React from 'react';
import Navigation from './components/Navigation';
import ChessboardHero from './components/ChessboardHero';
import './App.css';

function App() {
  return (
    <div className="App">
      <Navigation />
      <ChessboardHero />
    </div>
  );
}

export default App;
