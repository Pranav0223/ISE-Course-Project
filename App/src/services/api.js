import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://10.0.2.2:5000/api/v1', // Android emulator localhost
  // baseURL: 'http://YOUR_LOCAL_IP:5000/api/v1', // Real device - use your PC's IP
  timeout: 10000,
});

// Auto-attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;