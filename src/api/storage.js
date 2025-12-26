// src/services/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@my_castle_favorites';

// 1. Guardar o Quitar (Toggle)
// Si ya existe lo borra, si no existe lo agrega.
export const toggleFavorite = async (location) => {
  try {
    const existing = await getFavorites();
    const isFav = existing.some(i => i.id === location.id);
    
    let newFavs;
    if (isFav) {
      // Si ya es favorito -> LO QUITAMOS
      newFavs = existing.filter(i => i.id !== location.id); 
    } else {
      // Si no es favorito -> LO AGREGAMOS
      newFavs = [...existing, location]; 
    }
    
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
    return !isFav; // Devuelve true si ahora es favorito, false si se quitó
  } catch (e) {
    console.error("Error saving favorite:", e);
    return false;
  }
};

// 2. Obtener toda la lista de favoritos
export const getFavorites = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Error reading favorites:", e);
    return [];
  }
};

// 3. Chequear si UNO específico es favorito (para pintar el corazón)
export const checkIsFavorite = async (id) => {
  try {
    const existing = await getFavorites();
    return existing.some(i => i.id === id);
  } catch (e) {
    return false;
  }
};