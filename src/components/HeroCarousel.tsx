import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, ImageBackground } from 'react-native';
import styles, { width } from './HeroCarousel.styles';

interface Slide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
}

const slides: Slide[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1996&auto=format&fit=crop',
    title: 'Explora el Pasado',
    subtitle: 'Descubre monumentos eternos',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1564399580075-5dfe19c205f9?q=80&w=2070&auto=format&fit=crop',
    title: 'Ruinas Legendarias',
    subtitle: 'Historia viva en cada piedra',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=2076&auto=format&fit=crop',
    title: 'Ciudades Perdidas',
    subtitle: 'Maravillas de la ingeniería antigua',
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1599309927896-1c27271822be?q=80&w=2070&auto=format&fit=crop',
    title: 'Templos Sagrados',
    subtitle: 'Conecta con civilizaciones pasadas',
  },
];

export default function HeroCarousel(): React.ReactElement {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= slides.length) nextIndex = 0;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const renderItem = ({ item }: { item: Slide }) => (
    <View style={styles.slideContainer}>
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.imageBackground}
        imageStyle={{ borderRadius: 0 }}
      >
        <View style={styles.darkOverlay} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
      </ImageBackground>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        getItemLayout={(_data, index) => ({ length: width, offset: width * index, index })}
      />
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, currentIndex === index ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>
    </View>
  );
}
