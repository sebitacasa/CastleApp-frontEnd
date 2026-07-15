import type { Region as MapRegion } from 'react-native-maps';

// ─── Navigation param lists ───────────────────────────────────────────────────

export type RootStackParamList = {
  MainTabs: undefined;
  Detail: { locationData: LocationData };
  LoginScreen: undefined;
  Register: undefined;
  ProfileScreen: undefined;
  MyDiscoveries: undefined;
  Conquests: { friendId?: string; friendName?: string };
  Friends: { initialTab?: string };
  Favorites: undefined;
  HistoryMap: undefined;
};

export type MainTabParamList = {
  Feed: undefined;
  Discover: undefined;
  Map: { feedLocations?: LocationData[]; currentCoords?: MapRegion | null };
};

// ─── Core domain types ────────────────────────────────────────────────────────

export interface LocationData {
  id: string;
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lon?: number;
  image_url?: string | null;
  images?: string[];
  category?: string;
  source?: 'db' | 'google';
  distance?: number | null;
  computedDistance?: number | null;
  country?: string;
  country_code?: string;
  wiki_title?: string;
  google_place_id?: string;
  vicinity?: string;
  image_source?: string;
  address?: string;
  city?: string;
  // Fields from conquests
  place_name?: string;
  place_lat?: number;
  place_lon?: number;
  conquered_at?: string;
  location_id?: string;
}

export interface UserInfo {
  id?: string;
  name?: string;
  email?: string;
  picture?: string;
  photoURL?: string;
  displayName?: string;
  avatar_url?: string;
  username?: string;
  given_name?: string;
  full_name?: string;
  user_metadata?: { avatar_url?: string; full_name?: string };
  user?: {
    id?: string;
    avatar_url?: string;
    photoURL?: string;
    user_metadata?: { avatar_url?: string; full_name?: string };
  };
}

export interface AuthContextType {
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: (googleToken: string, normalizedUser?: any) => Promise<void>;
  isLoading: boolean;
  userToken: string | null;
  userInfo: UserInfo | null;
}

export interface FavoritesContextType {
  favorites: LocationData[];
  toggleFavorite: (item: LocationData) => void;
  isFavorite: (id: string) => boolean;
}

export interface TopCity {
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
}

export interface RecommendedRegion {
  id: string;
  name: string;
  label: string;
  image: string;
}
