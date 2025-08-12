// views/SplashView.js (Presentation Layer)
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Image } from 'react-native';

export default function SplashView({ navigation }) {
  // Animated value for logo scale (start oversized at 2x)
  const scaleAnim = useRef(new Animated.Value(2)).current;

  useEffect(() => {
    // Kick off a spring animation to scale the logo down to 1x
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,  // lower friction = more bounce
      tension: 80,  // higher tension = snappier
      useNativeDriver: true, // better perf for transforms
    }).start();

    // After 3 seconds, move to auth flow
    const timer = setTimeout(() => {
      navigation.replace('AuthWrapper');
    }, 3000);

    // Cleanup timer if user navigates away early
    return () => clearTimeout(timer);
  }, [navigation, scaleAnim]);

  return (
    <View style={styles.container}>
      {/* Animated logo scales from 2x → 1x */}
      <Animated.Image
        source={require('../assets/logo.png')}
        style={[styles.logo, { transform: [{ scale: scaleAnim }] }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Full-screen dark background, centered content
  container: {
    flex: 1,
    backgroundColor: '#1B182B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Base size for the logo (animation controls scale)
  logo: {
    width: 180,
    height: 180,
  },
});
