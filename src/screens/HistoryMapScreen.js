import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  StatusBar, 
  Platform,
  Dimensions
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

const LOCAL_PAPER_TEXTURE = require('../../assets/Images/pexels-pixabay-235985.jpg'); 
const { width } = Dimensions.get('window');

const RETRO_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#ebe3cd" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#523735" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f1e6" }] },
  { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#c9b2a6" }] },
  { "featureType": "administrative.land_parcel", "elementType": "geometry.stroke", "stylers": [{ "color": "#dcd2be" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] },
  { "featureType": "poi", "elementType": "labels.text", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#f5f1e6" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#f8c967" }] },
  { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#b9d3c2" }] }
];

// 👇 MARCADOR ICONO CON TEMPORIZADOR (FIX PARA ANDROID)
const ConquestIconMarker = ({ place, onPress }) => {
    const [tracksViewChanges, setTracksViewChanges] = useState(true);

    useEffect(() => {
        // Esperamos 500ms para asegurar que el icono se dibuje antes de congelar el marcador
        const timer = setTimeout(() => {
            setTracksViewChanges(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <Marker
            coordinate={{ latitude: place.lat, longitude: place.lon }}
            centerOffset={{ x: 0, y: -28 }} // Ajustado para que el pico toque el lugar
            tracksViewChanges={tracksViewChanges}
            onPress={() => onPress(place)}
        >
            <View style={styles.iconMarkerContainer}>
                <View style={styles.iconBadge}>
                    <MaterialCommunityIcons name="shield-sword" size={22} color="#f5f1e6" />
                </View>
                <View style={styles.markerArrow} />
                <View style={styles.markerShadow} />
            </View>
        </Marker>
    );
};

export default function HistoryMapScreen() {
  const navigation = useNavigation();
  const { userInfo } = useContext(AuthContext);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [visitedPlaces] = useState([
      { 
          id: 1, 
          name: "Castillo de San Telmo", 
          lat: -34.6212, 
          lon: -58.3731,
          image_url: "https://images.unsplash.com/photo-1533658607474-5e5898863628?q=80",
          category: "Fortaleza",
          country: "Argentina",
          description: "Un antiguo punto estratégico."
      },
      { 
          id: 2, 
          name: "Obelisco", 
          lat: -34.6037, 
          lon: -58.3816,
          image_url: "https://images.unsplash.com/photo-1518182170546-0766ce6fec56?q=80",
          category: "Monumento",
          country: "Argentina",
          description: "Icono histórico de Buenos Aires."
      },
  ]);

  if (!userInfo) {
      return (
          <View style={styles.centerContainer}>
              <Ionicons name="lock-closed-outline" size={60} color="#8d6e63" />
              <Text style={styles.warningText}>Debes iniciar sesión.</Text>
              <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
                  <Text style={styles.btnText}>Volver</Text>
              </TouchableOpacity>
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <MapView
        mapType="hybrid"
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={RETRO_MAP_STYLE}
        initialCamera={{
            center: { latitude: -34.6037, longitude: -58.3816 },
            pitch: 50,
            heading: 0,
            altitude: 1000, 
            zoom: 15,
        }}
        pitchEnabled={true}
        rotateEnabled={true}
        showsBuildings={false}
        onPress={() => setSelectedPlace(null)}
      >
        {visitedPlaces.map((place) => (
            <ConquestIconMarker 
                key={place.id} 
                place={place} 
                onPress={setSelectedPlace} 
            />
        ))}
      </MapView>

      <Image 
        source={LOCAL_PAPER_TEXTURE}
        style={styles.overlayTexture}
        pointerEvents="none"
      />

      <View style={styles.titleContainer}>
          <Text style={styles.vintageTitle}>My History</Text>
          <Text style={styles.subtitle}>{visitedPlaces.length} Lugares Descubiertos</Text>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
         <Ionicons name="arrow-back" size={24} color="#523735" />
      </TouchableOpacity>

      {selectedPlace && (
          <View style={styles.infoCardContainer}>
              <View style={styles.infoCard}>
                  <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{selectedPlace.name}</Text>
                      <TouchableOpacity onPress={() => setSelectedPlace(null)}>
                          <Ionicons name="close-circle" size={24} color="#8d6e63" />
                      </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.cardCategory}>{selectedPlace.category} • {selectedPlace.country}</Text>
                  
                  <TouchableOpacity 
                      style={styles.detailsBtn}
                      onPress={() => {
                          setSelectedPlace(null);
                          navigation.navigate('Detail', { locationData: selectedPlace });
                      }}
                  >
                      <Text style={styles.detailsBtnText}>⚔️ Ver Detalles</Text>
                  </TouchableOpacity>
              </View>
          </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ecab3a' },
  map: { width: '100%', height: '100%' },
  
  overlayTexture: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.5,
      resizeMode: 'cover',
  },
  
  // --- ESTILOS MARCADOR (ICONO) ---
  iconMarkerContainer: {
      width: 60,
      height: 60,
      alignItems: 'center',
      justifyContent: 'flex-start',
  },
  iconBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#8d6e63', // Marrón medieval
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#f5f1e6', // Borde crema
      zIndex: 3,
      elevation: 4, // Sombra nativa Android
  },
  markerArrow: {
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderLeftWidth: 10,
      borderRightWidth: 10,
      borderTopWidth: 14,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: '#8d6e63',
      marginTop: -4, 
      zIndex: 2,
  },
  markerShadow: {
      position: 'absolute',
      bottom: 8,
      width: 26,
      height: 8,
      backgroundColor: 'black',
      opacity: 0.3,
      borderRadius: 10,
      transform: [{ scaleX: 1.5 }],
  },
  // ---------------------------------

  titleContainer: {
      position: 'absolute',
      top: 50,
      alignSelf: 'center',
      backgroundColor: 'rgba(235, 227, 205, 0.95)',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#8d6e63',
      alignItems: 'center',
      elevation: 5,
      zIndex: 10,
  },
  vintageTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#523735',
      fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
  },
  subtitle: {
      fontSize: 12,
      color: '#8d6e63',
      fontStyle: 'italic',
  },
  backButton: {
      position: 'absolute',
      top: 50,
      left: 20,
      backgroundColor: 'rgba(235, 227, 205, 0.9)',
      padding: 10,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: '#8d6e63',
      zIndex: 10,
  },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ebe3cd' },
  warningText: { marginTop: 20, fontSize: 16, color: '#523735', textAlign: 'center', width: '80%' },
  btn: { marginTop: 20, backgroundColor: '#8d6e63', padding: 10, borderRadius: 5 },
  btnText: { color: '#ebe3cd', fontWeight: 'bold' },

  infoCardContainer: {
      position: 'absolute',
      bottom: 30,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 20,
  },
  infoCard: {
      width: width * 0.85,
      backgroundColor: '#f5f1e6',
      borderRadius: 12,
      padding: 15,
      borderWidth: 2,
      borderColor: '#8d6e63',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
  },
  cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
  },
  cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#523735',
      flex: 1,
  },
  cardCategory: {
      fontSize: 14,
      color: '#8d6e63',
      marginBottom: 15,
      fontStyle: 'italic',
  },
  detailsBtn: {
      backgroundColor: '#523735',
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
  },
  detailsBtnText: {
      color: '#d4af37',
      fontWeight: 'bold',
      fontSize: 16,
  }
});