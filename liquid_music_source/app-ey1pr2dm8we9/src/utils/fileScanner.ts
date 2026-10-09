import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { Track, FolderRecord } from '@/types/music';

const { StorageAccessFramework } = FileSystem;

const STORAGE_FILE = `${FileSystem.documentDirectory || ''}liquid_music_data.json`;

interface StoredData {
  folders: FolderRecord[];
  tracks: Track[];
}

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg'];

export function removeFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot > 0) {
    return filename.substring(0, lastDot);
  }
  return filename;
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot > 0) {
    return filename.substring(lastDot).toLowerCase();
  }
  return '';
}

export function isAudioFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return AUDIO_EXTENSIONS.includes(ext);
}

async function readStoredData(): Promise<StoredData> {
  try {
    const info = await FileSystem.getInfoAsync(STORAGE_FILE);
    if (!info.exists) {
      return { folders: [], tracks: [] };
    }
    const content = await FileSystem.readAsStringAsync(STORAGE_FILE);
    return JSON.parse(content);
  } catch (err) {
    console.warn('Failed reading stored music data:', err);
    return { folders: [], tracks: [] };
  }
}

async function writeStoredData(data: Partial<StoredData>): Promise<void> {
  try {
    const current = await readStoredData();
    const updated = { ...current, ...data };
    await FileSystem.writeAsStringAsync(STORAGE_FILE, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed writing stored music data:', err);
  }
}

export async function getSavedFolders(): Promise<FolderRecord[]> {
  const data = await readStoredData();
  return data.folders || [];
}

export async function saveFolders(folders: FolderRecord[]): Promise<void> {
  await writeStoredData({ folders });
}

export async function getSavedLocalTracks(): Promise<Track[]> {
  const data = await readStoredData();
  return data.tracks || [];
}

export async function saveLocalTracks(tracks: Track[]): Promise<void> {
  await writeStoredData({ tracks });
}

async function tryReadCompanionLrc(audioUri: string, baseName: string): Promise<string | undefined> {
  try {
    if (audioUri.startsWith('file://')) {
      const lastSlash = audioUri.lastIndexOf('/');
      if (lastSlash > 0) {
        const dir = audioUri.substring(0, lastSlash + 1);
        const lrcUri = `${dir}${baseName}.lrc`;
        const info = await FileSystem.getInfoAsync(lrcUri);
        if (info.exists) {
          return await FileSystem.readAsStringAsync(lrcUri);
        }
      }
    }

    if (audioUri.startsWith('content://') && StorageAccessFramework) {
      const lrcExpectedName = `${baseName}.lrc`;
      const lastSlash = audioUri.lastIndexOf('%2F') !== -1 ? audioUri.lastIndexOf('%2F') : audioUri.lastIndexOf('/');
      if (lastSlash > 0) {
        const parentUri = audioUri.substring(0, lastSlash);
        try {
          const files = await StorageAccessFramework.readDirectoryAsync(parentUri);
          for (const fileUri of files) {
            const decodedFile = decodeURIComponent(fileUri);
            if (decodedFile.endsWith(lrcExpectedName)) {
              return await StorageAccessFramework.readAsStringAsync(fileUri);
            }
          }
        } catch {
          // ignore
        }
      }
    }
  } catch (e) {
    console.warn('Could not read companion lrc:', e);
  }
  return undefined;
}

async function scanSafDirectoryRecursive(
  directoryUri: string,
  folderName: string,
  tracks: Track[],
  visitedUris: Set<string>,
  depth = 0
): Promise<void> {
  if (depth > 5 || !StorageAccessFramework) return;

  try {
    const fileUris = await StorageAccessFramework.readDirectoryAsync(directoryUri);
    const lrcMap = new Map<string, string>();

    for (const uri of fileUris) {
      const decoded = decodeURIComponent(uri);
      const filename = decoded.split('/').pop()?.split('%2F').pop() || '';
      if (filename.toLowerCase().endsWith('.lrc')) {
        const base = removeFileExtension(filename);
        lrcMap.set(base.toLowerCase(), uri);
      }
    }

    for (const uri of fileUris) {
      if (visitedUris.has(uri)) continue;
      visitedUris.add(uri);

      const decoded = decodeURIComponent(uri);
      const filename = decoded.split('/').pop()?.split('%2F').pop() || '未知音频';

      if (isAudioFile(filename)) {
        const cleanName = removeFileExtension(filename);
        const ext = getFileExtension(filename).replace('.', '').toUpperCase();

        let lrcContent: string | undefined;
        const matchingLrcUri = lrcMap.get(cleanName.toLowerCase());
        if (matchingLrcUri) {
          try {
            lrcContent = await StorageAccessFramework.readAsStringAsync(matchingLrcUri);
          } catch {
            // ignore
          }
        }

        tracks.push({
          id: `local-${uri}`,
          title: cleanName,
          artist: '本地音乐',
          album: folderName,
          duration: 0,
          uri,
          isLocal: true,
          folderName,
          folderUri: directoryUri,
          format: ext,
          lrcContent,
        });
      } else if (!filename.includes('.')) {
        try {
          await scanSafDirectoryRecursive(uri, folderName, tracks, visitedUris, depth + 1);
        } catch {
          // ignore
        }
      }
    }
  } catch (err) {
    console.warn(`Failed scanning SAF dir ${directoryUri}:`, err);
  }
}

async function scanFileDirectoryRecursive(
  dirUri: string,
  folderName: string,
  tracks: Track[],
  visitedUris: Set<string>,
  depth = 0
): Promise<void> {
  if (depth > 5) return;

  try {
    const entries = await FileSystem.readDirectoryAsync(dirUri);
    for (const entry of entries) {
      const fullUri = dirUri.endsWith('/') ? `${dirUri}${entry}` : `${dirUri}/${entry}`;
      if (visitedUris.has(fullUri)) continue;
      visitedUris.add(fullUri);

      const info = await FileSystem.getInfoAsync(fullUri);
      if (info.exists && info.isDirectory) {
        await scanFileDirectoryRecursive(fullUri, folderName, tracks, visitedUris, depth + 1);
      } else if (info.exists && isAudioFile(entry)) {
        const cleanName = removeFileExtension(entry);
        const ext = getFileExtension(entry).replace('.', '').toUpperCase();
        const lrcContent = await tryReadCompanionLrc(fullUri, cleanName);

        tracks.push({
          id: `local-${fullUri}`,
          title: cleanName,
          artist: '本地音频',
          album: folderName,
          duration: 0,
          uri: fullUri,
          fileSize: 'size' in info ? (info.size as number) : undefined,
          isLocal: true,
          folderName,
          folderUri: dirUri,
          format: ext,
          lrcContent,
        });
      }
    }
  } catch (err) {
    console.warn(`Failed scanning file dir ${dirUri}:`, err);
  }
}

export async function scanFolder(folder: FolderRecord): Promise<Track[]> {
  const tracks: Track[] = [];
  const visited = new Set<string>();

  if (folder.uri.startsWith('content://') && StorageAccessFramework) {
    await scanSafDirectoryRecursive(folder.uri, folder.name, tracks, visited);
  } else if (folder.uri.startsWith('file://')) {
    await scanFileDirectoryRecursive(folder.uri, folder.name, tracks, visited);
  }

  return tracks;
}

export async function pickDirectorySaf(): Promise<FolderRecord | null> {
  try {
    if (StorageAccessFramework) {
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted && permissions.directoryUri) {
        const decoded = decodeURIComponent(permissions.directoryUri);
        const parts = decoded.split(':');
        const folderPart = parts.length > 1 ? parts[parts.length - 1] : decoded;
        const name = folderPart.split('/').filter(Boolean).pop() || '音乐文件夹';

        return {
          id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name,
          uri: permissions.directoryUri,
          songCount: 0,
          addedAt: Date.now(),
        };
      }
    }
  } catch (err) {
    console.warn('pickDirectorySaf error:', err);
  }
  return null;
}

export async function pickAudioFiles(): Promise<Track[]> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      multiple: true,
      copyToCacheDirectory: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return [];
    }

    const tracks: Track[] = [];
    for (const asset of result.assets) {
      const cleanName = removeFileExtension(asset.name || '未知音频');
      const ext = getFileExtension(asset.name || '').replace('.', '').toUpperCase() || 'MP3';
      const lrcContent = await tryReadCompanionLrc(asset.uri, cleanName);

      tracks.push({
        id: `local-file-${asset.uri}`,
        title: cleanName,
        artist: '导入音乐',
        album: '本地已选',
        duration: 0,
        uri: asset.uri,
        fileSize: asset.size,
        isLocal: true,
        folderName: '外部导入',
        folderUri: asset.uri,
        format: ext,
        lrcContent,
      });
    }

    return tracks;
  } catch (err) {
    console.warn('pickAudioFiles error:', err);
    return [];
  }
}
