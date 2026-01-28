import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { AuthContext } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { loginWithGoogle } = useContext(AuthContext);
  const [isGoogleLoading, setGoogleLoading] = useState(false);

  // 1. Configuración Inicial
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, 
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  // 2. La Función de Login
  const signIn = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      // Inteligencia de formato
      let userInfo = response.data || response;
      if (typeof userInfo === 'string') {
          try { userInfo = JSON.parse(userInfo); } catch(e) {}
      }

      // Estrategia de rescate de token
      const token = userInfo.idToken || userInfo.user?.idToken || userInfo.serverAuthCode;
      const user = userInfo.user || userInfo;

      if (token) {
        console.log("✅ ¡LOGIN EXITOSO!");
        
        // A. Ejecutar login en el contexto (guardar token, estado global, etc.)
        // Usamos await para asegurarnos de que se guarde antes de navegar
        await loginWithGoogle(token, user);

        // B. NAVEGACIÓN INTELIGENTE 🧠 (La clave del Guest Mode)
        // En lugar de ir siempre al Home, preguntamos si hay una pantalla anterior.
        if (navigation.canGoBack()) {
            navigation.goBack(); // Vuelve al castillo o al Feed donde estabas
        } else {
            navigation.navigate('FeedScreen'); // Fallback por si acaso
        }

      } else {
        Alert.alert("Error", "Google conectó pero no entregó el pase (Token).");
      }
      
    } catch (error) {
      console.log("❌ Error:", error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // Usuario canceló
      } else {
        Alert.alert("Error Login", error.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Explorer 🏰</Text>
      
      <TouchableOpacity
        style={styles.googleButton}
        onPress={signIn}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <ActivityIndicator color="#555" />
        ) : (
          <>
            <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
            <Text style={styles.text}>  Sign in with Google</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={{ marginTop: 20 }} 
        onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('FeedScreen');
        }}
      >
        <Text style={{ color: '#888' }}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, marginBottom: 30, fontWeight: 'bold', color: '#333' },
  googleButton: { 
    flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
    paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', elevation: 2
  },
  text: { color: '#555', fontWeight: 'bold', fontSize: 16 }
});

export default LoginScreen;