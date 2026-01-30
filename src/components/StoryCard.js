import React, { useState, useMemo, memo, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Importamos los contextos para la lógica de usuario y favoritos
import { AuthContext } from '../context/AuthContext';
import { FavoritesContext } from '../context/FavoritesContext';

// --- 🎨 PALETA DE COLORES "SCRATCH MAP" ---
const THEME = {
  cardBg: '#1E1E1E',       // Gris oscuro para la tarjeta
  gold: '#D4AF37',         // Dorado Clásico
  goldDim: 'rgba(212, 175, 55, 0.15)', // Dorado suave
  text: '#F0F0F0',         // Blanco hueso
  subText: '#A0A0A0',      // Gris plata
  border: '#333333',       // Borde sutil
  danger: '#CF6679',       // Para errores o acciones destructivas
};

const API_BASE = 'https://castleapp-backend-production.up.railway.app';
const BACKUP_URL = 'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&cs=tinysrgb&w=800';

const StoryCard = memo(({ item, navigation }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // --- 1. HOOKS DE CONTEXTO ---
  const { userInfo } = useContext(AuthContext); // Para saber si es Guest o Usuario registrado
  const { toggleFavorite, isFavorite } = useContext(FavoritesContext); // Para manejar la DB local de favs

  // Verificamos si este item ya es favorito
  const isFav = isFavorite(item.id);

  // --- 2. LÓGICA DE URL DE IMAGEN ---
  const finalUrl = useMemo(() => {
    let rawUrl = item.images?.[0] || item.image_url;
    if (!rawUrl) return null; 
    let processed = String(rawUrl).trim().replace(/["{}]/g, "");
    const cacheBuster = `&t=${new Date().getTime()}`; 
    return `${API_BASE}/api/image-proxy?url=${encodeURIComponent(processed)}${cacheBuster}`;
  }, [item.id, item.image_url, item.images]);

  const handlePress = () => {
    navigation.navigate('Detail', { locationData: item });
  };

  // --- 3. LÓGICA DEL GUARDIA DE FAVORITOS 🛡️ ---
  const handleFavoritePress = () => {
    // A. Si NO hay usuario (es invitado), mandarlo al Login
    if (!userInfo || (typeof userInfo === 'object' && Object.keys(userInfo).length === 0)) {
        // Opcional: Podrías pasar el item como params si quisieras redirigir directo al volver
        navigation.navigate('LoginScreen'); 
        return; 
    }

    // B. Si SÍ hay usuario, ejecutar la acción de favorito
    toggleFavorite(item);
  };

  // Helper para limpiar el HTML del autor
  // const cleanAuthor = (text) => {
  //     if (!text) return 'Wiki Commons';
  //     return text.replace(/<[^>]*>?/gm, '').trim();
  // };

  return (
    <TouchableOpacity 
      style={styles.cardContainer} 
      activeOpacity={0.9}
      onPress={handlePress}
    >
      {/* 1. SECCIÓN DE IMAGEN */}
      <View style={styles.imageContainer}>
        {/* A. Imagen de Respaldo */}
        <Image 
          source={{ uri: BACKUP_URL }} 
          style={styles.cardImagePlaceholder} 
          resizeMode="cover"
        />
        
        {/* B. Imagen Real */}
        {finalUrl && (
            <Image 
              source={{ uri: finalUrl }} 
              style={[styles.cardImage, { opacity: isLoaded ? 1 : 0 }]} 
              onLoad={() => setIsLoaded(true)}
              resizeMode="cover"
            />
        )}
        
        {/* C. Gradiente Oscuro (Overlay) */}
        <View style={styles.imageOverlay} />

        {/* D. Badge de Categoría (Top-Left) */}
        <View style={styles.badge}>
          <MaterialCommunityIcons name="bookmark" size={12} color={THEME.gold} style={{marginRight: 4}} />
          <Text style={styles.badgeText}>
            {item.category ? item.category.toUpperCase() : 'HISTORIC'}
          </Text>
        </View>

        {/* E. 🆕 BOTÓN DE FAVORITOS (Top-Right) */}
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

        {/* F. Badge de Créditos / Autor (Bottom-Right) */}
        {/* {finalUrl && (
            <View style={styles.creditBadge}>
                <Text style={styles.creditText} numberOfLines={1}>
                    📸 {cleanAuthor(item.author)} • {item.license || 'CC BY'}
                </Text>
            </View>
        )} */}
      </View>

      {/* 2. SECCIÓN DE INFORMACIÓN */}
      <View style={styles.infoContainer}>
        
        {/* Título Serif Elegante */}
        <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
        
        {/* Ubicación con Icono Dorado */}
        <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={14} color={THEME.gold} />
            <Text style={styles.location} numberOfLines={1}>
                {item.country || 'Unknown Location'}
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
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
    overflow: 'hidden',
  },
  
  // Imagen
  imageContainer: {
    height: 180,
    width: '100%',
    backgroundColor: '#000',
    position: 'relative', 
  },
  cardImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  // Badge Categoría (Arriba Izquierda)
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.gold,
  },
  badgeText: {
    color: THEME.gold,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // 🆕 Botón Favorito (Arriba Derecha)
  favoriteBtn: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(0,0,0,0.6)', // Círculo oscuro semitransparente
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)'
  },

  // Badge Créditos (Abajo Derecha)
  creditBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: '65%', 
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  creditText: {
    color: '#E0E0E0', 
    fontSize: 9,      
    fontWeight: '600',
  },

  // Info
  infoContainer: {
    padding: 16,
    backgroundColor: THEME.cardBg,
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
    color: '#888',
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