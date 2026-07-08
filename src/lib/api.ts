import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update to your machine's local IP when running on a physical device
export const API_URL = 'http://192.168.1.100:8000/api/v1';

// Client for our own backend
const api = axios.create({ baseURL: API_URL });

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-clear token on 401 (expired / invalid)
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
    }
    return Promise.reject(err);
  }
);

// Separate instance for FakeStore — no auth header, no base URL
export const fakeStoreApi = axios.create({ baseURL: 'https://fakestoreapi.com' });

export default api;
