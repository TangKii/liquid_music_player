import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  FolderPlus,
  FilePlus2,
  Trash2,
  FolderSync,
  HardDrive,
  Info,
  CheckCircle2,
} from 'lucide-react-native';
import { usePlayer } from '@/context/PlayerContext';
import { LiquidGlassBackground } from '@/components/LiquidGlassBackground';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';

export default function FoldersScreen() {
  const router = useRouter();
  const {
    folders,
    addFolderViaSaf,
    importAudioFiles,
    removeFolder,
    rescanAllFolders,
    isScanning,
    localTracks,
  } = usePlayer();

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  };

  const handleAddFolder = async () => {
    const res = await addFolderViaSaf();
    if (res) {
      showFeedback(`已添加文件夹「${res.name}」，扫描发现 ${res.songCount} 首音频`);
    }
  };

  const handleImportFiles = async () => {
    const count = await importAudioFiles();
    if (count > 0) {
      showFeedback(`成功导入 ${count} 首本地音频文件`);
    }
  };

  return (
    <LiquidGlassBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            className="active:opacity-70"
            style={styles.backBtn}
            hitSlop={10}
          >
            <ChevronLeft size={24} color="#EDEDED" />
          </Pressable>
          <Text style={styles.headerTitle}>音乐文件夹</Text>
          <Pressable
            onPress={rescanAllFolders}
            disabled={isScanning}
            className="active:opacity-60"
            style={styles.rescanBtn}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color="#E5A93C" />
            ) : (
              <FolderSync size={18} color="#E5A93C" />
            )}
            <Text style={styles.rescanBtnText}>重新扫描</Text>
          </Pressable>
        </View>

        {/* Feedback Banner if present */}
        {feedbackMessage && (
          <View style={styles.feedbackBanner}>
            <CheckCircle2 size={16} color="#E5A93C" />
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        )}

        {/* Summary Card */}
        <View style={styles.summaryContainer}>
          <LiquidGlassCard style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <View style={styles.summaryIconBox}>
                <HardDrive size={24} color="#E5A93C" />
              </View>
              <View>
                <Text style={styles.summaryTitle}>本地音频库</Text>
                <Text style={styles.summarySubtitle}>
                  已添加 {folders.length} 个文件夹 • 共计 {localTracks.length} 首歌曲
                </Text>
              </View>
            </View>
          </LiquidGlassCard>
        </View>

        {/* Add Actions */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleAddFolder}
            disabled={isScanning}
            className="active:opacity-80"
            style={styles.primaryActionBtn}
          >
            <FolderPlus size={18} color="#121212" />
            <Text style={styles.primaryActionBtnText}>指定音乐文件夹</Text>
          </Pressable>

          <Pressable
            onPress={handleImportFiles}
            disabled={isScanning}
            className="active:opacity-80"
            style={styles.secondaryActionBtn}
          >
            <FilePlus2 size={18} color="#EDEDED" />
            <Text style={styles.secondaryActionBtnText}>导入音频文件</Text>
          </Pressable>
        </View>

        {/* Format & Lyrics Hint */}
        <View style={styles.hintCardWrapper}>
          <View style={styles.hintInner}>
            <Info size={14} color="#7E7E94" style={{ marginTop: 2 }} />
            <Text style={styles.hintText}>
              支持扫描 MP3 / WAV / FLAC / M4A / AAC / OGG
              格式。播放时将自动在歌曲所在目录下匹配同名 .lrc 歌词文件并实现毫秒级高亮对齐。
            </Text>
          </View>
        </View>

        {/* Folders List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionHeader}>已选文件夹列表 ({folders.length})</Text>

          <FlatList
            data={folders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <LiquidGlassCard style={styles.folderItemCard}>
                <View style={styles.folderItemLeft}>
                  <View style={styles.folderIconBadge}>
                    <FolderPlus size={20} color="#E5A93C" />
                  </View>
                  <View style={styles.folderMeta}>
                    <Text numberOfLines={1} style={styles.folderName}>
                      {item.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.folderUri}>
                      包含 {item.songCount} 首音频 • {decodeURIComponent(item.uri)}
                    </Text>
                  </View>
                </View>

                {/* Remove button */}
                <Pressable
                  onPress={() => removeFolder(item.id)}
                  className="active:opacity-60"
                  style={styles.deleteBtn}
                  hitSlop={8}
                >
                  <Trash2 size={18} color="#D64545" />
                </Pressable>
              </LiquidGlassCard>
            )}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyListTitle}>尚未添加任何音乐文件夹</Text>
                <Text style={styles.emptyListDesc}>
                  点击上方「指定音乐文件夹」选择手机中的存储目录（如 Music、Download 等），我们将自动提取音乐。
                </Text>
              </View>
            }
          />
        </View>
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
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#EDEDED',
    fontSize: 18,
    fontWeight: '700',
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.3)',
  },
  rescanBtnText: {
    color: '#E5A93C',
    fontSize: 12,
    fontWeight: '700',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.4)',
  },
  feedbackText: {
    color: '#EDEDED',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 20,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.3)',
  },
  summaryTitle: {
    color: '#EDEDED',
    fontSize: 16,
    fontWeight: '700',
  },
  summarySubtitle: {
    color: '#8A8A9E',
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E5A93C',
    paddingVertical: 13,
    borderRadius: 20,
    shadowColor: '#E5A93C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  primaryActionBtnText: {
    color: '#121212',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 13,
    borderRadius: 20,
  },
  secondaryActionBtnText: {
    color: '#EDEDED',
    fontSize: 13,
    fontWeight: '600',
  },
  hintCardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  hintInner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  hintText: {
    color: '#7E7E94',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    color: '#EDEDED',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 40,
  },
  folderItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
  },
  folderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  folderIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderMeta: {
    flex: 1,
  },
  folderName: {
    color: '#EDEDED',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  folderUri: {
    color: '#7E7E94',
    fontSize: 11,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(214, 69, 69, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(214, 69, 69, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    alignItems: 'center',
    paddingTop: 36,
    paddingHorizontal: 16,
  },
  emptyListTitle: {
    color: '#9E9EB2',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyListDesc: {
    color: '#656578',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
