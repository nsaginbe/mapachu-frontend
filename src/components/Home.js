import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">Mapachu</h1>
        <p className="home-subtitle">Find and catch Pokémon in Almaty!</p>
        
        <div className="home-description">
          <p>Explore the city, find hidden Pokémon in buildings, and catch them all!</p>
          <p>You have 40 seconds to find as many Pokémon as possible.</p>
          <p>Different Pokéballs give you different chances to catch them.</p>
        </div>
        
        <Link to="/game" className="start-game-button">Start Game</Link>
      </div>
    </div>
  );
}

export default Home;