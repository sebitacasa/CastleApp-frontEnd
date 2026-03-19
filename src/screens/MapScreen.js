import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, StyleSheet 
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location'; 
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Asegúrate de que la ruta a tus estilos sea correcta
import { styles, THEME } from './MapScreen.styles';

// 👇 IMPORTAMOS LA FUNCIÓN QUE CONECTA CON TU DB
import { getMapLocations } from '../api/locationsApi.js';

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

  // --- 1. OBTENER UBICACIÓN REAL ---
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            "Permiso denegado", 
            "Usaremos una ubicación por defecto (Buenos Aires)."
          );
          const fallback = { latitude: -34.6037, longitude: -58.3816, latitudeDelta: 0.05, longitudeDelta: 0.05 };
          setUserLocation(fallback);
          fetchNearbyLocations(fallback);
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const currentCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };

        setUserLocation(currentCoords);

        // Si no venimos de una búsqueda específica, cargamos lo cercano
        if (!route.params?.targetCoordinate) {
            fetchNearbyLocations(currentCoords);
        }

      } catch (error) {
        console.log("Error al obtener ubicación:", error);
        const fallback = { latitude: -34.6037, longitude: -58.3816, latitudeDelta: 0.05, longitudeDelta: 0.05 };
        setUserLocation(fallback);
        fetchNearbyLocations(fallback);
      } finally {
        setFetchingLocation(false);
      }
    })();
  }, []);

  // --- 2. CARGAR LUGARES (Usando api.js) ---
  const fetchNearbyLocations = async (region) => {
    if (!region) return;
    setLoading(true);
    try {
        // 👇 AQUÍ ESTÁ EL CAMBIO PRINCIPAL
        // Ya no usamos fetch() directo, usamos el servicio que filtra y limpia los datos
        const data = await getMapLocations(region.latitude, region.longitude);
        setLocations(data);
    } catch (error) {
      console.error("Error cargando mapa:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRegionChangeComplete = (newRegion) => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      // Esperamos 1 seg después de mover el mapa para recargar
      searchTimeout.current = setTimeout(() => fetchNearbyLocations(newRegion), 1000);
  };

  const onMarkerPress = (loc) => {
      setSelectedLocation(loc); 
      // Centrar mapa un poco más arriba para dejar espacio a la tarjeta
      mapRef.current?.animateToRegion({
          latitude: loc.latitude, 
          longitude: loc.longitude,
          latitudeDelta: 0.015, 
          longitudeDelta: 0.015,
      }, 500);
  };

  // --- RENDERIZADO ---
  if (fetchingLocation && !userLocation) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={THEME.primary || '#d4af37'} />
        <Text style={{marginTop: 15, color: '#333'}}>Searching for your location...</Text>
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
            // 🔴 Rojo para tus lugares oficiales, Azul para museos, etc.
            pinColor={ loc.category === 'Museums' ? 'blue' : 'red' }
            title={loc.name}
            onPress={() => onMarkerPress(loc)}
          />
        ))}
      </MapView>

      {/* LOADER FLOTANTE (Cuando te mueves en el mapa) */}
      {loading && (
        <View style={[styles.loaderContainer, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
          <ActivityIndicator size="small" color="#333" />
          <Text style={[styles.loaderText, { color: '#333' }]}>Updating zone...</Text>
        </View>
      )}

      {/* 🟢 BOTÓN FLOTANTE (+) PARA AGREGAR NUEVO LUGAR */}
      {/* Solo se muestra si no hay un lugar seleccionado */}
      {!selectedLocation && (
        <TouchableOpacity 
            style={localStyles.fab}
            onPress={() => navigation.navigate('Search')} 
        >
            <Ionicons name="add" size={36} color="white" />
        </TouchableOpacity>
      )}

      {/* TARJETA DE DETALLE */}
      {selectedLocation && (
        <TouchableOpacity 
            style={styles.cardContainer}
            activeOpacity={0.95}
            // Navegamos al detalle. Nota: selectedLocation ya tiene la URL limpia gracias a api.js
            onPress={() => navigation.navigate('Detail', { locationData: selectedLocation })}
        >
            <View style={styles.cardImageWrapper}>
                <Image 
                    // Ya no necesitamos getSecureImage, api.js ya nos dio una URL válida
                    source={{ uri: selectedLocation.image_url }}
                    style={styles.cardImage}
                    resizeMode="cover"
                />
            </View>
            <View style={styles.textContent}>
                <Text numberOfLines={1} style={styles.cardTitle}>{selectedLocation.name}</Text>
                <Text numberOfLines={1} style={styles.cardSubtitle}>
                    {selectedLocation.category || 'Historical Site'} • {selectedLocation.country || "Ubicación"}
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

      {/* BOTÓN ATRÁS (Opcional) */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
}

// Estilos locales para el botón flotante (FAB)
const localStyles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#d4af37', // Color dorado
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6, // Sombra en Android
        shadowColor: '#000', // Sombra en iOS
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 100, // Asegura que esté por encima del mapa
    }
});