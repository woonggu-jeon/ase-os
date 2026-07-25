import type { SubtitleTrack } from '../domain/subtitle.js';

/**
 * Stores generated subtitle tracks keyed by video id.
 * Phase 1 uses an in-memory implementation (see ADR 0001); not persisted across restarts.
 */
export interface SubtitleRepository {
  save(track: SubtitleTrack): void;
  findByVideoId(videoId: string): SubtitleTrack | undefined;
}

export class InMemorySubtitleRepository implements SubtitleRepository {
  readonly #tracks = new Map<string, SubtitleTrack>();

  save(track: SubtitleTrack): void {
    this.#tracks.set(track.videoId, track);
  }

  findByVideoId(videoId: string): SubtitleTrack | undefined {
    return this.#tracks.get(videoId);
  }
}
