import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  createAudioPlayer,
  setAudioModeAsync,
  requestNotificationPermissionsAsync,
  AudioPlayer,
  AudioStatus,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Track, FolderRecord, LyricLine, RepeatMode } from '@/types/music';
import { FEATURED_TRACKS } from '@/data/featuredSongs';
import { parseLrc, getActiveLyricIndex } from '@/utils/lrcParser';
import {
  getSavedFolders,
  saveFolders,
  getSavedLocalTracks,
  saveLocalTracks,
  scanFolder,
  pickDirectorySaf,
  pickAudioFiles,
  getSavedFavoriteIds,
  saveFavoriteIds,
} from '@/utils/fileScanner';

interface PlayerContextType {
  // Playback state
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number; // in seconds
  duration: number; // in seconds
  queue: Track[];
  currentQueueIndex: number;
  repeatMode: RepeatMode;
  isBuffering: boolean;
  
  // Lyrics
  lyrics: LyricLine[];
  activeLyricIndex: number;

  // Local files & folders
  folders: FolderRecord[];
  localTracks: Track[];
  isScanning: boolean;

  // Favorites
  favoriteTrackIds: string[];
  favoriteTracks: Track[];
  toggleFavorite: (trackId: string) => void;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  cycleRepeatMode: () => void;
  setQueue: (tracks: Track[]) => void;
  
  // Folder management
  addFolderViaSaf: () => Promise<FolderRecord | null>;
  importAudioFiles: () => Promise<number>;
  removeFolder: (folderId: string) => Promise<void>;
  rescanAllFolders: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(FEATURED_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(FEATURED_TRACKS[0].duration || 0);
  const [queue, setQueueState] = useState<Track[]>(FEATURED_TRACKS);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [isBuffering, setIsBuffering] = useState<boolean>(false);

  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState<number>(0);

  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const [favoriteTrackIds, setFavoriteTrackIds] = useState<string[]>([]);

  const playerRef = useRef<AudioPlayer | null>(null);
  const statusSubscriptionRef = useRef<{ remove: () => void } | null>(null);
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  repeatModeRef.current = repeatMode;
  const queueRef = useRef<Track[]>(queue);
  queueRef.current = queue;
  const currentQueueIndexRef = useRef<number>(currentQueueIndex);
  currentQueueIndexRef.current = currentQueueIndex;

  // Configure Audio Mode on mount
  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
        });
      } catch (err) {
        console.warn('Failed to set audio mode:', err);
      }
    })();
  }, []);

  // Load saved folders and local tracks on mount
  useEffect(() => {
    (async () => {
      const savedF = await getSavedFolders();
      setFolders(savedF);
      const savedT = await getSavedLocalTracks();
      setLocalTracks(savedT);
      const savedFav = await getSavedFavoriteIds();
      // 收藏列表 = 云端精选（预置红心）+ 本地已收藏；云端精选不与收藏状态解耦，避免取消后无法找回
      setFavoriteTrackIds(savedFav ?? []);
      if (savedFav === null) {
        saveFavoriteIds([]);
      }
    })();
  }, []);

  // Update lyrics whenever currentTrack changes
  useEffect(() => {
    if (!currentTrack) {
      setLyrics([]);
      setActiveLyricIndex(0);
      return;
    }

    if (currentTrack.lrcContent) {
      const parsed = parseLrc(currentTrack.lrcContent);
      setLyrics(parsed);
    } else {
      // Check if it's one of the featured tracks
      const found = FEATURED_TRACKS.find((t) => t.id === currentTrack.id || t.title === currentTrack.title);
      if (found && found.lrcContent) {
        setLyrics(parseLrc(found.lrcContent));
      } else {
        // Fallback default lyric
        setLyrics([
          { time: 0, text: currentTrack.title },
          { time: 3, text: currentTrack.artist || '纯音乐 / 无词歌谣' },
          { time: 8, text: '• 液态玻璃音场沉浸体验 •' },
        ]);
      }
    }
  }, [currentTrack]);

  // Update active lyric based on playback position
  useEffect(() => {
    if (lyrics.length > 0) {
      const index = getActiveLyricIndex(lyrics, position);
      setActiveLyricIndex(index);
    }
  }, [position, lyrics]);

  // Clean up player on unmount
  useEffect(() => {
    return () => {
      if (statusSubscriptionRef.current) {
        statusSubscriptionRef.current.remove();
      }
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }
    };
  }, []);

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
  };

  /**
   * Play the next song in the queue
   */
  const playNext = useCallback(async () => {
    const q = queueRef.current;
    if (q.length === 0) return;

    triggerHaptic();

    let nextIndex = 0;
    const mode = repeatModeRef.current;
    if (mode === 'shuffle') {
      nextIndex = Math.floor(Math.random() * q.length);
    } else {
      nextIndex = (currentQueueIndexRef.current + 1) % q.length;
    }

    const nextTrack = q[nextIndex];
    if (nextTrack) {
      setCurrentQueueIndex(nextIndex);
      await playTrack(nextTrack);
    }
  }, []);

  /**
   * Play previous song
   */
  const playPrevious = useCallback(async () => {
    const q = queueRef.current;
    if (q.length === 0) return;

    triggerHaptic();

    let prevIndex = 0;
    const mode = repeatModeRef.current;
    if (mode === 'shuffle') {
      prevIndex = Math.floor(Math.random() * q.length);
    } else {
      prevIndex = (currentQueueIndexRef.current - 1 + q.length) % q.length;
    }

    const prevTrack = q[prevIndex];
    if (prevTrack) {
      setCurrentQueueIndex(prevIndex);
      await playTrack(prevTrack);
    }
  }, []);

  /**
   * Play a track
   */
  const playTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    try {
      triggerHaptic();

      if (newQueue && newQueue.length > 0) {
        setQueueState(newQueue);
        const idx = newQueue.findIndex((t) => t.id === track.id);
        setCurrentQueueIndex(idx >= 0 ? idx : 0);
      } else {
        const idx = queueRef.current.findIndex((t) => t.id === track.id);
        if (idx >= 0) {
          setCurrentQueueIndex(idx);
        } else {
          // Append to queue
          const updated = [...queueRef.current, track];
          setQueueState(updated);
          setCurrentQueueIndex(updated.length - 1);
        }
      }

      setCurrentTrack(track);
      setPosition(0);
      if (track.duration > 0) {
        setDuration(track.duration);
      }

      // Dispose existing player if any
      if (statusSubscriptionRef.current) {
        statusSubscriptionRef.current.remove();
        statusSubscriptionRef.current = null;
      }
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }

      // Create new AudioPlayer with source
      const player = createAudioPlayer(track.uri, {
        updateInterval: 250,
      });
      playerRef.current = player;

      // Enable lock screen / Dynamic Island (灵动岛) controls with metadata
      try {
        player.setActiveForLockScreen(true, {
          title: track.title,
          artist: track.artist,
          albumTitle: track.album || track.folderName,
          artworkUrl: track.coverUri,
        });
      } catch (err) {
        console.warn('Failed to activate lock screen controls:', err);
      }

      // Android 13+ needs notification permission to show media controls
      try {
        await requestNotificationPermissionsAsync();
      } catch (err) {
        // ignore, only relevant on Android
      }

      // Listen to status updates
      const sub = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        setIsPlaying(status.playing);
        setPosition(status.currentTime || 0);
        setIsBuffering(status.isBuffering || false);
        if (status.duration > 0) {
          setDuration(status.duration);
        }

        if (status.didJustFinish) {
          if (repeatModeRef.current === 'one') {
            player.seekTo(0).then(() => player.play());
          } else {
            playNext();
          }
        }
      });
      statusSubscriptionRef.current = sub;

      player.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn('Error playing track:', err);
      setIsPlaying(false);
    }
  }, [playNext]);

  /**
   * Toggle play / pause
   */
  const togglePlayPause = useCallback(async () => {
    triggerHaptic();
    if (!playerRef.current) {
      if (currentTrack) {
        await playTrack(currentTrack);
      }
      return;
    }

    try {
      if (isPlaying) {
        playerRef.current.pause();
        setIsPlaying(false);
      } else {
        playerRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn('Error toggling play/pause:', err);
    }
  }, [isPlaying, currentTrack, playTrack]);

  /**
   * Seek to position
   */
  const seekTo = useCallback(async (seconds: number) => {
    setPosition(seconds);
    if (playerRef.current) {
      try {
        await playerRef.current.seekTo(seconds);
      } catch (err) {
        console.warn('Error seeking:', err);
      }
    }
  }, []);

  /**
   * Cycle repeat mode: all -> one -> shuffle -> all
   */
  const cycleRepeatMode = useCallback(() => {
    triggerHaptic();
    setRepeatMode((prev) => {
      if (prev === 'all') return 'one';
      if (prev === 'one') return 'shuffle';
      return 'all';
    });
  }, []);

  /**
   * Set custom queue
   */
  const setQueue = useCallback((tracks: Track[]) => {
    setQueueState(tracks);
  }, []);

  /**
   * Add folder via SAF (Storage Access Framework)
   */
  const addFolderViaSaf = useCallback(async (): Promise<FolderRecord | null> => {
    try {
      setIsScanning(true);
      const newFolder = await pickDirectorySaf();
      if (!newFolder) {
        setIsScanning(false);
        return null;
      }

      // Check if already added
      const exists = folders.some((f) => f.uri === newFolder.uri);
      if (exists) {
        setIsScanning(false);
        return newFolder;
      }

      // Scan new folder for audio tracks
      const newTracks = await scanFolder(newFolder);
      newFolder.songCount = newTracks.length;

      const updatedFolders = [...folders, newFolder];
      setFolders(updatedFolders);
      await saveFolders(updatedFolders);

      // Merge and deduplicate local tracks by URI
      const trackMap = new Map<string, Track>();
      for (const t of localTracks) {
        trackMap.set(t.uri, t);
      }
      for (const t of newTracks) {
        trackMap.set(t.uri, t);
      }

      const mergedTracks = Array.from(trackMap.values());
      setLocalTracks(mergedTracks);
      await saveLocalTracks(mergedTracks);

      setIsScanning(false);
      return newFolder;
    } catch (err) {
      console.warn('Failed to add folder:', err);
      setIsScanning(false);
      return null;
    }
  }, [folders, localTracks]);

  /**
   * Import individual audio files via DocumentPicker
   */
  const importAudioFiles = useCallback(async (): Promise<number> => {
    try {
      setIsScanning(true);
      const picked = await pickAudioFiles();
      if (picked.length === 0) {
        setIsScanning(false);
        return 0;
      }

      // Ensure a "手动导入" folder record exists
      let customFolder = folders.find((f) => f.name === '手动导入');
      if (!customFolder) {
        customFolder = {
          id: 'folder-manual-import',
          name: '手动导入',
          uri: 'manual://imports',
          songCount: 0,
          addedAt: Date.now(),
        };
      }

      const trackMap = new Map<string, Track>();
      for (const t of localTracks) {
        trackMap.set(t.uri, t);
      }
      for (const t of picked) {
        trackMap.set(t.uri, t);
      }

      const merged = Array.from(trackMap.values());
      customFolder.songCount = merged.filter((t) => t.folderName === '外部导入' || t.folderName === '手动导入').length;

      const updatedFolders = folders.some((f) => f.id === customFolder?.id)
        ? folders.map((f) => (f.id === customFolder?.id ? customFolder! : f))
        : [...folders, customFolder];

      setFolders(updatedFolders);
      await saveFolders(updatedFolders);

      setLocalTracks(merged);
      await saveLocalTracks(merged);

      setIsScanning(false);
      return picked.length;
    } catch (err) {
      console.warn('Failed to import audio files:', err);
      setIsScanning(false);
      return 0;
    }
  }, [folders, localTracks]);

  /**
   * Remove a folder and clean up associated songs
   */
  const removeFolder = useCallback(async (folderId: string) => {
    triggerHaptic();
    const folderToRemove = folders.find((f) => f.id === folderId);
    if (!folderToRemove) return;

    const updatedFolders = folders.filter((f) => f.id !== folderId);
    setFolders(updatedFolders);
    await saveFolders(updatedFolders);

    // Remove songs originating from this folder
    const filteredTracks = localTracks.filter((t) => t.folderUri !== folderToRemove.uri && t.folderName !== folderToRemove.name);
    setLocalTracks(filteredTracks);
    await saveLocalTracks(filteredTracks);

    // If current playing track was from removed folder, switch or stop
    if (currentTrack && currentTrack.isLocal && (currentTrack.folderUri === folderToRemove.uri || currentTrack.folderName === folderToRemove.name)) {
      if (FEATURED_TRACKS.length > 0) {
        playTrack(FEATURED_TRACKS[0], FEATURED_TRACKS);
      }
    }
  }, [folders, localTracks, currentTrack, playTrack]);

  /**
   * Rescan all folders
   */
  const rescanAllFolders = useCallback(async () => {
    setIsScanning(true);
    try {
      const allNewTracks: Track[] = [];
      const updatedFolders: FolderRecord[] = [];

      for (const f of folders) {
        if (f.uri.startsWith('manual://')) {
          updatedFolders.push(f);
          continue;
        }
        const scanned = await scanFolder(f);
        f.songCount = scanned.length;
        updatedFolders.push(f);
        allNewTracks.push(...scanned);
      }

      // Keep manual imported tracks
      const manualTracks = localTracks.filter((t) => t.folderName === '外部导入' || t.folderName === '手动导入');
      const trackMap = new Map<string, Track>();
      for (const t of manualTracks) {
        trackMap.set(t.uri, t);
      }
      for (const t of allNewTracks) {
        trackMap.set(t.uri, t);
      }

      const merged = Array.from(trackMap.values());
      setFolders(updatedFolders);
      await saveFolders(updatedFolders);
      setLocalTracks(merged);
      await saveLocalTracks(merged);
    } catch (err) {
      console.warn('Failed to rescan folders:', err);
    } finally {
      setIsScanning(false);
    }
  }, [folders, localTracks]);

  /**
   * Toggle favorite status for a track
   */
  const toggleFavorite = useCallback((trackId: string) => {
    setFavoriteTrackIds((prev) => {
      const next = prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId];
      saveFavoriteIds(next);
      return next;
    });
  }, []);

  // 收藏列表 = 云端精选（固定展示，预置红心） + 本地已收藏歌曲
  const favoriteTracks = useMemo<Track[]>(() => {
    const favSet = new Set(favoriteTrackIds);
    const localFav = localTracks.filter((t) => favSet.has(t.id));
    return [...FEATURED_TRACKS, ...localFav];
  }, [favoriteTrackIds, localTracks]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        position,
        duration,
        queue,
        currentQueueIndex,
        repeatMode,
        isBuffering,
        lyrics,
        activeLyricIndex,
        folders,
        localTracks,
        isScanning,
        favoriteTrackIds,
        favoriteTracks,
        toggleFavorite,
        playTrack,
        togglePlayPause,
        seekTo,
        playNext,
        playPrevious,
        cycleRepeatMode,
        setQueue,
        addFolderViaSaf,
        importAudioFiles,
        removeFolder,
        rescanAllFolders,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
