export interface TimelineClip {
  readonly index: number;
  readonly startSec: number;
  readonly endSec: number;
}

export interface TimelineSubtitle {
  readonly startSec: number;
  readonly endSec: number;
  readonly text: string;
}

/** A composed edit timeline derived from a video's scenes and subtitles. */
export interface Timeline {
  readonly videoId: string;
  readonly durationSec: number;
  /** Video track: one clip per detected scene (or a single clip if none). */
  readonly clips: readonly TimelineClip[];
  /** Subtitle track. */
  readonly subtitles: readonly TimelineSubtitle[];
  /** ISO-8601 timestamp. */
  readonly createdAt: string;
}
