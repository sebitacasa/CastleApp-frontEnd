import React, { useState, useContext, useRef, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, 
  Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location'; 
import * as ImagePicker from 'expo-image-picker';

import { suggestLocation, getLocations } from '../api/locationsApi';
import { AuthContext } from '../context/AuthContext';

// 👇 DATOS DE CLOUDINARY
const CLOUD_NAME = "dq4j7zh2a"; 
const UPLOAD_PRESET = "castleapp_upload"; 

const SELECTABLE_CATEGORIES = [
  'Castles', 'Museums', 'Historic Site', 'Religious',  'Others'
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

  // 👇 EFECTO DE UBICACIÓN REAL (GPS)
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need your location to show places around you.');
        // Fallback si no hay permisos
        setRegion({ latitude: -34.6037, longitude: -58.3816, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        loadPlaces();
        return;
      }

      setHasLocationPermission(true);

      try {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (e) {
        console.warn("GPS Error", e);
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
        Alert.alert("Restricted", "Please log in.");
        return;
    }
    // Usamos el centro del mapa actual para crear el lugar
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
      console.log("Subiendo imagen a Cloudinary...");
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
      
      Alert.alert("Success!", `Place created!`);
      loadPlaces();
      setModalVisible(false);
      setFormData({ name: '', description: '', imageUri: null, category: 'Castles' });

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not create place.");
    } finally {
      setLoadingSubmit(false);
      setUploadingImage(false);
    }
  };

  if (!region) return <View style={styles.center}><ActivityIndicator size="large" color="#D4AF37" /></View>;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={setRegion} // Actualizamos región al mover el mapa
        showsUserLocation={hasLocationPermission}
      >
        {places.map((place, index) => (
            <Marker
                key={place.id || index}
                coordinate={{ latitude: Number(place.latitude), longitude: Number(place.longitude) }}
                title={place.name}
                description={place.category}
                pinColor="#D4AF37"
            />
        ))}
      </MapView>

      <View style={styles.crosshairContainer} pointerEvents="none">
        <MaterialCommunityIcons name="target" size={50} color="#D4AF37" />
      </View>

      <View style={styles.scanButtonContainer}>
        <TouchableOpacity style={styles.createButton} onPress={handleStartCreation}>
          <Ionicons name="add-circle" size={28} color="#000" />
          <Text style={styles.createText}>CREATE PLACE HERE</Text>
        </TouchableOpacity>
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalContent}>
                <Text style={styles.modalTitle}>New Discovery</Text>
                
                <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                    {formData.imageUri ? (
                        <Image source={{ uri: formData.imageUri }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="camera" size={40} color="#D4AF37" />
                            <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={styles.label}>Name</Text>
                <TextInput 
                    style={styles.input} placeholder="Ex: Ancient Castle" placeholderTextColor="#666"
                    value={formData.name} onChangeText={(t) => setFormData({...formData, name: t})}
                />

                <Text style={styles.label}>Description</Text>
                <TextInput 
                    style={[styles.input, styles.textArea]} placeholder="History details..." placeholderTextColor="#666"
                    multiline numberOfLines={3}
                    value={formData.description} onChangeText={(t) => setFormData({...formData, description: t})}
                />

                <Text style={styles.label}>Category</Text>
                <View style={{ height: 50, marginBottom: 20 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

                <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loadingSubmit}>
                        {loadingSubmit ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <ActivityIndicator color="#000" style={{ marginRight: 10 }} />
                                <Text style={styles.submitText}>
                                    {uploadingImage ? "UPLOADING..." : "SAVING..."}
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.submitText}>SUBMIT</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { flex: 1 },
  crosshairContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 10, paddingTop: 60 },
  scanButtonContainer: { position: 'absolute', bottom: 40, alignSelf: 'center' },
  createButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D4AF37', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, elevation: 10 },
  createText: { fontWeight: 'bold', fontSize: 18, marginLeft: 10, color: '#000' },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.8)' },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, borderWidth: 1, borderColor: '#D4AF37', maxHeight: '85%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#D4AF37', marginBottom: 15, textAlign: 'center' },
  imagePickerBtn: { height: 150, marginBottom: 15, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#333', borderStyle: 'dashed' },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  imagePlaceholderText: { color: '#D4AF37', marginTop: 5 },
  label: { color: '#D4AF37', marginBottom: 5, fontWeight: '600' },
  input: { backgroundColor: '#333', color: '#fff', borderRadius: 10, padding: 10, marginBottom: 15, fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  catOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#666', marginRight: 10, backgroundColor: '#2A2A2A', height: 40, justifyContent: 'center' },
  catOptionSelected: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  catOptionText: { color: '#bbb', fontSize: 13, fontWeight: '600' },
  catOptionTextSelected: { color: '#000', fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#333', padding: 15, borderRadius: 12, marginRight: 10, alignItems: 'center' },
  cancelText: { color: '#fff', fontWeight: 'bold' },
  submitBtn: { flex: 2, backgroundColor: '#D4AF37', padding: 15, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#000', fontWeight: 'bold', fontSize: 16 }
});

export default SearchScreen;