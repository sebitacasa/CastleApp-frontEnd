import React, { useContext, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  ImageBackground, 
  StatusBar,
  Platform
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { AuthContext } from '../context/AuthContext';

// --- 🎨 USAMOS TU PALETA DE COLORES ---
const THEME = {
  bg: '#121212',
  card: '#1E1E1E',
  gold: '#D4AF37',
  text: '#F0F0F0',
  subText: '#A0A0A0',
  overlay: 'rgba(0,0,0,0.7)', // Más oscuro para legibilidad
};

const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1996&auto=format&fit=crop';

const LoginScreen = ({ navigation }) => {
  const { loginWithGoogle } = useContext(AuthContext);
  const [isGoogleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, 
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  const signIn = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      const googleUser = response.data?.user || response.user;
      const googleToken = response.data?.idToken || response.idToken;

      if (googleUser && googleToken) {
        const normalizedUser = {
          ...googleUser,
          picture: googleUser.photo,
          displayName: googleUser.name,
          given_name: googleUser.givenName
        };

        await loginWithGoogle(googleToken, normalizedUser);

        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('FeedScreen');
        }
      } else {
        Alert.alert("Error", "Google no entregó los datos del perfil.");
      }
      
    } catch (error) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert("Error Login", error.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={{ uri: BACKGROUND_IMAGE }} 
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" transparent backgroundColor="transparent" />
      
      {/* Overlay oscuro para resaltar el texto */}
      <View style={styles.overlay}>
        
        <View style={styles.header}>
          <MaterialCommunityIcons name="compass-outline" size={80} color={THEME.gold} />
          <Text style={styles.title}>CastleApp</Text>
          <Text style={styles.subtitle}>Unlock the secrets of history</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={signIn}
            disabled={isGoogleLoading}
            activeOpacity={0.8}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color={THEME.bg} />
            ) : (
              <>
                <MaterialCommunityIcons name="google" size={24} color={THEME.bg} />
                <Text style={styles.buttonText}>SIGN IN WITH GOOGLE</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.guestButton} 
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('FeedScreen')}
          >
            <Text style={styles.guestText}>Continue as Guest</Text>
            <Ionicons name="arrow-forward" size={14} color={THEME.subText} style={{marginLeft: 5}} />
          </TouchableOpacity>
        </View>

      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: THEME.overlay,
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  header: {
    alignItems: 'center',
    marginTop: 50,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: THEME.text,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.subText,
    fontStyle: 'italic',
    marginTop: 5,
    letterSpacing: 1,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  googleButton: { 
    flexDirection: 'row', 
    backgroundColor: THEME.gold, 
    width: '100%',
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: { 
    color: THEME.bg, 
    fontWeight: 'bold', 
    fontSize: 15, 
    marginLeft: 12,
    letterSpacing: 1,
  },
  guestButton: { 
    marginTop: 25, 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  guestText: { 
    color: THEME.subText, 
    fontSize: 14,
    textDecorationLine: 'underline',
  }
});

export default LoginScreen;