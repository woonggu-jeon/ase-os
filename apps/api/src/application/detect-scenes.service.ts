import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Scene, SceneList } from '@ase-os/shared';
import { detectScenes, DEFAULT_SCENE_THRESHOLD } from '@ase-os/ffmpeg';
import { VIDEO_REPOSITORY, type VideoRepository } from './video-repository';
import { SCENE_REPOSITORY, type SceneRepository } from './scene-repository';

@Injectable()
export class DetectScenesService {
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
    @Inject(SCENE_REPOSITORY) private readonly scenes: SceneRepository,
  ) {}

  async detect(videoId: string): Promise<SceneList> {
    const video = this.videos.findById(videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const threshold = Number(process.env.SCENE_THRESHOLD) || DEFAULT_SCENE_THRESHOLD;
    const detected = await detectScenes(video.storedPath, threshold);
    const scenes: Scene[] = detected.map((s) => ({
      index: s.index,
      startSec: s.startSec,
      endSec: s.endSec,
    }));

    const list: SceneList = {
      videoId,
      engine: `ffmpeg-scene:${threshold}`,
      scenes,
      detectedAt: new Date().toISOString(),
    };

    this.scenes.save(list);
    return list;
  }

  get(videoId: string): SceneList {
    const list = this.scenes.findByVideoId(videoId);
    if (!list) {
      throw new NotFoundException('No scenes for this video');
    }
    return list;
  }
}
