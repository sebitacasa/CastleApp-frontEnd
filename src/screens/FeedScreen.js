import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, 
  StatusBar, RefreshControl, TouchableOpacity, 
  ImageBackground, Animated, Image, StyleSheet, Dimensions, Platform, Alert
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location'; 

import { AuthContext } from '../context/AuthContext';
import StoryCard from '../components/StoryCard';
import CitySearch from '../components/CitySearch'; 

// --- 🎨 PALETA DE COLORES "SCRATCH MAP" ---
const THEME = {
  bg: '#121212',           
  card: '#1E1E1E',         
  gold: '#D4AF37',         
  goldDim: 'rgba(212, 175, 55, 0.15)', 
  text: '#F0F0F0',         
  subText: '#A0A0A0',      
  danger: '#CF6679',       
  overlay: 'rgba(0,0,0,0.7)', 
};

// URL de Producción en Railway
const API_BASE = 'https://castleapp-backend-production.up.railway.app';

const ITEMS_PER_PAGE = 20; 
const HEADER_HEIGHT = 280; 
const HEADER_IMAGE = 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1996&auto=format&fit=crop';

// Altura fija estimada para optimización
const ITEM_HEIGHT = 320; 

const categories = [
  'All', 'Castles', 'Ruins', 'Museums', 'Monuments', 'Plaques', 'Busts', 'Stolperstein', 'Historic Site', 'Others'
];

export default function FeedScreen() {
  const navigation = useNavigation();
  const { userInfo, logout } = useContext(AuthContext);

  // Extracción segura de datos del usuario
  const userPhoto = 
      userInfo?.avatar_url || userInfo?.photo || userInfo?.picture || 
      userInfo?.user?.avatar_url || userInfo?.user?.photo || userInfo?.user?.picture || null;

  const rawName = 
      userInfo?.username || userInfo?.givenName || userInfo?.name || 
      userInfo?.user?.username || userInfo?.user?.givenName || userInfo?.user?.name;

  const userName = rawName && !rawName.includes('@') ? rawName : 'Explorer';

  // --- STATE ---
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

  // --- ANIMATION ---
  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null); 

  const scrollYClamped = Animated.diffClamp(scrollY, 0, HEADER_HEIGHT);
  const translateY = scrollYClamped.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT / 1.5], 
    extrapolate: 'clamp', 
  });

  // --- 🛰️ HELPER: Obtener Ubicación Robusta ---
  const getRobustLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need your location to show nearby history.');
        return null;
      }

      // 1. Intento Rápido (Balanceado)
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, 
        });
        return location.coords;
      } catch (err) {
        console.log("⚠️ GPS preciso falló, intentando última ubicación conocida...");
      }

      // 2. Intento Caché (Última conocida)
      const lastKnown = await Location.getLastKnownPositionAsync({});
      if (lastKnown) return lastKnown.coords;

      // 3. Fallback (Si todo falla, devuelve null para manejarlo manualmente)
      return null;

    } catch (error) {
      console.error("Error en servicio de ubicación:", error);
      return null;
    }
  };

  // 1. Initial GPS Load
  useEffect(() => {
    (async () => {
      console.log("📍 FeedScreen: Iniciando búsqueda de ubicación...");
      const coords = await getRobustLocation();

      if (coords) {
        console.log("📍 Ubicación encontrada:", coords.latitude, coords.longitude);
        setActiveLocation({
          lat: coords.latitude,
          lon: coords.longitude,
          label: "Current Location",
          isManual: false
        });
      } else {
        console.log("⚠️ No se pudo obtener GPS real. Usando Fallback (San Telmo).");
        setActiveLocation({
          lat: -34.6212,
          lon: -58.3731,
          label: "San Telmo (Default)",
          isManual: false 
        });
      }
    })();
  }, []);

  // 2. Master Effect (Carga de datos cuando cambia location)
  useEffect(() => {
      if (activeLocation) {
          if (flatListRef.current) {
              flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
          }
          loadData(1, false, activeLocation);
      }
  }, [activeLocation, selectedCategory]); 


  // --- HANDLERS ---
  const handleCitySelected = (coordinates, locationName) => {
    setLocations([]); setLoading(true); 
    setActiveLocation({ lon: coordinates[0], lat: coordinates[1], label: locationName, isManual: true });
  };

  const clearSearch = async () => {
      if (loading) return; 
      setLocations([]); setLoading(true); setPage(1); setHasMore(true); setSelectedCategory('All');
      setSearchKey(prev => prev + 1); 
      if (flatListRef.current) flatListRef.current.scrollToOffset({ animated: true, offset: 0 });

      // Re-intentar obtener ubicación real al limpiar
      const coords = await getRobustLocation();
      
      if (coords) {
        setActiveLocation({ 
            lat: coords.latitude, 
            lon: coords.longitude, 
            label: "Current Location", 
            isManual: false, 
            timestamp: Date.now() 
        });
      } else {
        setActiveLocation({
            lat: -34.6212,
            lon: -58.3731,
            label: "San Telmo (Default)",
            isManual: false,
            timestamp: Date.now()
        });
        setLoading(false);
      }
  };

  // --- 🔥 CORE LOGIC: CARGA DE DATOS ---
  const loadData = useCallback(async (targetPage = 1, isRefresh = false, locationOverride = null, isSilent = false) => {
    if (loadingMore && !isSilent) return;
    
    const currentLoc = locationOverride || activeLocation;
    if (!currentLoc) return;

    try {
      if (!isSilent) {
          if (isRefresh) setRefreshing(true);
          else if (targetPage === 1) { setLoading(true); setHasMore(true); } 
          else { setLoadingMore(true); }
      }

      let url = `${API_BASE}/api/localizaciones?page=${targetPage}&limit=${ITEMS_PER_PAGE}`;
      if (selectedCategory !== 'All') url += `&category=${encodeURIComponent(selectedCategory)}`;
      url += `&lat=${currentLoc.lat}&lon=${currentLoc.lon}&label=${encodeURIComponent(currentLoc.label)}`; 

      const response = await fetch(url);
      const json = await response.json();
      const newData = json.data || [];

      if (targetPage === 1) {
          if (isSilent) {
              setLocations(prev => {
                  const updatedList = prev.map(item => {
                      const freshItem = newData.find(n => n.id === item.id);
                      return freshItem || item;
                  });
                  return updatedList;
              });
          } else {
              setLocations(newData);
          }
      } else {
          if (isSilent) {
             setLocations(prev => {
                const updatedList = prev.map(item => {
                    const freshItem = newData.find(n => n.id === item.id);
                    return freshItem || item;
                });
                return updatedList;
             });
          } else {
             setLocations(prev => [...prev, ...newData]);
          }
      }
      
      setPage(targetPage);
      if (newData.length < ITEMS_PER_PAGE) setHasMore(false);

      if (!isSilent && newData.length > 0) {
          setTimeout(() => {
              loadData(targetPage, false, currentLoc, true);
          }, 4000);
      }

    } catch (e) { console.error(e); } 
    finally { 
        if (!isSilent) { 
            setLoading(false); 
            setRefreshing(false); 
            setLoadingMore(false); 
        } 
    }
  }, [activeLocation, selectedCategory, loadingMore]);

  // Memoized Render Item
  const renderItem = useCallback(({ item }) => (
    <StoryCard item={item} navigation={navigation} />
  ), [navigation]);

  // Memoized Layout
  const getItemLayout = useCallback((data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  return (
    <View style={localStyles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
      
      {/* HEADER */}
      <Animated.View style={[localStyles.animatedHeaderContainer, { transform: [{ translateY }] }]}>
          <ImageBackground 
            source={{ uri: HEADER_IMAGE }} 
            style={localStyles.headerBackground}
            imageStyle={{ opacity: 0.6 }} 
          >
            <View style={localStyles.headerOverlay}> 
                <View style={localStyles.navTopRow}>
                    <TouchableOpacity style={localStyles.logoRow} onPress={clearSearch} activeOpacity={0.7} disabled={loading}>
                        <MaterialCommunityIcons name="compass-outline" size={28} color={THEME.gold} />
                        <Text style={localStyles.navTitle}>CastleApp</Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => navigation.navigate('MapScreen')} style={{ marginRight: 15 }}>
                            <Ionicons name="map" size={26} color={THEME.text} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
                            {/* Si es invitado, mostramos icono genérico. Si es user, su foto */}
                            {userInfo && userPhoto ? (
                                <Image source={{ uri: userPhoto }} style={localStyles.avatarSmall} />
                            ) : (
                                <Ionicons name="menu" size={30} color={THEME.gold} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ zIndex: 2000, marginTop: 10 }}>
                    <CitySearch key={searchKey} onLocationSelect={handleCitySelected} />
                </View>

                <View style={{ marginTop: 15 }}>
                    {activeLocation && (
                        <View style={localStyles.locationBadge}>
                            <Ionicons name="location-sharp" size={16} color={THEME.gold} />
                            <Text style={localStyles.locationText} numberOfLines={1}>
                                {activeLocation.label}
                            </Text>
                            <TouchableOpacity onPress={clearSearch} style={localStyles.resetButton}>
                                <Ionicons name="refresh" size={12} color={THEME.bg} />
                            </TouchableOpacity>
                        </View>
                    )}
                    
                    <View style={{ marginTop: 15, paddingBottom: 10 }}> 
                        <FlatList
                            data={categories}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 5 }}
                            renderItem={({item}) => (
                                <TouchableOpacity 
                                    onPress={() => setSelectedCategory(item)} 
                                    style={[localStyles.catBtn, selectedCategory === item && localStyles.catBtnActive]}
                                >
                                    <Text style={[localStyles.catText, selectedCategory === item && localStyles.catTextActive]}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </View> 
          </ImageBackground>

          {menuVisible && (
              <View style={localStyles.dropdownMenu}>
                  <View style={localStyles.arrowUp} />
                  
                  {/* CABECERA DEL MENÚ */}
                  <View style={localStyles.menuHeader}>
                      {userInfo && userPhoto ? (
                          <Image source={{ uri: userPhoto }} style={localStyles.avatarLarge} />
                      ) : (
                          <View style={localStyles.avatarPlaceholder}>
                              <Ionicons name="person" size={28} color={THEME.bg} />
                          </View>
                      )}
                      
                      {/* Texto condicional: Invitado vs Usuario */}
                      <Text style={localStyles.menuUserLabel}>{userInfo ? 'Explorer Rank' : 'Guest Mode'}</Text>
                      <Text style={localStyles.menuUserName} numberOfLines={1}>
                          {userInfo ? userName : 'Guest User'}
                      </Text>
                  </View>

                  <View style={localStyles.separator} />
                  
                  {/* OPCIONES DEL MENÚ */}
                  {userInfo ? (
                    // --- Opciones para USUARIOS LOGUEADOS ---
                    <>
                        <TouchableOpacity style={localStyles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Favorites'); }}>
                            <Ionicons name="heart" size={20} color={THEME.gold} />
                            <Text style={localStyles.menuItemText}>My Favorites</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={localStyles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('HistoryMap'); }}>
                            <MaterialCommunityIcons name="sword-cross" size={20} color={THEME.gold} />
                            <Text style={localStyles.menuItemText}>My Conquests</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={localStyles.menuItem} onPress={() => alert("Coming Soon")}>
                            <Ionicons name="add-circle" size={20} color={THEME.subText} />
                            <Text style={[localStyles.menuItemText, {color: THEME.subText}]}>Add Place</Text>
                        </TouchableOpacity>
                        <View style={localStyles.separator} />
                        <TouchableOpacity style={localStyles.menuItem} onPress={() => { setMenuVisible(false); logout(); }}>
                            <Ionicons name="log-out" size={20} color={THEME.danger} />
                            <Text style={[localStyles.menuItemText, { color: THEME.danger }]}>Sign Out</Text>
                        </TouchableOpacity>
                    </>
                  ) : (
                    // --- Opciones para INVITADOS (GUEST) ---
                    <TouchableOpacity 
                        style={localStyles.menuItem} 
                        onPress={() => { 
                            setMenuVisible(false); 
                            navigation.navigate('LoginScreen'); 
                        }}
                    >
                        <Ionicons name="log-in" size={20} color={THEME.gold} />
                        <Text style={[localStyles.menuItemText, { color: THEME.gold, fontWeight: 'bold' }]}>
                            Sign In / Register
                        </Text>
                    </TouchableOpacity>
                  )}
              </View>
          )}
      </Animated.View>

      {/* --- LIST --- */}
      <View style={{ flex: 1, backgroundColor: THEME.bg }}>
          {loading && !refreshing && locations.length === 0 ? (
              <View style={localStyles.centerLoading}>
                  <ActivityIndicator size="large" color={THEME.gold} />
                  <Text style={{color: THEME.gold, marginTop: 10}}>Loading Map...</Text>
              </View>
          ) : !loading && locations.length === 0 ? (
              <View style={localStyles.emptyState}>
                  <MaterialCommunityIcons name="map-search-outline" size={60} color={THEME.gold} style={{opacity: 0.5}}/>
                  <Text style={{ color: THEME.subText, fontSize: 18, marginTop: 10 }}>Uncharted Territory</Text>
              </View>
          ) : (
              <Animated.FlatList
                  ref={flatListRef}
                  data={locations}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.id.toString()}
                  getItemLayout={getItemLayout}
                  
                  // 🔥 PERFORMANCE
                  initialNumToRender={8} 
                  maxToRenderPerBatch={10} 
                  windowSize={11} 
                  removeClippedSubviews={false} 
                  
                  scrollEventThrottle={16} 
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                  )}
                  contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 20, paddingBottom: 40 }}
                  progressViewOffset={HEADER_HEIGHT + 20}
                  
                  onEndReached={() => { 
                      if (hasMore && !loadingMore) loadData(page + 1); 
                  }}
                  onEndReachedThreshold={0.5}
                  
                  refreshControl={
                      <RefreshControl 
                          refreshing={refreshing} 
                          onRefresh={() => loadData(1, true)} 
                          colors={[THEME.bg]} 
                          tintColor={THEME.gold} 
                          progressViewOffset={HEADER_HEIGHT + 20} 
                      />
                  }
                  ListFooterComponent={() => loadingMore && <ActivityIndicator style={{ margin: 20 }} color={THEME.gold} />}
              />
          )}
      </View>

    </View>
  );
}

const localStyles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: THEME.bg },
  animatedHeaderContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_HEIGHT, zIndex: 1000, backgroundColor: THEME.bg, borderBottomWidth: 1, borderBottomColor: '#333' },
  headerBackground: { width: '100%', height: '100%', backgroundColor: THEME.bg },
  headerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingHorizontal: 20, justifyContent: 'flex-start' },
  navTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  navTitle: { fontSize: 22, fontWeight: 'bold', color: THEME.text, marginLeft: 8, letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif' },
  avatarSmall: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: THEME.gold },
  locationBadge: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: THEME.goldDim },
  locationText: { color: THEME.gold, fontWeight: 'bold', fontSize: 14, marginLeft: 6, maxWidth: 200 },
  resetButton: { marginLeft: 10, backgroundColor: THEME.gold, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  catBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.subText, marginRight: 10 },
  catBtnActive: { backgroundColor: THEME.gold, borderColor: THEME.gold },
  catText: { color: THEME.subText, fontSize: 13, fontWeight: '600' },
  catTextActive: { color: '#000', fontWeight: 'bold' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: HEADER_HEIGHT },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: HEADER_HEIGHT },
  dropdownMenu: { position: 'absolute', top: 90, right: 20, width: 220, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 15, zIndex: 3000, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 20, borderWidth: 1, borderColor: '#333' },
  arrowUp: { position: 'absolute', top: -10, right: 15, width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 10, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#333' },
  menuHeader: { alignItems: 'center', marginBottom: 10 },
  avatarLarge: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: THEME.gold, marginBottom: 8 },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: THEME.gold, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  menuUserLabel: { color: THEME.subText, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  menuUserName: { color: THEME.text, fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  separator: { height: 1, backgroundColor: '#333', marginVertical: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  menuItemText: { color: THEME.text, marginLeft: 12, fontSize: 15 },
});