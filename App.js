import 'react-native-gesture-handler';
import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking'; // <--- 1. IMPORTANTE: Agrega esto

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import FeedScreen from './src/screens/FeedScreen';
import DetailScreen from './src/screens/DetailScreen'; 
import MapScreen from './src/screens/MapScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import HistoryMapScreen from './src/screens/HistoryMapScreen';

const Stack = createStackNavigator();

// --- 2. CONFIGURACIÓN DE DEEP LINKING ---
// Esto le dice a la navegación: "¡Escucha los enlaces que empiecen con castleapp-dev://!"
const linking = {
  prefixes: [Linking.createURL('/'), 'castleapp-dev://'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      Feed: 'feed',
    },
  },
};

const AppNavigation = () => {
  const { isLoading, userToken } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#203040" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken == null ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Feed" component={FeedScreen} />
          <Stack.Screen name="Detail" component={DetailScreen} />
          <Stack.Screen name="MapScreen" component={MapScreen} />
        </>
      )}
      <Stack.Screen 
                name="Favorites" 
                component={FavoritesScreen} 
                options={{ title: 'My Favorites', headerShown: true }} // Opcional: headerShown true para tener flecha de volver por defecto
            />
            <Stack.Screen name="HistoryMap" component={HistoryMapScreen} />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
      <NavigationContainer linking={linking}>
        <AppNavigation />
      </NavigationContainer>

      </FavoritesProvider>
      {/* 3. AGREGAMOS LA PROP LINKING AQUÍ 👇 */}
    </AuthProvider>
  );
}