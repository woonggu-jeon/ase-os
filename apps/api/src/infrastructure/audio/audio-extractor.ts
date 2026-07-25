import { spawn } from 'node:child_process';

/** Sample rate Whisper models expect. */
export const WHISPER_SAMPLE_RATE = 16_000;

export interface ExtractedAudio {
  readonly samples: Float32Array;
  readonly sampleRate: number;
  readonly durationSec: number;
}

/**
 * Decode any ffmpeg-readable media file into mono 16 kHz float32 PCM samples.
 * Uses the local `ffmpeg` binary (no network, no cost).
 */
export function extractPcm16kMono(mediaPath: string): Promise<ExtractedAudio> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i',
      mediaPath,
      '-ar',
      String(WHISPER_SAMPLE_RATE),
      '-ac',
      '1',
      '-f',
      'f32le',
      '-acodec',
      'pcm_f32le',
      '-loglevel',
      'error',
      'pipe:1',
    ]);

    const chunks: Buffer[] = [];
    let stderr = '';

    ffmpeg.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    ffmpeg.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    ffmpeg.on('error', reject);
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr.trim()}`));
        return;
      }
      const buffer = Buffer.concat(chunks);
      const sampleCount = Math.floor(buffer.byteLength / Float32Array.BYTES_PER_ELEMENT);
      // Copy into a standalone, correctly-aligned Float32Array.
      const samples = new Float32Array(sampleCount);
      for (let i = 0; i < sampleCount; i += 1) {
        samples[i] = buffer.readFloatLE(i * Float32Array.BYTES_PER_ELEMENT);
      }
      resolve({
        samples,
        sampleRate: WHISPER_SAMPLE_RATE,
        durationSec: sampleCount / WHISPER_SAMPLE_RATE,
      });
    });
  });
}
