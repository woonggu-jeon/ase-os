import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { run } from './run';

/** Whisper models expect 16 kHz mono audio. */
export const WHISPER_SAMPLE_RATE = 16_000;

/** Return true if the media file contains at least one audio stream. */
export async function hasAudioStream(mediaPath: string): Promise<boolean> {
  const { stdout } = await run('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'a',
    '-show_entries',
    'stream=index',
    '-of',
    'csv=p=0',
    mediaPath,
  ]);
  return stdout.trim().length > 0;
}

/**
 * Convert any ffmpeg-readable media file into a 16 kHz mono 16-bit WAV file and
 * return its path (in a fresh temp directory the caller should clean up).
 */
export async function extractWav16k(mediaPath: string): Promise<string> {
  const outDir = mkdtempSync(path.join(tmpdir(), 'ase-os-audio-'));
  const outPath = path.join(outDir, 'audio.wav');

  await run('ffmpeg', [
    '-i',
    mediaPath,
    '-ar',
    String(WHISPER_SAMPLE_RATE),
    '-ac',
    '1',
    '-c:a',
    'pcm_s16le',
    '-f',
    'wav',
    '-loglevel',
    'error',
    '-y',
    outPath,
  ]);

  return outPath;
}
