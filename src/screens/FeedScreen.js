import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, 
  StatusBar, Alert, RefreshControl, TouchableOpacity, 
  ImageBackground 
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location'; 

import StoryCard from '../components/StoryCard';
import CitySearch from '../components/CitySearch'; 
import styles from './FeedScreen.styles';

const API_BASE = 'http://192.168.1.33:8080'; 
const ITEMS_PER_PAGE = 20; 

// Imagen de fondo fija (Coliseo)
const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1996&auto=format&fit=crop';

const categories = [
  'All', 'Castles', 'Ruins', 'Museums', 'Monuments', 'Plaques', 'Busts', 'Stolperstein', 'Historic Site', 'Others'
];

export default function FeedScreen() {
  const navigation = useNavigation();
  
  // --- ESTADOS DE DATOS ---
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // --- ESTADOS DE UBICACIÓN ---
  const [activeLocation, setActiveLocation] = useState(null); // { lat, lon, label, isManual }
  
  // 🛡️ CONTADOR DE INTENTOS (REF)
  // Usamos useRef para que el valor persista entre renderizados sin causar re-renders visuales
  const retryCount = useRef(0);

  // 1. Obtener GPS Inicial
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso', 'Activa la ubicación para ver tesoros cercanos.');
          setLoading(false);
          return;
        }
        let loc = await Location.getCurrentPositionAsync({});
        console.log("📍 GPS Inicial:", loc.coords.latitude, loc.coords.longitude);
        
        setActiveLocation({
            lat: loc.coords.latitude,
            lon: loc.coords.longitude,
            label: "Mi Ubicación",
            isManual: false
        });
      } catch (error) {
        console.log("Error GPS:", error);
        setLoading(false);
      }
    })();
  }, []);

  // 2. Efecto Maestro: Cargar cuando cambia ubicación o categoría
  useEffect(() => {
      if (activeLocation) {
          // Resetear contador al cambiar de lugar o categoría
          retryCount.current = 0;
          loadData(1, false, activeLocation);
      }
  }, [activeLocation, selectedCategory]); 

  // --- HANDLERS ---
  const handleCitySelected = (coordinates, locationName) => {
    console.log(`🔎 Ciudad seleccionada: ${locationName}`);
    setLocations([]);
    setLoading(true);
    
    // Resetear contador manual
    retryCount.current = 0;

    setActiveLocation({ 
        lon: coordinates[0], 
        lat: coordinates[1], 
        label: locationName,
        isManual: true 
    });
  };

  const clearSearch = async () => {
      setLocations([]);
      setLoading(true);
      retryCount.current = 0;

      let loc = await Location.getCurrentPositionAsync({});
      setActiveLocation({
          lat: loc.coords.latitude,
          lon: loc.coords.longitude,
          label: "Mi Ubicación",
          isManual: false
      });
  };

  // --- CARGA DE DATOS ---
  const loadData = useCallback(async (targetPage = 1, isRefresh = false, locationOverride = null, isSilent = false) => {
    if (loadingMore && !isSilent) return;

    const currentLoc = locationOverride || activeLocation;
    if (!currentLoc) return;

    // Si es refresh manual (dedo hacia abajo), reseteamos contador
    if (isRefresh) retryCount.current = 0;

    try {
      if (isRefresh) setRefreshing(true);
      else if (targetPage === 1 && !isSilent) { 
          setLoading(true); 
          setHasMore(true); 
      } 
      else if (!isSilent) { 
          setLoadingMore(true); 
      }

      let url = `${API_BASE}/api/localizaciones?page=${targetPage}&limit=${ITEMS_PER_PAGE}`;
      
      if (selectedCategory !== 'All') {
          url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      
      // Enviamos lat/lon y etiqueta para que el Backend decida si usar radio 80km o buscar globalmente
      url += `&lat=${currentLoc.lat}&lon=${currentLoc.lon}`;
      url += `&label=${encodeURIComponent(currentLoc.label)}`; 

      if (!isSilent) console.log("📡 Fetching:", url); 

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP: ${response.status}`);
      
      const json = await response.json();
      const realData = json.data || [];

      if (targetPage === 1) setLocations(realData);
      else setLocations(prev => [...prev, ...realData]);
      
      setPage(targetPage);
      if (realData.length < ITEMS_PER_PAGE) setHasMore(false);

      // ============================================================
      // 🔄 LÓGICA DE AUTO-REFRESH (3 INTENTOS CADA 4 SEGUNDOS)
      // ============================================================
      if (targetPage === 1) {
          const incompleteData = realData.some(item => 
              (!item.images || item.images.length === 0) || 
              (item.description && item.description.includes('Discovered via exploration'))
          );

          if (incompleteData) {
              if (retryCount.current < 3) {
                  console.log(`⏳ Datos incompletos. Intento ${retryCount.current + 1}/3 en 4s...`);
                  retryCount.current += 1;
                  
                  // Esperar 4 segundos y volver a llamar (Modo Silencioso)
                  setTimeout(() => {
                      loadData(1, false, currentLoc, true);
                  }, 4000);
              } else {
                  console.log("🛑 Se alcanzó el límite de intentos (3). Se detiene la actualización.");
              }
          }
      }
      // ============================================================

    } catch (e) {
      console.error("🔥 Error Feed:", e);
    } finally {
      // Solo desactivamos los loaders si NO es una carga silenciosa
      if (!isSilent) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
      }
    }
  }, [activeLocation, selectedCategory, loadingMore]);


  // --- RENDERIZADO ---
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ImageBackground 
        source={{ uri: BACKGROUND_IMAGE }} 
        style={styles.backgroundImage}
        imageStyle={{ resizeMode: 'cover' }}
      >
        <View style={styles.globalOverlay}>

            {/* NAV BAR */}
            <View style={styles.navBar}>
                <View style={styles.navTopRow}>
                    <View style={styles.logoRow}>
                        <MaterialCommunityIcons name="bank" size={28} color="white" />
                        <Text style={styles.navTitle}>CastleApp</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('MapScreen')}>
                        <Ionicons name="map-outline" size={28} color="white" />
                    </TouchableOpacity>
                </View>

                <View style={{ marginTop: 5, marginBottom: 15, zIndex: 2000, paddingHorizontal: 0 }}>
                    <CitySearch onLocationSelect={handleCitySelected} />
                </View>

                {/* Feedback de Ubicación */}
                {activeLocation && (
                    <View style={{ paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#eee', fontSize: 13, flex: 1, textShadowColor: 'black', textShadowRadius: 3 }}>
                            📍 Explorando: <Text style={{fontWeight: 'bold', color: 'white', fontSize: 14}}>
                                {activeLocation.label}
                            </Text>
                        </Text>
                        
                        {/* Botón Borrar Búsqueda */}
                        {activeLocation.isManual && (
                            <TouchableOpacity onPress={clearSearch} style={{
                                backgroundColor: 'rgba(255,50,50,0.3)', paddingHorizontal: 10, paddingVertical: 4, 
                                borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginLeft: 10,
                                borderWidth: 1, borderColor: 'rgba(255,100,100,0.5)'
                            }}>
                                <Text style={{color: 'white', fontSize: 10, marginRight: 4, fontWeight:'bold'}}>X</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Filtros */}
                <View> 
                    <FlatList
                        data={categories}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 15 }}
                        renderItem={({item}) => (
                            <TouchableOpacity onPress={() => setSelectedCategory(item)} style={[styles.catBtn, selectedCategory === item && styles.catBtnActive]}>
                                <Text style={[styles.catText, selectedCategory === item && styles.catTextActive]}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>

            {/* LISTA DE RESULTADOS */}
            {loading && !refreshing && locations.length === 0 ? (
                <View style={styles.centerLoading}>
                    <ActivityIndicator size="large" color="white" />
                </View>
            ) : !loading && locations.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Nada por aquí...</Text>
                    <Text style={{ color: '#ccc', fontSize: 14, marginTop: 5 }}>Intenta buscar otra zona.</Text>
                </View>
            ) : (
                <FlatList
                    data={locations}
                    renderItem={({ item }) => <StoryCard item={item} navigation={navigation} />}
                    keyExtractor={(item) => item.id.toString()}
                    onEndReached={() => { if (hasMore && !loadingMore) loadData(page + 1); }}
                    onEndReachedThreshold={0.5}
                    
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => loadData(1, true)} colors={['white']} tintColor="white" />
                    }
                    
                    ListFooterComponent={() => loadingMore && <ActivityIndicator style={{ margin: 20 }} color="white" />}
                    keyboardShouldPersistTaps="handled" 
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}

        </View>
      </ImageBackground>
    </View>
  );
}