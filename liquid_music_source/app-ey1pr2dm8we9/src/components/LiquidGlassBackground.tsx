import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const LiquidGlassBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* Base deep space gradient */}
      <LinearGradient
        colors={['#080812', '#0f0c1b', '#07060e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Fluid Cyan/Blue Ambient Orb */}
      <View
        pointerEvents="none"
        style={[
          styles.ambientOrb,
          {
            top: -60,
            left: -40,
            width: 320,
            height: 320,
            borderRadius: 160,
            backgroundColor: 'rgba(56, 189, 248, 0.16)',
          },
        ]}
      />

      {/* Fluid Deep Purple/Magenta Ambient Orb */}
      <View
        pointerEvents="none"
        style={[
          styles.ambientOrb,
          {
            top: '30%',
            right: -80,
            width: 340,
            height: 340,
            borderRadius: 170,
            backgroundColor: 'rgba(168, 85, 247, 0.14)',
          },
        ]}
      />

      {/* Fluid Amber Glow Orb */}
      <View
        pointerEvents="none"
        style={[
          styles.ambientOrb,
          {
            bottom: -50,
            left: 20,
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: 'rgba(229, 169, 60, 0.09)',
          },
        ]}
      />

      {/* Subtle fine glass noise overlay */}
      <LinearGradient
        colors={['rgba(255,255,255,0.03)', 'transparent', 'rgba(0,0,0,0.4)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07070b',
  },
  ambientOrb: {
    position: 'absolute',
    opacity: 0.85,
  },
});
