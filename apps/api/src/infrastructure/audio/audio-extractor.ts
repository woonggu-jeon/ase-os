import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/** Whisper models expect 16 kHz mono audio. */
export const WHISPER_SAMPLE_RATE = 16_000;

/**
 * Convert any ffmpeg-readable media file into a 16 kHz mono 16-bit WAV file and
 * return its path. Uses the local `ffmpeg` binary (no network, no cost).
 */
export function extractWav16k(mediaPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const outDir = mkdtempSync(path.join(tmpdir(), 'ase-os-audio-'));
    const outPath = path.join(outDir, 'audio.wav');

    const ffmpeg = spawn('ffmpeg', [
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

    let stderr = '';
    ffmpeg.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    ffmpeg.on('error', reject);
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr.trim()}`));
        return;
      }
      resolve(outPath);
    });
  });
}
