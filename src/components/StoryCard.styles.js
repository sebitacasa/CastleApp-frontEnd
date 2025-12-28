import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  cardContainer: {
    width: width * 0.9, 
    alignSelf: 'center',
    marginBottom: 24,
    borderRadius: 20,
    
    // --- ESTILO TARJETA LIMPIA ---
    backgroundColor: '#FFFFFF', // Fondo BLANCO sólido
    
    // Sombras más suaves y difusas (estilo iOS moderno / Material Design)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08, // Mucho más sutil
    shadowRadius: 12,
    elevation: 6, // Sombra en Android
    
    overflow: 'hidden', // Para que la imagen no se salga de los bordes redondeados
  },
  
  imageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
    backgroundColor: '#E0E0E0', // Gris claro mientras carga
  },
  
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  // --- BADGE ---
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Badge blanco
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  
  badgeText: {
    color: '#B03040', // Texto color vino/bordó para mantener tu identidad
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // --- CONTENEDOR DE DATOS ---
  infoContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  
  // --- TEXTOS (Ahora oscuros para contrastar con fondo blanco) ---
  title: {
    color: '#1A1A1A', // Casi negro
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  
  location: {
    color: '#666666', // Gris medio
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  
  description: {
    color: '#444444', // Gris oscuro
    fontSize: 14,
    lineHeight: 22, // Mayor espaciado para mejor lectura
    fontWeight: '400',
  },
});