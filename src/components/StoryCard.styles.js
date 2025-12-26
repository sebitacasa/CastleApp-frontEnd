import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  cardContainer: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    marginHorizontal: 15, 
    marginBottom: 20, 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageWrapper: { 
    height: 200, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    overflow: 'hidden' 
  },
  cardImage: { 
    width: '100%', 
    height: '100%', 
    position: 'absolute' 
  },
  cardImagePlaceholder: { 
    width: '100%', 
    height: '100%', 
    opacity: 0.2, 
    position: 'absolute' 
  },
  photoBadge: { 
    position: 'absolute', 
    bottom: 10, 
    right: 10, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    borderRadius: 10, 
    flexDirection: 'row', 
    padding: 5,
    alignItems: 'center'
  },
  photoBadgeText: { 
    color: 'white', 
    marginLeft: 5, 
    fontSize: 12 
  },
  cardContent: { 
    padding: 15 
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  cardCountry: { 
    color: '#666', 
    marginTop: 4 
  },
  categoryBadge: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#8BC34A', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 5, 
    marginTop: 10 
  },
  categoryText: { 
    color: 'white', 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
});