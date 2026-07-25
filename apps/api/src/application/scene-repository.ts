import type { SceneList } from '@ase-os/shared';

export const SCENE_REPOSITORY = Symbol('SceneRepository');

export interface SceneRepository {
  save(scenes: SceneList): void;
  findByVideoId(videoId: string): SceneList | undefined;
}
