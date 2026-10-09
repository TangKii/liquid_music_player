import { LyricLine } from '@/types/music';

/**
 * Parse .lrc format lyrics into structured timestamped lines
 * Supports [mm:ss.xx] and [mm:ss.xxx] formats
 */
export function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText || typeof lrcText !== 'string') {
    return [];
  }

  const lines = lrcText.split(/\r?\n/);
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;
  const result: LyricLine[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Skip metadata tags like [ar:artist] or [ti:title]
    if (/^\[(ti|ar|al|by|offset|length):/i.test(trimmed)) {
      continue;
    }

    const timestamps: number[] = [];
    let match: RegExpExecArray | null;
    timeRegex.lastIndex = 0;

    while ((match = timeRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const msPart = match[3] || '0';
      const milliseconds = msPart.length === 2 ? parseInt(msPart, 10) * 10 : parseInt(msPart, 10);
      const totalSeconds = minutes * 60 + seconds + milliseconds / 1000;
      timestamps.push(totalSeconds);
    }

    const text = trimmed.replace(timeRegex, '').trim();
    if (timestamps.length > 0 && text) {
      for (const time of timestamps) {
        result.push({ time, text });
      }
    }
  }

  // Sort chronologically
  result.sort((a, b) => a.time - b.time);
  return result;
}

/**
 * Find the active lyric line index for the current playback position
 */
export function getActiveLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  if (!lyrics || lyrics.length === 0) return -1;
  if (currentTime < lyrics[0].time) return 0;

  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time - 0.2) {
      return i;
    }
  }

  return 0;
}
