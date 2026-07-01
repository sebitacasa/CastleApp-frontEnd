import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing, StyleSheet, StatusBar } from 'react-native';

const SPLASH_BG = '#ffffff';

export default function AnimatedSplash() {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim, fadeAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={SPLASH_BG} />
      <Animated.View style={{ opacity: fadeAnim, transform: [{ rotate }] }}>
        <Image
          source={require('../../assets/Images/brujula.png')}
          style={styles.compass}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compass: {
    width: 140,
    height: 140,
  },
});
