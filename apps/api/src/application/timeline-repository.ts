import type { Timeline } from '@ase-os/shared';

export const TIMELINE_REPOSITORY = Symbol('TimelineRepository');

/** Stores user-edited timelines. Absence means "use the auto-derived timeline". */
export interface TimelineRepository {
  save(timeline: Timeline): void;
  findByVideoId(videoId: string): Timeline | undefined;
  delete(videoId: string): void;
}
