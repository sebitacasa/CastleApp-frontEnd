import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Linking, 
  Platform, 
  Alert, 
  FlatList,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  TextInput,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';

import { AuthContext } from '../context/AuthContext';
import { FavoritesContext } from '../context/FavoritesContext';
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload';
import { submitContribution, getContributionForPlace, getMyContribution } from '../api/contributionsApi';

import { APP_PALETTE as THEME } from '../theme/colors';

const API_BASE = 'https://castleapp-backend-production.up.railway.app';
const { width, height } = Dimensions.get('window');
const IMG_HEIGHT = height * 0.45; 

const getPlaceholderImage = (category) => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('museum')) return 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?q=80&w=800';
  if (cat.includes('ruin')) return 'https://images.unsplash.com/photo-1565017226680-e82a6e9a04a0?q=80&w=800';
  return 'https://images.unsplash.com/photo-1599576838688-8a6c11263052?q=80&w=800';
};

export default function DetailScreen({ route, navigation }) {
  const { locationData } = route.params || {};
  const [activeIndex, setActiveIndex] = useState(0);
  
  const { toggleFavorite, isFavorite } = useContext(FavoritesContext);
  const isFav = locationData ? isFavorite(locationData.id) : false;

  const [isFullScreenVisible, setIsFullScreenVisible] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);

  const [isExpanded, setIsExpanded] = useState(false);
  const [fullDescription, setFullDescription] = useState(null); 
  const [loadingDesc, setLoadingDesc] = useState(false);     
  // 💡 NUEVO ESTADO: Saber si Wikipedia falló en segundo plano
  const [wikiFailed, setWikiFailed] = useState(false);

  const { userInfo, userToken } = useContext(AuthContext);
  const isLoggedIn = !!(userInfo && (typeof userInfo !== 'object' || Object.keys(userInfo).length > 0));

  // 💡 APORTES DE LA COMUNIDAD (foto + info del lugar, pendientes de aprobación)
  const [communityContribution, setCommunityContribution] = useState(null); // el aprobado, visible para todos
  const [myContribution, setMyContribution] = useState(null); // el propio, aprobado o no
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoTextInput, setInfoTextInput] = useState('');
  const [submittingContribution, setSubmittingContribution] = useState(false);

  const handleToggleFav = () => {
    if (!isLoggedIn) {
        navigation.navigate('LoginScreen');
        return;
    }
    toggleFavorite(locationData);
  };

  const openFullScreen = (index) => {
    setFullScreenIndex(index);
    setIsFullScreenVisible(true);
  };

  // 💡 ACTUALIZADO: Acepta isManualClick para saber si debe mostrar alertas o callar
  const handleReadMore = async (isManualClick = false) => {
    try {
      setLoadingDesc(true);
      
      // 💡 Si no vino wiki_title (el backend no encontró match al armar el feed),
      // buscamos solo por el nombre. Pegarle la dirección completa (que incluye
      // código postal, ej: "1010 Wien, Austria") arruina la relevancia de la
      // búsqueda en Wikipedia y casi nunca encuentra nada.
      const searchTerm = locationData.wiki_title || locationData.name;
      // country_code es el ISO-2 (ej. "IT") que ya viene resuelto por Google
      // Places en el backend -- mucho más confiable que parsear texto libre de
      // dirección, y es lo que el backend usa para elegir el Wikipedia en el
      // idioma correcto. Si no vino (lugar de la comunidad / versión vieja del
      // feed) el backend cae directo a inglés.
      const response = await axios.get(`${API_BASE}/api/external/wiki`, {
        params: { title: searchTerm, country_code: locationData.country_code }
      });

      if (response.data && response.data.full_description) {
        setFullDescription(response.data.full_description);
        setWikiFailed(false);
      } else {
        setWikiFailed(true);
        if (isManualClick) Alert.alert("History", "No detailed history found for this specific place.");
      }
      
    } catch (error) {
      setWikiFailed(true); // 💡 Si falla, lo marcamos silenciosamente
      if (isManualClick) {
          if (error.response && error.response.status === 404) {
              Alert.alert("History", "No English Wikipedia article found for this specific place.");
          } else {
              Alert.alert("Server Error", "Could not retrieve the history right now.");
          }
      }
    } finally {
      setLoadingDesc(false);
    }
  };

  if (!locationData) return null;

  const lat = parseFloat(locationData.latitude || locationData.lat || 0);
  const lon = parseFloat(locationData.longitude || locationData.lon || 0);

  const formatDistance = (distInKm) => {
    if (distInKm === null || distInKm === undefined) return null;
    if (distInKm < 1) {
      return `${Math.round(distInKm * 1000)} m`;
    }
    return `${distInKm.toFixed(1)} km`;
  };
  const formattedDistance = formatDistance(locationData.distance);

  let gallery = [];
  if (locationData.images && Array.isArray(locationData.images) && locationData.images.length > 0) {
    gallery = locationData.images;
  } else if (locationData.image_url && typeof locationData.image_url === 'string') {
    gallery = [locationData.image_url];
  } else {
    gallery = [getPlaceholderImage(locationData.category)];
  }

  const getProcessedUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    let cleanUrl = url.trim().replace(/["{}]/g, "");
    if (cleanUrl.startsWith('http:')) cleanUrl = cleanUrl.replace('http:', 'https:');
    if (cleanUrl.includes('wikimedia.org')) {
        return `${API_BASE}/api/image-proxy?url=${encodeURIComponent(cleanUrl)}`;
    }
    return cleanUrl;
  };

  const openExternalMaps = () => {
    const label = encodeURIComponent(locationData.name || 'Destino');
    const latLng = `${lat},${lon}`;
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latLng}`,
      android: `geo:0,0?q=${latLng}(${label})`
    });
    Linking.openURL(url).catch(() => Alert.alert("Error", "No se pudo abrir mapas."));
  };

  // 💡 AUTO-CARGA SILENCIOSA
  useEffect(() => {
      const searchTerm = locationData?.wiki_title || locationData?.name;
      // Añadimos !wikiFailed para que no intente infinitamente si ya falló
      if (searchTerm && !fullDescription && !loadingDesc && !wikiFailed) {
          handleReadMore(false); // false = Fallar en silencio, sin alertas
      }
  }, [locationData]);

  // 💡 APORTES DE LA COMUNIDAD: identificamos el lugar por google_place_id
  // (lugares de Google, la mayoría de los pines) o por location_id (lugares
  // de la comunidad, que sí tienen fila en historical_locations).
  const placeRef = locationData.source === 'google'
      ? { google_place_id: locationData.google_place_id }
      : { location_id: locationData.id };

  useEffect(() => {
      const placeIdentifier = placeRef.google_place_id || placeRef.location_id;
      if (!placeIdentifier) return;

      getContributionForPlace(placeRef).then(setCommunityContribution);
      if (isLoggedIn && userToken) {
          getMyContribution(placeRef, userToken).then(setMyContribution);
      }
  }, [locationData, userToken]);

  const pickContributionPhoto = async () => {
    if (!isLoggedIn) {
        navigation.navigate('LoginScreen');
        return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (result.canceled) return;

    setSubmittingContribution(true);
    try {
        const cloudUrl = await uploadImageToCloudinary(result.assets[0].uri);
        if (!cloudUrl) {
            Alert.alert("Upload Error", "No se pudo subir la foto. Probá de nuevo.");
            return;
        }
        const { contribution } = await submitContribution(placeRef, { photo_url: cloudUrl }, userToken);
        setMyContribution(contribution);
        Alert.alert("¡Listo!", "Tu foto fue enviada y va a mostrarse apenas se apruebe.");
    } catch (error) {
        Alert.alert("Error", error.response?.data?.error || "No se pudo enviar la foto.");
    } finally {
        setSubmittingContribution(false);
    }
  };

  const openAddInfoModal = () => {
    if (!isLoggedIn) {
        navigation.navigate('LoginScreen');
        return;
    }
    setInfoTextInput('');
    setInfoModalVisible(true);
  };

  const submitInfoText = async () => {
    if (infoTextInput.trim().length < 5) {
        Alert.alert("Muy corto", "Contanos un poco más sobre el lugar.");
        return;
    }
    setSubmittingContribution(true);
    try {
        const { contribution } = await submitContribution(placeRef, { info_text: infoTextInput.trim() }, userToken);
        setMyContribution(contribution);
        setInfoModalVisible(false);
        Alert.alert("¡Listo!", "Tu aporte fue enviado y va a mostrarse apenas se apruebe.");
    } catch (error) {
        Alert.alert("Error", error.response?.data?.error || "No se pudo enviar la info.");
    } finally {
        setSubmittingContribution(false);
    }
  };

  // 💡 LÓGICA DE DESCRIPCIÓN INTELIGENTE
  const renderDescription = () => {
      const fallbackText = locationData.description || "No further details available for this location.";
      const baseText = fullDescription ? fullDescription : fallbackText;
      
      const isLongText = baseText.length > 150;
      const textToShow = isExpanded 
          ? baseText 
          : (isLongText ? baseText.substring(0, 150) + "..." : baseText);

      return (
          <View style={{ marginBottom: 20 }}>
              <Text style={[styles.description, { lineHeight: 22 }]}>
                  {textToShow}
              </Text>
              
              {/* Si wiki falló Y el texto de Google es corto, no mostramos ningún botón */}
              {(!wikiFailed || isLongText) && (
                  <TouchableOpacity 
                      onPress={() => {
                          if (!fullDescription && !wikiFailed) {
                              handleReadMore(true); 
                              setIsExpanded(true);
                          } else {
                              setIsExpanded(!isExpanded);
                          }
                      }} 
                      style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}
                  >
                      {loadingDesc ? (
                          <ActivityIndicator size="small" color={THEME.gold} />
                      ) : (
                          <>
                              <Text style={[styles.readMoreText, { color: THEME.gold, fontWeight: 'bold' }]}>
                                  {isExpanded 
                                      ? 'SHOW LESS' 
                                      : (fullDescription || wikiFailed ? 'READ MORE' : 'READ FULL HISTORY FROM WIKIPEDIA')
                                  }
                              </Text>
                              <Ionicons 
                                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                                  size={16} 
                                  color={THEME.gold} 
                                  style={{ marginLeft: 5 }} 
                              />
                          </>
                      )}
                  </TouchableOpacity>
              )}

              {/* Créditos de la fuente si está expandido */}
              {isExpanded && fullDescription && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15, opacity: 0.5 }}>
                      <MaterialCommunityIcons name="wikipedia" size={14} color={THEME.gold} />
                      <Text style={{ color: THEME.gold, fontSize: 10, marginLeft: 5 }}>
                          WIKIPEDIA SOURCE
                      </Text>
                  </View>
              )}
              {isExpanded && !fullDescription && locationData.source === 'google' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15, opacity: 0.5 }}>
                      <Ionicons name="logo-google" size={14} color={THEME.gold} />
                      <Text style={{ color: THEME.gold, fontSize: 10, marginLeft: 5 }}>
                          GOOGLE PLACES
                      </Text>
                  </View>
              )}
          </View>
      );
  };

  // 💡 SECCIÓN DE APORTES DE LA COMUNIDAD (foto + info, solo si no hay Wikipedia)
  const noWikiData = !fullDescription && wikiFailed;
  const hasApprovedPhoto = !!communityContribution?.photo_url;
  const hasApprovedInfo = !!communityContribution?.info_text;
  const myPendingContribution = myContribution && !myContribution.is_approved ? myContribution : null;

  const renderCommunitySection = () => {
      // Los botones se muestran siempre (mismo patrón que el corazón de
      // favoritos): si el usuario no está logeado, tocarlos lo manda a Login
      // en vez de ocultarlos directamente.
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
                      source={{ uri: getProcessedUrl(communityContribution.photo_url) }}
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
                      <TouchableOpacity
                          style={styles.communityActionButton}
                          onPress={pickContributionPhoto}
                          disabled={submittingContribution}
                      >
                          {submittingContribution ? (
                              <ActivityIndicator size="small" color={THEME.gold} />
                          ) : (
                              <>
                                  <Ionicons name="camera-outline" size={16} color={THEME.gold} />
                                  <Text style={styles.communityActionText}>Add a photo</Text>
                              </>
                          )}
                      </TouchableOpacity>
                  )}
                  {showAddInfoButton && (
                      <TouchableOpacity
                          style={[styles.communityActionButton, { marginLeft: 10 }]}
                          onPress={openAddInfoModal}
                          disabled={submittingContribution}
                      >
                          <Ionicons name="create-outline" size={16} color={THEME.gold} />
                          <Text style={styles.communityActionText}>Add info</Text>
                      </TouchableOpacity>
                  )}
              </View>
          </View>
      );
  };

  const renderCarouselItem = ({ item, index }) => {
    const imageUrl = getProcessedUrl(item);
    if (!imageUrl) return null;

    return (
      <TouchableOpacity activeOpacity={1} onPress={() => openFullScreen(index)}>
        <View style={{ width, height: IMG_HEIGHT }}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.carouselImage} 
            resizeMode="cover" 
          />
          <View style={styles.imageOverlay} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderFullScreenItem = ({ item }) => {
    const imageUrl = getProcessedUrl(item);
    if (!imageUrl) return null;
    return (
        <View style={{ width, height, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
            <Image
                source={{ uri: imageUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
            />
        </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} > 
        
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
            <Ionicons name={isFav ? "heart" : "heart-outline"} size={26} color={isFav ? THEME.gold : "#FFF"} />
          </TouchableOpacity>

          {gallery.length > 1 && (
            <View style={styles.pagination}>
              {gallery.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeIndex ? styles.activeDot : null]} />
              ))}
            </View>
          )}

          {/* Atribución de fuente de imagen */}
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
            <MaterialCommunityIcons name="bookmark" size={14} color={THEME.bg} style={{marginRight: 4}} />
            <Text style={styles.categoryText}>{locationData.category?.toUpperCase() || 'HISTORIC SITE'}</Text>
          </View>

          <Text style={styles.title}>{locationData.name}</Text>

          <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={18} color={THEME.gold} style={{marginRight: 6}} />
              <Text style={styles.locationText}>
                  {locationData.country || 'Unknown location'}
                  {formattedDistance ? ` • ${formattedDistance} away` : ''}
              </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="map-marker-radius" size={20} color={THEME.gold} />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>

          <View style={styles.miniMapContainer}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.miniMap}
                initialRegion={{
                    latitude: lat,
                    longitude: lon,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
            >
                <Marker coordinate={{ latitude: lat, longitude: lon }} pinColor={THEME.gold} />
            </MapView>
            
            <TouchableOpacity style={styles.directionsButton} onPress={openExternalMaps} activeOpacity={0.8}>
                <Ionicons name="navigate" size={18} color={THEME.bg} style={{marginRight: 8}} />
                <Text style={styles.directionsText}>NAVIGATE HERE</Text>
            </TouchableOpacity>
          </View>

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

      <Modal
        visible={infoModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.infoModalOverlay}
        >
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
                {submittingContribution ? (
                  <ActivityIndicator size="small" color={THEME.gold} />
                ) : (
                  <Text style={{ color: THEME.gold, fontWeight: 'bold' }}>SUBMIT</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isFullScreenVisible}
        transparent={true}
        onRequestClose={() => setIsFullScreenVisible(false)}
        animationType="fade"
      >
        <View style={styles.fullScreenContainer}>
            <StatusBar hidden />
            <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setIsFullScreenVisible(false)}
            >
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
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  
  carouselContainer: {
    height: IMG_HEIGHT,
    position: 'relative',
  },
  carouselImage: {
    width: width,
    height: IMG_HEIGHT,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)', 
  },
  
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  favButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  pagination: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  photoCredit: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoCreditText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: THEME.gold,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  contentContainer: {
    flex: 1,
    backgroundColor: THEME.bg,
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
    marginTop: -30, 
    paddingHorizontal: 25,
    paddingTop: 30,
  },
  
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    color: THEME.bg, 
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.text,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    marginBottom: 8,
    lineHeight: 34,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    fontSize: 16,
    color: THEME.subText,
    fontStyle: 'italic',
  },

  divider: {
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.gold,
    marginLeft: 10,
    letterSpacing: 0.5,
  },

  miniMapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border, 
    position: 'relative',
  },
  miniMap: {
    ...StyleSheet.absoluteFillObject,
  },
  directionsButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: THEME.gold,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  directionsText: {
    color: THEME.bg,
    fontWeight: 'bold',
    fontSize: 12,
  },

  description: {
    fontSize: 16,
    color: THEME.text, 
    lineHeight: 26,
    textAlign: 'justify',
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    alignSelf: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: THEME.gold,
    paddingBottom: 2,
  },
  readMoreText: {
    color: THEME.gold,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },

  communityPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pendingText: {
    color: THEME.subText,
    fontSize: 13,
    marginLeft: 6,
  },
  communityActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.gold,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  communityActionText: {
    color: THEME.gold,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },

  infoModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  infoModalCard: {
    backgroundColor: THEME.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  infoModalInput: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    color: THEME.text,
    fontSize: 15,
  },

  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 5,
  },
});