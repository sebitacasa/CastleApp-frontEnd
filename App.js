import 'react-native-gesture-handler';
import React, { useContext } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // 👈 IMPORT THIS
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { FavoritesProvider } from './src/context/FavoritesContext';

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
const Tab = createBottomTabNavigator(); // 👈 CREATE TAB NAVIGATOR

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

// Header theme
const screenOptions = {
    headerStyle: { backgroundColor: '#121212' },
    headerTintColor: '#D4AF37', 
    headerTitleStyle: { fontWeight: 'bold' },
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
          backgroundColor: '#121212',
          borderTopColor: '#333',
          paddingBottom: 5,
          height: 60
        },
        tabBarActiveTintColor: '#D4AF37', // Gold
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tab.Screen 
        name="Feed" 
        component={FeedScreen} 
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="compass" size={24} color={color} />
        }}
      />

      {/* 👇 HERE IS THE LOGIC TO PROTECT THE SEARCH TAB */}
      <Tab.Screen 
        name="Discover" 
        component={SearchScreen} 
        listeners={{
          tabPress: (e) => {
            // If user is NOT logged in, prevent navigation and go to Login
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

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <Stack.Navigator 
        initialRouteName="MainTabs" 
        screenOptions={{ headerShown: false }}
    >
      {/* The main screen is now the TAB Navigator */}
      <Stack.Screen name="MainTabs" component={MainTabs} />

      {/* Public/Auth screens */}
      <Stack.Screen name="Detail" component={DetailScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      
      {/* Protected screens (accessed via buttons, not tabs) */}
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