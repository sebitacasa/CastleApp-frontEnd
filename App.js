import 'react-native-gesture-handler';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import AnimatedSplash from './src/components/AnimatedSplash';

// 💡 Evita que el splash nativo se oculte solo: lo controlamos a mano para
// pasar del logo estático nativo al mismo logo ya girando en AnimatedSplash.
SplashScreen.preventAutoHideAsync();

// Tiempo mínimo que se ve la brújula girando, para que la animación no
// desaparezca de un flash si el login ya estaba resuelto en caché.
const MIN_SPLASH_DURATION = 1800;

// 💡 1. IMPORTAMOS TU NUEVA PALETA GLOBAL
import { APP_PALETTE } from './src/theme/colors';

// Import screens
import FeedScreen from './src/screens/FeedScreen';
import DetailScreen from './src/screens/DetailScreen'; 
import MapScreen from './src/screens/MapScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import HistoryMapScreen from './src/screens/HistoryMapScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator(); 

// 💡 2. CREAMOS Y EXPORTAMOS EL CONTEXTO DEL TEMA
// Para que cualquier pantalla pueda usar import { ThemeContext } from '../../App'
export const ThemeContext = createContext(APP_PALETTE);

// --- DEEP LINKING CONFIG ---
const linking = {
  prefixes: [Linking.createURL('/'), 'castleapp-dev://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Feed: 'feed',
        }
      },
      Login: 'login',
      Register: 'register',
      Favorites: 'favorites',
    },
  },
};

// 💡 3. ACTUALIZAMOS EL TEMA DEL HEADER
const screenOptions = {
    headerStyle: { 
      backgroundColor: APP_PALETTE.bg, 
      elevation: 0, // Quita la sombra en Android para un look más limpio
      shadowOpacity: 0 // Quita la sombra en iOS
    },
    headerTintColor: APP_PALETTE.gold, 
    headerTitleStyle: { fontWeight: 'bold', color: APP_PALETTE.text },
    headerBackTitleVisible: false, 
};

// --- 1. TAB NAVIGATOR (The Bottom Bar) ---
const MainTabs = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: APP_PALETTE.bg, // 💡 Fondo claro
          borderTopColor: APP_PALETTE.border, // 💡 Borde tenue
          paddingBottom: 5,
          height: 60
        },
        tabBarActiveTintColor: APP_PALETTE.gold, // 💡 Bronce para el activo
        tabBarInactiveTintColor: APP_PALETTE.subText, // 💡 Gris pardo inactivo
      }}
    >
      <Tab.Screen 
        name="Feed" 
        component={FeedScreen} 
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="compass" size={24} color={color} />
        }}
      />

      <Tab.Screen 
        name="Discover" 
        component={SearchScreen} 
        listeners={{
          tabPress: (e) => {
            if (!userInfo) {
              e.preventDefault(); 
              navigation.navigate('LoginScreen'); 
            }
          },
        }}
        options={{
          tabBarLabel: 'Add Place',
          tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />
        }}
      />

      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />
        }}
      />
    </Tab.Navigator>
  );
};

// --- 2. MAIN STACK (The Container) ---
const AppNavigation = () => {
  const { isLoading } = useContext(AuthContext);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // 💡 El splash nativo ya muestra la misma brújula sobre el mismo fondo,
    // así que ocultarlo apenas montamos AnimatedSplash es una transición invisible.
    SplashScreen.hideAsync();
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !minTimeElapsed) {
    return <AnimatedSplash />;
  }

  return (
    
    <Stack.Navigator 
        initialRouteName="MainTabs" 
        screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />

      <Stack.Screen name="Detail" component={DetailScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen 
        name="Favorites" 
        component={FavoritesScreen} 
        options={{ 
            ...screenOptions, 
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
    // 💡 4. ENVOLVEMOS TODA LA APP EN TU NUEVO CONTEXTO DE TEMA
    <ThemeContext.Provider value={APP_PALETTE}>
      <AuthProvider>
        <FavoritesProvider>
          <NavigationContainer linking={linking}>
            {/* 💡 BARRA DE ESTADO ACTUALIZADA PARA FONDOS CLAROS (letras oscuras) */}
            <StatusBar barStyle="dark-content" backgroundColor={APP_PALETTE.bg} />
            <AppNavigation />
          </NavigationContainer>
        </FavoritesProvider>
      </AuthProvider>
    </ThemeContext.Provider>
  );
}