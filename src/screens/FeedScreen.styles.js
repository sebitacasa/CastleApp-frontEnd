import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  // --- EL CONTENEDOR PRINCIPAL YA NO TIENE COLOR ---
  mainContainer: { 
    flex: 1, 
    // backgroundColor: '#203040', <-- ELIMINADO
  },

  // --- NUEVO: ESTILO PARA LA IMAGEN DE FONDO GLOBAL ---
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  
  // --- NUEVO: CAPA OSCURA GLOBAL (ENSOMBRECIDO) ---
  globalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Oscurece todo un 60% para que las cards resalten
    paddingTop: 60, // Espacio para la StatusBar translucent
  },
  
  // --- NAV BAR (Ahora es transparente) ---
  navBar: { 
    // Quitamos padding superior porque ahora lo maneja globalOverlay
    paddingBottom: 15,
    marginBottom: 10, 
    zIndex: 10, 
    // Eliminamos bordes y sombras porque ya no es una "caja" separada
    // elevation: 10, shadowColor: '#000', ... etc.
  },
  
  // --- ELIMINAMOS EL OVERLAY VIEJO ---
  // overlay: { ... } <-- ELIMINADO

  navTopRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    marginBottom: 15,
  },
  logoRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  navTitle: { 
    color: 'white', 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginLeft: 8,
    textShadowColor: 'rgba(0,0,0,0.8)', 
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  
  catBtn: { 
    paddingHorizontal: 18, 
    paddingVertical: 6, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.2)', // Un poco más transparente
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  catBtnActive: { 
    backgroundColor: 'white',
    borderColor: 'white'
  },
  catText: { 
    color: 'white', 
    fontWeight: 'bold' 
  },
  catTextActive: { 
    color: '#000' // Texto negro para el botón activo blanco
  },
  
  centerLoading: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  }
});