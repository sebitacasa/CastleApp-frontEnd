import React, { useState, useMemo, memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// --- 🎨 PALETA DE COLORES "SCRATCH MAP" (Coincide con FeedScreen) ---
const THEME = {
  cardBg: '#1E1E1E',       // Gris oscuro para la tarjeta
  gold: '#D4AF37',         // Dorado Clásico
  goldDim: 'rgba(212, 175, 55, 0.15)', // Dorado suave
  text: '#F0F0F0',         // Blanco hueso
  subText: '#A0A0A0',      // Gris plata
  border: '#333333',       // Borde sutil
};

// Configuración API
const API_BASE = 'http://10.0.2.2:8080';
const BACKUP_URL = 'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&cs=tinysrgb&w=800';

const StoryCard = memo(({ item, navigation }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // --- LÓGICA DE URL ---
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
        
        {/* C. Gradiente Oscuro (Overlay) para que el texto resalte si decides poner algo encima */}
        <View style={styles.imageOverlay} />

        {/* D. Badge de Categoría (Estilo Etiqueta Premium) */}
        <View style={styles.badge}>
          <MaterialCommunityIcons name="bookmark" size={12} color={THEME.gold} style={{marginRight: 4}} />
          <Text style={styles.badgeText}>
            {item.category ? item.category.toUpperCase() : 'HISTORIC'}
          </Text>
        </View>
      </View>

      {/* 2. SECCIÓN DE INFORMACIÓN (Dark Theme) */}
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

        {/* Botón "Leer más" (Decorativo) */}
        <View style={styles.footerRow}>
            <Text style={styles.readMoreText}>EXPLORE</Text>
            <Ionicons name="arrow-forward" size={14} color={THEME.gold} />
        </View>

      </View>
    </TouchableOpacity>
  );
});

// --- 🎨 ESTILOS INTEGRADOS (BLACK & GOLD) ---
const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 15,
    // Bordes y Sombras Premium
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8, // Sombra Android
    overflow: 'hidden', // Para que la imagen respete el borde redondeado
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
    backgroundColor: 'rgba(0,0,0,0.2)', // Oscurece un poco la imagen para elegancia
  },

  // Badge (Etiqueta negra con borde dorado)
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)', // Negro casi sólido
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.gold, // Borde Dorado
  },
  badgeText: {
    color: THEME.gold,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
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
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif', // Fuente Serif "Histórica"
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
    color: '#888', // Un gris un poco más oscuro para que no compita con el título
    lineHeight: 18,
    marginBottom: 12,
  },
  
  // Footer "Explore"
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