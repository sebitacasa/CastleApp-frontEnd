import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: width,
    height: '100%',
  },
  calloutContainer: {
    width: 150,
    padding: 5,
    alignItems: 'center'
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
    textAlign: 'center'
  },
  calloutSubtitle: {
    fontSize: 12,
    color: '#007AFF'
  },
  listContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    height: 180,
  },
  listTitle: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 20,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
  },
  card: {
    width: 140,
    height: 110,
    marginRight: 15,
    borderRadius: 15,
    backgroundColor: 'white',
    elevation: 5, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: '#e74c3c',
    transform: [{ scale: 1.05 }],
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  cardText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 13,
  },
  loaderContainer: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    zIndex: 10,
  },
  loaderText: {
    color: 'white',
    marginTop: 10,
    fontWeight: '600',
  }
});