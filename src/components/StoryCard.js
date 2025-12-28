import React, { useState, useMemo, memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import styles from './StoryCard.styles';

// Tu configuración de API
const API_BASE = 'http://192.168.1.33:8080';
const BACKUP_URL = 'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&cs=tinysrgb&w=800';

const StoryCard = memo(({ item, navigation }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // --- TU LÓGICA DE PROCESAMIENTO DE URL (INTACTA) ---
  const finalUrl = useMemo(() => {
    // Intentamos obtener la imagen del array o la propiedad directa
    let rawUrl = item.images?.[0] || item.image_url;
    
    // Si no hay ninguna, usamos null para que salga el backup
    if (!rawUrl) return null; 
    
    let processed = String(rawUrl).trim().replace(/["{}]/g, "");
    const cacheBuster = `&t=${new Date().getTime()}`; // Truco para refrescar caché
    
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
        
        {/* A. Imagen de Respaldo (Fondo estático) */}
        <Image 
          source={{ uri: BACKUP_URL }} 
          style={styles.cardImagePlaceholder} 
          resizeMode="cover"
        />
        
        {/* B. Imagen Real (Se superpone con opacidad animada) */}
        {finalUrl && (
            <Image 
              source={{ uri: finalUrl }} 
              style={[styles.cardImage, { opacity: isLoaded ? 1 : 0 }]} 
              onLoad={() => setIsLoaded(true)}
              resizeMode="cover"
            />
        )}
        
        {/* C. Badge de Categoría (Bordó) */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.category ? item.category.toUpperCase() : 'HISTORIC'}
          </Text>
        </View>
      </View>

      {/* 2. SECCIÓN DE INFORMACIÓN (Transparente/Vidrio) */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.location} numberOfLines={1}>
            📍 {item.country || 'Ubicación desconocida'}
        </Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {item.description 
            ? item.description.replace(/<[^>]*>?/gm, '') 
            : 'Un lugar histórico fascinante esperando ser descubierto.'}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export default StoryCard;