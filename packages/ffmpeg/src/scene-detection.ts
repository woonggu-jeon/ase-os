import { run } from './run';

export interface DetectedScene {
  readonly index: number;
  readonly startSec: number;
  readonly endSec: number;
}

/** Default ffmpeg scene-change score threshold (0..1). Higher = fewer cuts. */
export const DEFAULT_SCENE_THRESHOLD = 0.4;

/**
 * Detect scene boundaries in a local media file using ffmpeg's `scene` filter.
 * Returns contiguous scenes covering [0, duration]. Free/offline (local ffmpeg).
 */
export async function detectScenes(
  mediaPath: string,
  threshold: number = DEFAULT_SCENE_THRESHOLD,
): Promise<DetectedScene[]> {
  const duration = await probeDurationSec(mediaPath);
  const cutTimes = await sceneCutTimes(mediaPath, threshold);

  const boundaries = [0, ...cutTimes, duration].filter(
    (t) => Number.isFinite(t) && t >= 0 && t <= duration,
  );
  const sorted = [...new Set(boundaries)].sort((a, b) => a - b);

  const scenes: DetectedScene[] = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const start = sorted[i];
    const end = sorted[i + 1];
    if (end - start < 0.01) continue; // skip zero-length
    scenes.push({ index: scenes.length, startSec: round2(start), endSec: round2(end) });
  }

  // Fallback: a video with no detected cuts is a single scene.
  if (scenes.length === 0 && duration > 0) {
    scenes.push({ index: 0, startSec: 0, endSec: round2(duration) });
  }

  return scenes;
}

async function probeDurationSec(mediaPath: string): Promise<number> {
  const { stdout } = await run('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=nokey=1:noprint_wrappers=1',
    mediaPath,
  ]);
  return Number(stdout.trim()) || 0;
}

const PTS_TIME = /pts_time:([0-9]+(?:\.[0-9]+)?)/g;

async function sceneCutTimes(mediaPath: string, threshold: number): Promise<number[]> {
  // showinfo prints one line per selected (scene-change) frame to stderr.
  const { stderr } = await run('ffmpeg', [
    '-i',
    mediaPath,
    '-filter:v',
    `select='gt(scene,${threshold})',showinfo`,
    '-an',
    '-f',
    'null',
    '-',
  ]);

  const times: number[] = [];
  for (const match of stderr.matchAll(PTS_TIME)) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) times.push(value);
  }
  return times;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
