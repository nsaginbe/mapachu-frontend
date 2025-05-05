import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import apiService from './services/api';
import './App.css';

function HotColdOverlay({ spawns }) {
  const map = useMapEvents({
    mousemove: (e) => {
      const container = document.querySelector('.map-container');
      if (!spawns.length) return;
      const distances = spawns.map(s => map.distance(e.latlng, s.position));
      const minDist = Math.min(...distances);
      const maxDist = 500; // meters
      const ratio = Math.max(0, Math.min(1, 1 - minDist / maxDist));
      // ratio: 0=cold (blue), 1=hot (red)
      const red = Math.floor(255 * ratio);
      const blue = Math.floor(255 * (1 - ratio));
      container.style.backgroundColor = `rgba(${red},0,${blue},0.2)`;
    }
  });
  return null;
}

function App() {
  const [spawns, setSpawns] = useState([]);
  const [current, setCurrent] = useState(null);
  const [inventory, setInventory] = useState({ normal: 5, super: 3, ultra: 1 });
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('currentUser'));
  const zoneId = 1;

  useEffect(() => {
    if (!user) return navigate('/login');
    loadSpawns();
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { clearInterval(timerRef.current); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const loadSpawns = async () => {
    const data = await apiService.getSpawnsByZone(zoneId);
    // pick exactly 8 positions
    const chosen = data.sort(() => 0.5 - Math.random()).slice(0, 8);
    setSpawns(chosen);
  };

  const handleCatch = async (type) => {
    if (inventory[type] <= 0) { alert('No balls left'); return; }
    const result = await apiService.catchPokemon(current.id, user.id, type);
    alert(result.message);
    if (result.success) {
      setInventory(i => ({ ...i, [type]: i[type] - 1 }));
      setSpawns(s => s.filter(x => x.id !== current.id));
      setCurrent(null);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Mapachu</h1>
        <div className="timer">Time Left: {timeLeft}s</div>
      </header>
      <div className="game-dashboard">
        <div>Normal: {inventory.normal}</div>
        <div>Super: {inventory.super}</div>
        <div>Ultra: {inventory.ultra}</div>
      </div>
      <div className="map-container">
        {current && (
          <div className="pokemon-found">
            <h2>{current.pokemon.name}</h2>
            <img
              src={current.pokemon.imageUrl ||
                `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${current.pokemon.id}.png`}
              alt={current.pokemon.name}
            />
            <p>Type: {current.pokemon.type}</p>
            <p>Rarity: {current.pokemon.rarity}</p>
            <p>Strength: {current.pokemon.strength}</p>
            <div className="pokeball-options">
              {['normal','super','ultra'].map(type => (
                <button
                  key={type}
                  disabled={inventory[type] <= 0}
                  onClick={() => handleCatch(type)}
                >Use {type.charAt(0).toUpperCase() + type.slice(1)}</button>
              ))}
            </div>
          </div>
        )}
        <MapContainer
          center={[43.238949, 76.889709]}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <HotColdOverlay spawns={spawns} />
          {spawns.map(sp => (
            <Circle
              key={sp.id}
              center={sp.position}
              radius={20}
              pathOptions={{ color: 'transparent', fillOpacity: 0 }}
              eventHandlers={{ click: () => setCurrent(sp) }}
            >
              <Popup>{/* hidden marker popup if needed */}</Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>
      <button className="next-map" onClick={loadSpawns}>Next Map</button>
    </div>
  );
}

export default App;