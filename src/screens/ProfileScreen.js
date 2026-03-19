import React, { useContext } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar, 
  ScrollView, 
  ImageBackground,
  Platform,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios'; 
import { AuthContext } from '../context/AuthContext';

// --- 🎨 PALETA DE COLORES CASTLEAPP ---
const THEME = {
  bg: '#121212',
  card: '#1E1E1E',
  gold: '#D4AF37',
  goldDim: 'rgba(212, 175, 55, 0.2)',
  text: '#F0F0F0',
  subText: '#A0A0A0',
  danger: '#CF6679',
};

// 🏰 IMAGEN NUEVA: Un castillo épico/oscuro
const UPLOAD_BG = 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?q=80&w=800&auto=format&fit=crop';

const ProfileScreen = ({ navigation }) => {
  const { userInfo, logout } = useContext(AuthContext);

  // --- 👇 LÓGICA DE FOTO MEJORADA ---
  const userPhoto = 
    userInfo?.picture || 
    userInfo?.photoURL || 
    userInfo?.avatar_url || 
    userInfo?.user_metadata?.avatar_url || 
    userInfo?.user?.user_metadata?.avatar_url ||
    userInfo?.user?.photoURL ||
    'https://via.placeholder.com/150';

  // --- LÓGICA DE NOMBRE ---
  const userName = 
    userInfo?.name || 
    userInfo?.displayName || 
    userInfo?.full_name || 
    userInfo?.user_metadata?.full_name ||
    'Explorer';

  // --- FUNCIÓN DE ELIMINAR CUENTA ---
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account", 
      "Are you sure? This action is permanent. You will lose all your favorites and contributions.", 
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "DELETE", 
          style: "destructive", 
          onPress: async () => {
            try {
              const userId = userInfo?.id || userInfo?.user?.id;
              
              if (!userId) {
                 Alert.alert("Error", "Could not identify user ID.");
                 return;
              }

              await axios.delete(`https://castleapp-backend-production.up.railway.app/auth/${userId}`);
              logout(); 
              
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert("Error", "Could not delete account. Please try again later.");
            }
          } 
        }
      ]
    );
  };

  if (!userInfo) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
         <MaterialCommunityIcons name="account-lock" size={80} color={THEME.gold} />
         <Text style={styles.guestTitle}>Guest Mode</Text>
         <Text style={styles.guestSub}>Sign in to track your conquests and build your profile.</Text>
         <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('LoginScreen')}>
            <Text style={styles.loginButtonText}>LOGIN / REGISTER</Text>
         </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
      
      {/* --- HEADER --- */}
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="settings-sharp" size={22} color={THEME.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* --- 1. INFO DE USUARIO --- */}
        <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
                <Image source={{ uri: userPhoto }} style={styles.avatar} />
                <View style={styles.rankBadge}>
                    <MaterialCommunityIcons name="crown" size={14} color={THEME.bg} />
                </View>
            </View>
            
            <Text style={styles.nameText}>{userName}</Text>
            <Text style={styles.locationText}>
                <MaterialCommunityIcons name="compass-outline" size={14} color={THEME.gold} /> History Seeker
            </Text>
        </View>

        {/* --- 2. TARJETA HERO "SUBIR LUGAR" (CONTRIBUTE) --- */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Contribute Legacy</Text>
            
            <TouchableOpacity 
                activeOpacity={0.8} // Un poco más sensible al tacto
                style={styles.uploadCard}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Discover' })}
            >
                <ImageBackground 
                    source={{ uri: UPLOAD_BG }} 
                    style={styles.uploadBackground} 
                    // 👇 CAMBIO 1: Imagen más visible (0.6 en vez de 0.3)
                    imageStyle={{ borderRadius: 16, opacity: 0.6 }} 
                >
                    <View style={styles.uploadOverlay}>
                        <View style={styles.uploadIconCircle}>
                            <MaterialCommunityIcons name="feather" size={28} color={THEME.bg} />
                        </View>
                        
                        <Text style={styles.uploadTitle}>Chronicle the Past</Text>
                        <Text style={styles.uploadSubtitle}>
                            Did you find an unmapped fortress or ruin? Tap here to scan and add it to the map.
                        </Text>
                    </View>
                </ImageBackground>
            </TouchableOpacity>
        </View>

        {/* --- 3. MENÚ DE OPCIONES --- */}
        <View style={styles.menuContainer}>
            <MenuOption 
                icon="map-outline" 
                label="My Discoveries" 
                color={THEME.text}
                onPress={() => {}} 
            />
            <MenuOption 
                icon="heart-outline" 
                label="Favorite Places" 
                color={THEME.text}
                onPress={() => navigation.navigate('Favorites')} 
            />
            <MenuOption 
                icon="notifications-outline" 
                label="Notifications" 
                color={THEME.text}
                onPress={() => {}} 
            />
            
            <MenuOption 
                icon="log-out-outline" 
                label="Log Out" 
                color={THEME.text}
                onPress={logout} 
            />

            <MenuOption 
                icon="trash-bin-outline" 
                label="Delete Account" 
                color={THEME.danger}
                onPress={handleDeleteAccount} 
                noBorder
            />
        </View>

      </ScrollView>
    </View>
  );
};

const MenuOption = ({ icon, label, onPress, color, noBorder }) => (
    <TouchableOpacity style={[styles.menuItem, !noBorder && styles.menuBorder]} onPress={onPress}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={icon} size={22} color={color} style={{ marginRight: 15 }} />
            <Text style={[styles.menuText, { color: color }]}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#444" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  
  headerNav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: Platform.OS === 'ios' ? 60 : 50,
      paddingHorizontal: 20,
      marginBottom: 20,
  },
  headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: THEME.text,
      fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
  },
  iconBtn: { padding: 5 },

  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: {
      width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: THEME.gold
  },
  rankBadge: {
      position: 'absolute', bottom: 0, right: 0, 
      backgroundColor: THEME.gold, borderRadius: 12, 
      width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: THEME.bg
  },
  nameText: {
      fontSize: 26, fontWeight: 'bold', color: THEME.text, marginBottom: 5,
      fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
  },
  locationText: { color: THEME.subText, fontSize: 14, flexDirection: 'row', alignItems: 'center' },

  sectionContainer: { paddingHorizontal: 20, marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.text, marginBottom: 15 },
  
  // 👇 CAMBIO 2: Estilos de la tarjeta actualizados con borde
  uploadCard: { 
      height: 160, 
      borderRadius: 16, 
      overflow: 'hidden',
      borderWidth: 1,          // Borde fino
      borderColor: THEME.gold  // Color dorado
  },
  uploadBackground: { width: '100%', height: '100%', justifyContent: 'center' },
  uploadOverlay: {
      flex: 1, 
      backgroundColor: 'rgba(0,0,0,0.35)', // Más claro (antes 0.6)
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: 20
  },
  uploadIconCircle: {
      width: 50, height: 50, borderRadius: 25, backgroundColor: THEME.gold,
      justifyContent: 'center', alignItems: 'center', marginBottom: 10
  },
  uploadTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif', letterSpacing: 0.5 },
  uploadSubtitle: { fontSize: 13, color: '#E0E0E0', textAlign: 'center', marginTop: 5, maxWidth: '90%', lineHeight: 18 },

  menuContainer: { backgroundColor: THEME.card, marginHorizontal: 20, borderRadius: 16, padding: 10 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#333' },
  menuText: { fontSize: 16, fontWeight: '500' },

  guestTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.text, marginTop: 20 },
  guestSub: { color: THEME.subText, marginTop: 10, textAlign: 'center', maxWidth: '70%', marginBottom: 30 },
  loginButton: { backgroundColor: THEME.gold, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  loginButtonText: { color: THEME.bg, fontWeight: 'bold' }
});

export default ProfileScreen;