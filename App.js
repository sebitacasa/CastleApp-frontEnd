import 'react-native-gesture-handler';
import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// 1. Importar Contexto
import { AuthProvider, AuthContext } from './src/context/AuthContext';

// 2. Importar Pantallas de la App
import FeedScreen from './src/screens/FeedScreen';
import DetailScreen from './src/screens/DetailScreen'; 
import MapScreen from './src/screens/MapScreen';

// 3. Importar Pantallas de Login (Nuevas)
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

const Stack = createStackNavigator();

// --- SUB-COMPONENTE: El que decide qué mostrar ---
const AppNavigation = () => {
  // Ahora sí podemos usar el contexto porque estamos "dentro" del AuthProvider
  const { isLoading, userToken } = useContext(AuthContext);

  // Pantalla de carga mientras buscamos el token en el celular
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#203040" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken == null ? (
        // 🔒 MODO PÚBLICO (Login y Registro)
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        // 🔓 MODO PRIVADO (Tu App normal)
        <>
          <Stack.Screen name="Feed" component={FeedScreen} />
          {/* Nota: Asegúrate de que en FeedScreen navegas a 'Detail', no 'StoryDetailScreen' */}
          <Stack.Screen name="Detail" component={DetailScreen} />
          <Stack.Screen name="MapScreen" component={MapScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigation />
      </NavigationContainer>
    </AuthProvider>
  );
}