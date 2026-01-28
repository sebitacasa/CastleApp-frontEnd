import 'react-native-gesture-handler';
import React, { useContext } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { FavoritesProvider } from './src/context/FavoritesContext';

// Importación de pantallas
import FeedScreen from './src/screens/FeedScreen';
import DetailScreen from './src/screens/DetailScreen'; 
import MapScreen from './src/screens/MapScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import HistoryMapScreen from './src/screens/HistoryMapScreen';

const Stack = createStackNavigator();

// --- CONFIGURACIÓN DE DEEP LINKING ---
const linking = {
  prefixes: [Linking.createURL('/'), 'castleapp-dev://'],
  config: {
    screens: {
      Feed: 'feed',
      Login: 'login',
      Register: 'register',
      Favorites: 'favorites',
    },
  },
};

// Tema visual para las cabeceras de navegación (coincide con tu THEME)
const screenOptions = {
    headerStyle: { backgroundColor: '#121212' },
    headerTintColor: '#D4AF37', // Dorado
    headerTitleStyle: { fontWeight: 'bold' },
    headerBackTitleVisible: false, // Ocultar texto "Back" en iOS
};

const AppNavigation = () => {
  const { isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    // 🚀 CAMBIO CRÍTICO: Eliminamos la condición (userToken ? ... : ...)
    // Ahora todas las pantallas están disponibles, pero la inicial es siempre FEED.
    <Stack.Navigator 
        initialRouteName="Feed" 
        screenOptions={{ headerShown: false }}
    >
      {/* --- PANTALLAS PÚBLICAS (Todos acceden) --- */}
      <Stack.Screen name="Feed" component={FeedScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
      <Stack.Screen name="MapScreen" component={MapScreen} />

      {/* --- PANTALLAS DE AUTH (Se acceden bajo demanda) --- */}
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />

      {/* --- PANTALLAS PROTEGIDAS (El botón en Feed las protege) --- */}
      <Stack.Screen 
        name="Favorites" 
        component={FavoritesScreen} 
        options={{ 
            ...screenOptions, // Hereda estilos oscuros
            headerShown: true, 
            title: 'My Favorites' 
        }} 
      />
      
      <Stack.Screen 
        name="HistoryMap" 
        component={HistoryMapScreen} 
        options={{ 
            ...screenOptions,
            headerShown: true,
            title: 'My Conquests'
        }} 
      />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <NavigationContainer linking={linking}>
          <StatusBar barStyle="light-content" backgroundColor="#121212" />
          <AppNavigation />
        </NavigationContainer>
      </FavoritesProvider>
    </AuthProvider>
  );
}