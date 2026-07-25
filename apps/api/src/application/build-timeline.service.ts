import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Timeline } from '@ase-os/shared';
import { buildTimeline } from '@ase-os/timeline';
import { VIDEO_REPOSITORY, type VideoRepository } from './video-repository';
import { SCENE_REPOSITORY, type SceneRepository } from './scene-repository';
import { SUBTITLE_REPOSITORY, type SubtitleRepository } from './subtitle-repository';

/**
 * Composes a Timeline (a projection) from a video's metadata, scenes and subtitles.
 * Derived on demand — no separate persistence.
 */
@Injectable()
export class BuildTimelineService {
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
    @Inject(SCENE_REPOSITORY) private readonly scenes: SceneRepository,
    @Inject(SUBTITLE_REPOSITORY) private readonly subtitles: SubtitleRepository,
  ) {}

  build(videoId: string): Timeline {
    const video = this.videos.findById(videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return buildTimeline({
      videoId: video.id,
      durationSec: video.metadata.durationSec,
      scenes: this.scenes.findByVideoId(videoId)?.scenes,
      subtitles: this.subtitles.findByVideoId(videoId)?.segments,
    });
  }
}
