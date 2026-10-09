import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Disc,
  AlignLeft,
  Volume2,
} from 'lucide-react-native';
import { usePlayer } from '@/context/PlayerContext';
import { LiquidGlassBackground } from '@/components/LiquidGlassBackground';

export default function FullscreenPlayerScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [viewMode, setViewMode] = useState<'vinyl' | 'lyrics'>('vinyl');

  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    seekTo,
    playNext,
    playPrevious,
    repeatMode,
    cycleRepeatMode,
    lyrics,
    activeLyricIndex,
  } = usePlayer();

  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (isPlaying) {
      animation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 18000,
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

  const lyricsListRef = useRef<FlatList>(null);
  useEffect(() => {
    if (viewMode === 'lyrics' && lyrics.length > 0 && activeLyricIndex >= 0) {
      try {
        lyricsListRef.current?.scrollToIndex({
          index: activeLyricIndex,
          animated: true,
          viewPosition: 0.45,
        });
      } catch {
        // Fallback
      }
    }
  }, [activeLyricIndex, viewMode, lyrics]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;

  const handleProgressPress = (e: any) => {
    const { locationX } = e.nativeEvent;
    const barWidth = width - 48;
    if (barWidth > 0 && duration > 0) {
      const clickRatio = Math.max(0, Math.min(1, locationX / barWidth));
      seekTo(clickRatio * duration);
    }
  };

  const discSize = Math.min(width - 72, 300);

  return (
    <LiquidGlassBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          <Pressable
            onPress={() => router.back()}
            className="active:opacity-70"
            style={styles.iconBtn}
            hitSlop={12}
          >
            <ChevronDown size={28} color="#EDEDED" />
          </Pressable>

          {/* Mode Switch: Vinyl / Lyrics */}
          <View style={styles.modeSwitchWrapper}>
            <Pressable
              onPress={() => setViewMode('vinyl')}
              style={[
                styles.modeBtn,
                viewMode === 'vinyl' && styles.modeBtnActive,
              ]}
            >
              <Disc
                size={16}
                color={viewMode === 'vinyl' ? '#121212' : '#8A8A9E'}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  viewMode === 'vinyl' && styles.modeBtnTextActive,
                ]}
              >
                唱片
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setViewMode('lyrics')}
              style={[
                styles.modeBtn,
                viewMode === 'lyrics' && styles.modeBtnActive,
              ]}
            >
              <AlignLeft
                size={16}
                color={viewMode === 'lyrics' ? '#121212' : '#8A8A9E'}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  viewMode === 'lyrics' && styles.modeBtnTextActive,
                ]}
              >
                歌词
              </Text>
            </Pressable>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Center Content: Vinyl Disc or Lyrics Scrolling */}
        <View style={styles.centerSection}>
          {viewMode === 'vinyl' ? (
            <View style={styles.vinylContainer}>
              <Animated.View
                style={[
                  styles.vinylDisc,
                  {
                    width: discSize,
                    height: discSize,
                    borderRadius: discSize / 2,
                    transform: [{ rotate: spin }],
                  },
                ]}
              >
                {/* Concentric Vinyl Sound Grooves */}
                <View
                  style={[
                    styles.vinylGroove,
                    {
                      width: discSize * 0.9,
                      height: discSize * 0.9,
                      borderRadius: (discSize * 0.9) / 2,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.vinylGroove,
                    {
                      width: discSize * 0.75,
                      height: discSize * 0.75,
                      borderRadius: (discSize * 0.75) / 2,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.vinylGroove,
                    {
                      width: discSize * 0.6,
                      height: discSize * 0.6,
                      borderRadius: (discSize * 0.6) / 2,
                    },
                  ]}
                />

                {/* Center Album Art */}
                <View
                  style={[
                    styles.vinylCenterArt,
                    {
                      width: discSize * 0.48,
                      height: discSize * 0.48,
                      borderRadius: (discSize * 0.48) / 2,
                    },
                  ]}
                >
                  {currentTrack?.coverUri ? (
                    <Image
                      source={{ uri: currentTrack.coverUri }}
                      style={styles.fullImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.artPlaceholder}>
                      <Disc size={36} color="#E5A93C" />
                    </View>
                  )}
                  {/* Center Hole */}
                  <View style={styles.centerSpindleHole} />
                </View>

                {/* Specular sheen reflection */}
                <View style={styles.sheenReflection} pointerEvents="none" />
              </Animated.View>
            </View>
          ) : (
            <View style={styles.lyricsContainer}>
              {lyrics.length > 0 ? (
                <FlatList
                  ref={lyricsListRef}
                  data={lyrics}
                  keyExtractor={(_, index) => `lyric-${index}`}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.lyricsListContent}
                  getItemLayout={(_, index) => ({
                    length: 56,
                    offset: 56 * index,
                    index,
                  })}
                  renderItem={({ item, index }) => {
                    const isActive = index === activeLyricIndex;
                    return (
                      <Pressable
                        onPress={() => seekTo(item.time)}
                        className="active:opacity-70"
                        style={[
                          styles.lyricRow,
                          isActive && styles.lyricRowActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.lyricText,
                            isActive && styles.lyricTextActive,
                          ]}
                        >
                          {item.text}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              ) : (
                <View style={styles.noLyricsWrapper}>
                  <Text style={styles.noLyricsText}>暂无匹配的 LRC 歌词</Text>
                  <Text style={styles.noLyricsHint}>
                    将同名 .lrc 文件放入歌曲同文件夹即可自动识别
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Bottom Information & Controls Section */}
        <View style={styles.bottomSection}>
          <View style={styles.songMetaRow}>
            <View style={styles.metaTextCol}>
              <Text numberOfLines={1} style={styles.trackTitle}>
                {currentTrack?.title || '未选择歌曲'}
              </Text>
              <Text numberOfLines={1} style={styles.trackArtist}>
                {currentTrack?.artist || '未知歌手'} • {currentTrack?.folderName || '收藏'}
              </Text>
            </View>
            <View style={styles.audioFormatBadge}>
              <Text style={styles.audioFormatText}>
                {currentTrack?.format || 'HQ'}
              </Text>
            </View>
          </View>

          {/* Interactive Progress Bar */}
          <View style={styles.progressSection}>
            <Pressable
              onPress={handleProgressPress}
              style={styles.progressBarPressable}
            >
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
                <View
                  style={[
                    styles.progressBarKnob,
                    { left: `${progressPercent}%` },
                  ]}
                />
              </View>
            </Pressable>

            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* Playback Controls Cluster */}
          <View style={styles.controlsCluster}>
            <Pressable
              onPress={cycleRepeatMode}
              className="active:opacity-60"
              style={styles.secondaryControlBtn}
              hitSlop={8}
            >
              {repeatMode === 'one' ? (
                <Repeat1 size={20} color="#E5A93C" />
              ) : repeatMode === 'shuffle' ? (
                <Shuffle size={20} color="#E5A93C" />
              ) : (
                <Repeat size={20} color="#8A8A9E" />
              )}
            </Pressable>

            <Pressable
              onPress={playPrevious}
              className="active:opacity-70"
              style={styles.stepControlBtn}
              hitSlop={12}
            >
              <SkipBack size={26} color="#EDEDED" strokeWidth={2} />
            </Pressable>

            {/* Big Amber Liquid Play/Pause Button (64px) */}
            <Pressable
              onPress={togglePlayPause}
              className="active:opacity-85"
              style={styles.mainPlayBtn}
              hitSlop={8}
            >
              {isPlaying ? (
                <Pause size={30} color="#121212" strokeWidth={2.8} />
              ) : (
                <Play
                  size={30}
                  color="#121212"
                  strokeWidth={2.8}
                  style={{ marginLeft: 3 }}
                />
              )}
            </Pressable>

            <Pressable
              onPress={playNext}
              className="active:opacity-70"
              style={styles.stepControlBtn}
              hitSlop={12}
            >
              <SkipForward size={26} color="#EDEDED" strokeWidth={2} />
            </Pressable>

            <View style={styles.secondaryControlBtn}>
              <Volume2 size={20} color="#8A8A9E" />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LiquidGlassBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeSwitchWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modeBtnActive: {
    backgroundColor: '#E5A93C',
  },
  modeBtnText: {
    color: '#8A8A9E',
    fontSize: 13,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: '#121212',
    fontWeight: '700',
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  vinylContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylDisc: {
    backgroundColor: '#0c0c11',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  vinylGroove: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  vinylCenterArt: {
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  artPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#171424',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerSpindleHole: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#07070b',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  sheenReflection: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '20%',
    right: '20%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    transform: [{ rotate: '45deg' }],
  },
  lyricsContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  lyricsListContent: {
    paddingVertical: 140,
    alignItems: 'center',
  },
  lyricRow: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  lyricRowActive: {
    transform: [{ scale: 1.06 }],
  },
  lyricText: {
    color: '#707085',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  lyricTextActive: {
    color: '#E5A93C',
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 28,
    textShadowColor: 'rgba(229, 169, 60, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  noLyricsWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  noLyricsText: {
    color: '#EDEDED',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noLyricsHint: {
    color: '#707085',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  songMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  metaTextCol: {
    flex: 1,
    marginRight: 12,
  },
  trackTitle: {
    color: '#EDEDED',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  trackArtist: {
    color: '#9E9EB2',
    fontSize: 14,
  },
  audioFormatBadge: {
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  audioFormatText: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '800',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressBarPressable: {
    paddingVertical: 8,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 2,
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E5A93C',
    borderRadius: 2,
  },
  progressBarKnob: {
    position: 'absolute',
    top: -4,
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EDEDED',
    shadowColor: '#E5A93C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    color: '#707085',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  controlsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  secondaryControlBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepControlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5A93C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E5A93C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
});
