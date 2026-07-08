import React, { useContext, useState, useEffect, useRef } from 'react';
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
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios'; 
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import Footer from '../components/Footer';

// 👇 IMPORTAMOS TU PALETA GLOBAL
import { APP_PALETTE as THEME } from '../theme/colors';

// 🏰 IMAGEN NUEVA: Un castillo épico/oscuro
const UPLOAD_BG = 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?q=80&w=800&auto=format&fit=crop';

const API = 'https://castleapp-backend-production.up.railway.app';

const ProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { userInfo, logout, userToken } = useContext(AuthContext);
  const [conquestRank, setConquestRank] = useState(null);

  // Username state
  const [username, setUsername] = useState(null);
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null); // null | true | false
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const checkTimer = useRef(null);

  const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

  useEffect(() => {
    if (!userToken) return;
    axios.get(`${API}/api/conquests/rank`, { headers: { Authorization: `Bearer ${userToken}` } })
      .then(r => setConquestRank(r.data))
      .catch(() => {});
    axios.get(`${API}/api/username`, { headers: { Authorization: `Bearer ${userToken}` } })
      .then(r => setUsername(r.data.username || null))
      .catch(() => {});
  }, [userToken]);

  // Debounced username availability check
  useEffect(() => {
    clearTimeout(checkTimer.current);
    if (!usernameModalVisible) return;
    const val = usernameInput.trim();
    if (!val || val === username) { setUsernameAvailable(null); return; }
    if (!USERNAME_REGEX.test(val)) { setUsernameAvailable(false); return; }
    setUsernameChecking(true);
    checkTimer.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(
          `${API}/api/username/check?username=${encodeURIComponent(val)}`,
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        setUsernameAvailable(data.available);
      } catch { setUsernameAvailable(null); }
      finally { setUsernameChecking(false); }
    }, 450);
    return () => clearTimeout(checkTimer.current);
  }, [usernameInput, usernameModalVisible]);

  const openUsernameModal = () => {
    setUsernameInput(username || '');
    setUsernameAvailable(null);
    setUsernameModalVisible(true);
  };

  const saveUsername = async () => {
    const val = usernameInput.trim();
    if (!USERNAME_REGEX.test(val)) return;
    setUsernameSaving(true);
    try {
      const { data } = await axios.put(
        `${API}/api/username`,
        { username: val },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      setUsername(data.username);
      setUsernameModalVisible(false);
    } catch (e) {
      const msg = e.response?.data?.error === 'taken' ? 'Username already taken.' : 'Could not save username.';
      Alert.alert('Error', msg);
    } finally { setUsernameSaving(false); }
  };

  const userPhoto = 
    userInfo?.picture || 
    userInfo?.photoURL || 
    userInfo?.avatar_url || 
    userInfo?.user_metadata?.avatar_url || 
    userInfo?.user?.user_metadata?.avatar_url ||
    userInfo?.user?.photoURL ||
    'https://via.placeholder.com/150';

  const userName = 
    userInfo?.name || 
    userInfo?.displayName || 
    userInfo?.full_name || 
    userInfo?.user_metadata?.full_name ||
    'Explorer';

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.deleteTitle'),
      t('profile.deleteMessage'),
      [
        { text: t('profile.cancel'), style: "cancel" },
        {
          text: t('profile.deleteConfirm'),
          style: "destructive",
          onPress: async () => {
            try {
              const userId = userInfo?.id || userInfo?.user?.id;
              if (!userId) {
                Alert.alert("Error", t('profile.deleteIdError'));
                return;
              }
              await axios.delete(`https://castleapp-backend-production.up.railway.app/auth/${userId}`);
              logout();
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert("Error", t('profile.deleteError'));
            }
          }
        }
      ]
    );
  };

  // --- VISTA DE MODO INVITADO ---
  if (!userInfo) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
         <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
         <MaterialCommunityIcons name="account-lock" size={80} color={THEME.gold} />
         <Text style={styles.guestTitle}>{t('profile.guestTitle')}</Text>
         <Text style={styles.guestSub}>{t('profile.guestSub')}</Text>
         <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('LoginScreen')}>
            <Text style={styles.loginButtonText}>{t('profile.loginButton')}</Text>
         </TouchableOpacity>
      </View>
    );
  }

  // --- VISTA DE USUARIO LOGUEADO ---
  return (
    <View style={styles.container}>
      {/* 💡 dark-content para el fondo pergamino */}
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      
      {/* --- HEADER --- */}
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
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

            {/* Username row */}
            <TouchableOpacity style={styles.usernameRow} onPress={openUsernameModal}>
              <Text style={styles.usernameText}>
                {username ? `@${username}` : t('profile.setUsername')}
              </Text>
              <Ionicons name="pencil-outline" size={13} color={THEME.gold} style={{ marginLeft: 5 }} />
            </TouchableOpacity>

            <Text style={styles.locationText}>
                <MaterialCommunityIcons name="compass-outline" size={14} color={THEME.gold} /> {t('profile.historySeeker')}
            </Text>
        </View>

        {/* --- 2. RANK CARD --- */}
        {conquestRank && (
          <TouchableOpacity
            style={styles.rankCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Conquests')}
          >
            <Text style={styles.rankEmoji}>{conquestRank.rank?.emoji || '🌾'}</Text>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.rankTitle}>{conquestRank.rank?.title || 'Peasant'}</Text>
              <Text style={styles.rankSub}>
                {conquestRank.total} {conquestRank.total === 1 ? 'conquest' : 'conquests'}
                {conquestRank.rank?.next ? ` · ${conquestRank.rank.nextCount - conquestRank.total} to ${conquestRank.rank.next}` : ' · Max rank! 👑'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={THEME.subText} />
          </TouchableOpacity>
        )}

        {/* --- 3. TARJETA HERO "SUBIR LUGAR" (CONTRIBUTE) --- */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t('profile.contributeLegacy')}</Text>
            
            <TouchableOpacity 
                activeOpacity={0.8} 
                style={styles.uploadCard}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Discover' })}
            >
                <ImageBackground 
                    source={{ uri: UPLOAD_BG }} 
                    style={styles.uploadBackground} 
                    imageStyle={{ borderRadius: 16, opacity: 0.8 }} // Un poco más visible la foto
                >
                    {/* 💡 Overlay con tinte pergamino en lugar de negro puro */}
                    <View style={styles.uploadOverlay}>
                        <View style={styles.uploadIconCircle}>
                            <MaterialCommunityIcons name="feather" size={28} color={THEME.bg} />
                        </View>
                        
                        <Text style={styles.uploadTitle}>{t('profile.chronicleThePast')}</Text>
                        <Text style={styles.uploadSubtitle}>{t('profile.chronicleSub')}</Text>
                    </View>
                </ImageBackground>
            </TouchableOpacity>
        </View>

        {/* --- 3. MENÚ DE OPCIONES --- */}
        <View style={styles.menuContainer}>
            <MenuOption
                icon="people-outline"
                label={t('profile.friends')}
                color={THEME.text}
                onPress={() => navigation.navigate('Friends')}
            />
            <MenuOption
                icon="map-outline"
                label={t('profile.myDiscoveries')}
                color={THEME.text}
                onPress={() => navigation.navigate('MyDiscoveries')}
            />
            <MenuOption
                icon="shield-outline"
                label={t('profile.myConquests')}
                color={THEME.text}
                onPress={() => navigation.navigate('Conquests')}
            />
            <MenuOption 
                icon="heart-outline" 
                label={t('profile.myFavorites')}
                color={THEME.text}
                onPress={() => navigation.navigate('Favorites')} 
            />
            <MenuOption 
                icon="notifications-outline" 
                label={t('profile.notifications')}
                color={THEME.text}
                onPress={() => {}} 
            />
            
            <MenuOption
                icon="log-out-outline"
                label={t('profile.logOut')}
                color={THEME.text}
                onPress={logout}
            />

            <MenuOption 
                icon="trash-bin-outline" 
                label={t('profile.deleteAccount')}
                color={THEME.danger}
                onPress={handleDeleteAccount} 
                noBorder
            />
        </View>

        <Footer />
      </ScrollView>

      {/* Username edit modal */}
      <Modal
        visible={usernameModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUsernameModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('profile.editUsername')}</Text>
            <Text style={styles.modalSub}>{t('profile.usernameSub')}</Text>

            <View style={styles.inputRow}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={styles.usernameModalInput}
                value={usernameInput}
                onChangeText={v => { setUsernameInput(v); setUsernameAvailable(null); }}
                placeholder="your_username"
                placeholderTextColor={THEME.subText}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
              <View style={{ width: 22, alignItems: 'center' }}>
                {usernameChecking ? (
                  <ActivityIndicator size="small" color={THEME.gold} />
                ) : usernameAvailable === true ? (
                  <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                ) : usernameAvailable === false ? (
                  <Ionicons name="close-circle" size={20} color="#C0392B" />
                ) : null}
              </View>
            </View>

            {/* Hint */}
            {usernameInput.trim().length > 0 && !USERNAME_REGEX.test(usernameInput.trim()) && (
              <Text style={styles.hintError}>{t('profile.usernameHint')}</Text>
            )}
            {usernameAvailable === true && (
              <Text style={styles.hintOk}>{t('profile.usernameAvailable')}</Text>
            )}
            {usernameAvailable === false && USERNAME_REGEX.test(usernameInput.trim()) && (
              <Text style={styles.hintError}>{t('profile.usernameTaken')}</Text>
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setUsernameModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>{t('profile.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveUsername}
                disabled={!usernameAvailable || usernameSaving || usernameInput.trim() === username}
                style={[styles.modalSaveBtn, (!usernameAvailable || usernameInput.trim() === username) && { opacity: 0.4 }]}
              >
                {usernameSaving
                  ? <ActivityIndicator size="small" color={THEME.bg} />
                  : <Text style={styles.modalSaveText}>{t('profile.save')}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// Componente helper para no repetir tanto código
const MenuOption = ({ icon, label, onPress, color, noBorder }) => (
    <TouchableOpacity style={[styles.menuItem, !noBorder && styles.menuBorder]} onPress={onPress}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={icon} size={22} color={color} style={{ marginRight: 15 }} />
            <Text style={[styles.menuText, { color: color }]}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={THEME.subText} />
    </TouchableOpacity>
);

// --- 🎨 ESTILOS "PERGAMINO" INTEGRADOS ---
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
      borderWidth: 2, borderColor: THEME.bg // Borde del color de fondo
  },
  nameText: {
      fontSize: 26, fontWeight: 'bold', color: THEME.text, marginBottom: 5,
      fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
  },
  locationText: { color: THEME.subText, fontSize: 14, flexDirection: 'row', alignItems: 'center' },

  sectionContainer: { paddingHorizontal: 20, marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.text, marginBottom: 15 },
  
  uploadCard: { 
      height: 160, 
      borderRadius: 16, 
      overflow: 'hidden',
      borderWidth: 1, 
      borderColor: THEME.border, // Borde tenue tipo pergamino
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
  },
  uploadBackground: { width: '100%', height: '100%', justifyContent: 'center' },
  uploadOverlay: {
      flex: 1, 
      // 💡 Fondo claro y algo transparente para que la imagen se vea "lavada/vieja"
      backgroundColor: 'rgba(244, 241, 234, 0.7)', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: 20
  },
  uploadIconCircle: {
      width: 50, height: 50, borderRadius: 25, backgroundColor: THEME.gold,
      justifyContent: 'center', alignItems: 'center', marginBottom: 10
  },
  uploadTitle: { 
      fontSize: 20, fontWeight: 'bold', color: THEME.text, 
      fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif', letterSpacing: 0.5 
  },
  uploadSubtitle: { 
      fontSize: 13, color: THEME.text, textAlign: 'center', 
      marginTop: 5, maxWidth: '90%', lineHeight: 18 
  },

  menuContainer: { 
      backgroundColor: THEME.card, 
      marginHorizontal: 20, 
      borderRadius: 16, 
      padding: 10,
      borderWidth: 1,
      borderColor: THEME.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
  },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: THEME.border }, // Borde separador
  menuText: { fontSize: 16, fontWeight: '500' },

  usernameRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginTop: 2,
  },
  usernameText: {
    fontSize: 13, color: THEME.gold, fontWeight: '600',
  },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: THEME.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28, paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    borderTopWidth: 1, borderColor: THEME.border,
  },
  modalTitle: {
    fontSize: 18, fontWeight: 'bold', color: THEME.text, marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
  },
  modalSub: { fontSize: 12, color: THEME.subText, marginBottom: 20 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: THEME.card, borderRadius: 12,
    borderWidth: 1, borderColor: THEME.border,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
  },
  atSign: { fontSize: 18, color: THEME.gold, fontWeight: 'bold', marginRight: 4 },
  usernameModalInput: { flex: 1, color: THEME.text, fontSize: 16 },
  hintOk: { fontSize: 12, color: '#2E7D32', marginBottom: 12 },
  hintError: { fontSize: 12, color: '#C0392B', marginBottom: 12 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 12 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  modalCancelText: { color: THEME.subText, fontWeight: '600', fontSize: 15 },
  modalSaveBtn: {
    backgroundColor: THEME.gold, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20,
  },
  modalSaveText: { color: THEME.bg, fontWeight: 'bold', fontSize: 15 },

  rankCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: THEME.card, marginHorizontal: 20, marginBottom: 20,
    borderRadius: 16, borderWidth: 1, borderColor: THEME.border,
    padding: 16,
  },
  rankEmoji: { fontSize: 36 },
  rankTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.text, fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif' },
  rankSub: { fontSize: 12, color: THEME.subText, marginTop: 2 },

  guestTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.text, marginTop: 20 },
  guestSub: { color: THEME.subText, marginTop: 10, textAlign: 'center', maxWidth: '70%', marginBottom: 30 },
  loginButton: { backgroundColor: THEME.gold, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  loginButtonText: { color: THEME.bg, fontWeight: 'bold' }
});

export default ProfileScreen;