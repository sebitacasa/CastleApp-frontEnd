import { StyleSheet, Dimensions } from 'react-native';

// Exportamos estas constantes para usarlas en el componente si hace falta
export const { width } = Dimensions.get('window');
export const HERO_HEIGHT = 220;

export default StyleSheet.create({
  container: {
    height: HERO_HEIGHT,
    marginBottom: 10,
    backgroundColor: '#000', // Fondo negro preventivo
  },
  slideContainer: {
    width: width,
    height: HERO_HEIGHT,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // --- MAGIA DEL SOMBREADO ---
  darkOverlay: {
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // Oscurece la imagen un 45%
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    // Sombra de texto para legibilidad máxima
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    marginBottom: 5,
    letterSpacing: 1,
  },
  subtitle: {
    color: '#eee',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  // --- PAGINACIÓN (Puntitos) ---
  pagination: {
    position: 'absolute',
    bottom: 15,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 20,
    backgroundColor: '#fff',
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});