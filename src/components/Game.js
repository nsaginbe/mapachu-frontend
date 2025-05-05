import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useNavigate, Link } from 'react-router-dom';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/Game.css';
import L from 'leaflet';
import { mapApi, gameApi, pokemonApi } from '../services/api';

// Custom marker icon for buildings
const buildingIcon = new Icon({
  iconUrl: '/building-icon.png',
  iconSize: [0, 0], // Hidden icon, only Circle will be visible
});

// Calculate distance between two points
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
};

// Map boundaries controller
function MapBoundaryController() {
  const map = useMap();

  useEffect(() => {
    // Set zoom limits
    const minZoom = 16;
    const maxZoom = 18;
    map.setMinZoom(minZoom);
    map.setMaxZoom(maxZoom);

    // Set map boundaries
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

// Custom component for hot/cold detection
function ProximityDetector({ buildings, setMouseTemperature, nearestPokemonDistance }) {
  const map = useMapEvents({
    mousemove: (e) => {
      const { lat, lng } = e.latlng;
      
      // Find closest building with a pokemon
      let closestDistance = Infinity;
      buildings.forEach(building => {
        if (building.hasPokemon) {
          const distance = calculateDistance(
            lat, lng, 
            building.position[0], building.position[1]
          );
          if (distance < closestDistance) {
            closestDistance = distance;
          }
        }
      });
      
      // Set temperature based on distance
      setMouseTemperature(closestDistance);
    }
  });
  
  return null;
}

function Game() {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [inventory, setInventory] = useState({
    normal: 5,
    super: 3,
    ultra: 1
  });
  const [foundPokemon, setFoundPokemon] = useState(null);
  const [score, setScore] = useState(0);
  const [buildings, setBuildings] = useState([]);
  const [zoneId, setZoneId] = useState(1); // Default zone ID
  const [mouseTemperature, setMouseTemperature] = useState(null);
  const [catchResult, setCatchResult] = useState(null);
  const [showCatchAnimation, setShowCatchAnimation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentMapCenter, setCurrentMapCenter] = useState([43.238949, 76.889709]); // Almaty center
  const timerRef = useRef(null);
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  // Load buildings and spawn pokemons
  useEffect(() => {
    const fetchBuildingsAndSpawnPokemons = async () => {
      try {
        setLoading(true);
        
        // Get buildings in the current zone
        const zoneBuildings = await mapApi.getBuildingsInZone(zoneId);
        
        // Get random pokemons for spawning
        const buildingsWithPokemon = await Promise.all(
          zoneBuildings.map(async (building, index) => {
            // Add pokemon to some buildings (around 60%)
            const hasPokemon = Math.random() > 0.4;
            
            if (hasPokemon) {
              const randomPokemon = await pokemonApi.getRandomPokemon();
              
              // Create spawn in the database
              const spawnData = {
                pokemonId: randomPokemon.id,
                buildingId: building.id,
                zoneId: zoneId,
                expireAt: new Date(Date.now() + 60000).toISOString() // Expires in 60 seconds
              };
              
              try {
                const spawn = await gameApi.createSpawn(spawnData);
                return {
                  ...building,
                  hasPokemon: true,
                  pokemon: randomPokemon,
                  spawnId: spawn.id
                };
              } catch (error) {
                console.error("Error creating spawn:", error);
                return {
                  ...building,
                  hasPokemon: false
                };
              }
            }
            
            return {
              ...building,
              hasPokemon: false
            };
          })
        );
        
        setBuildings(buildingsWithPokemon);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    if (gameStarted) {
      fetchBuildingsAndSpawnPokemons();
    }
  }, [gameStarted, zoneId]);

  // Start game function
  const startGame = () => {
    setGameStarted(true);
    setTimeLeft(60);
    setScore(0);
    setFoundPokemon(null);
    setCatchResult(null);

    setInventory({
      normal: 5,
      super: 3,
      ultra: 1
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

  // End game function
  const endGame = () => {
    setGameStarted(false);
    setTimeLeft(60);
    setFoundPokemon(null);
    setCatchResult(null);
    
    // Show game over modal or navigate to results
    navigate('/results', { 
      state: { 
        score, 
        caughtPokemons: buildings.filter(b => b.caught).map(b => b.pokemon) 
      } 
    });
  };

  // Check building for pokemon
  const checkBuilding = async (building) => {
    if (building.hasPokemon && !building.caught) {
      setFoundPokemon({
        ...building.pokemon,
        spawnId: building.spawnId,
        buildingId: building.id
      });
    } else if (building.caught) {
      alert('You already caught the Pokémon in this building!');
    } else {
      alert('No Pokémon found in this building!');
    }
  };

  // Try to catch pokemon with selected pokeball
  const tryCatchPokemon = async (pokeballType) => {
    if (inventory[pokeballType] > 0) {
      // Update inventory
      setInventory(prev => ({
        ...prev,
        [pokeballType]: prev[pokeballType] - 1
      }));
      
      try {
        // Start catch animation
        setShowCatchAnimation(true);
        
        // Call catch API
        const catchData = {
          userId: userData.id,
          spawnId: foundPokemon.spawnId,
          pokeballType
        };
        
        const result = await gameApi.tryCatchPokemon(catchData);
        
        // Wait for animation to finish
        setTimeout(() => {
          setShowCatchAnimation(false);
          
          // Update catch result
          setCatchResult(result);
          
          if (result.success) {
            // Mark caught in our local state
            setBuildings(prev => 
              prev.map(b => 
                b.id === foundPokemon.buildingId 
                  ? { ...b, caught: true } 
                  : b
              )
            );
            
            // Update score based on rarity
            const points = calculatePoints(foundPokemon.rarity);
            setScore(prev => prev + points);
            
            // Clear pokemon after 2 seconds
            setTimeout(() => {
              setFoundPokemon(null);
              setCatchResult(null);
            }, 2000);
          } else {
            // If failed, give another chance or run away
            if (Math.random() > 0.7) {
              setTimeout(() => {
                alert('The Pokémon ran away!');
                setFoundPokemon(null);
                setCatchResult(null);
              }, 1000);
            }
          }
        }, 2000);
        
      } catch (error) {
        console.error("Error catching pokemon:", error);
        setShowCatchAnimation(false);
        alert('Error trying to catch the pokémon!');
      }
    } else {
      alert(`You don't have any ${pokeballType} Pokéballs left!`);
    }
  };

  // Calculate points based on pokemon rarity
  const calculatePoints = (rarity) => {
    switch (rarity) {
      case 'Common':
        return 5;
      case 'Uncommon':
        return 10;
      case 'Rare':
        return 20;
      case 'Legendary':
        return 50;
      default:
        return 5;
    }
  };
  
  // Get temperature color based on distance
  const getTemperatureColor = (distance) => {
    if (distance === null) return 'transparent';
    
    // Convert distance to a color (hot-cold)
    const maxDistance = 0.01; // Maximum distance in coordinates
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    
    // Color ranges from red (hot) to blue (cold)
    const red = Math.floor((1 - normalizedDistance) * 255);
    const blue = Math.floor(normalizedDistance * 255);
    
    return `rgb(${red}, 0, ${blue})`;
  };

  useEffect(() => {
    // Auto-start game when component mounts
    startGame();
  
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="game-container">
      <header className="game-header">
        <h1>Mapachu</h1>
        <div className="header-controls">
          <div className="timer">Time: {timeLeft}s</div>
          <div className="score">Score: {score}</div>
          <Link to="/collection" className="collection-link">My Collection</Link>
        </div>
      </header>

      {gameStarted && (
        <div className="game-content">
          <div className="inventory-panel">
            <h3>Inventory</h3>
            <div className="pokeballs">
              <div className="pokeball-item">
                <div className="pokeball normal"></div>
                <span>x{inventory.normal}</span>
              </div>
              <div className="pokeball-item">
                <div className="pokeball super"></div>
                <span>x{inventory.super}</span>
              </div>
              <div className="pokeball-item">
                <div className="pokeball ultra"></div>
                <span>x{inventory.ultra}</span>
              </div>
            </div>
          </div>

          <div className="map-wrapper" style={{ borderColor: getTemperatureColor(mouseTemperature) }}>
            {loading ? (
              <div className="loading-overlay">
                <div className="loading-pokeball"></div>
                <p>Loading map...</p>
              </div>
            ) : (
              <MapContainer
                center={currentMapCenter}
                zoom={17}
                className="game-map"
                zoomControl={true}
                attributionControl={false}
              >
                <MapBoundaryController />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                
                {buildings.map(building => (
                  <Circle
                    key={building.id}
                    center={[building.position[0], building.position[1]]}
                    radius={20}
                    pathOptions={{
                      fillColor: building.caught ? '#aaa' : '#3388ff',
                      fillOpacity: 0.8,
                      color: building.caught ? '#888' : '#0066cc',
                      weight: 2
                    }}
                    eventHandlers={{
                      click: () => checkBuilding(building)
                    }}
                  >
                    <Popup>
                      <div className="building-popup">
                        <h3>{building.name}</h3>
                        {building.caught && <p>Pokémon already caught!</p>}
                      </div>
                    </Popup>
                  </Circle>
                ))}
                
                <ProximityDetector 
                  buildings={buildings}
                  setMouseTemperature={setMouseTemperature}
                />
              </MapContainer>
            )}
          </div>

          {foundPokemon && (
            <div className="pokemon-encounter">
              <div className="pokemon-card">
                <h2>{foundPokemon.name}</h2>
                <div className="pokemon-image">
                  <img src={foundPokemon.imageUrl || `/pokemon/${foundPokemon.id}.png`} alt={foundPokemon.name} />
                </div>
                <div className="pokemon-details">
                  <p><strong>Type:</strong> {foundPokemon.type}</p>
                  <p><strong>Rarity:</strong> {foundPokemon.rarity}</p>
                  <p><strong>Strength:</strong> {foundPokemon.strength || Math.floor(Math.random() * 100) + 1}</p>
                </div>
                
                {showCatchAnimation ? (
                  <div className="catch-animation">
                    <div className="catching-pokeball"></div>
                    <p>Catching...</p>
                  </div>
                ) : catchResult ? (
                  <div className={`catch-result ${catchResult.success ? 'success' : 'failure'}`}>
                    <h3>{catchResult.success ? 'Gotcha!' : 'Failed!'}</h3>
                    <p>{catchResult.message}</p>
                  </div>
                ) : (
                  <div className="catch-actions">
                    <button 
                      onClick={() => tryCatchPokemon('normal')} 
                      disabled={inventory.normal <= 0}
                      className="catch-button normal"
                    >
                      Normal Ball ({inventory.normal})
                    </button>
                    <button 
                      onClick={() => tryCatchPokemon('super')} 
                      disabled={inventory.super <= 0}
                      className="catch-button super"
                    >
                      Super Ball ({inventory.super})
                    </button>
                    <button 
                      onClick={() => tryCatchPokemon('ultra')} 
                      disabled={inventory.ultra <= 0}
                      className="catch-button ultra"
                    >
                      Ultra Ball ({inventory.ultra})
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {!gameStarted && (
        <div className="game-start">
          <h2>Ready to catch 'em all?</h2>
          <button onClick={startGame} className="start-button">Start Game</button>
        </div>
      )}
    </div>
  );
}

export default Game;