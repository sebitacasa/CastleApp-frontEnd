import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext'; // Para separar favoritos por usuario

export const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const { userToken } = useContext(AuthContext); // (Opcional) Si quieres vincularlo al usuario

  // 1. Cargar favoritos al iniciar
  useEffect(() => {
    loadFavorites();
  }, [userToken]);

  const loadFavorites = async () => {
    try {
      // Usamos una clave única. Si usas usuarios, podrías concatenar el ID del usuario
      const stored = await AsyncStorage.getItem('@my_app_favorites');
      if (stored) setFavorites(JSON.parse(stored));
    } catch (e) {
      console.error("Error cargando favoritos", e);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem('@my_app_favorites', JSON.stringify(newFavorites));
    } catch (e) {
      console.error("Error guardando favoritos", e);
    }
  };

  // 2. Función principal: Agregar o Quitar
  const toggleFavorite = (castle) => {
    let newList = [];
    const exists = favorites.find(item => item.id === castle.id);

    if (exists) {
      // Si ya existe, lo sacamos (Remove)
      newList = favorites.filter(item => item.id !== castle.id);
      console.log(`💔 Eliminado de favoritos: ${castle.name}`);
    } else {
      // Si no existe, lo agregamos (Add)
      newList = [...favorites, castle];
      console.log(`❤️ Agregado a favoritos: ${castle.name}`);
    }

    setFavorites(newList);
    saveFavorites(newList);
  };

  // 3. Helper para saber si un castillo es favorito (para pintar el icono)
  const isFavorite = (id) => {
    return favorites.some(item => item.id === id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};