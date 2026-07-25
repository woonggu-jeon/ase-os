import type { Scene, SubtitleSegment, Timeline, TimelineClip } from '@ase-os/shared';

export interface BuildTimelineInput {
  readonly videoId: string;
  readonly durationSec: number;
  readonly scenes?: readonly Scene[];
  readonly subtitles?: readonly SubtitleSegment[];
}

/**
 * Compose a Timeline from a video's metadata, detected scenes and subtitles.
 * Framework-agnostic and pure aside from the createdAt timestamp.
 */
export function buildTimeline(input: BuildTimelineInput): Timeline {
  const clips: TimelineClip[] =
    input.scenes && input.scenes.length > 0
      ? input.scenes.map((s) => ({
          index: s.index,
          startSec: s.startSec,
          endSec: s.endSec,
        }))
      : [{ index: 0, startSec: 0, endSec: input.durationSec }];

  const subtitles = (input.subtitles ?? []).map((s) => ({
    startSec: s.startSec,
    endSec: s.endSec,
    text: s.text,
  }));

  return {
    videoId: input.videoId,
    durationSec: input.durationSec,
    clips,
    subtitles,
    createdAt: new Date().toISOString(),
  };
}
