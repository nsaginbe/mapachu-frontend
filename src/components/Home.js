import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">Mapachu</h1>
        <p className="home-description">
          Explore buildings on the map, find hidden Pokémon, and catch them!
        </p>
        <Link to="/login" className="home-button">Login / Register</Link>
        <Link to="/collection" className="home-button">My Collection</Link>
      </div>
    </div>
  );
}

export default Home;