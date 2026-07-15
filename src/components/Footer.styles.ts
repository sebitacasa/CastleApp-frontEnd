import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#ffffff',
    marginTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#000000',
    fontSize: 22,
    fontFamily: 'BerkshireSwash_400Regular',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    color: '#8b9bb4',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 15,
    textAlign: 'center',
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: '#2c3e50',
    marginBottom: 15,
  },
  copyright: {
    color: '#58677c',
    fontSize: 11,
  },
});
