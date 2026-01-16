import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from './Footer.styles';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <View style={styles.container}>
      {/* Icono decorativo con un azul más claro para resaltar */}
      <MaterialCommunityIcons name="bank" size={32} color="#4DA8DA" style={{ marginBottom: 10 }} />
      
      <Text style={styles.title}>CastleApp</Text>
      <Text style={styles.subtitle}>Discovering the past, one place at a time.</Text>
      
      <View style={styles.divider} />
      
      <Text style={styles.copyright}>© {currentYear} CastleApp. All rights reserved.</Text>
    </View>
  );
}