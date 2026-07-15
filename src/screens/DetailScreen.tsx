import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StatusBar, Linking,
  Platform, Alert, FlatList, Modal, ActivityIndicator, StyleSheet,
  Dimensions, TextInput, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import type { StackScreenProps } from '@react-navigation/stack';

import { AuthContext } from '../context/AuthContext';
import { FavoritesContext } from '../context/FavoritesContext';
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload';
import { submitContribution, getContributionForPlace, getMyContribution } from '../api/contributionsApi';
import { APP_PALETTE as THEME } from '../theme/colors';
import type { RootStackParamList, LocationData } from '../types';

type Props = StackScreenProps<RootStackParamList, 'Detail'>;

type PlaceRef =
  | { google_place_id: string; location_id?: never }
  | { location_id: string; google_place_id?: never };

const API_BASE = 'https://castleapp-backend-production.up.railway.app';
const { width, height } = Dimensions.get('window');
const IMG_HEIGHT = height * 0.45;

const getPlaceholderImage = (category?: string): string => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('museum')) return 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?q=80&w=800';
  if (cat.includes('ruin')) return 'https://images.unsplash.com/photo-1565017226680-e82a6e9a04a0?q=80&w=800';
  return 'https://images.unsplash.com/photo-1599576838688-8a6c11263052?q=80&w=800';
};

export default function DetailScreen({ route, navigation }: Props): React.ReactElement | null {
  const { locationData } = route.params || {};
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const { toggleFavorite, isFavorite } = useContext(FavoritesContext);
  const isFav = locationData ? isFavorite(locationData.id) : false;

  const [isFullScreenVisible, setIsFullScreenVisible] = useState<boolean>(false);
  const [fullScreenIndex, setFullScreenIndex] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [fullDescription, setFullDescription] = useState<string | null>(null);
  const [loadingDesc, setLoadingDesc] = useState<boolean>(false);
  const [wikiFailed, setWikiFailed] = useState<boolean>(false);

  const { userInfo, userToken } = useContext(AuthContext);
  const isLoggedIn = !!(userInfo && (typeof userInfo !== 'object' || Object.keys(userInfo).length > 0));

  const [communityContribution, setCommunityContribution] = useState<any>(null);
  const [myContribution, setMyContribution] = useState<any>(null);
  const [infoModalVisible, setInfoModalVisible] = useState<boolean>(false);
  const [infoTextInput, setInfoTextInput] = useState<string>('');
  const [submittingContribution, setSubmittingContribution] = useState<boolean>(false);

  const [conquered, setConquered] = useState<boolean>(false);
  const [conquestLoading, setConquestLoading] = useState<boolean>(false);

  const handleToggleFav = (): void => {
    if (!isLoggedIn) { navigation.navigate('LoginScreen'); return; }
    toggleFavorite(locationData);
  };

  const openFullScreen = (index: number): void => {
    setFullScreenIndex(index);
    setIsFullScreenVisible(true);
  };

  const handleReadMore = async (isManualClick: boolean = false): Promise<void> => {
    try {
      setLoadingDesc(true);
      const searchTerm = locationData.wiki_title || locationData.name;
      const response = await axios.get(`${API_BASE}/api/external/wiki`, {
        params: { title: searchTerm, country_code: locationData.country_code },
      });
      if (response.data && response.data.full_description) {
        setFullDescription(response.data.full_description);
        setWikiFailed(false);
      } else {
        setWikiFailed(true);
        if (isManualClick) Alert.alert('History', 'No detailed history found for this specific place.');
      }
    } catch (error: any) {
      setWikiFailed(true);
      if (isManualClick) {
        if (error.response?.status === 404) {
          Alert.alert('History', 'No English Wikipedia article found for this specific place.');
        } else {
          Alert.alert('Server Error', 'Could not retrieve the history right now.');
        }
      }
    } finally {
      setLoadingDesc(false);
    }
  };

  if (!locationData) return null;

  const lat = parseFloat(String(locationData.latitude ?? locationData.lat ?? 0));
  const lon = parseFloat(String(locationData.longitude ?? locationData.lon ?? 0));
  const hasValidCoords = lat !== 0 && lon !== 0 && !isNaN(lat) && !isNaN(lon);

  const formatDistance = (distInKm?: number | null): string | null => {
    if (distInKm === null || distInKm === undefined) return null;
    if (distInKm < 1) return `${Math.round(distInKm * 1000)} m`;
    return `${distInKm.toFixed(1)} km`;
  };
  const formattedDistance = formatDistance(locationData.distance);

  let gallery: string[] = [];
  if (locationData.images && Array.isArray(locationData.images) && locationData.images.length > 0) {
    gallery = locationData.images;
  } else if (locationData.image_url && typeof locationData.image_url === 'string') {
    gallery = [locationData.image_url];
  } else {
    gallery = [getPlaceholderImage(locationData.category)];
  }

  const getProcessedUrl = (url: string | null | undefined): string | null => {
    if (!url || typeof url !== 'string') return null;
    let cleanUrl = url.trim().replace(/["{}]/g, '');
    if (cleanUrl.startsWith('http:')) cleanUrl = cleanUrl.replace('http:', 'https:');
    if (cleanUrl.includes('wikimedia.org')) {
      return `${API_BASE}/api/image-proxy?url=${encodeURIComponent(cleanUrl)}`;
    }
    return cleanUrl;
  };

  const openExternalMaps = (): void => {
    const label = encodeURIComponent(locationData.name || 'Destino');
    const latLng = `${lat},${lon}`;
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latLng}`,
      android: `geo:0,0?q=${latLng}(${label})`,
    });
    if (url) Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir mapas.'));
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!isLoggedIn || !userToken) return;
    const id = locationData.google_place_id || locationData.id;
    if (!id) return;
    const param = locationData.source === 'google' || locationData.google_place_id
      ? `google_place_id=${locationData.google_place_id}`
      : `location_id=${locationData.id}`;
    axios
      .get(`${API_BASE}/api/conquests/check?${param}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      })
      .then(r => setConquered(r.data.conquered))
      .catch(() => {});
  }, [locationData, userToken, isLoggedIn]);

  const handleConquer = async (): Promise<void> => {
    if (!isLoggedIn) { navigation.navigate('LoginScreen'); return; }
    setConquestLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is required to conquer places.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const body: any = {
        place_name: locationData.name || '',
        place_lat: lat, place_lon: lon,
        user_lat: pos.coords.latitude, user_lon: pos.coords.longitude,
        image_url: locationData.image_url || null,
        category: locationData.category || null,
      };
      if (locationData.source === 'google' || locationData.google_place_id) {
        body.google_place_id = locationData.google_place_id;
      } else {
        body.location_id = locationData.id;
      }
      const { data } = await axios.post(`${API_BASE}/api/conquests`, body, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setConquered(true);
      const { rank, total } = data;
      Alert.alert(
        `${rank.emoji} Conquered!`,
        `${locationData.name} is yours!\n\n${rank.title} · ${total} ${total === 1 ? 'conquest' : 'conquests'}` +
        (rank.next ? `\n${rank.nextCount - total} more to become ${rank.next}` : '\nMax rank reached!'),
      );
    } catch (err: any) {
      if (err.response?.data?.error === 'too_far') {
        const dist = err.response.data.distance;
        Alert.alert('Too far away', `You are ${dist}m from this place. Get within 150m to conquer it.`);
      } else {
        Alert.alert('Error', 'Could not complete the conquest. Try again.');
      }
    } finally {
      setConquestLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const searchTerm = locationData?.wiki_title || locationData?.name;
    if (searchTerm && !fullDescription && !loadingDesc && !wikiFailed) {
      handleReadMore(false);
    }
  }, [locationData]);

  const placeRef: PlaceRef = locationData.source === 'google'
    ? { google_place_id: locationData.google_place_id! }
    : { location_id: locationData.id };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const placeIdentifier = (placeRef as any).google_place_id || (placeRef as any).location_id;
    if (!placeIdentifier) return;
    getContributionForPlace(placeRef).then(setCommunityContribution);
    if (isLoggedIn && userToken) {
      getMyContribution(placeRef, userToken).then(setMyContribution);
    }
  }, [locationData, userToken]);

  const pickContributionPhoto = async (): Promise<void> => {
    if (!isLoggedIn) { navigation.navigate('LoginScreen'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.7,
    });
    if (result.canceled) return;
    setSubmittingContribution(true);
    try {
      const cloudUrl = await uploadImageToCloudinary(result.assets[0].uri);
      if (!cloudUrl) { Alert.alert('Upload Error', 'No se pudo subir la foto. Proba de nuevo.'); return; }
      const { contribution } = await submitContribution(placeRef, { photo_url: cloudUrl }, userToken!);
      setMyContribution(contribution);
      Alert.alert('Listo!', 'Tu foto fue enviada y va a mostrarse apenas se apruebe.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo enviar la foto.');
    } finally { setSubmittingContribution(false); }
  };

  const openAddInfoModal = (): void => {
    if (!isLoggedIn) { navigation.navigate('LoginScreen'); return; }
    setInfoTextInput('');
    setInfoModalVisible(true);
  };

  const submitInfoText = async (): Promise<void> => {
    if (infoTextInput.trim().length < 5) { Alert.alert('Muy corto', 'Contanos un poco mas sobre el lugar.'); return; }
    setSubmittingContribution(true);
    try {
      const { contribution } = await submitContribution(placeRef, { info_text: infoTextInput.trim() }, userToken!);
      setMyContribution(contribution);
      setInfoModalVisible(false);
      Alert.alert('Listo!', 'Tu aporte fue enviado y va a mostrarse apenas se apruebe.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo enviar la info.');
    } finally { setSubmittingContribution(false); }
  };

  const renderDescription = (): React.ReactElement => {
    const fallbackText = locationData.description || 'No further details available for this location.';
    const baseText = fullDescription ? fullDescription : fallbackText;
    const isLongText = baseText.length > 150;
    const textToShow = isExpanded ? baseText : (isLongText ? baseText.substring(0, 150) + '...' : baseText);

    return (
      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.description, { lineHeight: 22 }]}>{textToShow}</Text>
        {(!wikiFailed || isLongText) && (
          <TouchableOpacity
            onPress={() => {
              if (!fullDescription && !wikiFailed) { handleReadMore(true); setIsExpanded(true); }
              else { setIsExpanded(!isExpanded); }
            }}
            style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}
          >
            {loadingDesc ? (
              <ActivityIndicator size="small" color={THEME.gold} />
            ) : (
              <>
                <Text style={[styles.readMoreText, { color: THEME.gold, fontWeight: 'bold' }]}>
                  {isExpanded ? 'SHOW LESS' : (fullDescription || wikiFailed ? 'READ MORE' : 'READ FULL HISTORY FROM WIKIPEDIA')}
                </Text>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={THEME.gold} style={{ marginLeft: 5 }} />
              </>
            )}
          </TouchableOpacity>
        )}
        {isExpanded && fullDescription && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15, opacity: 0.5 }}>
            <MaterialCommunityIcons name="wikipedia" size={14} color={THEME.gold} />
            <Text style={{ color: THEME.gold, fontSize: 10, marginLeft: 5 }}>WIKIPEDIA SOURCE</Text>
          </View>
        )}
        {isExpanded && !fullDescription && locationData.source === 'google' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15, opacity: 0.5 }}>
            <Ionicons name="logo-google" size={14} color={THEME.gold} />
            <Text style={{ color: THEME.gold, fontSize: 10, marginLeft: 5 }}>GOOGLE PLACES</Text>
          </View>
        )}
      </View>
    );
  };

  const noWikiData = !fullDescription && wikiFailed;
  const hasApprovedPhoto = !!communityContribution?.photo_url;
  const hasApprovedInfo = !!communityContribution?.info_text;
  const myPendingContribution = myContribution && !myContribution.is_approved ? myContribution : null;

  const renderCommunitySection = (): React.ReactElement => {
    const showAddPhotoButton = !hasApprovedPhoto;
    const showAddInfoButton = noWikiData && !hasApprovedInfo;

    return (
      <View style={{ marginTop: 10 }}>
        <View style={styles.sectionHeader}>
          <Ionicons name="people" size={20} color={THEME.gold} />
          <Text style={styles.sectionTitle}>Community</Text>
        </View>
        {hasApprovedPhoto && (
          <Image
            source={{ uri: getProcessedUrl(communityContribution.photo_url) ?? undefined }}
            style={styles.communityPhoto}
            resizeMode="cover"
          />
        )}
        {hasApprovedInfo && (
          <Text style={[styles.description, { marginTop: hasApprovedPhoto ? 12 : 0, marginBottom: 12 }]}>
            {communityContribution.info_text}
          </Text>
        )}
        {myPendingContribution && (
          <View style={styles.pendingBadge}>
            <Ionicons name="time-outline" size={14} color={THEME.subText} />
            <Text style={styles.pendingText}>Your contribution is pending review</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
          {showAddPhotoButton && (
            <TouchableOpacity style={styles.communityActionButton} onPress={pickContributionPhoto} disabled={submittingContribution}>
              {submittingContribution ? <ActivityIndicator size="small" color={THEME.gold} /> : (
                <>
                  <Ionicons name="camera-outline" size={16} color={THEME.gold} />
                  <Text style={styles.communityActionText}>Add a photo</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {showAddInfoButton && (
            <TouchableOpacity style={[styles.communityActionButton, { marginLeft: 10 }]} onPress={openAddInfoModal} disabled={submittingContribution}>
              <Ionicons name="create-outline" size={16} color={THEME.gold} />
              <Text style={styles.communityActionText}>Add info</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderCarouselItem = ({ item, index }: { item: string; index: number }) => {
    const imageUrl = getProcessedUrl(item);
    if (!imageUrl) return null;
    return (
      <TouchableOpacity activeOpacity={1} onPress={() => openFullScreen(index)}>
        <View style={{ width, height: IMG_HEIGHT }}>
          <Image source={{ uri: imageUrl }} style={styles.carouselImage} resizeMode="cover" />
          <View style={styles.imageOverlay} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderFullScreenItem = ({ item }: { item: string }) => {
    const imageUrl = getProcessedUrl(item);
    if (!imageUrl) return null;
    return (
      <View style={{ width, height, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.carouselContainer}>
          <FlatList
            data={gallery}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderCarouselItem}
            onMomentumScrollEnd={(ev) => {
              const newIndex = Math.round(ev.nativeEvent.contentOffset.x / width);
              setActiveIndex(newIndex);
            }}
          />

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.favButton} onPress={handleToggleFav} activeOpacity={0.8}>
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={26} color={isFav ? THEME.gold : '#FFF'} />
          </TouchableOpacity>

          {gallery.length > 1 && (
            <View style={styles.pagination}>
              {gallery.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeIndex ? styles.activeDot : null]} />
              ))}
            </View>
          )}

          {locationData.image_source === 'google' && (
            <View style={styles.photoCredit}>
              <Ionicons name="logo-google" size={10} color="rgba(255,255,255,0.7)" />
              <Text style={styles.photoCreditText}>Photo via Google Maps</Text>
            </View>
          )}
          {locationData.image_source === 'wikipedia' && (
            <View style={styles.photoCredit}>
              <MaterialCommunityIcons name="wikipedia" size={10} color="rgba(255,255,255,0.7)" />
              <Text style={styles.photoCreditText}>Photo: Wikimedia Commons (CC BY-SA)</Text>
            </View>
          )}
          {locationData.source === 'db' && (
            <View style={styles.photoCredit}>
              <Ionicons name="person-outline" size={10} color="rgba(255,255,255,0.7)" />
              <Text style={styles.photoCreditText}>Community photo</Text>
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.categoryBadge}>
            <MaterialCommunityIcons name="bookmark" size={14} color={THEME.bg} style={{ marginRight: 4 }} />
            <Text style={styles.categoryText}>{locationData.category?.toUpperCase() || 'HISTORIC SITE'}</Text>
          </View>

          <Text style={styles.title}>{locationData.name}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={18} color={THEME.gold} style={{ marginRight: 6 }} />
            <Text style={styles.locationText}>
              {locationData.country
                || (locationData.address ? locationData.address.split(',').slice(-2).join(',').trim() : null)
                || (locationData.city ? locationData.city : null)
                || 'Unknown location'}
              {formattedDistance ? ` · ${formattedDistance} away` : ''}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="map-marker-radius" size={20} color={THEME.gold} />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>

          {hasValidCoords ? (
            <View style={styles.miniMapContainer}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.miniMap}
                initialRegion={{ latitude: lat, longitude: lon, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker coordinate={{ latitude: lat, longitude: lon }} pinColor={THEME.gold} />
              </MapView>

              <TouchableOpacity style={styles.directionsButton} onPress={openExternalMaps} activeOpacity={0.8}>
                <Ionicons name="navigate" size={18} color={THEME.bg} style={{ marginRight: 8 }} />
                <Text style={styles.directionsText}>NAVIGATE HERE</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noLocationPlaceholder}>
              <Ionicons name="location-outline" size={32} color={THEME.subText} />
              <Text style={styles.noLocationText}>Location not available</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.conquerOuterButton, conquered && styles.conquerButtonDone]}
            onPress={conquered ? undefined : handleConquer}
            activeOpacity={conquered ? 1 : 0.8}
            disabled={conquestLoading}
          >
            {conquestLoading ? (
              <ActivityIndicator size="small" color={THEME.bg} style={{ marginRight: 8 }} />
            ) : (
              <Text style={{ fontSize: 16, marginRight: 8 }}>{conquered ? '✓' : '⚔️'}</Text>
            )}
            <Text style={styles.directionsText}>{conquered ? 'CONQUERED' : 'CONQUER THIS PLACE'}</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="script-text-outline" size={20} color={THEME.gold} />
            <Text style={styles.sectionTitle}>History & Details</Text>
          </View>

          {renderDescription()}

          <View style={styles.divider} />

          {renderCommunitySection()}
        </View>
      </ScrollView>

      <Modal visible={infoModalVisible} transparent={true} animationType="slide" onRequestClose={() => setInfoModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.infoModalOverlay}>
          <View style={styles.infoModalCard}>
            <Text style={styles.sectionTitle}>Add info about this place</Text>
            <TextInput
              style={styles.infoModalInput}
              placeholder="What do you know about this place?"
              placeholderTextColor={THEME.subText}
              multiline
              value={infoTextInput}
              onChangeText={setInfoTextInput}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 }}>
              <TouchableOpacity onPress={() => setInfoModalVisible(false)} style={{ marginRight: 20 }}>
                <Text style={{ color: THEME.subText, fontWeight: 'bold' }}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitInfoText} disabled={submittingContribution}>
                {submittingContribution
                  ? <ActivityIndicator size="small" color={THEME.gold} />
                  : <Text style={{ color: THEME.gold, fontWeight: 'bold' }}>SUBMIT</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={isFullScreenVisible} transparent={true} onRequestClose={() => setIsFullScreenVisible(false)} animationType="fade">
        <View style={styles.fullScreenContainer}>
          <StatusBar hidden />
          <TouchableOpacity style={styles.closeButton} onPress={() => setIsFullScreenVisible(false)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <FlatList
            data={gallery}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderFullScreenItem}
            initialScrollIndex={fullScreenIndex}
            getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  carouselContainer: { height: IMG_HEIGHT, position: 'relative' },
  carouselImage: { width, height: IMG_HEIGHT },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  backButton: {
    position: 'absolute', top: Platform.OS === 'ios' ? 50 : 40, left: 20,
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  conquerButtonDone: { backgroundColor: '#2E7D32' },
  conquerOuterButton: {
    marginTop: 12, backgroundColor: '#8B1A1A',
    paddingVertical: 14, paddingHorizontal: 20, borderRadius: 25,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3,
  },
  noLocationPlaceholder: {
    height: 100, borderRadius: 16, borderWidth: 1, borderColor: THEME.border,
    justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.card,
  },
  noLocationText: { color: THEME.subText, fontSize: 14, marginTop: 8 },
  favButton: {
    position: 'absolute', top: Platform.OS === 'ios' ? 50 : 40, right: 20,
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  pagination: { position: 'absolute', bottom: 40, width: '100%', flexDirection: 'row', justifyContent: 'center' },
  photoCredit: { position: 'absolute', bottom: 10, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  photoCreditText: { fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 4 },
  activeDot: { backgroundColor: THEME.gold, width: 8, height: 8, borderRadius: 4 },
  contentContainer: {
    flex: 1, backgroundColor: THEME.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30,
    marginTop: -30, paddingHorizontal: 25, paddingTop: 30,
  },
  categoryBadge: {
    alignSelf: 'flex-start', backgroundColor: THEME.gold,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginBottom: 15,
    flexDirection: 'row', alignItems: 'center',
  },
  categoryText: { color: THEME.bg, fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  title: {
    fontSize: 28, fontWeight: 'bold', color: THEME.text,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif', marginBottom: 8, lineHeight: 34,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  locationText: { fontSize: 16, color: THEME.subText, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: THEME.border, marginVertical: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.gold, marginLeft: 10, letterSpacing: 0.5 },
  miniMapContainer: {
    height: 200, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: THEME.border, position: 'relative',
  },
  miniMap: { ...StyleSheet.absoluteFillObject },
  directionsButton: {
    position: 'absolute', bottom: 15, right: 15, backgroundColor: THEME.gold,
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 25,
    flexDirection: 'row', alignItems: 'center', elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3,
  },
  directionsText: { color: THEME.bg, fontWeight: 'bold', fontSize: 12 },
  description: { fontSize: 16, color: THEME.text, lineHeight: 26, textAlign: 'justify' },
  readMoreText: { color: THEME.gold, fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  communityPhoto: { width: '100%', height: 180, borderRadius: 16 },
  pendingBadge: {
    flexDirection: 'row', alignItems: 'center', marginTop: 12,
    backgroundColor: THEME.card, borderWidth: 1, borderColor: THEME.border,
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12,
  },
  pendingText: { color: THEME.subText, fontSize: 13, marginLeft: 6 },
  communityActionButton: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: THEME.gold,
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 10,
  },
  communityActionText: { color: THEME.gold, fontWeight: 'bold', fontSize: 13, marginLeft: 6 },
  infoModalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  infoModalCard: { backgroundColor: THEME.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  infoModalInput: {
    borderWidth: 1, borderColor: THEME.border, borderRadius: 12, padding: 12, marginTop: 12,
    minHeight: 100, textAlignVertical: 'top', color: THEME.text, fontSize: 15,
  },
  fullScreenContainer: { flex: 1, backgroundColor: '#000' },
  closeButton: {
    position: 'absolute', top: 50, right: 20, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 5,
  },
});
