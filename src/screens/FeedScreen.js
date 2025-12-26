import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, 
  StatusBar, Alert, RefreshControl, TouchableOpacity, StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { useNavigation } from '@react-navigation/native';

import HeroCarousel from '../components/HeroCarousel';
import StoryCard from '../components/StoryCard';
import CitySearch from '../components/CitySearch'; 

import styles from './FeedScreen.styles';

// CAMBIA ESTO SEGÚN TU ENTORNO (Emulador vs Físico)
const API_BASE = 'http://192.168.1.33:8080'; 
//const API_BASE = 'http://10.0.2.2:8080'; 
const ITEMS_PER_PAGE = 20; 
const categories = ['All', 'Castles', 'Ruins', 'Museums', 'Others'];

export default function FeedScreen() {
  const navigation = useNavigation();
  
  // --- ESTADOS ---
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // 1. NUEVO ESTADO: Coordenadas de búsqueda actual
  const [searchCoords, setSearchCoords] = useState(null); 

  // --- LÓGICA MODIFICADA: ACTUALIZAR FEED, NO NAVEGAR ---
  const handleCitySelected = (coordinates) => {
    // coordinates viene de CitySearch como [longitud, latitud]
    console.log("📍 Ciudad seleccionada. Recargando Feed en:", coordinates);
    
    // Guardamos las coordenadas en el estado.
    // Esto disparará el useEffect de abajo automáticamente.
    setSearchCoords({
        lon: coordinates[0],
        lat: coordinates[1]
    });
    
    // Opcional: Reseteamos la página a 1 visualmente antes de la carga
    setLocations([]);
    setLoading(true);
  };

  const loadData = useCallback(async (targetPage = 1, isRefresh = false) => {
    if (loadingMore) return;
    try {
      if (isRefresh) setRefreshing(true);
      else if (targetPage === 1) { 
        // Si es página 1, limpiamos la lista anterior
        setLocations([]); 
        setLoading(true); 
        setHasMore(true); 
      }
      else setLoadingMore(true);

      // --- CONSTRUCCIÓN DE URL DINÁMICA ---
      let url = `${API_BASE}/api/localizaciones?page=${targetPage}&limit=${ITEMS_PER_PAGE}`;
      
      // A. Filtro por Categoría
      if (selectedCategory !== 'All') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }

      // B. Filtro por Ciudad (Coordenadas)
      // Si el usuario seleccionó una ciudad, enviamos lat/lon al backend.
      // Tu backend usará esto para buscar cerca de ese punto.
      if (searchCoords) {
        url += `&lat=${searchCoords.lat}&lon=${searchCoords.lon}`;
      }

      console.log("Fetching URL:", url);
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const json = await response.json();
      const realData = json.data || [];

      setLocations(prev => (targetPage === 1 ? realData : [...prev, ...realData]));
      setPage(targetPage);
      
      if (realData.length < ITEMS_PER_PAGE) setHasMore(false);
    } catch (e) {
      console.error("🔥 Error Feed:", e);
    } finally {
      setLoading(false); 
      setRefreshing(false); 
      setLoadingMore(false);
    }
  }, [selectedCategory, searchCoords, loadingMore, hasMore]); // Agregamos searchCoords a dependencias

  // --- USE EFFECT ---
  // Se ejecuta cuando cambia la categoría O las coordenadas de búsqueda
  useEffect(() => { 
    loadData(1); 
  }, [selectedCategory, searchCoords]);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#38761D" />
      
      <View style={styles.navBar}>
        <View style={styles.navTopRow}>
          <View style={styles.logoRow}>
            <Ionicons name="construct" size={24} color="white" />
            <Text style={styles.navTitle}>CastleApp</Text>
          </View>
          {/* Botón para ir al mapa manualmente si el usuario quiere */}
          <TouchableOpacity onPress={() => navigation.navigate('MapScreen')}>
            <Ionicons name="map-outline" size={26} color="white" />
          </TouchableOpacity>
        </View>

        <View style={{ 
          marginTop: 10, marginBottom: 10, zIndex: 2000, elevation: 10, paddingHorizontal: 0 
        }}>
             <CitySearch onLocationSelect={handleCitySelected} />
        </View>

        <View style={{ zIndex: 1, elevation: 1 }}> 
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 15 }}
            renderItem={({item}) => (
              <TouchableOpacity 
                onPress={() => setSelectedCategory(item)} 
                style={[
                  styles.catBtn, 
                  selectedCategory === item && styles.catBtnActive
                ]}
              >
                <Text style={[
                  styles.catText, 
                  selectedCategory === item && styles.catTextActive
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      {/* --- MENSAJE SI NO HAY RESULTADOS --- */}
      {!loading && locations.length === 0 && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }}>
              <Text style={{ color: '#666', fontSize: 16 }}>No se encontraron lugares aquí.</Text>
          </View>
      )}

      {loading && !refreshing && locations.length === 0 ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#38761D" />
          {/* Feedback visual para que sepa que está buscando en la nueva ciudad */}
          {searchCoords && <Text style={{marginTop: 10, color: '#666'}}>Explorando zona...</Text>}
        </View>
      ) : (
        <FlatList
          data={locations}
          renderItem={({ item }) => (
            <StoryCard item={item} navigation={navigation} />
          )}
          keyExtractor={(item) => item.id.toString()}
          onEndReached={() => { 
            if (hasMore && !loadingMore) loadData(page + 1); 
          }}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={HeroCarousel}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => loadData(1, true)} 
              colors={['#38761D']}
            />
          }
          ListFooterComponent={() => 
            loadingMore && <ActivityIndicator style={{ margin: 20 }} color="#38761D" />
          }
          keyboardShouldPersistTaps="handled" 
        />
      )}
    </View>
  );
}