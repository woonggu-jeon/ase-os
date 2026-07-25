import type { SubtitleTrack } from '@ase-os/shared';

export const SUBTITLE_REPOSITORY = Symbol('SubtitleRepository');

export interface SubtitleRepository {
  save(track: SubtitleTrack): void;
  findByVideoId(videoId: string): SubtitleTrack | undefined;
}
