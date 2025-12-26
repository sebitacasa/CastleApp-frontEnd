import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Dimensions, 
  Linking, 
  Platform, 
  Alert, 
  FlatList 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

// 👇 IMPORTAMOS EL SERVICIO DE FAVORITOS (Asegúrate de haber creado storage.js)
import { checkIsFavorite, toggleFavorite } from '../api/storage.js';

const { width } = Dimensions.get('window');
const IMG_HEIGHT = 350; 

// 👇 CONSTANTE DE IP (Ajusta si es necesario)
//const API_BASE = 'http://10.0.2.2:8080';
const API_BASE = 'http://192.168.1.33:8080';

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

  // 1. CARGA INICIAL: Chequear si ya es favorito
  useEffect(() => {
    if (locationData && locationData.id) {
        checkIsFavorite(locationData.id).then(setIsFav);
    }
  }, [locationData]);

  // 2. FUNCIÓN TOGGLE (Guardar/Quitar)
  const handleToggleFav = async () => {
    const newState = await toggleFavorite(locationData);
    setIsFav(newState); // Actualizamos el corazón visualmente
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

  // --- ABRIR MAPAS EXTERNOS (Navegación GPS) ---
  const openExternalMaps = () => {
    const label = encodeURIComponent(locationData.name || 'Destino');
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lon}`;
    
    // URL Scheme robusto para ambos sistemas
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    
    Linking.openURL(url).catch(() => Alert.alert("Error", "No se pudo abrir la aplicación de mapas."));
  };

  // --- HELPER: OBTENER URL ORIGINAL ---
  const getOriginalWikiUrl = (url) => {
      if (!url || typeof url !== 'string') return null;
      if (url.includes('/thumb/')) {
          try {
              let clean = url.replace('/thumb/', '/');
              const parts = clean.split('/');
              if (parts[parts.length - 1].includes('px-')) parts.pop();
              return parts.join('/');
          } catch (e) { return url; }
      }
      return url;
  };

  // --- RENDER ITEM CARRUSEL ---
  const renderCarouselItem = ({ item }) => {
    if (!item) return null;

    let cleanUrl = String(item).trim();
    cleanUrl = getOriginalWikiUrl(cleanUrl);
    cleanUrl = cleanUrl.replace(/["{}]/g, ""); 
    if (cleanUrl.startsWith('http:')) cleanUrl = cleanUrl.replace('http:', 'https:');

    let imageUrlToShow;
    if (cleanUrl.includes('wikimedia.org')) {
        imageUrlToShow = `${API_BASE}/api/image-proxy?url=${encodeURIComponent(cleanUrl)}`;
    } else {
        imageUrlToShow = cleanUrl;
    }

    return (
      <View style={{ width, height: IMG_HEIGHT }}>
        <Image 
          source={{ uri: imageUrlToShow }} 
          style={styles.carouselImage} 
          resizeMode="cover" 
          onError={(e) => {
              if(imageUrlToShow.includes('api/image-proxy')) {
                  console.log("⚠️ Error carga imagen detalle:", e.nativeEvent.error);
              }
          }}
        />
        <View style={styles.imageOverlay} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        
        {/* CARRUSEL E IMÁGENES */}
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

          {/* BOTÓN ATRÁS (Izquierda) */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* ❤️ BOTÓN FAVORITO (Derecha) ❤️ */}
          <TouchableOpacity 
            style={styles.favButton} 
            onPress={handleToggleFav}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isFav ? "heart" : "heart-outline"} 
              size={26} 
              color={isFav ? "#ff4757" : "#fff"} 
            />
          </TouchableOpacity>

          {gallery.length > 1 && (
            <View style={styles.pagination}>
              {gallery.map((_, i) => (
                <View 
                  key={i} 
                  style={[styles.dot, i === activeIndex ? styles.activeDot : null]} 
                />
              ))}
            </View>
          )}
        </View>

        {/* INFO DEL LUGAR */}
        <View style={styles.contentContainer}>
          <Text style={styles.category}>
             {locationData.category?.toUpperCase() || 'SITIO HISTÓRICO'}
          </Text>

          <Text style={styles.title}>
             {locationData.name}
          </Text>

          <View style={styles.locationRow}>
             <Ionicons name="location-sharp" size={16} color="#7f8c8d" style={{marginRight: 4, marginTop: 2}} />
             <Text style={styles.locationText}>
                 {locationData.country || 'Ubicación desconocida'}
             </Text>
          </View>

          <View style={styles.divider} />

          {/* SECCIÓN MAPA PEQUEÑO + BOTÓN NAVEGACIÓN */}
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
            >
                <Marker coordinate={{ latitude: lat, longitude: lon }} pinColor="#e74c3c" />
            </MapView>
            
            {/* BOTÓN AZUL: CÓMO LLEGAR */}
            <TouchableOpacity style={styles.directionsButton} onPress={openExternalMaps} activeOpacity={0.8}>
                <Ionicons name="navigate" size={20} color="#fff" style={{marginRight: 6}} />
                <Text style={styles.directionsText}>Cómo llegar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Historia</Text>
          <Text style={styles.description}>
            {locationData.description && locationData.description.length > 10 
                ? locationData.description 
                : 'No hay descripción histórica disponible para este lugar.'}
          </Text>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  carouselContainer: { height: IMG_HEIGHT, width: width, position: 'relative' },
  carouselImage: { width: width, height: IMG_HEIGHT },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
  
  pagination: { position: 'absolute', bottom: 40, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 4 },
  activeDot: { backgroundColor: '#fff', width: 10, height: 10, borderRadius: 5 },

  // Botón Atrás
  backButton: { 
      position: 'absolute', top: 50, left: 20, 
      width: 40, height: 40, borderRadius: 20, 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      justifyContent: 'center', alignItems: 'center', zIndex: 10 
  },
  
  // ❤️ Botón Favorito (Nuevo Estilo)
  favButton: { 
      position: 'absolute', top: 50, right: 20, 
      width: 40, height: 40, borderRadius: 20, 
      backgroundColor: 'rgba(0,0,0,0.5)', // Fondo semi-transparente para que se vea sobre la foto
      justifyContent: 'center', alignItems: 'center', zIndex: 10 
  },

  contentContainer: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, paddingHorizontal: 25, paddingTop: 30 },

  category: { color: '#e74c3c', fontWeight: '700', fontSize: 12, marginBottom: 5, letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#2c3e50', marginBottom: 8, lineHeight: 34 },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 },
  locationText: { fontSize: 15, color: '#7f8c8d', fontWeight: '500', flex: 1, lineHeight: 20 },

  divider: { height: 1, backgroundColor: '#f1f2f6', marginVertical: 25 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 15, color: '#2c3e50' },
  description: { fontSize: 16, lineHeight: 26, color: '#57606f', textAlign: 'left' },

  miniMapContainer: { height: 200, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f0f0f0', position: 'relative' },
  miniMap: { width: '100%', height: '100%' },
  
  directionsButton: { position: 'absolute', bottom: 15, right: 15, backgroundColor: '#4285F4', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 25, elevation: 5, shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3 },
  directionsText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});