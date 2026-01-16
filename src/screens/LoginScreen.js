import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { AuthContext } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { loginWithGoogle, isLoading } = useContext(AuthContext);
  const [isGoogleLoading, setGoogleLoading] = useState(false);

  // 1. Configuración Inicial (Solo se ejecuta una vez)
  useEffect(() => {
    GoogleSignin.configure({
      // ¡Aquí usamos tu ID Web! Google lo usa para validar el token internamente.
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, 
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  // 2. La Función de Login
// En LoginScreen.js (Reemplaza la función signIn completa)

  const signIn = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      console.log("📦 TIPO DE RESPUESTA:", typeof response);
      
      // 1. APLICAR INTELIGENCIA DE FORMATO
      // A veces la respuesta llega anidada en 'data'
      let userInfo = response.data || response;
      
      // Si por alguna razón extraña llega como texto, lo convertimos
      if (typeof userInfo === 'string') {
          try { userInfo = JSON.parse(userInfo); } catch(e) {}
      }

      console.log("🔍 Buscando token en:", Object.keys(userInfo));

      // 2. ESTRATEGIA DE RESCATE MULTI-NIVEL 
      // Buscamos el token en todas las ubicaciones posibles
      const token = userInfo.idToken || userInfo.user?.idToken || userInfo.serverAuthCode;
      const user = userInfo.user || userInfo;

      if (token) {
        console.log("✅ ¡TOKEN ENCONTRADO! Longitud:", token.length);
        // ¡Aquí está la magia!
        loginWithGoogle(token, user);
      } else {
        console.log("⚠️ El objeto no tenía token visible:", userInfo);
        Alert.alert("Error", "Google conectó pero no entregó el pase (Token).");
      }
      
    } catch (error) {
      console.log("❌ Error:", error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // Nada, el usuario cerró
      } else {
        Alert.alert("Error Login", error.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Nativo Real 🛡️</Text>
      
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
            <Text style={styles.text}>  Entrar con Google</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, marginBottom: 30, fontWeight: 'bold' },
  googleButton: { 
    flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
    paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', elevation: 2
  },
  text: { color: '#555', fontWeight: 'bold', fontSize: 16 }
});

export default LoginScreen;