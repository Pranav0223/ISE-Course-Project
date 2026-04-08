import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const envBaseUrl = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_BASE_URL : undefined;
const isWeb = Platform.OS === 'web';
const fallbackBaseUrl = isWeb ? 'http://localhost:3000' : 'http://10.30.84.168:3000';
const API_BASE_URL = envBaseUrl || fallbackBaseUrl;


const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
