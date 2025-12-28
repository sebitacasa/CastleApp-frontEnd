import { StyleSheet, Dimensions, Platform } from 'react-native';

// Exportamos las dimensiones para usarlas también en la lógica (cálculo de scroll)
export const { width, height } = Dimensions.get('window');
export const IMG_HEIGHT = 350;

export default StyleSheet.create({
  container: { 
    flex: 1, 
    // --- CAMBIO: Fondo Blanco para coincidir con la app ---
    backgroundColor: '#FFFFFF' 
  },
  
  // --- CARRUSEL SUPERIOR ---
  carouselContainer: { 
    height: IMG_HEIGHT, 
    width: width, 
    position: 'relative' 
  },
  carouselImage: { 
    width: width, 
    height: IMG_HEIGHT 
  },
  imageOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.1)' // Overlay más suave
  },
  
  // --- PAGINACIÓN ---
  pagination: { 
    position: 'absolute', 
    bottom: 40, 
    width: '100%', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    zIndex: 20 
  },
  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: 'rgba(255,255,255,0.5)', 
    marginHorizontal: 4 
  },
  activeDot: { 
    backgroundColor: '#fff', 
    width: 10, 
    height: 10, 
    borderRadius: 5 
  },

  // --- BOTONES FLOTANTES SUPERIORES ---
  backButton: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 50 : 40, 
    left: 20, 
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.9)', // Fondo blanco casi opaco
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
    shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, elevation: 4
  },
  favButton: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 20, 
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
    shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, elevation: 4
  },
  // IMPORTANTE: En DetailScreen.js tendrás que cambiar el color del icono de flecha atrás a NEGRO
  // <Ionicons name="arrow-back" size={24} color="#000" />

  // --- CONTENEDOR DE INFORMACIÓN (BLANCO) ---
  contentContainer: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', // Fondo BLANCO
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    marginTop: -30, 
    paddingHorizontal: 25, 
    paddingTop: 30,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },

  // --- TEXTOS E INFORMACIÓN (MODO CLARO) ---
  categoryBadge: {
    backgroundColor: 'rgba(176, 48, 64, 0.1)', // Rojo suave transparente
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(176, 48, 64, 0.2)'
  },
  categoryText: { 
    color: '#B03040', // Tu color bordó/vino tinto
    fontWeight: '800', 
    fontSize: 12, 
    letterSpacing: 1 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#1A1A1A', // Casi negro
    marginBottom: 10, 
    lineHeight: 34 
  },
  locationRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 5 
  },
  locationText: { 
    fontSize: 15, 
    color: '#666666', // Gris medio
    fontWeight: '600' 
  },

  divider: { 
    height: 1, 
    backgroundColor: '#EEEEEE', // Divisor gris muy claro
    marginVertical: 25 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    marginBottom: 15, 
    color: '#203040' // Azul oscuro (tu tema)
  },
  description: { 
    fontSize: 16, 
    lineHeight: 26, 
    color: '#444444', // Gris oscuro para lectura
    textAlign: 'left' 
  },
  
  // --- BOTÓN LEER MÁS (ESTILO) ---
  readMoreText: {
    color: '#203040', // Azul oscuro del tema
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 5,
    textDecorationLine: 'underline'
  },

  // --- MAPA PEQUEÑO ---
  miniMapContainer: { 
    height: 200, 
    borderRadius: 16, 
    overflow: 'hidden', 
    position: 'relative',
    backgroundColor: '#F0F0F0', // Fondo gris mientras carga
    borderWidth: 1,
    borderColor: '#E0E0E0' 
  },
  miniMap: { width: '100%', height: '100%' },
  
  directionsButton: { 
    position: 'absolute', 
    bottom: 15, right: 15, 
    backgroundColor: '#203040', // Azul oscuro temático
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: 10, paddingHorizontal: 18, 
    borderRadius: 25, 
    elevation: 5, shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3 
  },
  directionsText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // --- FOOTER TEMÁTICO (AZUL CIELO OSCURO) ---
  // Puedes usar esto envolviendo un View al final de tu ScrollView si quieres
  footerContainer: {
    marginTop: 30,
    backgroundColor: '#1a2533', // Azul muy oscuro (Cielo nocturno)
    padding: 30,
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 20
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic'
  },

  // --- ESTILOS DE PANTALLA COMPLETA (MODAL) ---
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 20,
    zIndex: 999, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  }
});