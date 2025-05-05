import apiService from './api';

// Temporary mock service until backend is connected
const gameService = {
  // User related methods
  getCurrentUser: () => {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  },
  
  setCurrentUser: (user) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  },
  
  // Zone and buildings methods
  getZone: async (zoneId = 1) => {
    try {
      // This would be an API call in production
      return {
        id: zoneId,
        name: "Almaty Center",
        boundaries: {
          southWest: [43.228949, 76.879709],
          northEast: [43.248949, 76.899709]
        },
        center: [43.238949, 76.889709],
      };
    } catch (error) {
      console.error("Error getting zone:", error);
      throw error;
    }
  },
  
  getBuildings: async (zoneId = 1) => {
    try {
      // This would be an API call in production
      // For now, return some sample buildings for Almaty
      return [
        { id: 1, position: [43.238949, 76.889709], name: "Mega Center" },
        { id: 2, position: [43.236949, 76.887709], name: "Esentai Mall" },
        { id: 3, position: [43.240949, 76.891709], name: "Dostyk Plaza" },
        { id: 4, position: [43.235949, 76.892709], name: "Almaty Arena" },
        { id: 5, position: [43.242949, 76.886709], name: "Kazakhstan Hotel" },
        { id: 6, position: [43.233949, 76.885709], name: "Central Stadium" },
        { id: 7, position: [43.244949, 76.893709], name: "Kok Tobe" },
      ];
    } catch (error) {
      console.error("Error getting buildings:", error);
      throw error;
    }
  },
  
  // Pokémon related methods
  getSpawns: async (zoneId = 1) => {
    try {
      // This would be an API call in production
      const buildings = await gameService.getBuildings(zoneId);
      
      // Randomly assign Pokémon to some buildings
      const pokemonTypes = ["Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground"];
      const rarities = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary"];
      const pokemonNames = [
        "Pikachu", "Charmander", "Bulbasaur", "Squirtle", "Jigglypuff", 
        "Eevee", "Meowth", "Psyduck", "Geodude", "Snorlax"
      ];
      
      return buildings.map(building => {
        // 60% chance a building has a Pokémon
        const hasPokemon = Math.random() < 0.6;
        
        if (hasPokemon) {
          const randomType = pokemonTypes[Math.floor(Math.random() * pokemonTypes.length)];
          const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
          const randomName = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
          
          return {
            ...building,
            hasPokemon: true,
            pokemon: {
              id: Math.floor(Math.random() * 1000),
              name: randomName,
              type: randomType,
              rarity: randomRarity,
              strength: Math.floor(Math.random() * 100) + 1
            }
          };
        }
        
        return {
          ...building,
          hasPokemon: false
        };
      });
    } catch (error) {
      console.error("Error getting spawns:", error);
      throw error;
    }
  },
  
  // Catching mechanics
  catchPokemon: async (spawnId, userId, pokeballType) => {
    try {
      // This would be an API call in production
      // For now, calculate catch chance based on ball type
      const catchChances = {
        normal: 0.5,
        great: 0.7,
        ultra: 0.9
      };
      
      const catchChance = catchChances[pokeballType] || 0.5;
      const caught = Math.random() < catchChance;
      
      return {
        success: caught,
        message: caught ? "You caught it!" : "It got away!",
        xpGained: caught ? 10 : 0
      };
    } catch (error) {
      console.error("Error catching Pokémon:", error);
      throw error;
    }
  }
};

export default gameService;