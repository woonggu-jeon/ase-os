import { run } from './run';

/**
 * Extract a single JPEG frame at `atSec` from a local media file to `outPath`.
 * Uses fast input seeking (-ss before -i). Free/offline.
 */
export async function extractFrame(
  mediaPath: string,
  atSec: number,
  outPath: string,
): Promise<void> {
  await run('ffmpeg', [
    '-ss',
    String(Math.max(0, atSec)),
    '-i',
    mediaPath,
    '-frames:v',
    '1',
    '-q:v',
    '2',
    '-y',
    '-loglevel',
    'error',
    outPath,
  ]);
}
