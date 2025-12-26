import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  mainContainer: { 
    flex: 1, 
    backgroundColor: '#f2f2f2' 
  },
  navBar: { 
    backgroundColor: '#38761D', 
    paddingTop: 45, 
    paddingBottom: 15 
  },
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