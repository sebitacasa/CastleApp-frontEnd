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

import { FavoritesContext } from '../context/FavoritesContext';

// --- 🎨 PALETA DE COLORES "SCRATCH MAP" ---
const THEME = {
  bg: '#121212',           // Negro Fondo Profundo
  card: '#1E1E1E',         // Gris Oscuro para secciones
  gold: '#D4AF37',         // Dorado Clásico
  text: '#F0F0F0',         // Blanco Hueso
  subText: '#A0A0A0',      // Gris Plata
  divider: '#333333',      // Líneas divisorias sutiles
  overlay: 'rgba(0,0,0,0.6)', // Oscurecer imágenes
};

const API_BASE = 'http://10.0.2.2:8080';
const { width, height } = Dimensions.get('window');
const IMG_HEIGHT = height * 0.45; // Imagen grande e inmersiva
const MAX_LENGTH = 150; 

// --- MAP STYLE (DARK MODE) ---
const DARK_MAP_STYLE = [
  {"elementType":"geometry","stylers":[{"color":"#212121"}]},
  {"elementType":"labels.icon","stylers":[{"visibility":"off"}]},
  {"elementType":"labels.text.fill","stylers":[{"color":"#757575"}]},
  {"elementType":"labels.text.stroke","stylers":[{"color":"#212121"}]},
  {"featureType":"administrative","elementType":"geometry","stylers":[{"color":"#757575"}]},
  {"featureType":"administrative.country","elementType":"labels.text.fill","stylers":[{"color":"#9e9e9e"}]},
  {"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#bdbdbd"}]},
  {"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#757575"}]},
  {"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#181818"}]},
  {"featureType":"poi.park","elementType":"labels.text.fill","stylers":[{"color":"#616161"}]},
  {"featureType":"road","elementType":"geometry.fill","stylers":[{"color":"#2c2c2c"}]},
  {"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#3c3c3c"}]},
  {"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"}]}
];

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

  const handleToggleFav = () => {
    toggleFavorite(locationData);
  };

  const openFullScreen = (index) => {
    setFullScreenIndex(index);
    setIsFullScreenVisible(true);
  };

  const handleReadMore = async () => {
      if (fullDescription) {
          setIsExpanded(!isExpanded);
          return;
      }

      try {
          setLoadingDesc(true);
          const response = await fetch(`${API_BASE}/api/localizaciones/${locationData.id}/description`);
          if (response.ok) {
              const data = await response.json();
              if (data.description) {
                  setFullDescription(data.description);
                  setIsExpanded(true); 
              }
          }
      } catch (error) {
          Alert.alert("Error", "No se pudo cargar la historia completa.");
      } finally {
          setLoadingDesc(false);
      }
  };

  if (!locationData) return null;

  const lat = parseFloat(locationData.latitude || locationData.lat || 0);
  const lon = parseFloat(locationData.longitude || locationData.lon || 0);

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

  const renderDescription = () => {
      const shortText = locationData.description && locationData.description.length > 5 
          ? locationData.description 
          : 'Información histórica clasificada no disponible.';

      const textToShow = (isExpanded && fullDescription) ? fullDescription : shortText;
      const shouldShowButton = shortText.endsWith('...') || shortText.length > MAX_LENGTH || fullDescription;

      return (
          <View>
              <Text style={styles.description}>
                  {textToShow}
              </Text>
              
              {shouldShowButton && (
                  <TouchableOpacity 
                      onPress={handleReadMore} 
                      style={styles.readMoreBtn}
                      activeOpacity={0.7}
                      disabled={loadingDesc}
                  >
                      {loadingDesc ? (
                          <ActivityIndicator size="small" color={THEME.gold} style={{ marginRight: 6 }} />
                      ) : (
                          <Text style={styles.readMoreText}>
                              {isExpanded ? 'READ LESS' : 'READ FULL HISTORY'}
                          </Text>
                      )}
                      {!loadingDesc && <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color={THEME.gold} style={{marginLeft: 4}} />}
                  </TouchableOpacity>
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
          {/* Overlay oscuro para que los botones blancos resalten */}
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
        
        {/* CARRUSEL INMERSIVO */}
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

          {/* BOTÓN BACK FLOTANTE (ESTILO CÍRCULO) */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          {/* BOTÓN FAVORITOS FLOTANTE */}
          <TouchableOpacity style={styles.favButton} onPress={handleToggleFav} activeOpacity={0.8}>
            <Ionicons name={isFav ? "heart" : "heart-outline"} size={26} color={isFav ? "#D4AF37" : "#FFF"} />
          </TouchableOpacity>

          {/* PAGINACIÓN */}
          {gallery.length > 1 && (
            <View style={styles.pagination}>
              {gallery.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeIndex ? styles.activeDot : null]} />
              ))}
            </View>
          )}
        </View>

        {/* CONTENIDO PRINCIPAL (NEGRO) */}
        <View style={styles.contentContainer}>
          
          {/* BADGE CATEGORÍA DORADO */}
          <View style={styles.categoryBadge}>
            <MaterialCommunityIcons name="bookmark" size={14} color={THEME.bg} style={{marginRight: 4}} />
            <Text style={styles.categoryText}>{locationData.category?.toUpperCase() || 'HISTORIC SITE'}</Text>
          </View>

          <Text style={styles.title}>{locationData.name}</Text>

          <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={18} color={THEME.gold} style={{marginRight: 6}} />
              <Text style={styles.locationText}>{locationData.country || 'Ubicación desconocida'}</Text>
          </View>

          <View style={styles.divider} />

          {/* SECCIÓN MAPA */}
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
                customMapStyle={DARK_MAP_STYLE} // 🗺️ MAPA MODO NOCTURNO
            >
                <Marker coordinate={{ latitude: lat, longitude: lon }} pinColor={THEME.gold} />
            </MapView>
            
            {/* Botón "Cómo llegar" Estilo Botón Dorado */}
            <TouchableOpacity style={styles.directionsButton} onPress={openExternalMaps} activeOpacity={0.8}>
                <Ionicons name="navigate" size={18} color={THEME.bg} style={{marginRight: 8}} />
                <Text style={styles.directionsText}>NAVIGATE HERE</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* SECCIÓN HISTORIA */}
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="script-text-outline" size={20} color={THEME.gold} />
            <Text style={styles.sectionTitle}>History & Details</Text>
          </View>
          
          {renderDescription()}

        </View>
      </ScrollView>

      {/* MODAL PANTALLA COMPLETA */}
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

// --- 🎨 ESTILOS "BLACK & GOLD" INTEGRADOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  
  // Carrusel
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
    backgroundColor: 'rgba(0,0,0,0.25)', // Sombra para que se vean los botones blancos
  },
  
  // Botones Flotantes (Círculos)
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', // Vidrio oscuro
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
    bottom: 20,
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

  // Contenido Principal
  contentContainer: {
    flex: 1,
    backgroundColor: THEME.bg,
    borderTopLeftRadius: 30, // Curva suave para superponerse a la imagen
    borderTopRightRadius: 30,
    marginTop: -30, // Efecto de superposición
    paddingHorizontal: 25,
    paddingTop: 30,
  },
  
  // Badge Dorado
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
    color: THEME.bg, // Texto negro sobre dorado
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
    backgroundColor: THEME.divider,
    marginVertical: 20,
  },

  // Títulos de Sección
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

  // Mapa
  miniMapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.divider,
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

  // Descripción
  description: {
    fontSize: 16,
    color: '#CCC', // Gris claro para lectura cómoda
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

  // Full Screen Modal
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