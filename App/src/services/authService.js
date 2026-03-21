/**
 * authService.js
 * ──────────────
 * Matched to backend endpoints in UserRoutes.js:
 *
 *   POST /signup   → { name, email, password, role, department }
 *   POST /login    → { email, password }  returns { message, token }
 *   POST /getuser  → { token }            returns { message, data: user }
 *
 * NOTE: Backend role enum is "viewer" | "policy-maker" | "admin"
 */

import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── POST /signup ──────────────────────────────────────────────────────────────
export const register = async (name, email, password, role, department) => {
  const { data } = await api.post('/api/users/signup', {  // ← changed
    name, email, password, role, department,
  });
  return data;
};

export const login = async (email, password) => {
  const { data } = await api.post('/api/users/login', { email, password });  // ← changed
  const token = data.token;
  await AsyncStorage.setItem('token', token);
  const userResponse = await api.post('/api/users/getuser', { token });  // ← changed
  const user = userResponse.data.data;
  return { token, user };
};

export const getUser = async (token) => {
  const { data } = await api.post('/api/users/getuser', { token });  // ← changed
  return data.data;
};

// ── Clear token on logout ─────────────────────────────────────────────────────
export const logout = async () => {
  await AsyncStorage.removeItem('token');
};