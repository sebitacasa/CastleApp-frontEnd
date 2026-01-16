import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, Image, ActivityIndicator, Alert 
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location'; 
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// 👇 IMPORTAMOS LOS ESTILOS Y EL TEMA
import { styles, THEME } from './MapScreen.styles';

// ⚠️ AJUSTA TU IP AQUÍ
const API_BASE = 'http://10.0.2.2:8080';

// --- 🌑 ESTILO DE MAPA "DARK LUXURY" ---
const LUXURY_MAP_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#212121" }] // Fondo base oscuro
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }] // Oculta iconos de Google
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }] // Texto gris suave
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#212121" }] // Borde del texto oscuro
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "color": "#757575" }] // Fronteras
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#181818" }] // Parques más oscuros
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#2c2c2c" }] // Calles gris oscuro
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#3c3c3c" }] // Autopistas un poco más claras
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#000000" }] // Agua totalmente negra
  }
];

export default function MapScreen() {
  const mapRef = useRef(null);
  const searchTimeout = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();
  
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(true);

  // --- 1. HELPER DE LIMPIEZA DE DATOS ---
  const cleanData = (data) => {
      return data.map(item => {
          let cleanImg = item.image_url;
          if (typeof cleanImg === 'string' && cleanImg.startsWith('{')) {
              cleanImg = cleanImg.replace(/[{}"\\]/g, '').split(',')[0];
          }
          if (Array.isArray(cleanImg)) {
              cleanImg = cleanImg.length > 0 ? cleanImg[0] : null;
          }
          if (!cleanImg && item.images) {
               let imgs = item.images;
               if (typeof imgs === 'string') imgs = imgs.replace(/[{}"\\]/g, '').split(',');
               if (Array.isArray(imgs) && imgs.length > 0) cleanImg = imgs[0];
          }
          return { ...item, image_url: cleanImg };
      });
  };

  // --- 2. HELPER "PROXY" (SOLUCIÓN ERROR 403) ---
  const getSecureImage = (item) => {
      if (!item) return 'https://via.placeholder.com/150';
      let rawUrl = item.image_url;
      if (!rawUrl) return 'https://via.placeholder.com/150';
      if (rawUrl.includes(API_BASE)) return rawUrl;
      return `${API_BASE}/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
  };

  // --- 3. OBTENER UBICACIÓN (FORZADO A SAN TELMO + FALLBACK) ---
  useEffect(() => {
    (async () => {
      try {
        // 👇 CONFIGURACIÓN FIJA: SAN TELMO, CABA (Para probar el mapa oscuro)
        const sanTelmoCoords = {
          latitude: -34.6212,  // Latitud San Telmo
          longitude: -58.3731, // Longitud San Telmo
          latitudeDelta: 0.015, 
          longitudeDelta: 0.015,
        };

        console.log("📍 Mapa: Forzando ubicación en San Telmo (Modo Dark)");
        setUserLocation(sanTelmoCoords);

        if (!route.params?.targetCoordinate) {
            fetchNearbyLocations(sanTelmoCoords);
        }

      } catch (error) {
        console.log("Error al iniciar mapa:", error);
        // Fallback (Obelisco)
        const fallback = { latitude: -34.6037, longitude: -58.3816, latitudeDelta: 0.05, longitudeDelta: 0.05 };
        setUserLocation(fallback);
        fetchNearbyLocations(fallback);
      } finally {
        setFetchingLocation(false);
      }
    })();
  }, []);

  // --- 4. ACTUALIZAR TARJETA AUTOMÁTICAMENTE ---
  useEffect(() => {
    if (selectedLocation) {
        const updatedLoc = locations.find(l => l.id === selectedLocation.id);
        if (updatedLoc && updatedLoc.image_url !== selectedLocation.image_url) {
            console.log(`✨ FOTO LISTA PARA: ${updatedLoc.name}`);
            setSelectedLocation(updatedLoc);
        }
    }
  }, [locations]);

  // --- 5. BÚSQUEDA ---
  const fetchNearbyLocations = async (region) => {
    if (!region) return;
    setLoading(true);
    try {
        const rawRadius = Math.round((region.latitudeDelta * 111000) / 2);
        const searchRadius = Math.max(2000, Math.min(rawRadius, 50000));
        const url = `${API_BASE}/api/localizaciones?page=1&limit=50&lat=${region.latitude}&lon=${region.longitude}&radius=${searchRadius}`;
        
        const response = await fetch(url);
        const json = await response.json();
        
        if (json.data) {
            const cleaned = cleanData(json.data);
            setLocations(cleaned);
        }
    } catch (error) {
      console.error("Error mapa:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRegionChangeComplete = (newRegion) => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => fetchNearbyLocations(newRegion), 1000);
  };

  const onMarkerPress = (loc) => {
      setSelectedLocation(loc); 
      mapRef.current?.animateToRegion({
          latitude: loc.latitude, longitude: loc.longitude,
          latitudeDelta: 0.015, longitudeDelta: 0.015,
      }, 500);
  };

  // --- RENDERIZADO ---
  if (fetchingLocation && !userLocation) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: '#212121' }]}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={{marginTop: 15, color: 'white', fontWeight: 'bold'}}>Cargando Mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        
        // 👇 APLICAMOS EL ESTILO DARK LUXURY AQUÍ
        customMapStyle={LUXURY_MAP_STYLE}
        
        showsUserLocation={true} 
        showsMyLocationButton={true}
        initialRegion={userLocation}
        onPress={() => setSelectedLocation(null)}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {locations.map((loc, index) => (
          <Marker
            key={`${loc.id}-${index}`}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            // Puedes probar pinColor={'gold'} si React Native Maps lo soporta, o dejar el default por ahora
            pinColor={ loc.category === 'Museums' ? 'blue' : 'red' }
            onPress={() => onMarkerPress(loc)}
          />
        ))}
      </MapView>

      {/* LOADER FLOTANTE */}
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={THEME.textWhite} />
          <Text style={styles.loaderText}>Explorando zona...</Text>
        </View>
      )}

      {/* TARJETA DE DETALLE */}
      {selectedLocation && (
        <TouchableOpacity 
            style={styles.cardContainer}
            activeOpacity={0.95}
            onPress={() => navigation.navigate('Detail', { locationData: selectedLocation })}
        >
            <View style={styles.cardImageWrapper}>
                <Image 
                    source={{ uri: getSecureImage(selectedLocation) }}
                    style={styles.cardImage}
                    resizeMode="cover"
                    onError={(e) => console.log("ERROR IMAGEN:", e.nativeEvent.error)}
                />
            </View>
            <View style={styles.textContent}>
                <Text numberOfLines={1} style={styles.cardTitle}>{selectedLocation.name}</Text>
                <Text numberOfLines={1} style={styles.cardSubtitle}>
                    {selectedLocation.category} • {selectedLocation.country || "Ubicación"}
                </Text>
                <View style={styles.detailsBtn}>
                    <Text style={styles.detailsBtnText}>Ver Detalles</Text>
                    <Ionicons name="arrow-forward" size={14} color="white" style={{marginLeft: 5}} />
                </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedLocation(null)}>
                <Ionicons name="close-circle" size={24} color={THEME.textGray} />
            </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* BOTÓN ATRÁS (Ahora blanco para que se vea en el mapa negro) */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
         <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}