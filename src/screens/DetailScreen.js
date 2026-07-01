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
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import axios from "axios";

import { AuthContext } from '../context/AuthContext';
import { FavoritesContext } from '../context/FavoritesContext';

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

  const { userInfo } = useContext(AuthContext);

  const handleToggleFav = () => {
    if (!userInfo || (typeof userInfo === 'object' && Object.keys(userInfo).length === 0)) {
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

        </View>
      </ScrollView>

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