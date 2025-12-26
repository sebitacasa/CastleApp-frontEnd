import React, { useState, useMemo, memo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Importación de estilos externos
import styles from './StoryCard.styles';

const API_BASE = 'http://192.168.1.33:8080';
const BACKUP_URL = 'https://images.pexels.com/photos/2422265/pexels-photo-2422265.jpeg?auto=compress&cs=tinysrgb&w=800';

const StoryCard = memo(({ item, navigation }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Procesamiento de URL con Cache Busting
  const finalUrl = useMemo(() => {
    let rawUrl = item.images?.[0] || item.image_url;
    if (!rawUrl) return null;
    
    let processed = String(rawUrl).trim().replace(/["{}]/g, "");
    const cacheBuster = `&t=${new Date().getTime()}`;
    
    return `${API_BASE}/api/image-proxy?url=${encodeURIComponent(processed)}${cacheBuster}`;
  }, [item.id, item.image_url]);

  return (
    <TouchableOpacity 
      style={styles.cardContainer} 
      activeOpacity={0.9}
      onPress={() => navigation.navigate('Detail', { locationData: item })}
    >
      <View style={styles.imageWrapper}>
        {/* Imagen de respaldo (siempre presente debajo) */}
        <Image 
          source={{ uri: BACKUP_URL }} 
          style={styles.cardImagePlaceholder} 
          resizeMode="cover"
        />
        
        {/* Imagen Real con transición de opacidad */}
        <Image 
          source={{ uri: finalUrl }} 
          style={[styles.cardImage, { opacity: isLoaded ? 1 : 0 }]} 
          onLoad={() => setIsLoaded(true)}
          resizeMode="cover"
        />
        
        {/* Contador de fotos si hay más de una */}
        {item.images?.length > 1 && (
          <View style={styles.photoBadge}>
            <Ionicons name="images" size={12} color="white" />
            <Text style={styles.photoBadgeText}>{item.images.length}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardCountry}>📍 {item.country}</Text>
        
        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {item.category.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default StoryCard;