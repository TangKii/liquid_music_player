import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useRouter, RelativePathString } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Folder, Sparkles, FolderPlus, Music2, RefreshCw } from 'lucide-react-native';
import { usePlayer } from '@/context/PlayerContext';
import { FEATURED_TRACKS } from '@/data/featuredSongs';
import { LiquidGlassBackground } from '@/components/LiquidGlassBackground';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';
import { SongListItem } from '@/components/SongListItem';
import { FloatingPlayerBar } from '@/components/FloatingPlayerBar';

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'featured' | 'local'>('featured');

  const {
    currentTrack,
    isPlaying,
    playTrack,
    localTracks,
    folders,
    rescanAllFolders,
  } = usePlayer();

  const openFolderManager = () => {
    router.push('/folders' as RelativePathString);
  };

  const currentDisplayTracks = activeTab === 'featured' ? FEATURED_TRACKS : localTracks;

  return (
    <LiquidGlassBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleWrapper}>
            <View style={styles.logoPill}>
              <View style={styles.logoGlowDot} />
              <Text style={styles.logoBadgeText}>LIQUID AUDIO</Text>
            </View>
            <Text style={styles.screenTitle}>液态音乐播放器</Text>
          </View>

          {/* Folder Management Button */}
          <Pressable
            onPress={openFolderManager}
            className="active:opacity-70"
            style={styles.folderBtn}
          >
            <Folder size={18} color="#EDEDED" />
            <Text style={styles.folderBtnText}>文件夹</Text>
            {folders.length > 0 && (
              <View style={styles.folderBadge}>
                <Text style={styles.folderBadgeText}>{folders.length}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Liquid Tab Segmented Switch */}
        <View style={styles.tabContainer}>
          <LiquidGlassCard variant="button" style={styles.tabCard}>
            <View style={styles.tabBarInner}>
              <Pressable
                onPress={() => setActiveTab('featured')}
                style={[
                  styles.tabItem,
                  activeTab === 'featured' && styles.tabItemActive,
                ]}
              >
                <Sparkles
                  size={15}
                  color={activeTab === 'featured' ? '#121212' : '#9E9EB2'}
                />
                <Text
                  style={[
                    styles.tabItemText,
                    activeTab === 'featured' && styles.tabItemTextActive,
                  ]}
                >
                  精选歌单 ({FEATURED_TRACKS.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('local')}
                style={[
                  styles.tabItem,
                  activeTab === 'local' && styles.tabItemActive,
                ]}
              >
                <Music2
                  size={15}
                  color={activeTab === 'local' ? '#121212' : '#9E9EB2'}
                />
                <Text
                  style={[
                    styles.tabItemText,
                    activeTab === 'local' && styles.tabItemTextActive,
                  ]}
                >
                  本地音乐 ({localTracks.length})
                </Text>
              </Pressable>
            </View>
          </LiquidGlassCard>
        </View>

        {/* If local tab and has tracks, show refresh status bar */}
        {activeTab === 'local' && folders.length > 0 && (
          <View style={styles.localSubHeader}>
            <Text style={styles.localSubHeaderText}>
              已关联 {folders.length} 个文件夹 • 共 {localTracks.length} 首歌曲
            </Text>
            <Pressable
              onPress={rescanAllFolders}
              hitSlop={8}
              className="active:opacity-60"
              style={styles.refreshIconBtn}
            >
              <RefreshCw size={14} color="#E5A93C" />
            </Pressable>
          </View>
        )}

        {/* Songs List */}
        <FlatList
          data={currentDisplayTracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SongListItem
              track={item}
              isActive={currentTrack?.id === item.id}
              isPlaying={isPlaying}
              onPress={() => playTrack(item, currentDisplayTracks)}
            />
          )}
          ListEmptyComponent={
            activeTab === 'local' ? (
              <View style={styles.emptyContainer}>
                <LiquidGlassCard style={styles.emptyCard}>
                  <View style={styles.emptyIconCircle}>
                    <FolderPlus size={36} color="#E5A93C" />
                  </View>
                  <Text style={styles.emptyTitle}>暂无本地音频</Text>
                  <Text style={styles.emptyDesc}>
                    添加手机中的音乐文件夹，系统将自动递归扫描并导入所有音频文件与同名歌词。
                  </Text>
                  <Pressable
                    onPress={openFolderManager}
                    className="active:opacity-80"
                    style={styles.emptyAddBtn}
                  >
                    <FolderPlus size={18} color="#121212" />
                    <Text style={styles.emptyAddBtnText}>添加音乐文件夹</Text>
                  </Pressable>
                </LiquidGlassCard>
              </View>
            ) : null
          }
        />

        {/* Bottom Floating Player Bar */}
        <FloatingPlayerBar />
      </SafeAreaView>
    </LiquidGlassBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  titleWrapper: {
    gap: 4,
  },
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoGlowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  logoBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  screenTitle: {
    color: '#EDEDED',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  folderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  folderBtnText: {
    color: '#EDEDED',
    fontSize: 13,
    fontWeight: '600',
  },
  folderBadge: {
    backgroundColor: '#E5A93C',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  folderBadgeText: {
    color: '#121212',
    fontSize: 10,
    fontWeight: '800',
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tabCard: {
    borderRadius: 18,
    padding: 4,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
  },
  tabItemActive: {
    backgroundColor: '#E5A93C',
    shadowColor: '#E5A93C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  tabItemText: {
    color: '#9E9EB2',
    fontSize: 13,
    fontWeight: '600',
  },
  tabItemTextActive: {
    color: '#121212',
    fontWeight: '700',
  },
  localSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 8,
  },
  localSubHeaderText: {
    color: '#7E7E94',
    fontSize: 12,
  },
  refreshIconBtn: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 110,
  },
  emptyContainer: {
    paddingTop: 36,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 28,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.25)',
  },
  emptyTitle: {
    color: '#EDEDED',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDesc: {
    color: '#8A8A9E',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E5A93C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#E5A93C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  emptyAddBtnText: {
    color: '#121212',
    fontSize: 14,
    fontWeight: '700',
  },
});
