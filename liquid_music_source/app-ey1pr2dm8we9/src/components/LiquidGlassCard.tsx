import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  variant?: 'card' | 'capsule' | 'button' | 'highlight';
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  style,
  variant = 'card',
}) => {
  let bgStyle: ViewStyle = {
    backgroundColor: 'rgba(25, 24, 38, 0.55)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  };

  if (variant === 'capsule') {
    bgStyle = {
      backgroundColor: 'rgba(20, 18, 32, 0.75)',
      borderColor: 'rgba(255, 255, 255, 0.18)',
    };
  } else if (variant === 'button') {
    bgStyle = {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.22)',
    };
  } else if (variant === 'highlight') {
    bgStyle = {
      backgroundColor: 'rgba(229, 169, 60, 0.18)',
      borderColor: 'rgba(229, 169, 60, 0.45)',
    };
  }

  return (
    <View
      className={className}
      style={[
        styles.base,
        bgStyle,
        style,
      ]}
    >
      {/* Top highlight specular line */}
      <View style={styles.topSpecularHighlight} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  topSpecularHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    zIndex: 1,
  },
});
