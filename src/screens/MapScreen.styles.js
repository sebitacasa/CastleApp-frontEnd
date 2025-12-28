import { StyleSheet, Platform } from 'react-native';

// 🎨 DEFINICIÓN DEL TEMA (Exportamos también los colores por si se necesitan en la lógica)
export const THEME = {
    darkBg: '#1a2230',      // Fondo oscuro principal
    cardBg: '#242f40',      // Fondo de tarjeta
    accent: '#38761D',      // Verde principal
    textWhite: '#FFFFFF',   // Texto blanco
    textGray: '#B0B0B0',    // Texto gris secundario
};

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  
  centerContent: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  map: { 
    width: '100%', 
    height: '100%' 
  },
  
  backButton: {
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 50 : 40, 
    left: 20,
    backgroundColor: 'white', 
    padding: 10, 
    borderRadius: 25,
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2,
    zIndex: 10 
  },

  // --- LOADER FLOTANTE ---
  loaderContainer: {
    position: 'absolute', 
    top: 90, 
    alignSelf: 'center',
    backgroundColor: 'rgba(26, 34, 48, 0.95)', // Fondo oscuro semi-transparente
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 20,
    flexDirection: 'row', 
    alignItems: 'center', 
    elevation: 6, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.4,
    zIndex: 20
  },
  
  loaderText: { 
    marginLeft: 10, 
    color: THEME.textWhite, 
    fontSize: 13, 
    fontWeight: '600' 
  },

  // --- TARJETA FLOTANTE OSCURA ---
  cardContainer: {
      position: 'absolute', 
      bottom: 30, 
      left: 15, 
      right: 15,
      backgroundColor: THEME.cardBg, 
      borderRadius: 16, 
      height: 110,
      flexDirection: 'row', 
      padding: 10,
      elevation: 12, 
      shadowColor: "#000", 
      shadowOffset: { width: 0, height: 6 }, 
      shadowOpacity: 0.5, 
      shadowRadius: 8,
      borderWidth: 1, 
      borderColor: 'rgba(255,255,255,0.05)'
  },
  
  cardImageWrapper: { 
    width: 90, 
    height: '100%', 
    borderRadius: 12, 
    overflow: 'hidden', 
    marginRight: 12, 
    backgroundColor: '#1a1a1a' 
  },
  
  cardImage: { 
    width: '100%', 
    height: '100%' 
  }, 
  
  textContent: { 
    flex: 1, 
    justifyContent: 'center', 
    paddingRight: 25 
  }, 
  
  cardTitle: { 
      fontSize: 17, 
      fontWeight: '700', 
      color: THEME.textWhite, 
      marginBottom: 4,
      textShadowColor: 'rgba(0,0,0,0.3)', 
      textShadowOffset: {width: 0, height: 1}, 
      textShadowRadius: 2
  },
  
  cardSubtitle: { 
    fontSize: 13, 
    color: THEME.textGray, 
    marginBottom: 10, 
    fontWeight: '500' 
  }, 
  
  detailsBtn: {
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: THEME.accent,
      paddingVertical: 5, 
      paddingHorizontal: 12, 
      borderRadius: 20, 
      alignSelf: 'flex-start'
  },
  
  detailsBtnText: { 
    color: 'white', 
    fontWeight: '700', 
    fontSize: 11, 
    textTransform: 'uppercase' 
  },
  
  closeBtn: { 
    position: 'absolute', 
    top: 8, 
    right: 8, 
    padding: 5, 
    zIndex: 5 
  }
});