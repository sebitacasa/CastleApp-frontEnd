import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FavoritesContextType, LocationData } from '../types';
import { AuthContext } from './AuthContext';

export const FavoritesContext = createContext<FavoritesContextType>({} as FavoritesContextType);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<LocationData[]>([]);
  const { userToken } = useContext(AuthContext);

  useEffect(() => {
    loadFavorites();
  }, [userToken]);

  const loadFavorites = async (): Promise<void> => {
    try {
      const stored = await AsyncStorage.getItem('@my_app_favorites');
      if (stored) setFavorites(JSON.parse(stored) as LocationData[]);
    } catch (e) {
      console.error('Error cargando favoritos', e);
    }
  };

  const saveFavorites = async (newFavorites: LocationData[]): Promise<void> => {
    try {
      await AsyncStorage.setItem('@my_app_favorites', JSON.stringify(newFavorites));
    } catch (e) {
      console.error('Error guardando favoritos', e);
    }
  };

  const toggleFavorite = (castle: LocationData): void => {
    let newList: LocationData[];
    const exists = favorites.find(item => item.id === castle.id);

    if (exists) {
      newList = favorites.filter(item => item.id !== castle.id);
      console.log(`Eliminado de favoritos: ${castle.name}`);
    } else {
      newList = [...favorites, castle];
      console.log(`Agregado a favoritos: ${castle.name}`);
    }

    setFavorites(newList);
    saveFavorites(newList);
  };

  const isFavorite = (id: string): boolean => {
    return favorites.some(item => item.id === id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};
