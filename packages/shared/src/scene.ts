export interface Scene {
  readonly index: number;
  readonly startSec: number;
  readonly endSec: number;
}

export interface SceneList {
  readonly videoId: string;
  /** Identifier of the detector, e.g. `ffmpeg-scene:0.4`. */
  readonly engine: string;
  readonly scenes: readonly Scene[];
  /** ISO-8601 timestamp. */
  readonly detectedAt: string;
}
