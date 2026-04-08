/**
 * AuthContext.js
 * ──────────────
 * - On app start: reads saved token from AsyncStorage → calls /getuser → restores session
 * - login(user, token): saves token, sets user in state
 * - logout(): clears token, clears user
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);   // true while checking AsyncStorage

  // ── Restore session on app launch ────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          try {
            const userData = await getUser(token);
            setUser(userData);
          } catch (err) {
            console.error('Failed to fetch user:', err?.message);
            // Token expired or invalid — clear it silently
            await AsyncStorage.removeItem('token');
          }
        }
      } catch (err) {
        console.error('AsyncStorage error:', err?.message);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ── login — called by LoginScreen and RegisterScreen after success ────────
  const login = (userData, token) => {
    setUser(userData);
    // token is already saved to AsyncStorage inside authService.login()
  };

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);