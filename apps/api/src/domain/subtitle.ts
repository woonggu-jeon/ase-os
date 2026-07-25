// Domain layer: subtitle types and rules only. No I/O, no framework imports.

export interface SubtitleSegment {
  readonly startSec: number;
  readonly endSec: number;
  readonly text: string;
}

export interface SubtitleTrack {
  readonly videoId: string;
  /** Detected language code, or null if unknown. */
  readonly language: string | null;
  /** Identifier of the engine that produced this track, e.g. the model name. */
  readonly engine: string;
  readonly segments: readonly SubtitleSegment[];
  /** ISO-8601 timestamp. */
  readonly generatedAt: string;
}
