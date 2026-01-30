import React, { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, 
  StatusBar, RefreshControl, TouchableOpacity, 
  ImageBackground, Animated, Image, StyleSheet, Dimensions, Platform
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location'; 

import { AuthContext } from '../context/AuthContext';
import StoryCard from '../components/StoryCard';
import CitySearch from '../components/CitySearch'; 

// --- 🎨 CONFIGURACIÓN ---
const THEME = {
  bg: '#121212',           
  card: '#1E1E1E',         
  gold: '#D4AF37',         
  goldDim: 'rgba(212, 175, 55, 0.15)', 
  text: '#F0F0F0',         
  subText: '#A0A0A0',      
  danger: '#CF6679',       
  overlay: 'rgba(0,0,0,0.7)', 
  placeholder: '#2A2A2A'
};

const API_BASE = 'https://castleapp-backend-production.up.railway.app';
const ITEMS_PER_PAGE = 20; 
const HEADER_HEIGHT = 280; 
const HEADER_IMAGE = 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1996&auto=format&fit=crop';
const ITEM_HEIGHT = 320; 
const CACHE_RADIUS_KM = 1.0; 

const categories = [
  'All', 'Castles', 'Ruins', 'Museums', 'Statues', 'Plaques', 'Busts', 'Stolperstein', 'Historic Site', 'Religious', 'Towers', 'Tourist', 'Others'
];

// ==================================================
// 🖼️ IMÁGENES POR DEFECTO (FALLBACK)
// ==================================================
const CATEGORY_DEFAULTS = {
    'Castles': 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?q=80&w=600&auto=format&fit=crop',
    'Ruins': 'https://images.unsplash.com/photo-1565017227-227e57c43313?q=80&w=600&auto=format&fit=crop',
    'Museums': 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?q=80&w=600&auto=format&fit=crop',
    'Religious': 'https://images.unsplash.com/photo-1548625361-58a9b86aa83b?q=80&w=600&auto=format&fit=crop',
    'Statues': 'https://images.unsplash.com/photo-1595166671041-380d19d67b2d?q=80&w=600&auto=format&fit=crop',
    'Busts': 'https://images.unsplash.com/photo-1574350518720-d92affb18bed?q=80&w=600&auto=format&fit=crop',
    'Plaques': 'https://images.unsplash.com/photo-1596627685695-1f90df7e20bc?q=80&w=600&auto=format&fit=crop',
    'Stolperstein': 'https://images.unsplash.com/photo-1629230623232-2d17482436d6?q=80&w=600&auto=format&fit=crop',
    'Towers': 'https://images.unsplash.com/photo-1571168538867-ad36fe110cc4?q=80&w=600&auto=format&fit=crop',
    'Tourist': 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?q=80&w=600&auto=format&fit=crop',
    'Historic Site': 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=600&auto=format&fit=crop',
    'Others': 'https://images.unsplash.com/photo-1447023029226-ef8f6b52e3ea?q=80&w=600&auto=format&fit=crop'
};

// ==================================================
// 💀 SKELETON CARD (Animado)
// ==================================================
const SkeletonCard = () => {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacityAnim]);

  return (
    <View style={{ height: ITEM_HEIGHT - 20, marginHorizontal: 16, marginBottom: 20, borderRadius: 16, backgroundColor: THEME.card, overflow: 'hidden' }}>
        <Animated.View style={{ width: '100%', height: '65%', backgroundColor: THEME.placeholder, opacity: opacityAnim }} />
        <View style={{ padding: 16 }}>
            <Animated.View style={{ width: '60%', height: 20, backgroundColor: THEME.placeholder, borderRadius: 4, marginBottom: 10, opacity: opacityAnim }} />
            <Animated.View style={{ width: '40%', height: 16, backgroundColor: THEME.placeholder, borderRadius: 4, opacity: opacityAnim }} />
        </View>
    </View>
  );
};

// ==================================================
// 💾 CACHÉ GLOBAL
// ==================================================
let GLOBAL_CACHE = {
    lat: null, lon: null, category: 'All', data: [], label: "Current Location"
};

// ==================================================
// 🧮 HELPERS
// ==================================================
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const nLat1 = parseFloat(lat1); const nLon1 = parseFloat(lon1);
  const nLat2 = parseFloat(lat2); const nLon2 = parseFloat(lon2);
  const R = 6371; 
  const dLat = deg2rad(nLat2 - nLat1);
  const dLon = deg2rad(nLon2 - nLon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(nLat1)) * Math.cos(deg2rad(nLat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};
const deg2rad = (deg) => deg * (Math.PI / 180);

// ==================================================
// 🏰 COMPONENTE PRINCIPAL
// ==================================================
export default function FeedScreen() {
  const navigation = useNavigation();
  const { userInfo, logout } = useContext(AuthContext);

  console.log("DEBUG - Estructura de userInfo:", JSON.stringify(userInfo, null, 2));

const isLoggedIn = !!userInfo; // Si existe el objeto, asumimos login (mejora esto si tu auth context limpia userInfo al salir)

  // 2. Buscar FOTO en todas las estructuras posibles de Google/Auth0/Supabase
// 1. Extraer FOTO (Añadidas llaves de Firebase y Supabase)
  const userPhoto = 
      userInfo?.picture || 
      userInfo?.photoURL ||          // 👈 Común en Firebase
      userInfo?.photo || 
      userInfo?.avatar_url || 
      userInfo?.user_metadata?.avatar_url || // 👈 Común en Supabase
      userInfo?.user?.photoURL ||
      userInfo?.user?.picture || 
      null;

  // 2. Extraer NOMBRE
  let rawName = 
      userInfo?.displayName ||       // 👈 Común en Firebase
      userInfo?.name || 
      userInfo?.full_name || 
      userInfo?.user_metadata?.full_name || 
      userInfo?.given_name || 
      userInfo?.givenName || 
      userInfo?.username || 
      userInfo?.user?.displayName ||
      userInfo?.email?.split('@')[0];

  const userName = rawName ? rawName.split(' ')[0] : 'Explorer';

  // Limpieza final del nombre
 
  // --- STATE ---
  const [locations, setLocations] = useState(GLOBAL_CACHE.data || []);
  const [loading, setLoading] = useState(locations.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(GLOBAL_CACHE.category || 'All');
  
  const [activeLocation, setActiveLocation] = useState(
      (GLOBAL_CACHE.lat && GLOBAL_CACHE.lon) 
      ? { lat: GLOBAL_CACHE.lat, lon: GLOBAL_CACHE.lon, label: GLOBAL_CACHE.label, isManual: false }
      : null
  );

  const [searchKey, setSearchKey] = useState(0); 
  const [menuVisible, setMenuVisible] = useState(false);

  // Animation Refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null); 
  const scrollYClamped = Animated.diffClamp(scrollY, 0, HEADER_HEIGHT);
  const translateY = scrollYClamped.interpolate({
    inputRange: [0, HEADER_HEIGHT], outputRange: [0, -HEADER_HEIGHT / 1.5], extrapolate: 'clamp', 
  });

  // --- 🛰️ UBI HELPER ---
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const lastKnown = await Location.getLastKnownPositionAsync({});
      
      if (lastKnown) {
          if (GLOBAL_CACHE.lat) {
             const dist = getDistanceFromLatLonInKm(GLOBAL_CACHE.lat, GLOBAL_CACHE.lon, lastKnown.coords.latitude, lastKnown.coords.longitude);
             if (dist > 0.5) { 
                 setActiveLocation({ lat: lastKnown.coords.latitude, lon: lastKnown.coords.longitude, label: "Current Location", isManual: false });
             }
          } else {
             setActiveLocation({ lat: lastKnown.coords.latitude, lon: lastKnown.coords.longitude, label: "Current Location", isManual: false });
          }
      } else {
          if (!GLOBAL_CACHE.lat) {
             setActiveLocation({ lat: 48.2082, lon: 16.3738, label: "Vienna (Loading...)", isManual: false });
          }
      }

      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then(freshLoc => {
          setActiveLocation(prev => {
              if (!prev) return { lat: freshLoc.coords.latitude, lon: freshLoc.coords.longitude, label: "Current Location", isManual: false };
              const dist = getDistanceFromLatLonInKm(prev.lat, prev.lon, freshLoc.coords.latitude, freshLoc.coords.longitude);
              if (dist > 0.2) { 
                  return { lat: freshLoc.coords.latitude, lon: freshLoc.coords.longitude, label: "Current Location", isManual: false };
              }
              return prev;
          });
      }).catch(e => console.log("GPS Preciso ignorado"));
    })();
  }, []);

  useEffect(() => {
      if (activeLocation) {
          const delay = activeLocation.isManual ? 0 : 50; 
          const timeout = setTimeout(() => { loadData(1, false, activeLocation); }, delay);
          return () => clearTimeout(timeout);
      }
  }, [activeLocation, selectedCategory]); 

  const handleCitySelected = (coordinates, locationName) => {
    setLocations([]); setLoading(true); 
    // Guardamos que fue manual para usar "q=" en lugar de "lat/lon"
    setActiveLocation({ lon: coordinates[0], lat: coordinates[1], label: locationName, isManual: true });
  };

  const clearSearch = async () => {
      setLocations([]); setLoading(true); setPage(1); setHasMore(true); setSelectedCategory('All');
      setSearchKey(prev => prev + 1); 
      const lastKnown = await Location.getLastKnownPositionAsync({});
      if (lastKnown) setActiveLocation({ lat: lastKnown.coords.latitude, lon: lastKnown.coords.longitude, label: "Current Location", isManual: false });
  };

  // 🔥🔥🔥 FUNCIÓN loadData CORREGIDA: PRIORIZA TEXTO SI ES BÚSQUEDA 🔥🔥🔥
  const loadData = useCallback(async (targetPage = 1, isRefresh = false, locationOverride = null, isSilent = false) => {
    if (loadingMore && !isSilent) return;
    const currentLoc = locationOverride || activeLocation;
    if (!currentLoc) return;

    if (targetPage === 1 && !isRefresh && !isSilent) {
        let dist = 9999;
        if (GLOBAL_CACHE.lat && GLOBAL_CACHE.lon) {
            dist = getDistanceFromLatLonInKm(GLOBAL_CACHE.lat, GLOBAL_CACHE.lon, currentLoc.lat, currentLoc.lon);
        }
        const isSameCategory = GLOBAL_CACHE.category === selectedCategory;
        
        // Solo usamos cache si es la misma ubicación Y categoría
        if (isSameCategory && dist < CACHE_RADIUS_KM && GLOBAL_CACHE.data.length > 0) {
            if (locations.length === 0) setLocations(GLOBAL_CACHE.data);
            setLoading(false); setHasMore(true);
            return; 
        }
    }

    try {
      if (!isSilent) {
          if (isRefresh) setRefreshing(true);
          else if (targetPage === 1) { setLoading(true); setHasMore(true); } 
          else { setLoadingMore(true); }
      }

      let url = `${API_BASE}/api/localizaciones?page=${targetPage}&limit=${ITEMS_PER_PAGE}`;
      if (selectedCategory !== 'All') url += `&category=${encodeURIComponent(selectedCategory)}`;

      // 🔥 LÓGICA INTELIGENTE:
      if (currentLoc.isManual) {
          // 1. Si es búsqueda manual (ej: "Salzburg"), enviamos TEXTO ('q')
          // Esto activa la búsqueda inteligente de Google en el Backend.
          url += `&q=${encodeURIComponent(currentLoc.label)}`;
      } else {
          // 2. Si es GPS (Current Location), enviamos COORDENADAS ('lat/lon')
          // Esto activa el Radar de Google en el Backend.
          const latFixed = parseFloat(currentLoc.lat).toFixed(6);
          const lonFixed = parseFloat(currentLoc.lon).toFixed(6);
          url += `&lat=${latFixed}&lon=${lonFixed}`; 
      }

      console.log("📡 Fetching:", url); // Debug para ver qué pedimos

      const response = await fetch(url);
      const json = await response.json();
      const newData = json.data || [];

      if (targetPage === 1) {
          setLocations(newData);
          if (!isSilent) {
              GLOBAL_CACHE = {
                  lat: currentLoc.lat, lon: currentLoc.lon, category: selectedCategory, data: newData, label: currentLoc.label
              };
          }
      } else {
          setLocations(prev => {
              const existingIds = new Set(prev.map(item => item.id));
              const uniqueNewData = newData.filter(item => !existingIds.has(item.id));
              return [...prev, ...uniqueNewData];
          });
      }
      
      setPage(targetPage);
      if (newData.length < ITEMS_PER_PAGE) setHasMore(false);

    } catch (e) { console.error("Error fetching:", e); } 
    finally { 
        if (!isSilent) { setLoading(false); setRefreshing(false); setLoadingMore(false); } 
    }
  }, [activeLocation, selectedCategory, loadingMore, locations.length]);

  const handleScrollEnd = () => {
      // Sin scroll infinito automático por ahora
  };

  const renderItem = useMemo(() => ({ item }) => {
      const fallbackImage = CATEGORY_DEFAULTS[item.category] || CATEGORY_DEFAULTS['Others'];
      const itemToRender = { ...item, image_url: item.image_url || fallbackImage };
      return <StoryCard item={itemToRender} navigation={navigation} />;
  }, [navigation, locations]);

  const getItemLayout = useCallback((data, index) => ({
    length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index,
  }), []);

  const renderEmptyOrLoading = () => {
      if (loading && !refreshing) {
          return (
              <View style={{ paddingTop: HEADER_HEIGHT + 20 }}>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
              </View>
          );
      }
      return (
          <View style={[localStyles.emptyState, { paddingTop: HEADER_HEIGHT }]}>
              <MaterialCommunityIcons name="map-search-outline" size={60} color={THEME.gold} style={{opacity: 0.5}}/>
              <Text style={{ color: THEME.subText, fontSize: 18, marginTop: 10 }}>Uncharted Territory</Text>
              <Text style={{ color: THEME.subText, fontSize: 12, marginTop: 5 }}>
                 {activeLocation?.isManual ? `Search: ${activeLocation.label}` : "GPS Location"}
              </Text>
          </View>
      );
  };

  return (
    <View style={localStyles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
      
      <Animated.View style={[localStyles.animatedHeaderContainer, { transform: [{ translateY }] }]}>
          <ImageBackground source={{ uri: HEADER_IMAGE }} style={localStyles.headerBackground} imageStyle={{ opacity: 0.6 }}>
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
                            {isLoggedIn && userPhoto ? (
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
                            <Text style={localStyles.locationText} numberOfLines={1}>{activeLocation.label}</Text>
                            <TouchableOpacity onPress={clearSearch} style={localStyles.resetButton}>
                                <Ionicons name="refresh" size={12} color={THEME.bg} />
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={{ marginTop: 15, paddingBottom: 10 }}> 
                        <FlatList
                            data={categories} horizontal showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 5 }}
                            renderItem={({item}) => (
                                <TouchableOpacity onPress={() => setSelectedCategory(item)} style={[localStyles.catBtn, selectedCategory === item && localStyles.catBtnActive]}>
                                    <Text style={[localStyles.catText, selectedCategory === item && localStyles.catTextActive]}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </View> 
          </ImageBackground>
          
          {/* --- MENU DROPDOWN --- */}
          {menuVisible && (
              <View style={localStyles.dropdownMenu}>
                  <View style={localStyles.arrowUp} />
                  
                  <View style={localStyles.menuHeader}>
                      {isLoggedIn && userPhoto ? (
                          <Image source={{ uri: userPhoto }} style={localStyles.avatarLarge} />
                      ) : (
                          <View style={localStyles.avatarPlaceholder}>
                              <Ionicons name="person" size={28} color={THEME.bg} />
                          </View>
                      )}
                      
                      <Text style={localStyles.menuUserLabel}>{isLoggedIn ? 'Explorer Rank' : 'Guest Mode'}</Text>
                      <Text style={localStyles.menuUserName} numberOfLines={1}>
                          {isLoggedIn ? userName : 'Guest User'}
                      </Text>
                  </View>

                  <View style={localStyles.separator} />
                  
                  {isLoggedIn ? (
                    <>
                        <TouchableOpacity style={localStyles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Favorites'); }}>
                            <Ionicons name="heart" size={20} color={THEME.gold} />
                            <Text style={localStyles.menuItemText}>My Favorites</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={localStyles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('HistoryMap'); }}>
                            <MaterialCommunityIcons name="sword-cross" size={20} color={THEME.gold} />
                            <Text style={localStyles.menuItemText}>My Conquests</Text>
                        </TouchableOpacity>
                        <View style={localStyles.separator} />
                        <TouchableOpacity style={localStyles.menuItem} onPress={() => { setMenuVisible(false); logout(); }}>
                            <Ionicons name="log-out" size={20} color={THEME.danger} />
                            <Text style={[localStyles.menuItemText, { color: THEME.danger }]}>Sign Out</Text>
                        </TouchableOpacity>
                    </>
                  ) : (
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

      <View style={{ flex: 1, backgroundColor: THEME.bg }}>
          {locations.length === 0 ? renderEmptyOrLoading() : (
              <Animated.FlatList
                  ref={flatListRef}
                  data={locations}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.id.toString()}
                  getItemLayout={getItemLayout}
                  onMomentumScrollEnd={handleScrollEnd}
                  onScrollEndDrag={handleScrollEnd}
                  initialNumToRender={4}    
                  maxToRenderPerBatch={5}   
                  windowSize={5}            
                  removeClippedSubviews={true} 
                  scrollEventThrottle={16} 
                  onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                  contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 20, paddingBottom: 40 }}
                  progressViewOffset={HEADER_HEIGHT + 20}
                  onEndReached={() => { if (hasMore && !loadingMore) loadData(page + 1); }}
                  onEndReachedThreshold={0.5}
                  refreshControl={
                      <RefreshControl refreshing={refreshing} onRefresh={() => loadData(1, true)} colors={[THEME.bg]} tintColor={THEME.gold} progressViewOffset={HEADER_HEIGHT + 20} />
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
  navTitle: { fontSize: 22, fontWeight: 'bold', color: THEME.text, marginLeft: 8 },
  avatarSmall: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: THEME.gold },
  locationBadge: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: THEME.goldDim },
  locationText: { color: THEME.gold, fontWeight: 'bold', fontSize: 14, marginLeft: 6, maxWidth: 200 },
  resetButton: { marginLeft: 10, backgroundColor: THEME.gold, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  catBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.subText, marginRight: 10 },
  catBtnActive: { backgroundColor: THEME.gold, borderColor: THEME.gold },
  catText: { color: THEME.subText, fontSize: 13, fontWeight: '600' },
  catTextActive: { color: '#000', fontWeight: 'bold' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dropdownMenu: { position: 'absolute', top: 90, right: 20, width: 220, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 15, zIndex: 3000, borderWidth: 1, borderColor: '#333' },
  arrowUp: { position: 'absolute', top: -10, right: 15, width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 10, borderStyle: 'solid', borderBottomColor: '#333', borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  menuHeader: { alignItems: 'center', marginBottom: 10 },
  avatarLarge: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: THEME.gold, marginBottom: 8 },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: THEME.gold, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  menuUserLabel: { color: THEME.subText, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  menuUserName: { color: THEME.text, fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  separator: { height: 1, backgroundColor: '#333', marginVertical: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  menuItemText: { color: THEME.text, marginLeft: 12, fontSize: 15 },
});