const API_URL = 'http://localhost:8080';

// Helper function to handle fetch requests
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error: ${response.status}`);
  }
  
  if (response.status === 204) {
    return null;
  }
  
  return await response.json();
};

// User related API calls
export const userApi = {
  // Login user
  login: (username, password) => 
    fetchWithAuth('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  
  // Register new user
  register: (username, password) => 
    fetchWithAuth('/api/users', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  
  // Get user by ID
  getUser: (userId) => fetchWithAuth(`/api/users/${userId}`),
  
  // Get user collection
  getUserCollection: (userId) => fetchWithAuth(`/api/collection/${userId}`),
  
  // Delete pokemon from collection
  deletePokemonFromCollection: (userId, pokemonId) => 
    fetchWithAuth(`/api/collection/${userId}/${pokemonId}`, {
      method: 'DELETE',
    }),
};

// Pokemon related API calls
export const pokemonApi = {
  // Get all pokemons
  getAllPokemons: () => fetchWithAuth('/api/pokemons'),
  
  // Get pokemon by ID
  getPokemon: (pokemonId) => fetchWithAuth(`/api/pokemons/${pokemonId}`),
  
  // Get random pokemon
  getRandomPokemon: () => fetchWithAuth('/api/pokemon/random'),
};

// Zone and building related API calls
export const mapApi = {
  // Get all zones
  getAllZones: () => fetchWithAuth('/api/zones'),
  
  // Get buildings in a zone
  getBuildingsInZone: (zoneId) => fetchWithAuth(`/api/zones/${zoneId}/buildings`),
  
  // Get building by ID
  getBuilding: (buildingId) => fetchWithAuth(`/api/buildings/${buildingId}`),
  
  // Get active spawns in a zone
  getSpawnsInZone: (zoneId) => fetchWithAuth(`/api/spawns/zone/${zoneId}`),
};

// Gameplay related API calls
export const gameApi = {
  // Get all pokeballs
  getAllPokeballs: () => fetchWithAuth('/api/pokeballs'),
  
  // Get pokeball by type
  getPokeball: (type) => fetchWithAuth(`/api/pokeballs/${type}`),
  
  // Create a new spawn
  createSpawn: (spawnData) => 
    fetchWithAuth('/api/spawns', {
      method: 'POST',
      body: JSON.stringify(spawnData),
    }),
  
  // Mark spawn as caught
  markSpawnAsCaught: (spawnId) => 
    fetchWithAuth(`/api/spawns/${spawnId}/caught`, {
      method: 'PUT',
    }),
  
  // Try to catch a Pokemon
  tryCatchPokemon: (catchData) => 
    fetchWithAuth('/api/catch', {
      method: 'POST',
      body: JSON.stringify(catchData),
    }),
};

export default {
  user: userApi,
  pokemon: pokemonApi,
  map: mapApi,
  game: gameApi,
};