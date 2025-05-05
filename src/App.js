import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import './App.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import L from 'leaflet';

// Fix for default marker icon in Leaflet with React
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// This component handles map restrictions
function MapBoundaryController() {
  const map = useMap();

  useEffect(() => {
    const minZoom = 16;
    const maxZoom = 18;
    map.setMinZoom(minZoom);
    map.setMaxZoom(maxZoom);

    const southWest = L.latLng(43.228949, 76.879709);
    const northEast = L.latLng(43.248949, 76.899709);
    const bounds = L.latLngBounds(southWest, northEast);

    map.setMaxBounds(bounds);
    map.on('drag', () => {
      map.panInsideBounds(bounds, { animate: false });
    });

    return () => {
      map.off('drag');
    };
  }, [map]);

  return null;
}

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(40);
  const [inventory, setInventory] = useState({
    normal: 5,
    super: 3,
    ultra: 1,
  });
  const [foundPokemon, setFoundPokemon] = useState(null);
  const [score, setScore] = useState(0);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const almatyCenter = [43.238949, 76.889709];

  const samplePoints = [
    {
      id: 1,
      position: [43.238949, 76.889709],
      name: 'Building 1',
      hasPokemon: true,
      pokemon: { name: 'Pikachu', type: 'Electric', rarity: 'Common' },
    },
    { id: 2, position: [43.236949, 76.887709], name: 'Building 2', hasPokemon: false },
    {
      id: 3,
      position: [43.240949, 76.891709],
      name: 'Building 3',
      hasPokemon: true,
      pokemon: { name: 'Charmander', type: 'Fire', rarity: 'Uncommon' },
    },
    { id: 4, position: [43.235949, 76.892709], name: 'Building 4', hasPokemon: false },
    {
      id: 5,
      position: [43.242949, 76.886709],
      name: 'Building 5',
      hasPokemon: true,
      pokemon: { name: 'Bulbasaur', type: 'Grass', rarity: 'Rare' },
    },
  ];

  const startGame = () => {
    setGameStarted(true);
    setTimeLeft(40);
    setScore(0);
    setFoundPokemon(null);

    setInventory({
      normal: 5,
      super: 3,
      ultra: 1,
    });

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endGame = () => {
    setGameStarted(false);
    setTimeLeft(40);
    alert(`Game Over! Your final score: ${score} points`);
    navigate('/');
  };

  const checkBuilding = (building) => {
    if (building.hasPokemon) {
      setFoundPokemon(building.pokemon);

      setTimeout(() => {
        setFoundPokemon(null);
        setScore((prev) => prev + calculatePoints(building.pokemon.rarity));
      }, 2000);
    } else {
      alert('No Pokémon found in this building!');
    }
  };

  const calculatePoints = (rarity) => {
    switch (rarity) {
      case 'Common':
        return 5;
      case 'Uncommon':
        return 10;
      case 'Rare':
        return 20;
      default:
        return 5;
    }
  };

  // Переименовали хук в обычную функцию и заменили 'great' на 'super'
  const catchPokeball = (type) => {
    if (inventory[type] > 0) {
      setInventory((prev) => ({
        ...prev,
        [type]: prev[type] - 1,
      }));
      return true;
    } else {
      alert(`You don't have any ${type} Pokéballs left!`);
      return false;
    }
  };

  useEffect(() => {
    startGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Mapachu</h1>
        <div className="timer">Time Left: {timeLeft} seconds</div>
      </header>

      {gameStarted && (
        <>
          <div className="game-dashboard">
            <div className="score">Score: {score}</div>
            <div className="inventory">
              <div className="pokeball">
                <div className="pokeball-icon pokeball-normal" />
                <span>{inventory.normal}</span>
              </div>
              <div className="pokeball">
                <div className="pokeball-icon pokeball-super" />
                <span>{inventory.super}</span>
              </div>
              <div className="pokeball">
                <div className="pokeball-icon pokeball-ultra" />
                <span>{inventory.ultra}</span>
              </div>
            </div>
          </div>

          <div className="map-container">
            {foundPokemon && (
              <div className="pokemon-found">
                <h2>You found a {foundPokemon.name}!</h2>
                <p>
                  Type: {foundPokemon.type} | Rarity: {foundPokemon.rarity}
                </p>
                <p>Click a Pokéball to try to catch it!</p>
                <div className="pokeball-options">
                  <button
                    onClick={() => catchPokeball('normal')}
                    disabled={inventory.normal <= 0}
                    className="pokeball-button"
                  >
                    Use Normal Ball
                  </button>
                  <button
                    onClick={() => catchPokeball('super')}
                    disabled={inventory.super <= 0}
                    className="pokeball-button"
                  >
                    Use Super Ball
                  </button>
                  <button
                    onClick={() => catchPokeball('ultra')}
                    disabled={inventory.ultra <= 0}
                    className="pokeball-button"
                  >
                    Use Ultra Ball
                  </button>
                </div>
              </div>
            )}

            <MapContainer
              center={almatyCenter}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              zoomControl
              doubleClickZoom
              scrollWheelZoom
              attributionControl
            >
              <MapBoundaryController />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {samplePoints.map((point) => (
                <Marker
                  key={point.id}
                  position={point.position}
                  eventHandlers={{
                    click: () => {
                      checkBuilding(point);
                    },
                  }}
                >
                  <Popup>{point.name}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </>
      )}
    </div>
  );
}

export default App;