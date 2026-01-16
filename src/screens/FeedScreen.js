import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, 
  StatusBar, RefreshControl, TouchableOpacity, 
  ImageBackground, Animated, Image, StyleSheet, Dimensions, Platform
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

import StoryCard from '../components/StoryCard';
import CitySearch from '../components/CitySearch'; 

// --- 🎨 PALETA DE COLORES "SCRATCH MAP" ---
const THEME = {
  bg: '#121212',           // Negro Fondo (Océano oscuro)
  card: '#1E1E1E',         // Gris muy oscuro (Para elementos flotantes)
  gold: '#D4AF37',         // Dorado Clásico (Tierra raspada)
  goldDim: 'rgba(212, 175, 55, 0.15)', // Dorado transparente para fondos
  text: '#F0F0F0',         // Blanco hueso (Lectura)
  subText: '#A0A0A0',      // Gris plata (Subtítulos)
  danger: '#CF6679',       // Rojo suave para Logout
  overlay: 'rgba(0,0,0,0.7)', // Oscurecer la imagen de cabecera
};

const API_BASE = 'http://10.0.2.2:8080';
const ITEMS_PER_PAGE = 20; 
const HEADER_HEIGHT = 280; // Cabecera un poco más alta para lucir la imagen
const HEADER_IMAGE = 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1996&auto=format&fit=crop';

const categories = [
  'All', 'Castles', 'Ruins', 'Museums', 'Monuments', 'Plaques', 'Busts', 'Stolperstein', 'Historic Site', 'Others'
];

export default function FeedScreen() {
  const navigation = useNavigation();
  const { userInfo, logout } = useContext(AuthContext);

  // --- LOGIC TO FIND USER DATA ---
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
  const retryCount = useRef(0);
  const flatListRef = useRef(null); 

  const scrollYClamped = Animated.diffClamp(scrollY, 0, HEADER_HEIGHT);
  
  const translateY = scrollYClamped.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT / 1.5], // Parallax effect suave
    extrapolate: 'clamp', 
  });

  // 1. Initial GPS
  useEffect(() => {
    (async () => {
      try {
        console.log("📍 FeedScreen: Forcing location to San Telmo");
        setActiveLocation({ 
            lat: -34.6212, 
            lon: -58.3731, 
            label: "San Telmo, CABA", 
            isManual: true 
        });
      } catch (error) {
        console.log("Error GPS:", error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2. Master Effect
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

      setActiveLocation({ 
          lat: -34.6212, lon: -58.3731, label: "San Telmo, CABA", isManual: true, timestamp: Date.now() 
      });
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
    <View style={localStyles.mainContainer}>
      {/* Fondo negro total para la status bar */}
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
      
      {/* --- ANIMATED HEADER --- */}
      <Animated.View style={[localStyles.animatedHeaderContainer, { transform: [{ translateY }] }]}>
          
          <ImageBackground 
            source={{ uri: HEADER_IMAGE }} 
            style={localStyles.headerBackground}
            imageStyle={{ opacity: 0.6 }} // Imagen más sutil para que resalte el dorado
          >
            {/* Gradiente oscuro simulado */}
            <View style={localStyles.headerOverlay}> 
                
                {/* TOP BAR */}
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
                            {userPhoto ? (
                                <Image 
                                    source={{ uri: userPhoto }} 
                                    style={localStyles.avatarSmall} 
                                />
                            ) : (
                                <Ionicons name="menu" size={30} color={THEME.gold} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* SEARCH & LOCATION */}
                <View style={{ zIndex: 2000, marginTop: 10 }}>
                    <CitySearch key={searchKey} onLocationSelect={handleCitySelected} />
                </View>

                {/* ACTIVE LOCATION LABEL */}
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
                    
                    {/* CATEGORIES */}
                    <View style={{ marginTop: 15, paddingBottom: 10 }}> 
                        <FlatList
                            data={categories}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 5 }}
                            renderItem={({item}) => (
                                <TouchableOpacity 
                                    onPress={() => setSelectedCategory(item)} 
                                    style={[
                                        localStyles.catBtn, 
                                        selectedCategory === item && localStyles.catBtnActive
                                    ]}
                                >
                                    <Text style={[
                                        localStyles.catText, 
                                        selectedCategory === item && localStyles.catTextActive
                                    ]}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>

            </View> 
          </ImageBackground>

          {/* 👇 DROPDOWN MENU - ESTILO DARK & GOLD 👇 */}
          {menuVisible && (
              <View style={localStyles.dropdownMenu}>
                  {/* Flechita dorada */}
                  <View style={localStyles.arrowUp} />
                  
                  <View style={localStyles.menuHeader}>
                      {userPhoto ? (
                          <Image source={{ uri: userPhoto }} style={localStyles.avatarLarge} />
                      ) : (
                          <View style={localStyles.avatarPlaceholder}>
                              <Ionicons name="person" size={28} color={THEME.bg} />
                          </View>
                      )}

                      <Text style={localStyles.menuUserLabel}>Explorer</Text>
                      <Text style={localStyles.menuUserName} numberOfLines={1}>
                          {userName}
                      </Text>
                  </View>
                  
                  <View style={localStyles.separator} />

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
                  <Text style={{ color: THEME.subText, fontSize: 14, opacity: 0.7 }}>Try searching for a different city.</Text>
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
                  contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 20, paddingBottom: 40 }}
                  progressViewOffset={HEADER_HEIGHT + 20}
                  onEndReached={() => { if (hasMore && !loadingMore) loadData(page + 1); }}
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

// --- 🎨 NEW STYLES (BLACK & GOLD) ---
const localStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  // Header
  animatedHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 1000,
    backgroundColor: THEME.bg,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: THEME.bg,
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)', // Oscuro para legibilidad
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  navTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.text,
    marginLeft: 8,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif', // Fuente estilo antiguo
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: THEME.gold,
  },
  
  // Location Badge
  locationBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.goldDim,
  },
  locationText: {
    color: THEME.gold,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
    maxWidth: 200,
  },
  resetButton: {
    marginLeft: 10,
    backgroundColor: THEME.gold,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Categories
  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.subText,
    marginRight: 10,
  },
  catBtnActive: {
    backgroundColor: THEME.gold,
    borderColor: THEME.gold,
  },
  catText: {
    color: THEME.subText,
    fontSize: 13,
    fontWeight: '600',
  },
  catTextActive: {
    color: '#000', // Negro sobre dorado para contraste
    fontWeight: 'bold',
  },

  // Loading / Empty
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: HEADER_HEIGHT,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: HEADER_HEIGHT,
  },

  // Dropdown Menu (The VIP Card)
  dropdownMenu: {
    position: 'absolute',
    top: 90, 
    right: 20,
    width: 220,
    backgroundColor: '#1A1A1A', // Gris casi negro
    borderRadius: 12,
    padding: 15,
    zIndex: 3000,
    // Sombra Dorada sutil
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  arrowUp: {
    position: 'absolute',
    top: -10,
    right: 15,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#333', // Coincide con el borde del menú
  },
  menuHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: THEME.gold,
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuUserLabel: {
    color: THEME.subText,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuUserName: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuItemText: {
    color: THEME.text,
    marginLeft: 12,
    fontSize: 15,
  },
});