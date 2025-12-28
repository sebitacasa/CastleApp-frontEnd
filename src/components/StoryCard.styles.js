import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  cardContainer: {
    width: width * 0.9, 
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 16,
    
    // --- EFECTO VIDRIO (FONDO TRANSPARENTE) ---
    // Este color de fondo se verá detrás del texto.
    // Usamos un azul muy oscuro pero con alta transparencia (0.6)
    backgroundColor: 'rgba(30, 42, 61, 0.5)', 
    
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Borde fino brillante
    
    // Sombra para separar la tarjeta del fondo global
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
    
    overflow: 'hidden', 
  },
  
  imageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
    // El fondo de la imagen es negro por si tarda en cargar
    backgroundColor: '#6f6f6fff',
  },
  
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    // La imagen es opaca, tapará el efecto vidrio en la parte superior (como querías)
  },
  
  // --- CAMBIO: CARTELITO BORDÓ OSCURO ---
  badge: {
    
    position: 'absolute',
    top: 10,
    right: 10,
    // Color Bordó / Vino Tinto con un poco de transparencia
    //backgroundColor: 'rgba(100, 0, 30, 0.9)', 
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 100, 0.3)', // Borde rojizo sutil
    shadowColor: 'rgba(176, 110, 130, 0.9)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  
  badgeText: {
    color: 'rgba(248, 248, 248, 0.9)', // Blanco marfil
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // --- CONTENEDOR DE DATOS (TRANSPARENTE) ---
  infoContainer: {
    padding: 15,
    // Al no tener backgroundColor, deja ver el del 'cardContainer' (el vidrio)
  },
  
  title: {
    color: 'rgba(237, 237, 237, 0.91)', 
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 3,
  },
  
  location: {
    color: 'rgba(196, 196, 196, 0.9)', // Gris claro brillante
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 2,
  },
  
  description: {
    color: '#a8a6a6ff', // Blanco suave
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.95,
    fontWeight: '400',
  },
});