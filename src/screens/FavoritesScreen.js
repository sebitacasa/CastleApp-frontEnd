import React, { useContext, useLayoutEffect } from 'react'; // 1. Agregamos useLayoutEffect
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  StatusBar,
  Platform
} from 'react-native';
import { FavoritesContext } from '../context/FavoritesContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const API_BASE = 'http://10.0.2.2:8080';

// --- 🎨 PALETA DE COLORES "SCRATCH MAP" ---
const THEME = {
  bg: '#121212',           // Negro Fondo Profundo
  cardBg: '#1E1E1E',       // Gris Oscuro para tarjetas
  gold: '#D4AF37',         // Dorado Clásico
  text: '#F0F0F0',         // Blanco Hueso
  subText: '#A0A0A0',      // Gris Plata
  danger: '#CF6679',       // Rojo suave para borrar
  border: '#333333',       // Borde sutil
};

const FavoritesScreen = () => {
  const { favorites, toggleFavorite } = useContext(FavoritesContext);
  const navigation = useNavigation();

  // 👇 2. ESTO ELIMINA EL NAVBAR BLANCO NATIVO
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // --- HELPER PARA IMÁGENES ---
  const getSecureImage = (item) => {
      if (!item) return 'https://via.placeholder.com/150';

      let rawUrl = item.image_url;
      if (Array.isArray(rawUrl)) rawUrl = rawUrl[0];
      if (typeof rawUrl === 'string' && rawUrl.startsWith('{')) {
          rawUrl = rawUrl.replace(/[{}"\\]/g, '').split(',')[0];
      }
      
      if (!rawUrl) return 'https://via.placeholder.com/150';

      if (rawUrl.includes(API_BASE)) return rawUrl;

      // Proxy
      return `${API_BASE}/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
  };

  // --- SI NO HAY FAVORITOS (Estado Vacío Oscuro) ---
  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
        <MaterialCommunityIcons name="heart-broken" size={80} color={THEME.gold} style={{ opacity: 0.5 }} />
        <Text style={styles.emptyText}>No Treasures Yet</Text>
        <Text style={styles.emptySubText}>Explore the map and mark the places you want to conquer.</Text>
        
        <TouchableOpacity 
            style={styles.exploreButton} 
            onPress={() => navigation.navigate('Feed')}
        >
            <Text style={styles.exploreButtonText}>START EXPLORING</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- RENDER DE LA TARJETA (Dark Mode) ---
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => navigation.navigate('Detail', { locationData: item })}
    >
      {/* IMAGEN */}
      <Image 
        source={{ uri: getSecureImage(item) }} 
        style={styles.image} 
        resizeMode="cover"
      />
      {/* Sombra interna sobre la imagen para que no corte brusco */}
      <View style={styles.imageOverlay} />

      <View style={styles.info}>
        {/* Badge Categoría Dorado */}
        <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category?.toUpperCase() || 'PLACE'}</Text>
        </View>

        <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
        
        <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={12} color={THEME.subText} />
            <Text numberOfLines={1} style={styles.location}>{item.city || item.country || "Unknown Location"}</Text>
        </View>
      </View>

      {/* Botón Borrar (Elegante) */}
      <TouchableOpacity onPress={() => toggleFavorite(item)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={20} color={THEME.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
      
      {/* Cabecera Simple Personalizada */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <Ionicons name="arrow-back" size={24} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <View style={styles.countBadge}>
            <Text style={styles.countText}>{favorites.length}</Text>
        </View>
      </View>
      
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// --- 🎨 ESTILOS "BLACK & GOLD" ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: THEME.bg, 
  },
  
  // Cabecera
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 50 : 60, // Ajuste para status bar
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    marginBottom: 10,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: THEME.text, 
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    flex: 1,
  },
  countBadge: {
    backgroundColor: THEME.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    color: THEME.bg,
    fontWeight: 'bold',
    fontSize: 12,
  },
  
  // Estilos de Vacío
  emptyContainer: { 
    flex: 1, 
    backgroundColor: THEME.bg,
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  emptyText: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: THEME.text, 
    marginTop: 20,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
  },
  emptySubText: { 
    fontSize: 14, 
    color: THEME.subText, 
    textAlign: 'center', 
    marginTop: 10,
    lineHeight: 20,
    maxWidth: '80%'
  },
  exploreButton: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderWidth: 1,
    borderColor: THEME.gold,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: THEME.gold,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // Estilos de Tarjeta (Fila)
  card: { 
    flexDirection: 'row', 
    backgroundColor: THEME.cardBg, 
    borderRadius: 12, 
    marginBottom: 16, 
    overflow: 'hidden', 
    height: 90, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  
  // Imagen
  image: { 
    width: 90, 
    height: '100%', 
    backgroundColor: '#000' 
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 90,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)', // Oscurece un poco la foto
  },
  
  // Info
  info: { 
    flex: 1, 
    paddingHorizontal: 15, 
    justifyContent: 'center' 
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.15)', // Dorado muy transparente
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  categoryText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: THEME.gold,
      letterSpacing: 0.5,
  },
  name: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: THEME.text,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: { 
    fontSize: 12, 
    color: THEME.subText,
    marginLeft: 4,
  },
  
  // Botón Borrar
  deleteBtn: { 
    padding: 15,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: THEME.border,
  },
});

export default FavoritesScreen;