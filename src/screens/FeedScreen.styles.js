import { StyleSheet, Platform, StatusBar } from 'react-native';

// 1. Definimos la altura fija para usarla en la animación
export const HEADER_HEIGHT = 265; 

export default StyleSheet.create({
  // --- ESTILOS PRINCIPALES DEL FEED ---
  mainContainer: { 
    flex: 1, 
    backgroundColor: '#F4F6F8', 
  },

  // El Header ahora es absoluto (Flota sobre la lista)
  animatedHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100, // Para que esté por encima de la lista
    elevation: 4, // Sombra en Android
    backgroundColor: '#F4F6F8', 
  },

  headerBackground: {
    width: '100%',
    height: HEADER_HEIGHT, 
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden', 
  },
  
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)', 
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 35 : 60,
    justifyContent: 'flex-end', 
    paddingBottom: 10,
    zIndex: 200, 
  },

  navTopRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    marginBottom: 15, 
    alignItems: 'center',
    zIndex: 300, 
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
  
  // --- ESTILOS DE CATEGORÍAS ---
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
    marginTop: HEADER_HEIGHT 
  },

  // --- NUEVOS ESTILOS DEL MENÚ (CORREGIDOS) ---
  dropdownMenu: {
    position: 'absolute',
    // Ajuste de posición para que no tape el header
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 65 : 95, 
    right: 20,
    width: 230, // <--- MÁS ANCHO (Antes 200)
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 5, // Padding vertical general
    
    // Sombras potentes
    zIndex: 9999, 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  
  arrowUp: {
    position: 'absolute',
    top: -10,
    right: 14, // Alineado con el ícono del menú/avatar
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'white',
  },
  
  menuHeader: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1, // Separador visual
    borderBottomColor: '#eee',
  },
  
  menuUserLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  
  menuUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#203040',
  },
  
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 0, // Quitamos margen vertical para usar el padding del item
  },
  
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15, // <--- MÁS ALTO (Mejor tacto)
    paddingHorizontal: 15,
  },
  
  menuItemText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});