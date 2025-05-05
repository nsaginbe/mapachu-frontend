import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../services/api';
import '../styles/Collection.css';

function Collection() {
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('date'); // date, name, rarity, type
  const [filterType, setFilterType] = useState('');
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true);
        
        if (!userData.id) {
          throw new Error('User not logged in');
        }
        
        const userCollection = await userApi.getUserCollection(userData.id);
        setCollection(userCollection);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching collection:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchCollection();
  }, [userData.id]);

  const handleDeletePokemon = async (pokemonId) => {
    if (window.confirm('Are you sure you want to release this Pokémon?')) {
      try {
        await userApi.deletePokemonFromCollection(userData.id, pokemonId);
        
        // Update local state
        setCollection(prev => prev.filter(p => p.id !== pokemonId));
      } catch (err) {
        console.error('Error deleting pokemon:', err);
        alert('Failed to release Pokémon. Please try again.');
      }
    }
  };

  const getPokemonTypes = () => {
    const types = new Set();
    collection.forEach(pokemon => {
      types.add(pokemon.type);
    });
    return Array.from(types);
  };

  const sortCollection = (pokemons) => {
    switch (sortBy) {
      case 'name':
        return [...pokemons].sort((a, b) => a.name.localeCompare(b.name));
      case 'rarity':
        const rarityOrder = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Legendary': 4 };
        return [...pokemons].sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);
      case 'type':
        return [...pokemons].sort((a, b) => a.type.localeCompare(b.type));
      case 'date':
      default:
        return [...pokemons].sort((a, b) => new Date(b.caughtAt) - new Date(a.caughtAt));
    }
  };

  const filterCollection = (pokemons) => {
    if (!filterType) return pokemons;
    return pokemons.filter(pokemon => pokemon.type === filterType);
  };

  const filteredAndSortedCollection = sortCollection(filterCollection(collection));

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Common': return '#a3a3a3';
      case 'Uncommon': return '#54b360';
      case 'Rare': return '#5e73df';
      case 'Legendary': return '#ffd700';
      default: return '#a3a3a3';
    }
  };

  if (loading) {
    return (
      <div className="collection-loading">
        <div className="loading-pokeball"></div>
        <p>Loading your collection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="collection-error">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <Link to="/game" className="back-button">Back to Game</Link>
      </div>
    );
  }

  return (
    <div className="collection-container">
      <header className="collection-header">
        <h1>My Pokémon Collection</h1>
        <Link to="/game" className="back-to-game">Back to Game</Link>
      </header>
      
      <div className="collection-controls">
        <div className="collection-filters">
          <div className="filter-group">
            <label>Filter by Type:</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              {getPokemonTypes().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Newest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="rarity">Rarity</option>
              <option value="type">Type</option>
            </select>
          </div>
        </div>
        
        <div className="collection-stats">
          <div className="stat">
            <span className="stat-value">{collection.length}</span>
            <span className="stat-label">Total Pokémon</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {collection.filter(p => p.rarity === 'Rare' || p.rarity === 'Legendary').length}
            </span>
            <span className="stat-label">Rare Pokémon</span>
          </div>
        </div>
      </div>
      
      {filteredAndSortedCollection.length === 0 ? (
        <div className="empty-collection">
          <h2>No Pokémon Found</h2>
          <p>Go catch some Pokémon to fill your collection!</p>
        </div>
      ) : (
        <div className="pokemon-grid">
          {filteredAndSortedCollection.map(pokemon => (
            <div key={pokemon.id} className="pokemon-card">
              <div 
                className="pokemon-rarity-tag" 
                style={{ backgroundColor: getRarityColor(pokemon.rarity) }}
              >
                {pokemon.rarity}
              </div>
              
              <div className="pokemon-image">
                <img 
                  src={pokemon.imageUrl || `/pokemon/${pokemon.pokemonId}.png`} 
                  alt={pokemon.name}
                  onError={(e) => {
                    e.target.src = '/pokemon/default.png';
                  }}
                />
              </div>
              
              <div className="pokemon-info">
                <h3>{pokemon.name}</h3>
                <div className="pokemon-tags">
                  <span className="type-tag">{pokemon.type}</span>
                  <span className="cp-tag">CP: {pokemon.strength || '??'}</span>
                </div>

                <div className="pokemon-details">
                  <p>Caught on: {new Date(pokemon.caughtAt).toLocaleDateString()}</p>
                </div>
                
                <button 
                  className="release-button"
                  onClick={() => handleDeletePokemon(pokemon.id)}
                >
                  Release
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Collection;