import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  StatusBar, 
  Platform,
  Dimensions,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

// 🎨 Textura de papel (Asegúrate de tener esta imagen o comenta la línea)
const LOCAL_PAPER_TEXTURE = require('../../assets/Images/pexels-pixabay-235985.jpg'); 
const { width, height } = Dimensions.get('window');

// ⚠️ IMPORTANTE: Configuración de IP
// - Emulador Android: 'http://10.0.2.2:8080/api/social'
// - Celular Físico: Usa tu IP local (ej: 'http://192.168.1.XX:8080/api/social')
//const API_URL = 'http://10.0.2.2:8080/social'; 
// Debe ser https (seguro) y terminar en up.railway.app
const API_URL = 'https://castleapp-backend-production.up.railway.app/social';

// --- ESTILO DE MAPA RETRO ---
const RETRO_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#ebe3cd" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#523735" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f1e6" }] },
  { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#c9b2a6" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#f5f1e6" }] },
  { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#b9d3c2" }] }
];

// 👇 MARCADOR PERSONALIZADO (Marrón = Tú, Azul = Amigo)
const ConquestIconMarker = ({ place, onPress, isFriend }) => {
    const [tracksViewChanges, setTracksViewChanges] = useState(true);
    
    // Colores: Marrón para mí, Azul Navy para el amigo
    const badgeColor = isFriend ? '#1F4E79' : '#8d6e63'; 
    const iconName = isFriend ? 'account-eye' : 'shield-sword';
    const borderColor = isFriend ? '#C0C0C0' : '#f5f1e6';

    // Optimización: Deja de renderizar cambios después de 500ms
    useEffect(() => {
        const timer = setTimeout(() => setTracksViewChanges(false), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <Marker
            coordinate={{ latitude: place.lat, longitude: place.lon }}
            centerOffset={{ x: 0, y: -28 }}
            tracksViewChanges={tracksViewChanges}
            onPress={() => onPress(place, isFriend)}
            zIndex={isFriend ? 10 : 20} // Mis marcadores siempre encima
        >
            <View style={styles.iconMarkerContainer}>
                <View style={[styles.iconBadge, { backgroundColor: badgeColor, borderColor: borderColor }]}>
                    <MaterialCommunityIcons name={iconName} size={22} color={borderColor} />
                </View>
                <View style={[styles.markerArrow, { borderTopColor: badgeColor }]} />
                <View style={styles.markerShadow} />
            </View>
        </Marker>
    );
};

export default function HistoryMapScreen() {
  const navigation = useNavigation();
  const { userInfo } = useContext(AuthContext);
  
  // --- ESTADOS ---
  const [activeFriend, setActiveFriend] = useState(null); 
  const [selectedPlace, setSelectedPlace] = useState(null);
  
  // Datos del Mapa
  const [myPlaces, setMyPlaces] = useState([]);
  const [friendPlaces, setFriendPlaces] = useState([]);
  
  // Buscador (Modal)
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // 1. 🟢 CARGAR MIS LUGARES (Al iniciar pantalla)
  useEffect(() => {
     const fetchMyPlaces = async () => {
    try {
        const response = await fetch(`${API_URL}/visits/me`);
        
        // 👇 AGREGAMOS ESTO PARA ESPIAR EL ERROR
        const textoRespuesta = await response.text(); 
        console.log("📢 RESPUESTA DEL SERVIDOR:", textoRespuesta); 

        // Intentamos convertir manualmente
        const data = JSON.parse(textoRespuesta); 
        if (Array.isArray(data)) {
            setMyPlaces(data); 
        }
    } catch (error) {
        console.error("🔥 Error real:", error);
    }
};
      fetchMyPlaces();
  }, []);

  // 2. 🔵 CARGAR LUGARES DEL AMIGO (Cuando seleccionas a alguien)
  useEffect(() => {
      const fetchFriendPlaces = async () => {
          if (activeFriend) {
              try {
                  console.log(`Cargando mapa de: ${activeFriend.username} (ID: ${activeFriend.id})`);
                  const response = await fetch(`${API_URL}/visits/user/${activeFriend.id}`);
                  const data = await response.json();
                  if (Array.isArray(data)) {
                    setFriendPlaces(data);
                  }
              } catch (error) {
                  console.error("Error cargando amigo:", error);
              }
          } else {
              setFriendPlaces([]); // Limpiar mapa si cierro el VS
          }
      };
      fetchFriendPlaces();
  }, [activeFriend]);

  // --- LÓGICA DEL BUSCADOR ---
  const searchFriends = async (text) => {
      setSearchQuery(text);
      if (text.length < 2) {
          setSearchResults([]);
          return;
      }
      setSearching(true);
      try {
          const res = await fetch(`${API_URL}/search?q=${text}`);
          const data = await res.json();
          setSearchResults(data);
      } catch (e) {
          console.error(e);
      } finally {
          setSearching(false);
      }
  };

  const selectFriend = (friend) => {
      setActiveFriend(friend); 
      setModalVisible(false);  
      setSearchQuery('');      
      setSearchResults([]);
      setSelectedPlace(null); // Cerrar tarjeta de info si estaba abierta
  };

  const handleMarkerPress = (place, isFriend) => {
      setSelectedPlace({ ...place, isFriendOwner: isFriend });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* 🗺️ MAPA */}
      <MapView
        mapType="hybrid"
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={RETRO_MAP_STYLE}
        initialCamera={{
            center: { latitude: -34.6037, longitude: -58.3816 },
            pitch: 50, heading: 0, altitude: 4000, zoom: 13,
        }}
        onPress={() => setSelectedPlace(null)}
      >
        {myPlaces.map(place => (
            <ConquestIconMarker key={`me-${place.id}`} place={place} isFriend={false} onPress={handleMarkerPress} />
        ))}
        {friendPlaces.map(place => (
            <ConquestIconMarker key={`fr-${place.id}`} place={place} isFriend={true} onPress={handleMarkerPress} />
        ))}
      </MapView>

      <Image source={LOCAL_PAPER_TEXTURE} style={styles.overlayTexture} pointerEvents="none" />

      {/* 🔙 Botón Atrás */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
         <Ionicons name="arrow-back" size={24} color="#523735" />
      </TouchableOpacity>

      {/* ⚔️ Botón VS (Abrir Buscador) */}
      <TouchableOpacity 
          style={[styles.vsButton, activeFriend && styles.vsButtonActive]} 
          onPress={() => setModalVisible(true)}
      >
         <MaterialCommunityIcons name="sword-cross" size={24} color={activeFriend ? "#ebe3cd" : "#523735"} />
         {activeFriend && <Text style={styles.vsText}>VS {activeFriend.username}</Text>}
      </TouchableOpacity>
      
      {/* Botón X para cancelar amigo */}
      {activeFriend && (
          <TouchableOpacity style={styles.clearFriendBtn} onPress={() => setActiveFriend(null)}>
              <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
      )}

      {/* 🏷️ Leyenda (Solo visible en modo VS) */}
      {activeFriend && (
        <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#8d6e63' }]} />
                <Text style={styles.legendText}>Yo ({myPlaces.length})</Text>
            </View>
            <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#1F4E79' }]} />
                <Text style={styles.legendText}>{activeFriend.username} ({friendPlaces.length})</Text>
            </View>
        </View>
      )}

      {/* 📜 Tarjeta de Información (Pop-up inferior) */}
      {selectedPlace && (
          <View style={styles.infoCardContainer}>
              <View style={[styles.infoCard, selectedPlace.isFriendOwner && styles.friendCardBorder]}>
                  <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{selectedPlace.name}</Text>
                      <TouchableOpacity onPress={() => setSelectedPlace(null)}>
                          <Ionicons name="close-circle" size={24} color={selectedPlace.isFriendOwner ? "#1F4E79" : "#8d6e63"} />
                      </TouchableOpacity>
                  </View>
                  <Text style={styles.cardCategory}>
                    {selectedPlace.isFriendOwner ? `Hallazgo de ${activeFriend?.username}` : 'Tu conquista'} • {selectedPlace.country || 'Desconocido'}
                  </Text>
                  
                  {/* Botón Acción (Ej: Ver detalle) */}
                  <TouchableOpacity 
                    style={[styles.detailsBtn, selectedPlace.isFriendOwner && styles.friendBtn]}
                    onPress={() => {
                        // Aquí navegarías al detalle si quisieras
                        // navigation.navigate('Detail', { locationData: selectedPlace });
                        console.log("Ver detalle de", selectedPlace.name);
                    }}
                  >
                      <Text style={[styles.detailsBtnText, selectedPlace.isFriendOwner && { color: '#fff' }]}>
                        {selectedPlace.isFriendOwner ? '🔍 Ver su hallazgo' : '⚔️ Ver Detalles'}
                      </Text>
                  </TouchableOpacity>
              </View>
          </View>
      )}

      {/* 🔍 MODAL BUSCADOR (Ventana emergente) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Desafiar a un Explorador</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#523735" />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#8d6e63" />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Buscar amigo (ej: Ana)..."
                        placeholderTextColor="#a1887f"
                        value={searchQuery}
                        onChangeText={searchFriends}
                        autoCapitalize="none"
                    />
                </View>

                {searching ? (
                    <ActivityIndicator size="small" color="#8d6e63" style={{marginTop: 20}} />
                ) : (
                    <FlatList 
                        data={searchResults}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({item}) => (
                            <TouchableOpacity style={styles.userRow} onPress={() => selectFriend(item)}>
                                <Image source={{uri: item.avatar_url || 'https://i.pravatar.cc/150'}} style={styles.userAvatar} />
                                <Text style={styles.userName}>{item.username}</Text>
                                <Ionicons name="chevron-forward" size={20} color="#8d6e63" />
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            searchQuery.length > 2 && <Text style={styles.emptyText}>No se encontraron exploradores.</Text>
                        }
                    />
                )}
            </View>
        </View>
      </Modal>

    </View>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ecab3a' },
  map: { width: '100%', height: '100%' },
  overlayTexture: { ...StyleSheet.absoluteFillObject, opacity: 0.5, resizeMode: 'cover' },
  
  // Botones Superiores
  backButton: {
      position: 'absolute', top: 50, left: 20,
      backgroundColor: 'rgba(235, 227, 205, 0.95)',
      padding: 10, borderRadius: 25, borderWidth: 1, borderColor: '#8d6e63',
      zIndex: 10, elevation: 5
  },
  vsButton: {
      position: 'absolute', top: 50, right: 20,
      backgroundColor: 'rgba(235, 227, 205, 0.95)',
      flexDirection: 'row', alignItems: 'center',
      padding: 10, borderRadius: 25, borderWidth: 1, borderColor: '#8d6e63',
      zIndex: 10, elevation: 5
  },
  vsButtonActive: {
      backgroundColor: '#523735', borderColor: '#d4af37'
  },
  vsText: {
      marginLeft: 8, fontWeight: 'bold', color: '#ebe3cd', fontSize: 14
  },
  clearFriendBtn: {
      position: 'absolute', top: 45, right: 15,
      backgroundColor: '#c62828', borderRadius: 10, width: 20, height: 20,
      justifyContent: 'center', alignItems: 'center', zIndex: 11, elevation: 6
  },

  // Leyenda Flotante
  legendContainer: {
      position: 'absolute', top: 110, right: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ccc',
      gap: 6, zIndex: 10, elevation: 3
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { fontSize: 12, fontWeight: 'bold', color: '#333' },

  // Modal
  modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center', alignItems: 'center'
  },
  modalContent: {
      width: width * 0.85, height: height * 0.6,
      backgroundColor: '#f5f1e6', borderRadius: 12,
      padding: 20, borderWidth: 4, borderColor: '#8d6e63'
  },
  modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20
  },
  modalTitle: {
      fontSize: 18, fontWeight: 'bold', color: '#523735', fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif'
  },
  searchBox: {
      flexDirection: 'row', backgroundColor: '#e0d6c3',
      padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 15
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#3e2723' },
  userRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#d7ccc8'
  },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ccc' },
  userName: { flex: 1, marginLeft: 15, fontSize: 16, color: '#3e2723', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#a1887f', marginTop: 20 },

  // Tarjeta Info
  infoCardContainer: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center', zIndex: 20 },
  infoCard: { width: width * 0.85, backgroundColor: '#f5f1e6', borderRadius: 12, padding: 15, borderWidth: 2, borderColor: '#8d6e63', elevation: 8 },
  friendCardBorder: { borderColor: '#1F4E79', borderWidth: 3 }, // Borde más grueso para amigo
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#523735', flex: 1 },
  cardCategory: { fontSize: 14, color: '#8d6e63', marginBottom: 15, fontStyle: 'italic' },
  detailsBtn: { backgroundColor: '#523735', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  friendBtn: { backgroundColor: '#1F4E79' },
  detailsBtnText: { color: '#d4af37', fontWeight: 'bold', fontSize: 16 },

  // Estilos Marcador
  iconMarkerContainer: { width: 60, height: 60, alignItems: 'center', justifyContent: 'flex-start' },
  iconBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, zIndex: 3, elevation: 4 },
  markerArrow: { width: 0, height: 0, borderStyle: 'solid', borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 14, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -4, zIndex: 2 },
  markerShadow: { position: 'absolute', bottom: 8, width: 26, height: 8, backgroundColor: 'black', opacity: 0.3, borderRadius: 10, transform: [{ scaleX: 1.5 }] },
});