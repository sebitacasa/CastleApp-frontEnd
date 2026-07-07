import React, { useState, useMemo, memo, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Importamos los contextos para la lógica de usuario y favoritos
import { AuthContext } from '../context/AuthContext';
import { FavoritesContext } from '../context/FavoritesContext';

// 👇 1. IMPORTAMOS TU PALETA GLOBAL AQUÍ
import { APP_PALETTE as THEME } from '../theme/colors';

const API_BASE = 'https://castleapp-backend-production.up.railway.app';

const StoryCard = memo(({ item, navigation }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // --- 1. HOOKS DE CONTEXTO ---
  const { userInfo } = useContext(AuthContext); 
  const { toggleFavorite, isFavorite } = useContext(FavoritesContext); 

  // Verificamos si este item ya es favorito
  const isFav = isFavorite(item.id);

  // --- 2. LÓGICA DE URL DE IMAGEN ---
  const finalUrl = useMemo(() => {
    let rawUrl = item.image_url || item.images?.[0];
    if (!rawUrl) return null;
    let processed = String(rawUrl).trim().replace(/["{}]/g, "");
    return processed;
  }, [item.image_url, item.images]);

  const imageSourceLabel = useMemo(() => {
    if (item.source === 'db') return null; // "COMMUNITY GEM" badge ya identifica estas fotos
    if (item.image_source === 'google') return 'Google';
    if (item.image_source === 'wikipedia') return 'Wikipedia';
    const url = finalUrl || '';
    if (url.includes('places.googleapis.com')) return 'Google';
    if (url.includes('wikimedia.org')) return 'Wikipedia';
    if (url.includes('unsplash.com')) return 'Unsplash';
    return null;
  }, [item.image_source, item.source, finalUrl]);

  const handlePress = () => {
    navigation.navigate('Detail', { locationData: item });
  };

  // --- 3. LÓGICA DEL GUARDIA DE FAVORITOS 🛡️ ---
  const handleFavoritePress = () => {
    if (!userInfo || (typeof userInfo === 'object' && Object.keys(userInfo).length === 0)) {
        navigation.navigate('LoginScreen'); 
        return; 
    }
    toggleFavorite(item);
  };

  // --- 4. 📍 FORMATEO DE DISTANCIA ---
  const formatDistance = (distInKm) => {
    if (distInKm === null || distInKm === undefined) return null;
    
    // Si es menos de 1 km, mostrar en metros (ej: 850 m)
    if (distInKm < 1) {
      const meters = Math.round(distInKm * 1000);
      return `${meters} m`;
    }
    // Si es más de 1 km, mostrar con 1 decimal (ej: 3.2 km)
    return `${distInKm.toFixed(1)} km`;
  };

  const formattedDistance = formatDistance(item.distance);

  return (
    <TouchableOpacity 
      style={styles.cardContainer} 
      activeOpacity={0.9}
      onPress={handlePress}
    >
      {/* 1. SECCIÓN DE IMAGEN */}
      <View style={styles.imageContainer}>
        {finalUrl ? (
          <Image
            source={{ uri: finalUrl }}
            style={[styles.cardImage, { opacity: isLoaded ? 1 : 0 }]}
            onLoad={() => setIsLoaded(true)}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noPhotoPlaceholder}>
            <MaterialCommunityIcons name="image-off-outline" size={32} color={THEME.border} />
          </View>
        )}

        {/* Overlay solo cuando hay foto */}
        {finalUrl && <View style={styles.imageOverlay} />}

        {/* D. Badge fuente de imagen (Bottom-Left) */}
        {imageSourceLabel && (
          <View style={styles.sourceTag}>
            <Text style={styles.sourceTagText}>{imageSourceLabel}</Text>
          </View>
        )}

        {/* E. Badge de Categoría (Top-Left) */}
        <View style={styles.badge}>
          <MaterialCommunityIcons name="bookmark" size={12} color={THEME.gold} style={{marginRight: 4}} />
          <Text style={styles.badgeText}>
            {item.category ? item.category.toUpperCase() : 'HISTORIC'}
          </Text>
        </View>

        {/* F. BOTÓN DE FAVORITOS (Top-Right) */}
        <TouchableOpacity 
            style={styles.favoriteBtn} 
            onPress={handleFavoritePress}
            activeOpacity={0.7}
        >
            <Ionicons 
                name={isFav ? "heart" : "heart-outline"} 
                size={22} 
                color={isFav ? THEME.gold : "#FFF"} 
            />
        </TouchableOpacity>
      </View>

      {/* 2. SECCIÓN DE INFORMACIÓN */}
      <View style={styles.infoContainer}>
        
        {/* Título Serif Elegante */}
        <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
        
        {/* Ubicación con Icono Dorado Y DISTANCIA */}
        <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={14} color={THEME.gold} />
            <Text style={styles.location} numberOfLines={1}>
                {item.country || item.vicinity || 'Unknown Location'}
                {formattedDistance ? ` • ${formattedDistance} away` : ''}
            </Text>
        </View>
        
        {/* Separador Sutil */}
        <View style={styles.separator} />

        {/* Descripción */}
        <Text style={styles.description} numberOfLines={2}>
          {item.description 
            ? item.description.replace(/<[^>]*>?/gm, '') 
            : 'Un lugar histórico fascinante esperando ser descubierto.'}
        </Text>

        {/* Botón "Leer más" */}
        <View style={styles.footerRow}>
            <Text style={styles.readMoreText}>EXPLORE</Text>
            <Ionicons name="arrow-forward" size={14} color={THEME.gold} />
        </View>

      </View>
    </TouchableOpacity>
  );
});

// --- 🎨 ESTILOS INTEGRADOS ---
const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: THEME.card, // 💡 Usando THEME.card
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, // 💡 Sombra súper sutil para fondos claros
    shadowRadius: 8,
    elevation: 3, // 💡 Menos elevación nativa
    overflow: 'hidden',
  },
  
  // Imagen
 imageContainer: {
    height: 180,
    width: '100%',
    backgroundColor: THEME.border, // ✅ AHORA ES UN GRIS PIEDRA SUAVE
    position: 'relative', 
  },
  noPhotoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  // La imagen mantiene overlays oscuros para que los textos/íconos resalten
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  // Badge Categoría (Arriba Izquierda)
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.goldDim,
  },
  badgeText: {
    color: THEME.gold,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  sourceTag: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  sourceTagText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    letterSpacing: 0.3,
  },

  // Botón Favorito (Arriba Derecha)
  favoriteBtn: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(0,0,0,0.6)', 
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)'
  },

  // Info
  infoContainer: {
    padding: 16,
    backgroundColor: THEME.card, // 💡 Usando THEME.card
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.text,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  location: {
    fontSize: 13,
    color: THEME.subText,
    marginLeft: 4,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: THEME.border,
    marginBottom: 10,
    width: '100%',
  },
  description: {
    fontSize: 13,
    color: THEME.subText, // 💡 Ya no es un gris harcodeado
    lineHeight: 18,
    marginBottom: 12,
  },
  
  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  readMoreText: {
    color: THEME.gold,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginRight: 4,
  }
});

export default StoryCard;