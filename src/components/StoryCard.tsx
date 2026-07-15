import React, { useState, useMemo, memo, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NavigationProp } from '@react-navigation/native';

import { AuthContext } from '../context/AuthContext';
import { FavoritesContext } from '../context/FavoritesContext';
import { APP_PALETTE as THEME } from '../theme/colors';
import type { LocationData, RootStackParamList } from '../types';

interface StoryCardProps {
  item: LocationData;
  navigation: NavigationProp<RootStackParamList>;
}

const StoryCard: React.FC<StoryCardProps> = memo(({ item, navigation }) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const { t } = useTranslation();

  const { userInfo } = useContext(AuthContext);
  const { toggleFavorite, isFavorite } = useContext(FavoritesContext);

  const isFav = isFavorite(item.id);

  const finalUrl = useMemo<string | null>(() => {
    const rawUrl: any = (item as any).image_url || (item as any).images?.[0];
    if (!rawUrl) return null;
    return String(rawUrl).trim().replace(/["{}]/g, '');
  }, [item.image_url, (item as any).images]);

  const imageSourceLabel = useMemo<string | null>(() => {
    if (item.source === 'db') return null;
    if (item.image_source === 'google') return 'Google';
    if (item.image_source === 'wikipedia') return 'Wikipedia';
    const url = finalUrl || '';
    if (url.includes('places.googleapis.com')) return 'Google';
    if (url.includes('wikimedia.org')) return 'Wikipedia';
    if (url.includes('unsplash.com')) return 'Unsplash';
    return null;
  }, [item.image_source, item.source, finalUrl]);

  const handlePress = (): void => {
    navigation.navigate('Detail', { locationData: item });
  };

  const handleFavoritePress = (): void => {
    if (!userInfo || (typeof userInfo === 'object' && Object.keys(userInfo).length === 0)) {
      navigation.navigate('LoginScreen');
      return;
    }
    toggleFavorite(item);
  };

  const formatDistance = (distInKm: number | null | undefined): string | null => {
    if (distInKm === null || distInKm === undefined) return null;
    if (distInKm < 1) return `${Math.round(distInKm * 1000)} m`;
    return `${distInKm.toFixed(1)} km`;
  };

  const formattedDistance = formatDistance(item.distance);

  return (
    <TouchableOpacity style={styles.cardContainer} activeOpacity={0.9} onPress={handlePress}>
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

        {finalUrl && <View style={styles.imageOverlay} />}

        {imageSourceLabel && (
          <View style={styles.sourceTag}>
            <Text style={styles.sourceTagText}>{imageSourceLabel}</Text>
          </View>
        )}

        <View style={styles.badge}>
          <MaterialCommunityIcons name="bookmark" size={12} color={THEME.gold} style={{ marginRight: 4 }} />
          <Text style={styles.badgeText}>
            {item.category
              ? t(`categories.${item.category}`, item.category).toUpperCase()
              : t('common.historic')}
          </Text>
        </View>

        <TouchableOpacity style={styles.favoriteBtn} onPress={handleFavoritePress} activeOpacity={0.7}>
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? THEME.gold : '#FFF'} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>{item.name}</Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={14} color={THEME.gold} />
          <Text style={styles.location} numberOfLines={1}>
            {(item as any).country || (item as any).vicinity || t('card.unknownLocation')}
            {formattedDistance ? ` • ${formattedDistance} ${t('feed.away')}` : ''}
          </Text>
        </View>

        <View style={styles.separator} />

        <Text style={styles.description} numberOfLines={2}>
          {item.description
            ? item.description.replace(/<[^>]*>?/gm, '')
            : t('card.defaultDescription')}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.readMoreText}>{t('feed.explore')}</Text>
          <Ionicons name="arrow-forward" size={14} color={THEME.gold} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 180,
    width: '100%',
    backgroundColor: THEME.border,
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
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
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
    borderColor: 'rgba(255,255,255,0.2)',
  },
  infoContainer: {
    padding: 16,
    backgroundColor: THEME.card,
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
    color: THEME.subText,
    lineHeight: 18,
    marginBottom: 12,
  },
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
  },
});

export default StoryCard;
