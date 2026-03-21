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
  const { data } = await api.post('/api/users/signup', {
    name,
    email,
    password,
    role,        // "viewer" or "policy-maker"
    department,
  });
  return data;   // { message, data: createdUser }
};

// ── POST /login ───────────────────────────────────────────────────────────────
// Backend returns { message, token } — no user object
// We then call /getuser to fetch the full user profile
export const login = async (email, password) => {
  const { data } = await api.post('/api/users/login', { email, password });

  const token = data.token;

  // Persist token to AsyncStorage immediately
  await AsyncStorage.setItem('token', token);

  // Fetch full user profile using the token
  const userResponse = await api.post('/api/users/getuser', { token });
  const user = userResponse.data.data;  // { _id, name, email, role, department }

  return { token, user };
};

// ── POST /getuser ─────────────────────────────────────────────────────────────
export const getUser = async (token) => {
  const { data } = await api.post('/api/users/getuser', { token });
  return data.data;   // { _id, name, email, role, department }
};

// ── Clear token on logout ─────────────────────────────────────────────────────
export const logout = async () => {
  await AsyncStorage.removeItem('token');
};