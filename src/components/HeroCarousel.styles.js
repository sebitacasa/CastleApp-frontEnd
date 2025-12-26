import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  heroImage: { 
    width: width, 
    height: 220 
  },
  pagination: { 
    flexDirection: 'row', 
    position: 'absolute', 
    top: 190, 
    alignSelf: 'center' 
  },
  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: 'white', 
    marginHorizontal: 4 
  },
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    margin: 15, 
    color: '#333' 
  },
});