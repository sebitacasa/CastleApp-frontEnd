import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, StyleSheet, Dimensions, Platform
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location'; 
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// 👇 IMPORTAMOS LA PALETA GLOBAL
import { APP_PALETTE as THEME } from '../theme/colors';
import { getMapLocations } from '../api/locationsApi.js';

const { width } = Dimensions.get('window');

export default function MapScreen() {
  const mapRef = useRef(null);
  const searchTimeout = useRef(null);
  const isFirstRegionChange = useRef(true); // 💡 Bandera para detectar el auto-centrado inicial
  
  const navigation = useNavigation();
  const route = useRoute();
  
  // 💡 Extraemos los parámetros pasados desde el FeedScreen
  const { feedLocations, currentCoords } = route.params || {};
  
  // 💡 Inicializamos con los datos del Feed si existen
  const [locations, setLocations] = useState(feedLocations || []);
  const [selectedLocation, setSelectedLocation] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(currentCoords || null);
  const [fetchingLocation, setFetchingLocation] = useState(!currentCoords);

  useEffect(() => {
    // 💡 Si ya recibimos ubicación y datos del Feed, saltamos la búsqueda de GPS inicial
    if (currentCoords && feedLocations) {
        setUserLocation(currentCoords);
        setFetchingLocation(false);
        return;
    }

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        const fallbackCoords = { latitude: 47.0707, longitude: 15.4395, latitudeDelta: 0.05, longitudeDelta: 0.05 };

        if (status !== 'granted') {
          Alert.alert("Permiso denegado", "Usaremos una ubicación por defecto en Europa.");
          setUserLocation(fallbackCoords);
          fetchNearbyLocations(fallbackCoords);
          return;
        }

        let location = await Location.getLastKnownPositionAsync({});

        try {
            const freshLoc = await Promise.race([
                Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("GPS Timeout")), 5000))
            ]);
            if (freshLoc) location = freshLoc;
        } catch (e) {
            console.log("⚠️ El GPS tardó mucho, usando la última ubicación conocida o el fallback.");
        }

        if (location) {
            const initialCoords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            };
            setUserLocation(initialCoords);

            if (!route.params?.targetCoordinate) {
                fetchNearbyLocations(initialCoords);
            }
        } else {
            setUserLocation(fallbackCoords);
            fetchNearbyLocations(fallbackCoords);
        }

      } catch (error) {
        console.log("Error general al obtener ubicación:", error);
        const fallbackCoords = { latitude: 47.0707, longitude: 15.4395, latitudeDelta: 0.05, longitudeDelta: 0.05 };
        setUserLocation(fallbackCoords);
        fetchNearbyLocations(fallbackCoords);
      } finally {
        setFetchingLocation(false);
      }
    })();
  }, [route.params?.targetCoordinate, currentCoords, feedLocations]);

  const fetchNearbyLocations = async (region) => {
    if (!region) return;
    setLoading(true);
    try {
        const data = await getMapLocations(region.latitude, region.longitude);
        
        // 💡 Combinamos los pines anteriores con los nuevos para no perder lo que vino del Feed
        setLocations(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const uniqueNewData = data.filter(item => !existingIds.has(item.id));
            return [...prev, ...uniqueNewData];
        });
    } catch (error) {
      console.error("Error cargando mapa:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRegionChangeComplete = (newRegion) => {
      // 💡 Ignoramos el evento de cámara inicial si vinimos del Feed
      if (feedLocations && isFirstRegionChange.current) {
          isFirstRegionChange.current = false;
          return;
      }

      // A partir del primer movimiento manual del usuario, empezamos a buscar en la nueva zona
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => fetchNearbyLocations(newRegion), 1000);
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

  if (fetchingLocation && !userLocation) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={THEME.gold} />
        <Text style={{marginTop: 15, color: THEME.subText}}>Searching for your location...</Text>
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
        // 💡 Tocar el mapa deselecciona el marcador automáticamente
        onPress={() => setSelectedLocation(null)}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {locations.map((loc, index) => (
          <Marker
            key={`${loc.id}-${index}`}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            pinColor={ loc.category === 'Museums' ? 'blue' : 'red' }
            title={loc.name}
            onPress={() => onMarkerPress(loc)}
          />
        ))}
      </MapView>

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={THEME.gold} />
          <Text style={styles.loaderText}>Updating zone...</Text>
        </View>
      )}

      {/* 💡 TARJETA DE DETALLE SIN BOTÓN DE CERRAR */}
      {selectedLocation && (
        <TouchableOpacity 
            style={styles.cardContainer}
            activeOpacity={0.95}
            onPress={() => navigation.navigate('Detail', { locationData: selectedLocation })}
        >
            <View style={styles.cardImageWrapper}>
                <Image 
                    source={{ uri: selectedLocation.image_url || 'https://images.unsplash.com/photo-1599576838688-8a6c11263052?q=80&w=800' }}
                    style={styles.cardImage}
                    resizeMode="cover"
                />
            </View>
            <View style={styles.textContent}>
                <Text numberOfLines={1} style={styles.cardTitle}>{selectedLocation.name}</Text>
                <Text numberOfLines={1} style={styles.cardSubtitle}>
                    {selectedLocation.category || 'Historical Site'} • {selectedLocation.country || "Location"}
                </Text>
                <View style={styles.detailsBtn}>
                    <Text style={styles.detailsBtnText}>EXPLORE</Text>
                    <Ionicons name="arrow-forward" size={14} color={THEME.gold} style={{marginLeft: 5}} />
                </View>
            </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={THEME.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loaderContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  loaderText: {
    marginLeft: 8,
    color: THEME.text,
    fontSize: 14,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.gold,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 100,
  },
  cardContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: width * 0.9,
    backgroundColor: THEME.card,
    borderRadius: 16,
    flexDirection: 'row',
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  textContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.text,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: THEME.subText,
    marginBottom: 8,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.gold,
    letterSpacing: 0.5,
  }
});