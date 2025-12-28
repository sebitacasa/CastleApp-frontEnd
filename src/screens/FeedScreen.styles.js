import { StyleSheet, Platform, StatusBar } from 'react-native';

// 1. Definimos la altura fija para usarla en la animación
export const HEADER_HEIGHT = 265; 

export default StyleSheet.create({
  mainContainer: { 
    flex: 1, 
    backgroundColor: '#F4F6F8', 
  },

  // 2. EL HEADER AHORA ES ABSOLUTO (Flota sobre la lista)
  animatedHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100, // Para que esté por encima de la lista
    elevation: 4, // Sombra en Android
    backgroundColor: '#F4F6F8', // Evita que se vea el fondo al deslizar
  },

  headerBackground: {
    width: '100%',
    height: HEADER_HEIGHT, 
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden', 
    // marginBottom ya no es necesario aquí porque usamos padding en la lista
  },
  
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)', 
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 35 : 60,
    justifyContent: 'flex-end', 
    paddingBottom: 10,
  },

  navTopRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    marginBottom: 15, 
    alignItems: 'center',
  },
  
  logoRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  
  navTitle: { 
    color: 'white', 
    fontSize: 26, 
    fontWeight: '800', 
    marginLeft: 8,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.5)', 
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  catBtn: { 
    paddingHorizontal: 20, 
    paddingVertical: 8, 
    borderRadius: 25, 
    backgroundColor: 'rgba(255,255,255,0.25)', 
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)'
  },
  catBtnActive: { 
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }] 
  },
  catText: { 
    color: 'white', 
    fontWeight: '600',
    fontSize: 13,
  },
  catTextActive: { 
    color: '#203040', 
    fontWeight: 'bold'
  },
  
  centerLoading: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: HEADER_HEIGHT // Ajuste para que el loading no quede tapado
  }
});