import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocationData } from '../types';

const FAVORITES_KEY = '@my_castle_favorites';

export const getFavorites = async (): Promise<LocationData[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
    return jsonValue != null ? (JSON.parse(jsonValue) as LocationData[]) : [];
  } catch (e) {
    console.error('Error reading favorites:', e);
    return [];
  }
};

export const toggleFavorite = async (location: LocationData): Promise<boolean> => {
  try {
    const existing = await getFavorites();
    const isFav = existing.some(i => i.id === location.id);
    let newFavs: LocationData[];
    if (isFav) {
      newFavs = existing.filter(i => i.id !== location.id);
    } else {
      newFavs = [...existing, location];
    }
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
    return !isFav;
  } catch (e) {
    console.error('Error saving favorite:', e);
    return false;
  }
};

export const checkIsFavorite = async (id: string): Promise<boolean> => {
  try {
    const existing = await getFavorites();
    return existing.some(i => i.id === id);
  } catch (e) {
    return false;
  }
};
