import type {
  Scene,
  SubtitleSegment,
  Timeline,
  TimelineClip,
  TimelineSubtitle,
} from '@ase-os/shared';

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

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Coerce arbitrary client input into a valid, edited Timeline. Duration is taken
 * from the authoritative video metadata, not the client. Invalid entries are dropped.
 */
export function sanitizeTimeline(
  videoId: string,
  durationSec: number,
  raw: unknown,
): Timeline {
  const body = record(raw);

  const clipsInput = Array.isArray(body.clips) ? body.clips : [];
  const clips: TimelineClip[] = clipsInput
    .map((c) => record(c))
    .map((c) => ({ startSec: num(c.startSec), endSec: num(c.endSec) }))
    .filter((c) => c.endSec > c.startSec)
    .map((c, index) => ({ index, startSec: c.startSec, endSec: c.endSec }));

  const subsInput = Array.isArray(body.subtitles) ? body.subtitles : [];
  const subtitles: TimelineSubtitle[] = subsInput
    .map((s) => record(s))
    .map((s) => ({
      startSec: num(s.startSec),
      endSec: num(s.endSec),
      text: typeof s.text === 'string' ? s.text.trim() : '',
    }))
    .filter((s) => s.text !== '' && s.endSec >= s.startSec);

  return {
    videoId,
    durationSec,
    clips,
    subtitles,
    createdAt: new Date().toISOString(),
  };
}
