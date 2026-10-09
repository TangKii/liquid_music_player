export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  uri: string;
  coverUri?: string;
  isLocal: boolean;
  folderName?: string;
  folderUri?: string;
  fileSize?: number;
  format?: string;
  lrcContent?: string;
}

export interface FolderRecord {
  id: string;
  name: string;
  uri: string;
  songCount: number;
  addedAt: number;
}

export type RepeatMode = 'all' | 'one' | 'shuffle';
