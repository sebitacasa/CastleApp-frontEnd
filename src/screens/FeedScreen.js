import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, 
  StatusBar, Alert, RefreshControl, TouchableOpacity, 
  ImageBackground, Animated, Platform, Image 
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location'; 

import { AuthContext } from '../context/AuthContext';

import StoryCard from '../components/StoryCard';
import CitySearch from '../components/CitySearch'; 
import styles, { HEADER_HEIGHT } from './FeedScreen.styles';

const API_BASE = 'http://10.0.2.2:8080';
//const API_BASE = 'http://192.168.1.33:8080';
const ITEMS_PER_PAGE = 20; 
const HEADER_IMAGE = 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1996&auto=format&fit=crop';

const categories = [
  'All', 'Castles', 'Ruins', 'Museums', 'Monuments', 'Plaques', 'Busts', 'Stolperstein', 'Historic Site', 'Others'
];

export default function FeedScreen() {
  const navigation = useNavigation();
  const { userInfo, logout } = useContext(AuthContext);

  // --- ESTADOS ---
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [activeLocation, setActiveLocation] = useState(null); 
  const [searchKey, setSearchKey] = useState(0); 

  const [menuVisible, setMenuVisible] = useState(false);

  // --- ANIMACIÓN ---
  const scrollY = useRef(new Animated.Value(0)).current;
  const retryCount = useRef(0);
  const flatListRef = useRef(null); 

  const scrollYClamped = Animated.diffClamp(scrollY, 0, HEADER_HEIGHT);
  
  const translateY = scrollYClamped.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp', 
  });

  // 1. Obtener GPS Inicial
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso', 'Activa la ubicación.');
          setLoading(false);
          return;
        }
        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setActiveLocation({
            lat: loc.coords.latitude,
            lon: loc.coords.longitude,
            label: "Mi Ubicación",
            isManual: false
        });
      } catch (error) {
        setActiveLocation({ lat: -34.6037, lon: -58.3816, label: "Ubicación Simulada", isManual: false });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2. Efecto Maestro
  useEffect(() => {
      if (activeLocation) {
          retryCount.current = 0;
          if (flatListRef.current) {
              flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
          }
          loadData(1, false, activeLocation);
      }
  }, [activeLocation, selectedCategory]); 

  // --- HANDLERS ---
  const handleCitySelected = (coordinates, locationName) => {
    setLocations([]); setLoading(true); retryCount.current = 0;
    setActiveLocation({ lon: coordinates[0], lat: coordinates[1], label: locationName, isManual: true });
  };

  const clearSearch = async () => {
      if (loading) return; 
      setLocations([]); setLoading(true); setPage(1); setHasMore(true); setSelectedCategory('All');
      setSearchKey(prev => prev + 1); 
      if (flatListRef.current) flatListRef.current.scrollToOffset({ animated: true, offset: 0 });

      try {
          let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setActiveLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude, label: "Mi Ubicación", isManual: false, timestamp: Date.now() });
      } catch (error) {
          setActiveLocation({ lat: -34.6037, lon: -58.3816, label: "Ubicación Simulada", isManual: false, timestamp: Date.now() });
      }
  };

  // --- API LOAD ---
  const loadData = useCallback(async (targetPage = 1, isRefresh = false, locationOverride = null, isSilent = false) => {
    if (loadingMore && !isSilent) return;
    const currentLoc = locationOverride || activeLocation;
    if (!currentLoc) return;
    if (isRefresh) retryCount.current = 0;

    try {
      if (isRefresh) setRefreshing(true);
      else if (targetPage === 1 && !isSilent) { setLoading(true); setHasMore(true); } 
      else if (!isSilent) { setLoadingMore(true); }

      let url = `${API_BASE}/api/localizaciones?page=${targetPage}&limit=${ITEMS_PER_PAGE}`;
      if (selectedCategory !== 'All') url += `&category=${encodeURIComponent(selectedCategory)}`;
      url += `&lat=${currentLoc.lat}&lon=${currentLoc.lon}&label=${encodeURIComponent(currentLoc.label)}`; 

      const response = await fetch(url);
      const json = await response.json();
      const realData = json.data || [];

      if (targetPage === 1) setLocations(realData);
      else setLocations(prev => [...prev, ...realData]);
      
      setPage(targetPage);
      if (realData.length < ITEMS_PER_PAGE) setHasMore(false);

    } catch (e) { console.error(e); } 
    finally { if (!isSilent) { setLoading(false); setRefreshing(false); setLoadingMore(false); } }
  }, [activeLocation, selectedCategory, loadingMore]);


  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* --- HEADER ANIMADO --- */}
      <Animated.View style={[styles.animatedHeaderContainer, { transform: [{ translateY }] }]}>
          
          {/* IMAGEN DE FONDO (CON OVERFLOW HIDDEN) */}
          <ImageBackground 
            source={{ uri: HEADER_IMAGE }} 
            style={styles.headerBackground}
            imageStyle={{ resizeMode: 'cover' }}
          >
            <View style={styles.headerOverlay}> 
                
                <View style={styles.navTopRow}>
                    {/* IZQUIERDA: LOGO */}
                    <TouchableOpacity style={styles.logoRow} onPress={clearSearch} activeOpacity={0.7} disabled={loading}>
                        <MaterialCommunityIcons name="bank" size={28} color="white" />
                        <Text style={styles.navTitle}>CastleApp</Text>
                    </TouchableOpacity>

                    {/* DERECHA: ICONOS */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => navigation.navigate('MapScreen')} style={{ marginRight: 15 }}>
                            <Ionicons name="map-outline" size={28} color="white" />
                        </TouchableOpacity>

                        {/* BOTÓN MENÚ / AVATAR */}
                        <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
                            {userInfo?.avatar_url ? (
                                <Image 
                                    source={{ uri: userInfo.avatar_url }} 
                                    style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'white' }} 
                                />
                            ) : (
                                <Ionicons name="menu" size={32} color="white" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* SEARCH & UBICACIÓN */}
                <View style={{ marginTop: 0, marginBottom: 10, zIndex: 2000 }}>
                    <CitySearch key={searchKey} onLocationSelect={handleCitySelected} />
                </View>

                <View>
                    {activeLocation && (
                        <View style={{ paddingHorizontal: 20, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: '#eee', fontSize: 13, flex: 1, textShadowColor: 'black', textShadowRadius: 3 }} numberOfLines={1}>
                                📍 <Text style={{fontWeight: 'bold', color: 'white', fontSize: 14}}>{activeLocation.label}</Text>
                            </Text>
                            {activeLocation.isManual && (
                                <TouchableOpacity onPress={clearSearch} style={{ backgroundColor: 'rgba(255,50,50,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 10, borderWidth: 1, borderColor: 'rgba(255,100,100,0.5)' }}>
                                    <Text style={{color: 'white', fontSize: 10, fontWeight:'bold'}}>X</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                    <View style={{ paddingBottom: 10 }}> 
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

            </View> 
          </ImageBackground>

          {/* 🚨 CORRECCIÓN CLAVE: EL MENÚ AHORA ESTÁ FUERA DEL IMAGEBACKGROUND 🚨 */}
          {menuVisible && (
              <View style={styles.dropdownMenu}>
                  <View style={styles.arrowUp} />
                  <View style={styles.menuHeader}>
                      <Text style={styles.menuUserLabel}>Hola,</Text>
                      <Text style={styles.menuUserName} numberOfLines={1}>
                          {userInfo?.username || 'Explorador'}
                      </Text>
                  </View>
                  
                  <View style={styles.separator} />

                  <TouchableOpacity style={styles.menuItem} onPress={() => alert("Próximamente")}>
                      <Ionicons name="heart-outline" size={20} color="#333" />
                      <Text style={styles.menuItemText}>Mis Favoritos</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuItem} onPress={() => alert("Próximamente")}>
                      <Ionicons name="add-circle-outline" size={20} color="#333" />
                      <Text style={styles.menuItemText}>Subir Lugar</Text>
                  </TouchableOpacity>

                  <View style={styles.separator} />

                  <TouchableOpacity 
                      style={styles.menuItem} 
                      onPress={() => {
                          setMenuVisible(false);
                          logout();
                      }}
                  >
                      <Ionicons name="log-out-outline" size={20} color="#D9534F" />
                      <Text style={[styles.menuItemText, { color: '#D9534F', fontWeight: 'bold' }]}>Cerrar Sesión</Text>
                  </TouchableOpacity>
              </View>
          )}

      </Animated.View>

      {/* --- LISTA --- */}
      <View style={{ flex: 1 }}>
          {loading && !refreshing && locations.length === 0 ? (
              <View style={styles.centerLoading}><ActivityIndicator size="large" color="#203040" /></View>
          ) : !loading && locations.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: HEADER_HEIGHT }}>
                  <Text style={{ color: '#555', fontSize: 18, fontWeight: 'bold' }}>Nada por aquí...</Text>
                  <Text style={{ color: '#999', fontSize: 14, marginTop: 5 }}>Intenta buscar otra zona.</Text>
              </View>
          ) : (
              <Animated.FlatList
                  ref={flatListRef}
                  data={locations}
                  renderItem={({ item }) => <StoryCard item={item} navigation={navigation} />}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEventThrottle={16} 
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                  )}
                  contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 10, paddingBottom: 20 }}
                  progressViewOffset={HEADER_HEIGHT + 20}
                  onEndReached={() => { if (hasMore && !loadingMore) loadData(page + 1); }}
                  onEndReachedThreshold={0.5}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(1, true)} colors={['#203040']} tintColor="#203040" progressViewOffset={HEADER_HEIGHT + 20} />}
                  ListFooterComponent={() => loadingMore && <ActivityIndicator style={{ margin: 20 }} color="#203040" />}
              />
          )}
      </View>

    </View>
  );
}