import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
// import MainTabs from './MainTabs'; // ← add this later

export default function RootNavigator() {
  const { user, loading } = useAuth();

  // Still checking AsyncStorage on startup
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        // <MainTabs /> // ← uncomment when you build the main screens
        <AuthStack />   // temporary — replace with MainTabs later
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}