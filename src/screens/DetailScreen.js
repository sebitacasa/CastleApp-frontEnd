import React, { useState, useEffect } from 'react';
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
  ActivityIndicator // <--- IMPORTANTE: Agregado para el spinner
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

// 👇 IMPORTAMOS ESTILOS Y CONSTANTES
import styles, { width, height, IMG_HEIGHT } from './DetailScreen.styles';

// 👇 IMPORTAMOS EL SERVICIO DE FAVORITOS
import { checkIsFavorite, toggleFavorite } from '../api/storage.js';
import Footer from '../components/Footer.js';

// 👇 CONSTANTE DE IP (Ajusta si es necesario)
const API_BASE = 'http://10.0.2.2:8080';
//const API_BASE = 'http://192.168.1.33:8080';

// Límite visual para decidir si mostrar botón (fallback local)
const MAX_LENGTH = 100; 

// --- HELPER: IMAGEN POR DEFECTO ---
const getPlaceholderImage = (category) => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('museum')) return 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?q=80&w=800';
  if (cat.includes('ruin')) return 'https://images.unsplash.com/photo-1565017226680-e82a6e9a04a0?q=80&w=800';
  return 'https://images.unsplash.com/photo-1599576838688-8a6c11263052?q=80&w=800';
};

export default function DetailScreen({ route, navigation }) {
  const { locationData } = route.params || {};
  const [activeIndex, setActiveIndex] = useState(0);
  
  // ❤️ ESTADO PARA FAVORITOS
  const [isFav, setIsFav] = useState(false);

  // 🖼️ ESTADO PARA EL VISOR DE PANTALLA COMPLETA
  const [isFullScreenVisible, setIsFullScreenVisible] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);

  // 📖 ESTADOS PARA LAZY LOADING DE DESCRIPCIÓN
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullDescription, setFullDescription] = useState(null); // Aquí guardamos el texto largo
  const [loadingDesc, setLoadingDesc] = useState(false);      // Spinner de carga

  // 1. CARGA INICIAL
  useEffect(() => {
    if (locationData && locationData.id) {
        checkIsFavorite(locationData.id).then(setIsFav);
    }
  }, [locationData]);

  // 2. FUNCIÓN TOGGLE FAVORITOS
  const handleToggleFav = async () => {
    const newState = await toggleFavorite(locationData);
    setIsFav(newState);
  };

  // 3. ABRIR PANTALLA COMPLETA
  const openFullScreen = (index) => {
    setFullScreenIndex(index);
    setIsFullScreenVisible(true);
  };

  // 4. MANEJADOR DE "LEER MÁS" (FETCH AL ENDPOINT)
  const handleReadMore = async () => {
      // A) Si ya tenemos el texto completo, solo alternamos la vista
      if (fullDescription) {
          setIsExpanded(!isExpanded);
          return;
      }

      // B) Si no, lo descargamos
      try {
          setLoadingDesc(true);
          const response = await fetch(`${API_BASE}/api/localizaciones/${locationData.id}/description`);
          
          if (response.ok) {
              const data = await response.json();
              if (data.description) {
                  setFullDescription(data.description);
                  setIsExpanded(true); // Expandimos automáticamente al terminar
              }
          } else {
              console.warn("No se pudo obtener la descripción completa.");
          }
      } catch (error) {
          console.error("Error fetching description:", error);
          Alert.alert("Error", "No se pudo cargar la historia completa.");
      } finally {
          setLoadingDesc(false);
      }
  };

  if (!locationData) return null;

  const lat = parseFloat(locationData.latitude || locationData.lat || 0);
  const lon = parseFloat(locationData.longitude || locationData.lon || 0);

  // --- PREPARAR GALERÍA ---
  let gallery = [];
  if (locationData.images && Array.isArray(locationData.images) && locationData.images.length > 0) {
    gallery = locationData.images;
  } else if (locationData.image_url && typeof locationData.image_url === 'string') {
    gallery = [locationData.image_url];
  } else {
    gallery = [getPlaceholderImage(locationData.category)];
  }

  // --- HELPER URL ---
  const getProcessedUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    let cleanUrl = url.trim().replace(/["{}]/g, "");
    if (cleanUrl.includes('/thumb/')) {
        try {
            let parts = cleanUrl.split('/');
            if (parts[parts.length - 1].includes('px-')) parts.pop();
            cleanUrl = parts.join('/').replace('/thumb/', '/');
        } catch (e) { /* Fallback */ }
    }
    if (cleanUrl.startsWith('http:')) cleanUrl = cleanUrl.replace('http:', 'https:');
    
    if (cleanUrl.includes('wikimedia.org')) {
        return `${API_BASE}/api/image-proxy?url=${encodeURIComponent(cleanUrl)}`;
    }
    return cleanUrl;
  };

  // --- ABRIR MAPAS EXTERNOS ---
  const openExternalMaps = () => {
    const label = encodeURIComponent(locationData.name || 'Destino');
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lon}`;
    
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    
    Linking.openURL(url).catch(() => Alert.alert("Error", "No se pudo abrir la aplicación de mapas."));
  };

  // --- LÓGICA DE RENDERIZADO DE DESCRIPCIÓN (MODIFICADA) ---
  const renderDescription = () => {
      // Texto corto que viene del feed (ya viene recortado con "...")
      const shortText = locationData.description && locationData.description.length > 5 
          ? locationData.description 
          : 'Información histórica no disponible por el momento.';

      // Determinamos qué texto mostrar
      const textToShow = (isExpanded && fullDescription) ? fullDescription : shortText;

      // Decidimos si mostramos el botón "Leer más"
      // Se muestra si el texto es largo, si termina en "...", o si ya tenemos el full text cargado
      const shouldShowButton = shortText.endsWith('...') || shortText.length > MAX_LENGTH || fullDescription;

      return (
          <View>
              <Text style={styles.description}>
                  {textToShow}
              </Text>
              
              {shouldShowButton && (
                  <TouchableOpacity 
                      onPress={handleReadMore} 
                      style={{ marginTop: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' }}
                      activeOpacity={0.7}
                      disabled={loadingDesc}
                  >
                      {loadingDesc && (
                          <ActivityIndicator size="small" color="#203040" style={{ marginRight: 6 }} />
                      )}
                      
                      <Text style={styles.readMoreText}>
                          {loadingDesc ? 'Cargando historia...' : (isExpanded ? 'Leer menos' : 'Leer más')}
                      </Text>
                  </TouchableOpacity>
              )}
          </View>
      );
  };

  // --- RENDER ITEMS CARRUSEL ---
  const renderCarouselItem = ({ item, index }) => {
    const imageUrl = getProcessedUrl(item);
    if (!imageUrl) return null;

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => openFullScreen(index)}>
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
        <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
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
      
      <ScrollView contentContainerStyle={{ paddingBottom: 0 }} showsVerticalScrollIndicator={false} > 
        
        {/* CARRUSEL */}
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
            <Ionicons name="arrow-back" size={24} color="#203040" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.favButton} onPress={handleToggleFav} activeOpacity={0.8}>
            <Ionicons name={isFav ? "heart" : "heart-outline"} size={26} color={isFav ? "#ff4757" : "#203040"} />
          </TouchableOpacity>

          {gallery.length > 1 && (
            <View style={styles.pagination}>
              {gallery.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeIndex ? styles.activeDot : null]} />
              ))}
            </View>
          )}
        </View>

        {/* INFO */}
        <View style={styles.contentContainer}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{locationData.category?.toUpperCase() || 'HISTORIC SITE'}</Text>
          </View>

          <Text style={styles.title}>{locationData.name}</Text>

          <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={18} color="#bdc3c7" style={{marginRight: 6, marginTop: 2}} />
              <Text style={styles.locationText}>{locationData.country || 'Ubicación desconocida'}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Ubicación</Text>
          <View style={styles.miniMapContainer}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.miniMap}
                initialRegion={{
                    latitude: lat,
                    longitude: lon,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.015,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                customMapStyle={[{"elementType":"geometry","stylers":[{"color":"#242f3e"}]},{"elementType":"labels.text.fill","stylers":[{"color":"#746855"}]},{"elementType":"labels.text.stroke","stylers":[{"color":"#242f3e"}]},{"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#263c3f"}]},{"featureType":"poi.park","elementType":"labels.text.fill","stylers":[{"color":"#6b9a76"}]},{"featureType":"road","elementType":"geometry","stylers":[{"color":"#38414e"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#212a37"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#9ca5b3"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#746855"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#1f2835"}]},{"featureType":"road.highway","elementType":"labels.text.fill","stylers":[{"color":"#f3d191"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#2f3948"}]},{"featureType":"transit.station","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#17263c"}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#515c6d"}]},{"featureType":"water","elementType":"labels.text.stroke","stylers":[{"color":"#17263c"}]}]}
            >
                <Marker coordinate={{ latitude: lat, longitude: lon }} pinColor="#e74c3c" />
            </MapView>
            
            <TouchableOpacity style={styles.directionsButton} onPress={openExternalMaps} activeOpacity={0.8}>
                <Ionicons name="navigate" size={20} color="#fff" style={{marginRight: 8}} />
                <Text style={styles.directionsText}>Cómo llegar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* SECCIÓN HISTORIA CON LAZY LOADING */}
          <Text style={styles.sectionTitle}>Historia</Text>
          {renderDescription()}

        </View>
        
        <Footer />
      </ScrollView>

      {/* MODAL PANTALLA COMPLETA */}
      <Modal
        visible={isFullScreenVisible}
        transparent={true}
        onRequestClose={() => setIsFullScreenVisible(false)}
        animationType="fade"
      >
        <View style={styles.fullScreenContainer}>
            <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setIsFullScreenVisible(false)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
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
                getItemLayout={(data, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
            />
        </View>
      </Modal>

    </View>
  );
}