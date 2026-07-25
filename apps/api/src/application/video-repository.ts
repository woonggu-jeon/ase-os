import type { Video } from '@ase-os/shared';

/** DI token for the VideoRepository interface (interfaces have no runtime value). */
export const VIDEO_REPOSITORY = Symbol('VideoRepository');

export interface VideoRepository {
  save(video: Video): void;
  findById(id: string): Video | undefined;
  list(): readonly Video[];
}
