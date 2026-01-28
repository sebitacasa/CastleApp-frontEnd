import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, Image, ActivityIndicator, Alert 
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location'; 
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { styles, THEME } from './MapScreen.styles';

const API_BASE = 'https://castleapp-backend-production.up.railway.app';

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
          return { ...item, image_url: cleanImg };
      });
  };

  const getSecureImage = (item) => {
      if (!item) return 'https://via.placeholder.com/150';
      let rawUrl = item.image_url;
      if (!rawUrl) return 'https://via.placeholder.com/150';
      if (rawUrl.includes(API_BASE)) return rawUrl;
      return `${API_BASE}/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
  };

  // --- 2. OBTENER UBICACIÓN REAL ---
  useEffect(() => {
    (async () => {
      try {
        // Pedimos permiso para usar el GPS
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            "Permiso denegado", 
            "Necesitamos tu ubicación para mostrarte los castillos cercanos. Usaremos una ubicación por defecto."
          );
          const fallback = { latitude: -34.6037, longitude: -58.3816, latitudeDelta: 0.05, longitudeDelta: 0.05 };
          setUserLocation(fallback);
          fetchNearbyLocations(fallback);
          return;
        }

        // Obtenemos la posición actual real del sensor
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const currentCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02, // Zoom inicial
          longitudeDelta: 0.02,
        };

        console.log("📍 Ubicación real obtenida:", currentCoords);
        setUserLocation(currentCoords);

        // Si no venimos de una búsqueda específica, buscamos lo que hay alrededor del usuario
        if (!route.params?.targetCoordinate) {
            fetchNearbyLocations(currentCoords);
        }

      } catch (error) {
        console.log("Error al obtener ubicación:", error);
        const fallback = { latitude: -34.6037, longitude: -58.3816, latitudeDelta: 0.05, longitudeDelta: 0.05 };
        setUserLocation(fallback);
      } finally {
        setFetchingLocation(false);
      }
    })();
  }, []);

  // --- 3. BÚSQUEDA ---
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
      console.error("Error al buscar localizaciones:", error);
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
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={{marginTop: 15, color: '#333'}}>Detectando tu ubicación...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        
        // 👇 ELIMINAMOS customMapStyle PARA VOLVER A LOS COLORES ORIGINALES
        
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

      {/* LOADER FLOTANTE */}
      {loading && (
        <View style={[styles.loaderContainer, { backgroundColor: 'rgba(255,255,255,0.8)' }]}>
          <ActivityIndicator size="small" color="#333" />
          <Text style={[styles.loaderText, { color: '#333' }]}>Buscando...</Text>
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
                <Ionicons name="close-circle" size={24} color="#999" />
            </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* BOTÓN ATRÁS */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
}