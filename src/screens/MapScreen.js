import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, 
  Image, ActivityIndicator, Alert 
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location'; 
import { useNavigation, useRoute } from '@react-navigation/native'; // <--- Importante: useRoute

// Importación de datos y API
import { REGIONES_RECOMENDADAS } from '../data/regions.js';
import { getRegionData } from '../api/locationsApi.js';

// Importación de estilos externos
import styles from './MapScreen.styles';

const DEFAULT_PLACEHOLDER = 'https://images.unsplash.com/photo-1599576838688-8a6c11263052?q=80&w=400';

export default function MapScreen() {
  const mapRef = useRef(null);
  const navigation = useNavigation();
  const route = useRoute(); // Hook para leer parámetros de navegación
  
  const [locations, setLocations] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(true);

  // --- 1. UBICACIÓN DEL USUARIO ---
  useEffect(() => {
    (async () => {
      try {
        let serviceEnabled = await Location.hasServicesEnabledAsync();
        if (!serviceEnabled) {
          Alert.alert('GPS desactivado', 'Por favor, enciende la ubicación.');
          setFetchingLocation(false);
          return;
        }

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'No podemos mostrar tu ubicación.');
          setFetchingLocation(false);
          return;
        }

        let loc = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch (error) {
        // Fallo silencioso o alerta simple
        console.log("Error GPS:", error);
      } finally {
        setFetchingLocation(false);
      }
    })();
  }, []);

  // --- 2. LÓGICA DE BÚSQUEDA (Recibir coordenadas del Feed) ---
  useEffect(() => {
    // Si la ruta trae 'targetCoordinate', movemos el mapa
    if (route.params?.targetCoordinate) {
      // Photon devuelve array: [longitud, latitud]
      const [longitude, latitude] = route.params.targetCoordinate; 

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: 0.05, // Zoom de ciudad
          longitudeDelta: 0.05,
        }, 2000); // 2 segundos de animación
      }
      
      // Reseteamos selección de región manual para evitar confusión
      setSelectedRegion(null);
    }
  }, [route.params?.targetCoordinate]); 


  // --- 3. SELECCIÓN DE REGIONES (Lista inferior) ---
  const handleSelectRegion = async (region) => {
    if (selectedRegion === region.id && locations.length > 0) return;

    setSelectedRegion(region.id);
    setLoading(true);

    try {
      const data = await getRegionData(region.name);
      if (data && data.center) {
        mapRef.current?.animateToRegion({
          ...data.center,
          latitudeDelta: 0.8,
          longitudeDelta: 0.8,
        }, 1500);

        setLocations(data.places || []);
        if (!data.places?.length) {
          Alert.alert("Explorador", "No hay sitios registrados aquí aún.");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Fallo al cargar datos de la zona.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERIZADO ---
  if (fetchingLocation) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#38761D" />
        <Text style={{marginTop: 10}}>Buscando tu ubicación...</Text>
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
        initialRegion={userLocation || {
          latitude: 48.8566, 
          longitude: 2.3522,
          latitudeDelta: 10,
          longitudeDelta: 10,
        }}
      >
        {locations.map((loc, index) => (
          <Marker
            key={loc.id || index} 
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            pinColor={loc.category === 'Ruins' ? 'orange' : loc.category === 'Museums' ? 'blue' : 'red'}
            onCalloutPress={() => navigation.navigate('Detail', { locationData: loc })}
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{loc.name}</Text>
                <Text style={styles.calloutSubtitle}>Ver detalles ➔</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loaderText}>Explorando zona...</Text>
        </View>
      )}

      {/* Lista de regiones inferior */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Explorar Destinos Históricos 🏰</Text>
        <FlatList
          data={REGIONES_RECOMENDADAS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.card, selectedRegion === item.id && styles.cardSelected]}
              onPress={() => handleSelectRegion(item)}
            >
              <Image 
                source={{ uri: item.image || DEFAULT_PLACEHOLDER }} 
                style={styles.cardImage} 
              />
              <View style={styles.cardOverlay}>
                <Text style={styles.cardText}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}