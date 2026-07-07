import React, { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, 
  StatusBar, RefreshControl, TouchableOpacity, 
  Animated, Image, StyleSheet, Dimensions, Platform, Alert
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthContext } from '../context/AuthContext';
import StoryCard from '../components/StoryCard';
import CitySearch from '../components/CitySearch';
import Footer from '../components/Footer';
import { APP_PALETTE as THEME } from '../theme/colors';

const API_BASE = 'https://castleapp-backend-production.up.railway.app';

const ITEMS_PER_PAGE = 20; 
const MIN_ITEMS_TO_FILL_SCREEN = 15; 

const HEADER_HEIGHT = 280; 
const ITEM_HEIGHT = 320; 

const CACHE_RADIUS_KM = 5.0; 
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; 
const MAX_RADIUS_KM = 100; 

const GLOBAL_KEYWORDS = {
    castles: ['schloss', 'burg', 'festung', 'palast', 'castle', 'fortress', 'palace', 'citadel', 'castillo', 'fortaleza', 'alcázar', 'château', 'forteresse', 'castello', 'fortezza', 'castelo', 'hrad', 'vár', 'slot'],
    ruins: ['ruin', 'ruine', 'ruina', 'rovina', 'trosky'],
    museums: ['museum', 'musée', 'museo', 'gallery', 'galerie', 'pinakothek'],
    religious: ['church', 'kirche', 'église', 'cathedral', 'dom', 'catedral', 'abbey', 'kloster', 'monastery', 'chapel', 'kapelle', 'basilica', 'basílica', 'santuario']
};

const categories = [
  'All', 'Castles', 'Ruins', 'Museums', 'Religious', 'Historic Site', 'Community'
];

const CATEGORY_DEFAULTS = {
    'Castles': 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310',
    'Ruins': 'https://images.unsplash.com/photo-1565017227-227e57c43313',
    'Museums': 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7',
    'Religious': 'https://images.unsplash.com/photo-1548625361-58a9b86aa83b',
    'Historic Site': 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc',
    'Community': 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205',
    'Others': 'https://images.unsplash.com/photo-1447023029226-ef8f6b52e3ea'
};

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
    <View style={{ height: ITEM_HEIGHT - 20, marginHorizontal: 16, marginBottom: 20, borderRadius: 16, backgroundColor: THEME.card, overflow: 'hidden', borderWidth: 1, borderColor: THEME.border }}>
        <Animated.View style={{ width: '100%', height: '65%', backgroundColor: THEME.border, opacity: opacityAnim }} />
        <View style={{ padding: 16 }}>
            <Animated.View style={{ width: '60%', height: 20, backgroundColor: THEME.border, borderRadius: 4, marginBottom: 10, opacity: opacityAnim }} />
            <Animated.View style={{ width: '40%', height: 16, backgroundColor: THEME.border, borderRadius: 4, opacity: opacityAnim }} />
        </View>
    </View>
  );
};

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0; 
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

export default function FeedScreen() {
  const navigation = useNavigation();
  const { userInfo, logout } = useContext(AuthContext);

  const isLoggedIn = !!userInfo; 
  const userPhoto = userInfo?.picture || userInfo?.avatar_url || userInfo?.user_metadata?.avatar_url || userInfo?.user?.user_metadata?.avatar_url || userInfo?.user?.avatar_url || null;
  let rawName = userInfo?.name || userInfo?.displayName || userInfo?.username || userInfo?.email?.split('@')[0];
  const userName = rawName ? rawName.split(' ')[0] : 'Explorer';

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

  const [googlePageToken, setGooglePageToken] = useState(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null); 
  const scrollYClamped = Animated.diffClamp(scrollY, 0, HEADER_HEIGHT);
  const translateY = scrollYClamped.interpolate({
    inputRange: [0, HEADER_HEIGHT], outputRange: [0, -HEADER_HEIGHT / 1.5], extrapolate: 'clamp', 
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
          Alert.alert('Permission denied', 'We need your location to show historic places around you.');
          return;
      }

      try {
          const freshLoc = await Promise.race([
              Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
              new Promise((_, reject) => setTimeout(() => reject(new Error("GPS Timeout")), 5000))
          ]);
          setActiveLocation({
              lat: freshLoc.coords.latitude,
              lon: freshLoc.coords.longitude,
              label: "Current Location",
              isManual: false
          });
      } catch (error) {
          console.log("⚠️ GPS Error/Timeout, usando lastKnown:", error);
          const lastKnown = await Location.getLastKnownPositionAsync({});
          if (lastKnown) {
              setActiveLocation({
                  lat: lastKnown.coords.latitude,
                  lon: lastKnown.coords.longitude,
                  label: "Current Location",
                  isManual: false
              });
          }
      }
    })();
  }, []);

  useEffect(() => {
      if (activeLocation) {
          const delay = activeLocation.isManual ? 100 : 50; 
          const timeout = setTimeout(() => { loadData(1, false, activeLocation); }, delay);
          return () => clearTimeout(timeout);
      }
  }, [activeLocation, selectedCategory]); 

  const handleCitySelected = (coordinates, locationName) => {
    setLocations([]); setPage(1); setHasMore(true); setGooglePageToken(null);
    setActiveLocation({ lon: coordinates[0], lat: coordinates[1], label: locationName, isManual: true });
  };

  const clearSearch = async () => {
      setLocations([]); setLoading(true); setPage(1); setHasMore(true); setSelectedCategory('All');
      setGooglePageToken(null); 
      setSearchKey(prev => prev + 1); 
      
      try {
          const lastKnown = await Location.getLastKnownPositionAsync({});
          if (lastKnown) {
              setActiveLocation({ lat: lastKnown.coords.latitude, lon: lastKnown.coords.longitude, label: "Current Location", isManual: false });
          }
      } catch (e) {
          console.log("Error resetting GPS");
      }
  };

 const loadData = useCallback(async (targetPage = 1, isRefresh = false, locationOverride = null, isSilent = false, recursiveCount = 0) => {
    if (recursiveCount > 5) {
        setLoading(false); setRefreshing(false); setLoadingMore(false);
        return;
    }

    if (loadingMore && !isSilent && recursiveCount === 0) return;
    if (!hasMore && targetPage > 1 && !isRefresh) return;

    const currentLoc = locationOverride || activeLocation;
    if (!currentLoc || isNaN(currentLoc.lat) || isNaN(currentLoc.lon)) {
        return;
    }

    let loadedFromCache = false;

    if (targetPage === 1) {
        setGooglePageToken(null);
    }

    if (targetPage === 1 && !isRefresh && !currentLoc.isManual && recursiveCount === 0) {
        try {
            const cacheKey = `FEED_CACHE_${selectedCategory}`;
            const cachedData = await AsyncStorage.getItem(cacheKey);
            if (cachedData) {
                const parsedCache = JSON.parse(cachedData);
                const now = new Date().getTime();
                const dist = getDistanceFromLatLonInKm(currentLoc.lat, currentLoc.lon, parsedCache.lat, parsedCache.lon);
                
                if ((now - parsedCache.timestamp < CACHE_EXPIRY_MS) && dist < CACHE_RADIUS_KM && parsedCache.data.length > 0) {
                    const sortedCache = parsedCache.data.sort((a, b) => (a.distance != null ? a.distance : Infinity) - (b.distance != null ? b.distance : Infinity));
                    setLocations(sortedCache);
                    setLoading(false);
                    setHasMore(true);
                    loadedFromCache = true;
                }
            }
        } catch (error) { console.warn("Cache Error", error); }
    }

    try {
      if (!isSilent) {
          if (isRefresh) setRefreshing(true);
          else if (targetPage === 1 && !loadedFromCache && recursiveCount === 0) { 
              setLoading(true); setHasMore(true); 
          } 
          else if (targetPage > 1 || recursiveCount > 0) { 
              setLoadingMore(true); 
          }
      }

      const ROUTE_PREFIX = `${API_BASE}/api`; 
      const params = `page=${targetPage}&limit=${ITEMS_PER_PAGE}`;
      
      const latFixed = parseFloat(currentLoc.lat).toFixed(6);
      const lonFixed = parseFloat(currentLoc.lon).toFixed(6);

      const radiusParam = `&radius=50000`;

      // 💡 CitySearch siempre entrega lat/lon reales (búsqueda manual o GPS),
      // así que todas las categorías pasan por el mismo endpoint híbrido (DB + Google Nearby Search).
      let url = `${ROUTE_PREFIX}/?lat=${latFixed}&lon=${lonFixed}&${params}${radiusParam}`;
      if (selectedCategory !== 'All' && selectedCategory !== 'Others') {
          url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (isRefresh) url += '&refresh=1';

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000));
      const response = await Promise.race([fetch(url), timeoutPromise]);

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const json = await response.json();

      let rawData = [];
      if (Array.isArray(json)) rawData = json;
      else if (json.data && Array.isArray(json.data)) rawData = json.data;

      if (json.nextGoogleToken) {
          setGooglePageToken(json.nextGoogleToken);
      } else if (targetPage === 1) {
          setGooglePageToken(null);
      }

      const filteredData = rawData.map(item => {
          const rawLat = item.latitude || item.lat || item.geometry?.location?.lat;
          const rawLon = item.longitude || item.lon || item.geometry?.location?.lng;
          
          let dist = null;
          if (rawLat && rawLon) {
              dist = getDistanceFromLatLonInKm(currentLoc.lat, currentLoc.lon, rawLat, rawLon);
          }
          return { ...item, computedDistance: dist };
      }).filter(item => {
          if (currentLoc.isManual) return true;
          if (item.computedDistance === null) return true;
          return item.computedDistance <= MAX_RADIUS_KM; 
      });

      const finalData = filteredData.map(item => {
          if (item.latitude && item.image_url) {
              return { ...item, distance: item.computedDistance }; 
          }

          let finalCat = 'Others'; 
          
          const types = item.types || [];
          const iconUrl = item.icon || ""; 
          const nameLower = item.name ? item.name.toLowerCase() : "";
          const hasKeyword = (list) => list.some(key => nameLower.includes(key));

          if (types.includes('castle') || types.includes('fortress') || (iconUrl.includes('historic') && hasKeyword(GLOBAL_KEYWORDS.castles))) {
              finalCat = 'Castles';
          } 
          else if (hasKeyword(GLOBAL_KEYWORDS.ruins)) {
              finalCat = 'Ruins';
          } 
          else if (types.includes('museum') || types.includes('art_gallery') || iconUrl.includes('museum') || hasKeyword(GLOBAL_KEYWORDS.museums)) {
              finalCat = 'Museums';
          } 
          else if (types.includes('church') || types.includes('place_of_worship') || iconUrl.includes('worship') || hasKeyword(GLOBAL_KEYWORDS.religious)) {
              finalCat = 'Religious';
          } 
          else if (types.includes('historic_site') || types.includes('archaeological_site')) {
              finalCat = 'Historic Site';
          }

          return {
              id: item.place_id || item.id || Math.random().toString(),
              name: item.name,
              description: item.vicinity || item.description || "Historic Place detected via Radar.",
              latitude: item.geometry?.location?.lat || item.lat,
              longitude: item.geometry?.location?.lng || item.lon,
              category: finalCat, 
              image_url: null, 
              source: 'google',
              distance: item.computedDistance 
          };
      });

      let displayData = finalData.filter(item => {
          if (selectedCategory === 'All') return true;
          return item.category === selectedCategory;
      });

      displayData.sort((a, b) => (a.distance != null ? a.distance : Infinity) - (b.distance != null ? b.distance : Infinity));

      let currentTotalItems = 0;

      if (targetPage === 1) {
          setLocations(displayData);
          currentTotalItems = displayData.length;
          
          if (finalData.length > 0 && !currentLoc.isManual) { 
              try {
                  const cacheToSave = {
                      lat: currentLoc.lat, lon: currentLoc.lon,
                      timestamp: new Date().getTime(),
                      data: finalData
                  };
                  await AsyncStorage.setItem(`FEED_CACHE_${selectedCategory}`, JSON.stringify(cacheToSave));
              } catch (e) {}
          }
      } else {
          setLocations(prev => {
              const existingIds = new Set(prev.map(item => item.id));
              const uniqueNewData = displayData.filter(item => !existingIds.has(item.id));
              currentTotalItems = prev.length + uniqueNewData.length;
              
              const combined = [...prev, ...uniqueNewData];
              return combined.sort((a, b) => (a.distance != null ? a.distance : Infinity) - (b.distance != null ? b.distance : Infinity));
          });
      }
      
      setPage(targetPage);
      
      const googleHasMore = rawData.length >= ITEMS_PER_PAGE || !!json.nextGoogleToken;
      setHasMore(googleHasMore);

      if (currentTotalItems < MIN_ITEMS_TO_FILL_SCREEN && googleHasMore) {
          loadData(targetPage + 1, false, currentLoc, true, recursiveCount + 1);
      } else {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
      }

    } catch (e) { 
        if (targetPage === 1 && !loadedFromCache) setLocations([]); 
        setLoading(false); setRefreshing(false); setLoadingMore(false);
    } 
  }, [activeLocation, selectedCategory, loadingMore, locations.length, hasMore, googlePageToken]);
  
  const handleLoadMore = () => {
      if (hasMore && !loadingMore && !loading) {
          loadData(page + 1);
      }
  };

  const renderItem = useMemo(() => ({ item }) => {
      return (
        <View style={{ marginBottom: 20 }}>
            <View>
                <StoryCard item={item} navigation={navigation} />
                {item.source === 'db' && (
                    <View style={localStyles.communityBadge}>
                        <MaterialCommunityIcons name="crown" size={14} color="#000" style={{ marginRight: 4 }} />
                        <Text style={localStyles.communityText}>COMMUNITY GEM</Text>
                    </View>
                )}
            </View>
        </View>
      );
  }, [navigation, locations]);

  const getItemLayout = useCallback((data, index) => ({
    length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index,
  }), []);

  const renderEmptyOrLoading = () => {
      if (loading && !refreshing) {
          return (
              <View style={{ paddingTop: HEADER_HEIGHT + 20 }}>
                  <SkeletonCard /><SkeletonCard /><SkeletonCard />
              </View>
          );
      }
      return (
          <View style={[localStyles.emptyState, { paddingTop: HEADER_HEIGHT }]}>
              <MaterialCommunityIcons name="map-search-outline" size={60} color={THEME.gold} style={{opacity: 0.5}}/>
              <Text style={{ color: THEME.subText, fontSize: 18, marginTop: 10 }}>Uncharted Territory</Text>
              <Text style={{ color: THEME.subText, fontSize: 12, marginTop: 5 }}>
                  {activeLocation?.isManual ? `No results for ${activeLocation.label}` : "Waiting for GPS..."}
              </Text>
          </View>
      );
  };

  return (
    <View style={localStyles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      
      <Animated.View style={[localStyles.animatedHeaderContainer, { transform: [{ translateY }] }]}>
          <View style={localStyles.headerContent}> 
              <View style={localStyles.navTopRow}>
                  <TouchableOpacity style={localStyles.logoRow} onPress={clearSearch} activeOpacity={0.7} disabled={loading}>
                      <MaterialCommunityIcons name="compass-outline" size={28} color={THEME.gold} />
                      <Text style={localStyles.navTitle}>Echoes&Paths</Text>
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                     <TouchableOpacity 
    onPress={() => navigation.navigate('Map', { 
        feedLocations: locations, // Pasamos la lista actual del feed
        currentCoords: activeLocation ? {
            latitude: activeLocation.lat,
            longitude: activeLocation.lon,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05
        } : null
    })} 
    style={{ marginRight: 15 }}
>
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
                              <TouchableOpacity 
                                  onPress={() => {
                                      if (selectedCategory === item) return;
                                      setLocations([]); 
                                      setLoading(true);
                                      setGooglePageToken(null); 
                                      setSelectedCategory(item);
                                  }} 
                                  style={[localStyles.catBtn, selectedCategory === item && localStyles.catBtnActive]}
                              >
                                  <Text style={[localStyles.catText, selectedCategory === item && localStyles.catTextActive]}>{item}</Text>
                              </TouchableOpacity>
                          )}
                      />
                  </View>
              </View>
          </View> 
      </Animated.View>

      <View style={{ flex: 1, backgroundColor: THEME.bg }}>
          {locations.length === 0 ? renderEmptyOrLoading() : (
              <Animated.FlatList
                  ref={flatListRef}
                  data={locations}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.id.toString()}
                  getItemLayout={getItemLayout}
                  onScrollBeginDrag={() => {
                      if (menuVisible) setMenuVisible(false);
                  }}
                  onMomentumScrollEnd={() => {}}
                  onScrollEndDrag={() => {}}
                  initialNumToRender={4}    
                  maxToRenderPerBatch={5}   
                  windowSize={5}            
                  removeClippedSubviews={true} 
                  scrollEventThrottle={16} 
                  onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                  contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 20, paddingBottom: 40 }}
                  progressViewOffset={HEADER_HEIGHT + 20}
                  onEndReached={handleLoadMore} 
                  onEndReachedThreshold={0.8} 
                  refreshControl={
                      <RefreshControl refreshing={refreshing} onRefresh={() => loadData(1, true)} colors={[THEME.bg]} tintColor={THEME.gold} progressViewOffset={HEADER_HEIGHT + 20} />
                  }
                  ListFooterComponent={() => {
                    if (loadingMore) return <ActivityIndicator style={{ margin: 20 }} color={THEME.gold} />;
                    if (!hasMore && locations.length > 0) return <Footer />;
                    return null;
                  }}
              />
          )}
      </View>

      {/* 💡 BOTÓN INVISIBLE MEJORADO PARA ANDROID */}
      {menuVisible && (
          <TouchableOpacity 
              style={[StyleSheet.absoluteFill, { zIndex: 2500, elevation: 4 }]} 
              activeOpacity={1} 
              onPress={() => setMenuVisible(false)} 
              onPressIn={() => setMenuVisible(false)} // 👈 EL TRUCO PARA ANDROID: Se dispara apenas tocas
          />
      )}

      {menuVisible && (
          <View style={localStyles.dropdownMenu}>
              <View style={localStyles.arrowUp} />
              <TouchableOpacity style={localStyles.menuHeader} activeOpacity={0.7} onPress={() => { setMenuVisible(false); navigation.navigate('ProfileScreen'); }}>
                  {isLoggedIn && userPhoto ? (
                      <Image source={{ uri: userPhoto }} style={localStyles.avatarLarge} />
                  ) : (
                      <View style={localStyles.avatarPlaceholder}><Ionicons name="person" size={28} color={THEME.bg} /></View>
                  )}
                  <Text style={localStyles.menuUserLabel}>{isLoggedIn ? 'Explorer Rank' : 'Guest Mode'}</Text>
                  <Text style={localStyles.menuUserName} numberOfLines={1}>{isLoggedIn ? userName : 'Guest User'}</Text>
                  <Text style={{ color: THEME.gold, fontSize: 14, marginTop: 4 }}>View Profile <Ionicons name="chevron-forward" size={14} /></Text>
              </TouchableOpacity>

              <View style={localStyles.separator} />
              
              {isLoggedIn ? (
                <>
                    <TouchableOpacity style={localStyles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Favorites'); }}>
                        <Ionicons name="heart" size={20} color={THEME.gold} />
                        <Text style={localStyles.menuItemText}>My Favorites</Text>
                    </TouchableOpacity>
                    <View style={localStyles.separator} />
                    <TouchableOpacity style={localStyles.menuItem} onPress={() => { setMenuVisible(false); logout(); }}>
                        <Ionicons name="log-out" size={20} color={THEME.danger} />
                        <Text style={[localStyles.menuItemText, { color: THEME.danger }]}>Sign Out</Text>
                    </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={localStyles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('LoginScreen'); }}>
                    <Ionicons name="log-in" size={20} color={THEME.gold} />
                    <Text style={[localStyles.menuItemText, { color: THEME.gold, fontWeight: 'bold' }]}>Sign In / Register</Text>
                </TouchableOpacity>
              )}
          </View>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: THEME.bg },
  animatedHeaderContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_HEIGHT, zIndex: 1000, backgroundColor: THEME.bg, borderBottomWidth: 1, borderBottomColor: THEME.border },
  headerContent: { flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 60, paddingHorizontal: 20, justifyContent: 'flex-start' },
  navTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  navTitle: { fontSize: 24, fontFamily: 'BerkshireSwash_400Regular', color: THEME.text, marginLeft: 8 },
  avatarSmall: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: THEME.gold },
  locationBadge: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', backgroundColor: THEME.card, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: THEME.border },
  locationText: { color: THEME.gold, fontWeight: 'bold', fontSize: 14, marginLeft: 6, maxWidth: 200 },
  resetButton: { marginLeft: 10, backgroundColor: THEME.gold, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  catBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.subText, marginRight: 10 },
  catBtnActive: { backgroundColor: THEME.gold, borderColor: THEME.gold },
  catText: { color: THEME.subText, fontSize: 13, fontWeight: '600' },
  catTextActive: { color: THEME.bg, fontWeight: 'bold' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  dropdownMenu: { position: 'absolute', top: 90, right: 20, width: 220, backgroundColor: THEME.card, borderRadius: 12, padding: 15, zIndex: 3000, borderWidth: 1, borderColor: THEME.border, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 5 },
  arrowUp: { position: 'absolute', top: -10, right: 15, width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 10, borderStyle: 'solid', borderBottomColor: THEME.card, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  menuHeader: { alignItems: 'center', marginBottom: 10 },
  avatarLarge: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: THEME.gold, marginBottom: 8 },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: THEME.gold, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  menuUserLabel: { color: THEME.subText, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  menuUserName: { color: THEME.text, fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  separator: { height: 1, backgroundColor: THEME.border, marginVertical: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  menuItemText: { color: THEME.text, marginLeft: 12, fontSize: 15 },
  
  communityBadge: {
    position: 'absolute',
    top: 15,
    right: 30, 
    backgroundColor: THEME.gold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10
  },
  communityText: {
      color: THEME.bg,
      fontWeight: 'bold',
      fontSize: 10,
      letterSpacing: 0.5
  }
});