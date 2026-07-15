import 'react-native-gesture-handler';
import './src/i18n'; // must be imported before any screen
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigationContainerRef } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts, BerkshireSwash_400Regular } from '@expo-google-fonts/berkshire-swash';
import { registerPushToken } from './src/utils/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import AnimatedSplash from './src/components/AnimatedSplash';

SplashScreen.preventAutoHideAsync();

const MIN_SPLASH_DURATION = 1800;

import { APP_PALETTE } from './src/theme/colors';
import type { RootStackParamList, MainTabParamList } from './src/types';

// Screens
import FeedScreen from './src/screens/FeedScreen';
import DetailScreen from './src/screens/DetailScreen';
import MapScreen from './src/screens/MapScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import HistoryMapScreen from './src/screens/HistoryMapScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import MyDiscoveriesScreen from './src/screens/MyDiscoveriesScreen';
import ConquestsScreen from './src/screens/ConquestsScreen';
import FriendsScreen from './src/screens/FriendsScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

export const ThemeContext = createContext(APP_PALETTE);

const linking = {
  prefixes: [Linking.createURL('/'), 'castleapp-dev://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Feed: 'feed',
        },
      },
      LoginScreen: 'login',
      Register: 'register',
      Favorites: 'favorites',
    },
  },
};

const screenOptions = {
  headerStyle: {
    backgroundColor: APP_PALETTE.bg,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTintColor: APP_PALETTE.gold,
  headerTitleStyle: { fontWeight: 'bold' as const, color: APP_PALETTE.text },
  headerBackTitleVisible: false,
};

// --- TAB NAVIGATOR ---
const MainTabs = ({ navigation }: { navigation: any }): React.ReactElement => {
  const { userInfo } = useContext(AuthContext);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: APP_PALETTE.bg,
          borderTopColor: APP_PALETTE.border,
          paddingBottom: 5,
          height: 60,
        },
        tabBarActiveTintColor: APP_PALETTE.gold,
        tabBarInactiveTintColor: APP_PALETTE.subText,
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="compass" size={24} color={color} />,
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
          tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

// --- MAIN STACK ---
interface AppNavigationProps {
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>;
}

const SAFETY_TIMEOUT = 6000;

const AppNavigation = ({ navigationRef }: AppNavigationProps): React.ReactElement | null => {
  const { isLoading, userToken } = useContext(AuthContext);
  const [minTimeElapsed, setMinTimeElapsed] = useState<boolean>(false);
  const [safetyElapsed, setSafetyElapsed] = useState<boolean>(false);
  const [fontsLoaded, fontError] = useFonts({ BerkshireSwash_400Regular });
  const tokenRegistered = useRef<boolean>(false);

  useEffect(() => {
    SplashScreen.hideAsync();
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_DURATION);
    // Safety net: never block forever regardless of what hangs
    const safety = setTimeout(() => setSafetyElapsed(true), SAFETY_TIMEOUT);
    return () => { clearTimeout(timer); clearTimeout(safety); };
  }, []);

  useEffect(() => {
    if (userToken && !tokenRegistered.current) {
      tokenRegistered.current = true;
      registerPushToken(userToken);
    }
    if (!userToken) {
      tokenRegistered.current = false;
    }
  }, [userToken]);

  const fontsReady = fontsLoaded || !!fontError;
  const appReady = !isLoading && minTimeElapsed && fontsReady;

  if (!appReady && !safetyElapsed) {
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
      <Stack.Screen name="MyDiscoveries" component={MyDiscoveriesScreen} />
      <Stack.Screen name="Conquests" component={ConquestsScreen} />
      <Stack.Screen name="Friends" component={FriendsScreen} />
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          ...screenOptions,
          headerShown: true,
          title: 'My Favorites',
        }}
      />
      <Stack.Screen
        name="HistoryMap"
        component={HistoryMapScreen}
        options={{
          ...screenOptions,
          headerShown: true,
          title: 'My Conquests',
        }}
      />
    </Stack.Navigator>
  );
};

export default function App(): React.ReactElement {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      if (!data?.screen) return;
      const tryNavigate = (): void => {
        if (navigationRef.current?.isReady()) {
          navigationRef.current.navigate(data.screen as any, data.tab ? { initialTab: data.tab } : undefined);
        } else {
          setTimeout(tryNavigate, 100);
        }
      };
      tryNavigate();
    });
    return () => sub.remove();
  }, []);

  return (
    <ThemeContext.Provider value={APP_PALETTE}>
      <AuthProvider>
        <FavoritesProvider>
          <NavigationContainer ref={navigationRef} linking={linking}>
            <StatusBar barStyle="dark-content" backgroundColor={APP_PALETTE.bg} />
            <AppNavigation navigationRef={navigationRef} />
          </NavigationContainer>
        </FavoritesProvider>
      </AuthProvider>
    </ThemeContext.Provider>
  );
}
