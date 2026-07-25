import { mkdirSync, rmSync } from 'node:fs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Scene, SceneList } from '@ase-os/shared';
import { detectScenes, extractFrame, DEFAULT_SCENE_THRESHOLD } from '@ase-os/ffmpeg';
import { VIDEO_REPOSITORY, type VideoRepository } from './video-repository';
import { SCENE_REPOSITORY, type SceneRepository } from './scene-repository';
import { thumbnailsDir, thumbnailPath } from '../infrastructure/thumbnails';

@Injectable()
export class DetectScenesService {
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
    @Inject(SCENE_REPOSITORY) private readonly scenes: SceneRepository,
  ) {}

  async detect(videoId: string, thresholdOverride?: number): Promise<SceneList> {
    const video = this.videos.findById(videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const envThreshold = Number(process.env.SCENE_THRESHOLD);
    const raw =
      thresholdOverride ??
      (Number.isFinite(envThreshold) && envThreshold > 0
        ? envThreshold
        : DEFAULT_SCENE_THRESHOLD);
    // Keep within a sane range so a bad input can't disable detection.
    const threshold = Math.min(1, Math.max(0.05, raw));

    const detected = await detectScenes(video.storedPath, threshold);
    const scenes: Scene[] = detected.map((s) => ({
      index: s.index,
      startSec: s.startSec,
      endSec: s.endSec,
    }));

    await this.generateThumbnails(videoId, video.storedPath, scenes);

    const list: SceneList = {
      videoId,
      engine: `ffmpeg-scene:${threshold}`,
      scenes,
      detectedAt: new Date().toISOString(),
    };

    this.scenes.save(list);
    return list;
  }

  /** Best-effort: one JPEG per scene (midpoint). Failures don't fail detection. */
  private async generateThumbnails(
    videoId: string,
    storedPath: string,
    scenes: readonly Scene[],
  ): Promise<void> {
    const dir = thumbnailsDir(videoId);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    await Promise.allSettled(
      scenes.map((s) =>
        extractFrame(storedPath, (s.startSec + s.endSec) / 2, thumbnailPath(videoId, s.index)),
      ),
    );
  }

  get(videoId: string): SceneList {
    const list = this.scenes.findByVideoId(videoId);
    if (!list) {
      throw new NotFoundException('No scenes for this video');
    }
    return list;
  }
}
