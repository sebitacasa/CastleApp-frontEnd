import React, { useState, useContext, useRef, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, 
  Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, StatusBar 
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location'; 
import * as ImagePicker from 'expo-image-picker';

import { suggestLocation, getLocations } from '../api/locationsApi';
import { AuthContext } from '../context/AuthContext';

// 👇 IMPORTAMOS TU PALETA GLOBAL
import { APP_PALETTE as THEME } from '../theme/colors';

const CLOUD_NAME = "dq4j7zh2a"; 
const UPLOAD_PRESET = "castleapp_upload"; 

const SELECTABLE_CATEGORIES = [
  'Castles', 'Museums', 'Historic Site', 'Ruins', 'Religious', 'Others'
];

const SearchScreen = ({ navigation }) => {
  const mapRef = useRef(null);
  const { userInfo } = useContext(AuthContext);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [region, setRegion] = useState(null);
  const [places, setPlaces] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [creatingCoords, setCreatingCoords] = useState(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false); 
  
  const [formData, setFormData] = useState({ name: '', description: '', imageUri: null, category: 'Castles' });

  const loadPlaces = async () => {
    const data = await getLocations();
    if (data && Array.isArray(data)) setPlaces(data);
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      const fallbackCoords = { latitude: 47.0707, longitude: 15.4395, latitudeDelta: 0.05, longitudeDelta: 0.05 };

      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need your location to show places around you.');
        setRegion(fallbackCoords);
        loadPlaces();
        return;
      }

      setHasLocationPermission(true);

      try {
        let location = await Location.getLastKnownPositionAsync({});
        
        try {
            const freshLoc = await Promise.race([
                Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("GPS Timeout")), 5000))
            ]);
            if (freshLoc) location = freshLoc;
        } catch (e) {
            console.warn("GPS timeout, usando last known.");
        }

        if (location) {
            setRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        } else {
             setRegion(fallbackCoords);
        }

      } catch (e) {
        console.warn("GPS Error", e);
        setRegion(fallbackCoords);
      } finally {
        loadPlaces();
      }
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setFormData({ ...formData, imageUri: result.assets[0].uri });
    }
  };

  const handleStartCreation = () => {
    if (!userInfo) {
        Alert.alert("Restricted", "Please log in to contribute.");
        return;
    }
    setCreatingCoords({ lat: region.latitude, lon: region.longitude });
    setModalVisible(true);
  };

  const uploadToCloudinary = async (imageUri) => {
    if (!imageUri) return null;
    const data = new FormData();
    let filename = imageUri.split('/').pop();
    let match = /\.(\w+)$/.exec(filename);
    let type = match ? `image/${match[1]}` : `image`;

    data.append('file', { uri: imageUri, name: filename, type });
    data.append('upload_preset', UPLOAD_PRESET);

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: data
        });
        const result = await res.json();
        return result.secure_url || null;
    } catch (error) {
        console.error("Upload failed:", error);
        return null;
    }
  };

  const handleSubmit = async () => {
    if (formData.name.length < 3 || formData.description.length < 5) {
        Alert.alert("Incomplete", "Please fill name and description.");
        return;
    }
    if (!formData.imageUri) {
        Alert.alert("Image Required", "Please select a photo.");
        return;
    }
    
    setLoadingSubmit(true);
    setUploadingImage(true);

    const userId = userInfo?.id || userInfo?.user?.id;

    try {
      const cloudImageUrl = await uploadToCloudinary(formData.imageUri);

      if (!cloudImageUrl) {
          Alert.alert("Upload Error", "Failed to upload image. Try again.");
          setLoadingSubmit(false);
          setUploadingImage(false);
          return;
      }

      let addressText = "Unknown Location";
      try {
          const reverseGeo = await Location.reverseGeocodeAsync({
              latitude: creatingCoords.lat,
              longitude: creatingCoords.lon
          });
          if (reverseGeo.length > 0) {
              const item = reverseGeo[0];
              const city = item.city || item.region || item.subregion;
              const country = item.country;
              addressText = city ? `${city}, ${country}` : country;
          }
      } catch (geoError) { console.warn("Geo error:", geoError); }

      const newItem = {
        name: formData.name,
        description: formData.description,
        latitude: creatingCoords.lat,
        longitude: creatingCoords.lon,
        image_url: cloudImageUrl,
        user_id: userId,
        category: formData.category,
        location_text: addressText 
      };

      await suggestLocation(newItem);
      
      Alert.alert("Success!", "Place submitted for review. It will appear on the map for nearby explorers once approved.");
      loadPlaces();
      setModalVisible(false);
      setFormData({ name: '', description: '', imageUri: null, category: 'Castles' });

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not submit place.");
    } finally {
      setLoadingSubmit(false);
      setUploadingImage(false);
    }
  };

  if (!region) {
      return (
          <View style={[styles.container, styles.center]}>
              <ActivityIndicator size="large" color={THEME.gold} />
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} translucent={false} />
      
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={true}
      >
        {places.map((place, index) => (
            <Marker
                key={place.id || index}
                coordinate={{ latitude: Number(place.latitude), longitude: Number(place.longitude) }}
                title={place.name}
                description={place.category}
                pinColor={place.source === 'db' ? THEME.gold : "red"} 
            />
        ))}
      </MapView>

      <View style={styles.crosshairContainer} pointerEvents="none">
        <MaterialCommunityIcons name="crosshairs-gps" size={40} color={THEME.gold} />
      </View>

      <View style={styles.scanButtonContainer}>
        <TouchableOpacity style={styles.createButton} onPress={handleStartCreation} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color={THEME.bg} />
          <Text style={styles.createText}>MARK LOCATION</Text>
        </TouchableOpacity>
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
            {/* 💡 CORRECCIÓN AQUÍ: keyboardShouldPersistTaps="handled" */}
            <ScrollView 
                contentContainerStyle={styles.modalContent} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled" 
            >
                
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Chronicle the Past</Text>
                    {/* 💡 CORRECCIÓN AQUÍ: hitSlop para hacer el botón más fácil de tocar */}
                    <TouchableOpacity 
                        onPress={() => setModalVisible(false)} 
                        style={styles.closeModalBtn}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} 
                    >
                         <Ionicons name="close" size={28} color={THEME.subText} />
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.modalSubtitle}>Help map the forgotten history. Add details for the location at the center of the map.</Text>
                
                <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage} activeOpacity={0.7}>
                    {formData.imageUri ? (
                        <Image source={{ uri: formData.imageUri }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="camera-outline" size={40} color={THEME.gold} />
                            <Text style={styles.imagePlaceholderText}>Upload Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={styles.label}>Name of the Site</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Forgotten Watchtower" 
                    placeholderTextColor={THEME.subText}
                    value={formData.name} 
                    onChangeText={(t) => setFormData({...formData, name: t})}
                />

                <Text style={styles.label}>Description</Text>
                <TextInput 
                    style={[styles.input, styles.textArea]} 
                    placeholder="What history does this place hold?" 
                    placeholderTextColor={THEME.subText}
                    multiline numberOfLines={3}
                    value={formData.description} 
                    onChangeText={(t) => setFormData({...formData, description: t})}
                />

                <Text style={styles.label}>Category</Text>
                <View style={{ height: 50, marginBottom: 20 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {SELECTABLE_CATEGORIES.map((cat) => (
                            <TouchableOpacity 
                                key={cat} 
                                style={[styles.catOption, formData.category === cat && styles.catOptionSelected]}
                                onPress={() => setFormData({...formData, category: cat})}
                            >
                                <Text style={[styles.catOptionText, formData.category === cat && styles.catOptionTextSelected]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <TouchableOpacity 
                    style={[styles.submitBtn, loadingSubmit && { opacity: 0.7 }]} 
                    onPress={handleSubmit} 
                    disabled={loadingSubmit}
                >
                    {loadingSubmit ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ActivityIndicator color={THEME.bg} style={{ marginRight: 10 }} />
                            <Text style={styles.submitText}>
                                {uploadingImage ? "UPLOADING PHOTO..." : "SUBMITTING..."}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.submitText}>SUBMIT TO RADAR</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// --- 🎨 ESTILOS "PERGAMINO" INTEGRADOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { flex: 1 },
  
  crosshairContainer: { 
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
      justifyContent: 'center', alignItems: 'center', zIndex: 10 
  },
  
  scanButtonContainer: { 
      position: 'absolute', bottom: 40, alignSelf: 'center',
  },
  createButton: { 
      flexDirection: 'row', alignItems: 'center', 
      backgroundColor: THEME.gold, 
      paddingHorizontal: 24, paddingVertical: 14, 
      borderRadius: 30, 
      elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4 
  },
  createText: { 
      fontWeight: 'bold', fontSize: 15, marginLeft: 8, color: THEME.bg, letterSpacing: 1 
  },
  
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { 
      backgroundColor: THEME.bg, 
      borderTopLeftRadius: 30, borderTopRightRadius: 30, 
      padding: 25, 
      maxHeight: '90%' 
  },
  
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { 
      fontSize: 24, fontWeight: 'bold', color: THEME.text, 
      fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
  },
  modalSubtitle: { fontSize: 14, color: THEME.subText, marginBottom: 20, lineHeight: 20 },
  closeModalBtn: { padding: 5, zIndex: 10 }, // Aseguramos que esté por encima de todo

  imagePickerBtn: { 
      height: 160, marginBottom: 20, borderRadius: 16, overflow: 'hidden', 
      borderWidth: 1, borderColor: THEME.border, borderStyle: 'dashed',
      backgroundColor: THEME.card
  },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.card },
  imagePlaceholderText: { color: THEME.gold, marginTop: 8, fontWeight: '600' },
  
  label: { color: THEME.text, marginBottom: 8, fontWeight: 'bold', fontSize: 14 },
  input: { 
      backgroundColor: THEME.card, color: THEME.text, 
      borderRadius: 12, padding: 14, marginBottom: 20, 
      fontSize: 16, borderWidth: 1, borderColor: THEME.border 
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  
  catOption: { 
      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, 
      borderWidth: 1, borderColor: THEME.border, 
      marginRight: 10, backgroundColor: THEME.card, 
      height: 40, justifyContent: 'center' 
  },
  catOptionSelected: { backgroundColor: THEME.gold, borderColor: THEME.gold },
  catOptionText: { color: THEME.subText, fontSize: 13, fontWeight: '600' },
  catOptionTextSelected: { color: THEME.bg, fontWeight: 'bold' },
  
  submitBtn: { 
      backgroundColor: THEME.gold, padding: 16, borderRadius: 14, 
      alignItems: 'center', marginTop: 10, marginBottom: 20,
      elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 
  },
  submitText: { color: THEME.bg, fontWeight: 'bold', fontSize: 15, letterSpacing: 1 }
});

export default SearchScreen;