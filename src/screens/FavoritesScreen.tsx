import React, { useContext, useLayoutEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet,
  StatusBar, Platform,
} from 'react-native';
import { FavoritesContext } from '../context/FavoritesContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { APP_PALETTE as THEME } from '../theme/colors';
import type { LocationData, RootStackParamList } from '../types';

const FavoritesScreen: React.FC = () => {
  const { favorites, toggleFavorite } = useContext(FavoritesContext);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const getSecureImage = (item: LocationData): string => {
    if (!item) return 'https://via.placeholder.com/150';

    let rawUrl: string | undefined | null = item.image_url;

    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      rawUrl = item.images[0];
    }

    if (typeof rawUrl === 'string') {
      rawUrl = rawUrl.replace(/[{}"\\]/g, '').split(',')[0];
    }

    if (rawUrl && typeof rawUrl === 'string' && rawUrl.startsWith('http')) {
      return rawUrl;
    }

    return 'https://images.unsplash.com/photo-1599576838688-8a6c11263052?q=80&w=800';
  };

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
        <View style={styles.emptyHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={THEME.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Favorites</Text>
        </View>
        <View style={styles.emptyContent}>
          <MaterialCommunityIcons name="heart-broken" size={80} color={THEME.gold} style={{ opacity: 0.5 }} />
          <Text style={styles.emptyText}>No Treasures Yet</Text>
          <Text style={styles.emptySubText}>Explore the map and mark the places you want to conquer.</Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.exploreButtonText}>START EXPLORING</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: { item: LocationData }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('Detail', { locationData: item })}
    >
      <Image source={{ uri: getSecureImage(item) }} style={styles.image} resizeMode="cover" />
      <View style={styles.imageOverlay} />
      <View style={styles.info}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category?.toUpperCase() || 'HISTORY'}</Text>
        </View>
        <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={12} color="#DDD" />
          <Text numberOfLines={1} style={styles.location}>
            {item.city || item.country || item.address || 'Unknown Location'}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => toggleFavorite(item)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={20} color={THEME.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
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
        keyExtractor={(item) => (item.id || Math.random().toString())}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20, paddingHorizontal: 20, backgroundColor: THEME.bg, zIndex: 10,
  },
  headerTitle: {
    fontSize: 24, fontWeight: 'bold', color: THEME.text, marginLeft: 15, flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
  },
  countBadge: { backgroundColor: THEME.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { color: THEME.bg, fontWeight: 'bold', fontSize: 12 },
  backButton: { padding: 5 },
  emptyContainer: { flex: 1, backgroundColor: THEME.bg },
  emptyHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 20, zIndex: 10,
  },
  emptyContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyText: {
    color: THEME.text, fontSize: 22, fontWeight: 'bold', marginTop: 20,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
  },
  emptySubText: { color: THEME.subText, textAlign: 'center', marginTop: 10, marginBottom: 30, lineHeight: 20 },
  exploreButton: {
    backgroundColor: THEME.gold, paddingHorizontal: 30, paddingVertical: 14,
    borderRadius: 30, elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  exploreButtonText: { color: THEME.bg, fontWeight: 'bold', letterSpacing: 1 },
  card: {
    height: 180, backgroundColor: THEME.card, borderRadius: 16, marginBottom: 20,
    overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: THEME.border,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  image: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  info: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, justifyContent: 'flex-end' },
  name: {
    color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  location: { color: '#E0E0E0', fontSize: 13, marginLeft: 4 },
  categoryBadge: {
    position: 'absolute', top: -120, left: 0, backgroundColor: THEME.gold,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  categoryText: { color: THEME.bg, fontSize: 10, fontWeight: 'bold' },
  deleteBtn: {
    position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
});

export default FavoritesScreen;
