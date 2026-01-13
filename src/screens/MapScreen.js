import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, Image, ActivityIndicator, Alert 
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location'; 
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// 👇 IMPORTAMOS LOS ESTILOS Y EL TEMA (Nuevo estilo)
import { styles, THEME } from './MapScreen.styles';

// ⚠️ AJUSTA TU IP AQUÍ
const API_BASE = 'http://10.0.2.2:8080';
//const API_BASE = 'http://192.168.1.33:8080';

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

  // --- 1. HELPER DE LIMPIEZA DE DATOS (Para el estado general) ---
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

  // --- 2. 🔥 HELPER "PROXY" (SOLUCIÓN ERROR 403) ---
  // Esta función faltaba en tu código nuevo. Es la que pide la foto a TU servidor.
  const getSecureImage = (item) => {
      if (!item) return 'https://via.placeholder.com/150';

      // Aunque usemos cleanData antes, nos aseguramos de tener una URL base limpia aquí
      let rawUrl = item.image_url;
      
      if (!rawUrl) return 'https://via.placeholder.com/150';

      // Si la URL ya es de tu servidor local, no hacemos nada
      if (rawUrl.includes(API_BASE)) return rawUrl;

      // 🔥 LA MAGIA: Convertimos la URL directa en una URL PROXY
      // El celular le pide la foto a TU servidor, no a Wikipedia
      return `${API_BASE}/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
  };

  // --- 3. OBTENER UBICACIÓN ---
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setFetchingLocation(false);
          return;
        }
        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const userCoords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setUserLocation(userCoords);
        if (!route.params?.targetCoordinate) {
            fetchNearbyLocations(userCoords);
        }
      } catch (error) {
        console.log("Error GPS:", error);
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
        // Si detectamos que la imagen cambió (se cargó en la DB), actualizamos
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
      <View style={[styles.container, styles.centerContent, { backgroundColor: THEME.darkBg }]}>
        <ActivityIndicator size="large" color={THEME.accent} />
        <Text style={{marginTop: 15, color: THEME.textWhite, fontWeight: 'bold'}}>Iniciando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
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
            pinColor={ loc.category === 'Museums' ? 'blue' : 'red' }
            onPress={() => onMarkerPress(loc)}
          />
        ))}
      </MapView>

      {/* LOADER FLOTANTE (Nuevo Estilo) */}
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={THEME.textWhite} />
          <Text style={styles.loaderText}>Explorando zona...</Text>
        </View>
      )}

      {/* TARJETA DE DETALLE (Nuevo Estilo + Funcionalidad Proxy) */}
      {selectedLocation && (
        <TouchableOpacity 
            style={styles.cardContainer}
            activeOpacity={0.95}
            onPress={() => navigation.navigate('Detail', { locationData: selectedLocation })}
        >
            <View style={styles.cardImageWrapper}>
                <Image 
                    // 🔥 AQUÍ ESTÁ EL FIX: Usamos getSecureImage en lugar de la URL directa
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

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
         <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
}