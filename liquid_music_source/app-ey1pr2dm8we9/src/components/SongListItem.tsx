import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Play, Disc, Music, BarChart2, Heart } from 'lucide-react-native';
import { Track } from '@/types/music';

interface SongListItemProps {
  track: Track;
  isActive: boolean;
  isPlaying: boolean;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (trackId: string) => void;
}

const FAVORITE_RED = '#FF4D6D';

export const SongListItem: React.FC<SongListItemProps> = ({
  track,
  isActive,
  isPlaying,
  onPress,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const formatDuration = (sec: number) => {
    if (!sec || sec <= 0) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-75"
      style={[
        styles.row,
        isActive ? styles.rowActive : styles.rowNormal,
      ]}
    >
      {/* Cover or Format Icon */}
      <View style={styles.coverWrapper}>
        {track.coverUri ? (
          <Image source={{ uri: track.coverUri }} style={styles.coverImage} contentFit="cover" />
        ) : (
          <View style={[styles.coverFallback, isActive && styles.coverFallbackActive]}>
            {track.isLocal ? (
              <Music size={20} color={isActive ? '#E5A93C' : '#9E9EB2'} />
            ) : (
              <Disc size={20} color={isActive ? '#E5A93C' : '#9E9EB2'} />
            )}
          </View>
        )}
        {isActive && isPlaying && (
          <View style={styles.playingBadge}>
            <BarChart2 size={12} color="#121212" />
          </View>
        )}
      </View>

      {/* Track Details */}
      <View style={styles.metaCol}>
        <Text
          numberOfLines={1}
          style={[styles.title, isActive && styles.titleActive]}
        >
          {track.title}
        </Text>
        <View style={styles.subMetaRow}>
          {track.format && (
            <View style={styles.formatBadge}>
              <Text style={styles.formatText}>{track.format}</Text>
            </View>
          )}
          <Text numberOfLines={1} style={styles.artist}>
            {track.artist} {track.folderName ? `• ${track.folderName}` : ''}
          </Text>
        </View>
      </View>

      {/* Duration, Favorite and Play Action */}
      <View style={styles.rightCol}>
        <Text style={styles.duration}>
          {formatDuration(track.duration)}
        </Text>
        <View style={styles.rightActionRow}>
          {onToggleFavorite ? (
            <Pressable
              onPress={() => onToggleFavorite(track.id)}
              hitSlop={8}
              className="active:scale-90"
              style={[
                styles.favoriteBtn,
                isFavorite && styles.favoriteBtnActive,
              ]}
            >
              <Heart
                size={16}
                color={isFavorite ? FAVORITE_RED : '#9E9EB2'}
                fill={isFavorite ? FAVORITE_RED : 'none'}
                strokeWidth={isFavorite ? 2.2 : 1.8}
              />
            </Pressable>
          ) : isFavorite ? (
            // 只读红心（如云端精选预置收藏，不可取消）
            <View style={[styles.favoriteBtn, styles.favoriteBtnActive]}>
              <Heart size={16} color={FAVORITE_RED} fill={FAVORITE_RED} strokeWidth={2.2} />
            </View>
          ) : null}
          <View
            style={[
              styles.playCircle,
              isActive && isPlaying ? styles.playCircleActive : styles.playCircleNormal,
            ]}
          >
            <Play
              size={12}
              color={isActive ? '#121212' : '#9E9EB2'}
              style={{ marginLeft: 1 }}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
  },
  rowNormal: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  rowActive: {
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    borderColor: 'rgba(229, 169, 60, 0.35)',
  },
  coverWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverFallbackActive: {
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
  },
  playingBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5A93C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  title: {
    color: '#EDEDED',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  titleActive: {
    color: '#E5A93C',
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formatBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  formatText: {
    color: '#B0B0C4',
    fontSize: 10,
    fontWeight: '700',
  },
  artist: {
    color: '#8A8A9E',
    fontSize: 12,
    flex: 1,
  },
  rightCol: {
    alignItems: 'flex-end',
    marginLeft: 10,
    gap: 6,
  },
  rightActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  favoriteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBtnActive: {
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
  },
  duration: {
    color: '#707085',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  playCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircleNormal: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  playCircleActive: {
    backgroundColor: '#E5A93C',
  },
});
