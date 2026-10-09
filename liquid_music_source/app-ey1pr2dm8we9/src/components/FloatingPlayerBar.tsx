import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter, RelativePathString } from 'expo-router';
import { Image } from 'expo-image';
import { Play, Pause, SkipForward, Disc } from 'lucide-react-native';
import { usePlayer } from '@/context/PlayerContext';
import { LiquidGlassCard } from './LiquidGlassCard';

export const FloatingPlayerBar: React.FC = () => {
  const router = useRouter();
  const { currentTrack, isPlaying, togglePlayPause, playNext, position, duration } = usePlayer();

  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isPlaying) {
      animation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
    } else {
      spinAnim.stopAnimation();
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [isPlaying, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;

  const openPlayer = () => {
    router.push('/player' as RelativePathString);
  };

  return (
    <View style={styles.outerWrapper} pointerEvents="box-none">
      <Pressable onPress={openPlayer} style={styles.pressableContainer}>
        <LiquidGlassCard variant="capsule" style={styles.capsule}>
          {/* Subtle progress track line at the top of the floating bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>

          <View style={styles.contentRow}>
            {/* Spinning disc with cover */}
            <View style={styles.discWrapper}>
              <Animated.View style={[styles.discAnim, { transform: [{ rotate: spin }] }]}>
                {currentTrack.coverUri ? (
                  <Image
                    source={{ uri: currentTrack.coverUri }}
                    style={styles.discImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.discPlaceholder}>
                    <Disc size={20} color="#E5A93C" />
                  </View>
                )}
                {/* Center hole of the record */}
                <View style={styles.centerHole} />
              </Animated.View>
            </View>

            {/* Song title and artist */}
            <View style={styles.infoCol}>
              <Text numberOfLines={1} style={styles.titleText}>
                {currentTrack.title}
              </Text>
              <Text numberOfLines={1} style={styles.artistText}>
                {currentTrack.artist} • {currentTrack.folderName || '收藏'}
              </Text>
            </View>

            {/* Controls */}
            <View style={styles.controlsRow}>
              {/* Play / Pause amber liquid button */}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                hitSlop={8}
                style={styles.playButton}
              >
                {isPlaying ? (
                  <Pause size={18} color="#121212" strokeWidth={2.5} />
                ) : (
                  <Play size={18} color="#121212" strokeWidth={2.5} style={{ marginLeft: 2 }} />
                )}
              </Pressable>

              {/* Next track button */}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  playNext();
                }}
                hitSlop={8}
                style={styles.nextButton}
              >
                <SkipForward size={18} color="#EDEDED" strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        </LiquidGlassCard>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    zIndex: 99,
  },
  pressableContainer: {
    borderRadius: 32,
  },
  capsule: {
    borderRadius: 32,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(20, 18, 34, 0.82)',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E5A93C',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  discWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  discAnim: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  discPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1b1926',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerHole: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#07070b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  titleText: {
    color: '#EDEDED',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  artistText: {
    color: '#9E9EB2',
    fontSize: 12,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5A93C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E5A93C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  nextButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
