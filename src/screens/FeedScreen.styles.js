import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  mainContainer: { 
    flex: 1, 
    backgroundColor: '#f2f2f2' 
  },
  
  // --- AQUÍ ESTÁ EL CAMBIO ---
  navBar: { 
    backgroundColor: '#38761D', 
    paddingTop: 45, 
    paddingBottom: 15,
    
    // 1. Agregamos margen abajo para separar las tarjetas
    marginBottom: 20, 
    
    // 2. (Opcional) Bordes redondeados abajo para suavizar el corte
 

    // 3. Sombra para que la barra se "levante" sobre el fondo gris
    elevation: 5, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10, // Asegura que la sombra se vea por encima de las tarjetas
  },
  // ---------------------------

  navTopRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    marginBottom: 15 
  },
  logoRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  navTitle: { 
    color: 'white', 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginLeft: 8 
  },
  searchBarContainer: { 
    backgroundColor: 'white', 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginHorizontal: 15, 
    borderRadius: 25, 
    paddingHorizontal: 15, 
    height: 45, 
    marginBottom: 15, 
    elevation: 3 
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 16, 
    color: '#333' 
  },
  catBtn: { 
    paddingHorizontal: 18, 
    paddingVertical: 6, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    marginRight: 10 
  },
  catBtnActive: { 
    backgroundColor: 'white' 
  },
  catText: { 
    color: 'white', 
    fontWeight: 'bold' 
  },
  catTextActive: { 
    color: '#38761D' 
  },
  centerLoading: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  }
});