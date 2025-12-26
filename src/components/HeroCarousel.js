import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, Image, Dimensions } from 'react-native';
// Importamos los estilos desde el archivo separado
import styles from './HeroCarousel.styles';

const { width } = Dimensions.get('window');

const HERO_IMAGES = [
  { id: '1', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800' }, 
  { id: '2', url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800' },
  { id: '3', url: 'https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?q=80&w=800' }
];

const HeroCarousel = () => {
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= HERO_IMAGES.length) nextIndex = 0;

      // scrollToIndex puede fallar si el componente se desmonta justo en el intervalo
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        setCurrentIndex(nextIndex);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const onScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    // Usamos Math.round para mayor precisión al detectar el índice en scroll manual
    const newIndex = Math.round(contentOffset / viewSize);
    if (newIndex !== currentIndex) setCurrentIndex(newIndex);
  };

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={HERO_IMAGES}
        horizontal
        pagingEnabled
        onMomentumScrollEnd={onScroll}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        // getItemLayout mejora mucho el rendimiento del scroll automático
        getItemLayout={(_, index) => ({ 
          length: width, 
          offset: width * index, 
          index 
        })}
        renderItem={({ item }) => (
          <Image 
            source={{ uri: item.url }} 
            style={styles.heroImage} 
            resizeMode="cover" 
          />
        )}
      />
      
      {/* Indicadores de paginación */}
      <View style={styles.pagination}>
        {HERO_IMAGES.map((_, i) => (
          <View 
            key={i} 
            style={[styles.dot, { opacity: i === currentIndex ? 1 : 0.4 }]} 
          />
        ))}
      </View>
      
      <Text style={styles.sectionTitle}>Curated Stories</Text>
    </View>
  );
};

export default HeroCarousel;