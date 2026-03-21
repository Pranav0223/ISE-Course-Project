import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import PolicyInputScreen  from '../screens/simulation/PolicyInputScreen';
import ConfirmRulesScreen from '../screens/simulation/ConfirmRulesScreen';
import ResultsScreen      from '../screens/simulation/ResultsScreen';
import IndiaMapScreen     from '../screens/simulation/IndiaMapScreen';

const Stack = createNativeStackNavigator();

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PolicyInput"  component={PolicyInputScreen} />
      <Stack.Screen name="ConfirmRules" component={ConfirmRulesScreen} />
      <Stack.Screen name="Results"      component={ResultsScreen} />
      <Stack.Screen name="IndiaMap"     component={IndiaMapScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}