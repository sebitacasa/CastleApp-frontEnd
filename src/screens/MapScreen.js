import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, 
  Image, ActivityIndicator, Alert, StyleSheet, Dimensions, Platform
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location'; 
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// CONFIGURACIÓN API (Asegúrate de que es tu IP correcta)
const API_BASE = 'http://192.168.1.33:8080'; 

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

  // --- 1. OBTENER UBICACIÓN INICIAL ---
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'No podemos centrar el mapa en tu ubicación.');
          setFetchingLocation(false);
          return;
        }

        let loc = await Location.getCurrentPositionAsync({});
        const userCoords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setUserLocation(userCoords);
        
        // Si no venimos de una búsqueda específica, cargar zona actual
        if (!route.params?.targetCoordinate) {
            fetchNearbyLocations(userCoords);
        }

      } catch (error) {
        console.log("Error GPS:", error);
      } finally {
        setFetchingLocation(false);
      }
    })();
  }, []);

  // --- 2. SINCRONIZACIÓN AUTOMÁTICA DE FOTOS (EL FIX CLAVE) ---
  // Si tienes una tarjeta abierta y llega una foto nueva del backend, esto actualiza la tarjeta.
  useEffect(() => {
    if (selectedLocation) {
        // Buscar si este lugar ha cambiado en la lista principal
        const updatedLoc = locations.find(l => l.id === selectedLocation.id);
        
        // Si existe y tiene una imagen diferente (o nueva), actualizamos la tarjeta seleccionada
        if (updatedLoc && updatedLoc.images !== selectedLocation.images) {
            console.log(`🔄 Foto recibida para: ${updatedLoc.name}. Actualizando tarjeta...`);
            setSelectedLocation(updatedLoc);
        }
    }
  }, [locations]); // Se ejecuta cada vez que 'locations' cambia

  // --- 3. RECIBIR COORDENADAS DEL FEED ---
  useEffect(() => {
    if (route.params?.targetCoordinate) {
      const [longitude, latitude] = route.params.targetCoordinate; 
      const newRegion = {
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
      };
      mapRef.current?.animateToRegion(newRegion, 1500);
      fetchNearbyLocations(newRegion);
    }
  }, [route.params?.targetCoordinate]); 

  // --- 4. BÚSQUEDA DINÁMICA ---
  const fetchNearbyLocations = async (region) => {
    if (!region) return;

    setLoading(true);
    try {
        const rawRadius = Math.round((region.latitudeDelta * 111000) / 2);
        const searchRadius = Math.max(2000, Math.min(rawRadius, 50000));

        const url = `${API_BASE}/api/localizaciones?page=1&limit=50&lat=${region.latitude}&lon=${region.longitude}&radius=${searchRadius}`;
        
        // console.log(`📡 Buscando: ${(searchRadius/1000).toFixed(1)}km`);
        
        const response = await fetch(url);
        const json = await response.json();
        
        if (json.data) {
            setLocations(json.data);
        }
    } catch (error) {
      console.error("Error mapa:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRegionChangeComplete = (newRegion) => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
          fetchNearbyLocations(newRegion);
      }, 1000);
  };

  const onMarkerPress = (loc) => {
      setSelectedLocation(loc); 
      mapRef.current?.animateToRegion({
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.015, 
          longitudeDelta: 0.015,
      }, 500);
  };

  // --- 5. LIMPIEZA DE URL BLINDADA ---
  const getImageUrl = (item) => {
    if (!item) return 'https://via.placeholder.com/400x300/cccccc/666666?text=Cargando...';

    let finalUrl = null;

    // A. String sucio de Postgres: "{http://url.com}"
    if (typeof item.images === 'string') {
        // Quitamos { } " y \ (escapes)
        const cleanStr = item.images.replace(/[{}"\\]/g, '');
        const parts = cleanStr.split(',');
        // Buscamos la primera parte que sea http
        const validPart = parts.find(p => p.startsWith('http'));
        if (validPart) finalUrl = validPart;
    }
    // B. Array real
    else if (Array.isArray(item.images) && item.images.length > 0) {
        finalUrl = item.images[0];
    }

    // C. Fallback antiguo
    if (!finalUrl && item.image_url) {
        finalUrl = item.image_url;
    }

    return finalUrl || 'https://via.placeholder.com/400x300/cccccc/666666?text=Sin+Foto';
  };

  // --- RENDERIZADO ---
  if (fetchingLocation && !userLocation) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#38761D" />
        <Text style={{marginTop: 10}}>Localizando...</Text>
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
            // Key combinada para forzar repintado si cambia la imagen
            key={`${loc.id}-${loc.images ? 'img' : 'no'}-${index}`}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            pinColor={
                loc.category === 'Ruins' ? 'orange' : 
                loc.category === 'Museums' ? 'blue' : 
                loc.category === 'Castles' ? 'purple' : 'red'
            }
            onPress={() => onMarkerPress(loc)}
          />
        ))}
      </MapView>

      {/* Loader Flotante */}
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#38761D" />
          <Text style={styles.loaderText}>Explorando zona...</Text>
        </View>
      )}

      {/* TARJETA DE INFORMACIÓN */}
      {selectedLocation && (
        <TouchableOpacity 
            style={styles.cardContainer}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Detail', { locationData: selectedLocation })}
        >
            <View style={styles.cardImageWrapper}>
                <Image 
                    // KEY IMPORTANTE: Si la URL cambia, la imagen se recarga
                    key={getImageUrl(selectedLocation)}
                    source={{ uri: getImageUrl(selectedLocation) }}
                    style={styles.cardImage}
                    resizeMode="cover"
                />
            </View>
            <View style={styles.textContent}>
                <Text numberOfLines={1} style={styles.cardTitle}>{selectedLocation.name}</Text>
                <Text numberOfLines={1} style={styles.cardSubtitle}>
                    {selectedLocation.category} • {selectedLocation.country || "Ubicación detectada"}
                </Text>
                {selectedLocation.distance_meters && (
                    <Text style={styles.distanceText}>
                        📍 a {(selectedLocation.distance_meters / 1000).toFixed(1)} km
                    </Text>
                )}
                <View style={styles.detailsBtn}>
                    <Text style={styles.detailsBtnText}>Ver Detalles</Text>
                    <Ionicons name="arrow-forward" size={16} color="white" style={{marginLeft: 5}} />
                </View>
            </View>
            <TouchableOpacity 
                style={styles.closeBtn} 
                onPress={() => setSelectedLocation(null)}
            >
                <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Botón Volver */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
         <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  map: { width: '100%', height: '100%' },
  
  loaderContainer: {
    position: 'absolute', top: 50, alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)', padding: 10, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.2
  },
  loaderText: { marginLeft: 8, color: '#38761D', fontWeight: 'bold' },

  backButton: {
    position: 'absolute', top: Platform.OS === 'ios' ? 50 : 40, left: 20,
    backgroundColor: 'white', padding: 10, borderRadius: 25,
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2
  },

  cardContainer: {
      position: 'absolute', bottom: 30, left: 20, right: 20,
      backgroundColor: 'white', borderRadius: 15, height: 120,
      flexDirection: 'row', padding: 10,
      elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 6
  },
  cardImageWrapper: { flex: 1, borderRadius: 10, overflow: 'hidden', marginRight: 12 },
  cardImage: { width: '100%', height: '100%', backgroundColor: '#eee' }, // Fondo gris mientras carga
  textContent: { flex: 2, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  cardSubtitle: { fontSize: 13, color: '#666', marginBottom: 4 },
  distanceText: { fontSize: 12, color: '#38761D', fontWeight: '600', marginBottom: 6 },
  detailsBtn: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#38761D',
      paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, alignSelf: 'flex-start'
  },
  detailsBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  closeBtn: { position: 'absolute', top: 10, right: 10, padding: 5 }
});