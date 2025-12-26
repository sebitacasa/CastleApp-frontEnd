import 'react-native-gesture-handler'; // <--- AGREGA ESTO EN LA LÍNEA 1
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importa tus pantallas
import FeedScreen from './src/screens/FeedScreen';
import DetailScreen from './src/screens/DetailScreen'; // <--- IMPORTANTE
import MapScreen from './src/screens/MapScreen'; // (Próximamente)

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Feed" screenOptions={{ headerShown: false }}>
        
        {/* Pantalla Principal */}
        <Stack.Screen name="Feed" component={FeedScreen} />
        
        {/* Pantalla de Detalle (NUEVA) */}
        <Stack.Screen name="Detail" component={DetailScreen} />
        
   
         <Stack.Screen name="MapScreen" component={MapScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}