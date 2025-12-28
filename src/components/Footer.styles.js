import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#1a2533', // Azul marino oscuro
    
    // --- CAMBIOS PARA DISEÑO PLANO ---
    marginTop: 0,            // Eliminamos la separación con el contenido de arriba
    borderTopLeftRadius: 0,  // Eliminamos bordes redondos
    borderTopRightRadius: 0, // Eliminamos bordes redondos
    
    // Ajustes de espaciado sobrio
    paddingVertical: 30,     // Un poco menos alto para ser más sobrio
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // El resto se mantiene igual o con ajustes mínimos
  title: {
    color: '#FFFFFF',
    fontSize: 18, // Un poco más discreto
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    color: '#8b9bb4', // Gris azulado apagado
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 15,
    textAlign: 'center',
  },
  divider: {
    width: 40,      // Divisor más pequeño
    height: 1,      // Línea más fina
    backgroundColor: '#2c3e50', 
    marginBottom: 15,
  },
  copyright: {
    color: '#58677c', // Texto legal oscurecido para no distraer
    fontSize: 11,
  }
});