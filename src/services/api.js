import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const apiService = {
  getZones: async () => {
    const { data } = await axios.get(`${API_BASE_URL}/zones`);
    return data;
  },
  getBuildingsByZone: async (zoneId) => {
    const { data } = await axios.get(`${API_BASE_URL}/zones/${zoneId}/buildings`);
    return data;
  },
  getSpawnsByZone: async (zoneId) => {
    const { data } = await axios.get(`${API_BASE_URL}/spawns/zone/${zoneId}`);
    return data;
  },
  catchPokemon: async (spawnId, userId, pokeballType) => {
    const { data } = await axios.post(`${API_BASE_URL}/catch`, { spawnId, userId, pokeballType });
    return data;
  },
  createUser: async ({ username }) => {
    const { data } = await axios.post(`${API_BASE_URL}/users`, { username });
    return data;
  },
  getCollection: async (userId) => {
    const { data } = await axios.get(`${API_BASE_URL}/collection/${userId}`);
    return data;
  }
};

export default apiService;