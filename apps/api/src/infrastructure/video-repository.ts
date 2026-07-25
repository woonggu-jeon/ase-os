import type { Video } from '../domain/video.js';

/**
 * Metadata store for uploaded videos.
 *
 * Phase 1 uses an in-memory implementation (see ADR 0001): file bytes live on disk
 * under uploads/, while this holds their metadata for the current process only.
 * The interface lets a durable store replace it later without touching callers.
 */
export interface VideoRepository {
  save(video: Video): void;
  findById(id: string): Video | undefined;
  list(): readonly Video[];
}

export class InMemoryVideoRepository implements VideoRepository {
  readonly #videos = new Map<string, Video>();

  save(video: Video): void {
    this.#videos.set(video.id, video);
  }

  findById(id: string): Video | undefined {
    return this.#videos.get(id);
  }

  list(): readonly Video[] {
    return [...this.#videos.values()];
  }
}
