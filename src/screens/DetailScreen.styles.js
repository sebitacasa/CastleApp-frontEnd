import { StyleSheet, Dimensions, Platform } from 'react-native';

// Exportamos las dimensiones para usarlas también en la lógica (cálculo de scroll)
export const { width, height } = Dimensions.get('window');
export const IMG_HEIGHT = 350;

export default StyleSheet.create({
  container: { 
    flex: 1, 
    // Fondo principal oscuro (Igual que FeedScreen)
    backgroundColor: '#203040' 
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
    // Oscurecer un poco la imagen para que los botones blancos resalten
    backgroundColor: 'rgba(0,0,0,0.2)' 
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
    backgroundColor: 'rgba(255,255,255,0.4)', 
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
    top: Platform.OS === 'ios' ? 50 : 40, // Ajuste para StatusBar
    left: 20, 
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: 'rgba(0,0,0,0.6)', // Fondo más oscuro
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' // Borde sutil
  },
  favButton: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 20, 
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },

  // --- CONTENEDOR DE INFORMACIÓN (CURVO Y OSCURO) ---
  contentContainer: { 
    flex: 1, 
    backgroundColor: '#203040', // Mismo fondo oscuro para continuidad
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    marginTop: -30, // Superposición sobre la imagen
    paddingHorizontal: 25, 
    paddingTop: 30,
    paddingBottom: 40,
    // Sombra sutil para separarlo de la imagen
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // --- TEXTOS E INFORMACIÓN ---
  categoryBadge: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)', // Fondo rojo transparente
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)'
  },
  categoryText: { 
    color: '#e74c3c', 
    fontWeight: '800', 
    fontSize: 12, 
    letterSpacing: 1 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#ecf0f1', // Blanco claro
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
    color: '#bdc3c7', // Gris claro
    fontWeight: '500' 
  },

  divider: { 
    height: 1, 
    backgroundColor: 'rgba(255,255,255,0.1)', // Divisor sutil claro
    marginVertical: 25 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 15, 
    color: '#ecf0f1' // Blanco claro
  },
  description: { 
    fontSize: 16, 
    lineHeight: 26, 
    color: '#bdc3c7', // Gris claro para lectura cómoda
    textAlign: 'left' 
  },

  // --- MAPA PEQUEÑO ---
  miniMapContainer: { 
    height: 200, 
    borderRadius: 16, 
    overflow: 'hidden', 
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)' // Borde sutil
  },
  miniMap: { width: '100%', height: '100%' },
  
  directionsButton: { 
    position: 'absolute', 
    bottom: 15, right: 15, 
    backgroundColor: '#3498db', // Azul brillante para acción
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: 10, paddingHorizontal: 18, 
    borderRadius: 25, 
    elevation: 5, shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3 
  },
  directionsText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // --- ESTILOS DE PANTALLA COMPLETA (MODAL) ---
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000', // Fondo negro puro para el visor
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 20,
    zIndex: 999, // Asegurar que esté sobre todo
    backgroundColor: 'rgba(0,0,0,0.5)', // Fondo circular semi-transparente
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  }
});