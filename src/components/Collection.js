import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import '../styles/Collection.css';

function Collection() {
  const [col, setCol] = useState([]);
  const user = JSON.parse(localStorage.getItem('currentUser'));

  useEffect(() => {
    if (user) {
      apiService.getCollection(user.id).then(setCol);
    }
  }, [user]);

  if (!user) return <p>Please <Link to="/login">login</Link> first.</p>;

  return (
    <div className="collection-container">
      <h2>Your Pokémon Collection</h2>
      <ul>
        {col.map((entry) => (
          <li key={entry.id} className="collection-item">
            <img
              src={
                entry.pokemon.imageUrl ||
                `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${entry.pokemon.id}.png`
              }
              alt={entry.pokemon.name}
            />
            <div>
              <strong>{entry.pokemon.name}</strong> <em>({entry.pokemon.rarity})</em>
            </div>
          </li>
        ))}
      </ul>
      <Link to="/game" className="back-button">Back to Game</Link>
    </div>
  );
}

export default Collection;