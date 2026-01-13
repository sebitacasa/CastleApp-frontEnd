import React, { useContext, useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Image, Platform, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { makeRedirectUri } from 'expo-auth-session';

import { AuthContext } from '../context/AuthContext';

// Necesario para que el navegador de autenticación funcione correctamente en Expo Go
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, loginWithGoogle, isLoading } = useContext(AuthContext);

  // 1. Calculamos la URI de redirección
  // Esto genera la dirección exacta tipo: https://auth.expo.io/@tu-usuario/tu-slug
//   const redirectUri = AuthSession.makeRedirectUri({
//     path: 'auth.expo.io'
//   });

  // 2. LOG DE DEPURACIÓN (Se ejecuta al abrir la pantalla)
  useEffect(() => {
    console.log("============================================");
    console.log("⚠️ URI PARA GOOGLE CLOUD CONSOLE:");
    console.log(redirectUri);
    console.log("============================================");

    // Descomenta la siguiente línea si quieres ver la alerta en el celular:
    // Alert.alert("Copia esta URL en Google Console", redirectUri);
  }, []);

  //const redirectUri = "https://auth.expo.io/@sebit/castleapp";

// const redirectUri = makeRedirectUri({
//     useProxy: true,
//   });

  const redirectUri = "https://auth.expo.io/@sebit/castleapp-dev";
  // --- CONFIGURACIÓN DE GOOGLE ---
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: redirectUri, // Usamos la URI generada explícitamente
  });

  // Escuchar la respuesta de Google
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      loginWithGoogle(authentication.accessToken);
    } else if (response?.type === 'error') {
      console.error("Error en respuesta de Google:", response.error);
      Alert.alert("Error de Login", "No se pudo conectar con Google. Verifica la consola.");
    }
  }, [response]);
  // --------------------------------

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>CastleApp 🏰</Text>
        {/* 👇 AGREGA ESTO TEMPORALMENTE 👇 */}
        <Text style={{color: 'red', textAlign: 'center', margin: 10, fontSize: 12}}>
           URI ACTUAL: {redirectUri}
        </Text>
        {/* 👆 -------------------------- 👆 */}
        <Text style={styles.subtitle}>Bienvenido de nuevo</Text>

        {/* INPUTS NORMALES */}
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => login(email, password)}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        {/* --- SEPARADOR --- */}
        <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>o continúa con</Text>
            <View style={styles.separatorLine} />
        </View>

        {/* --- BOTÓN DE GOOGLE --- */}
        <TouchableOpacity 
          style={styles.googleButton} 
          disabled={!request}
          onPress={() => promptAsync()}
        >
          <MaterialCommunityIcons name="google" size={20} color="#DB4437" style={{ marginRight: 10 }} />
          <Text style={styles.googleButtonText}>Google</Text>
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Regístrate aquí</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#f0f2f5', padding: 20 },
  content: { backgroundColor: 'white', padding: 30, borderRadius: 20, elevation: 5 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#203040', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  
  input: { 
    backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', 
    borderRadius: 10, padding: 15, marginBottom: 15, fontSize: 16 
  },
  
  button: { 
    backgroundColor: '#203040', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 5 
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },
  separatorText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 14,
  },

  googleButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  googleButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 15 },
  footerText: { color: '#666' },
  link: { color: '#203040', fontWeight: 'bold' }
});

export default LoginScreen;