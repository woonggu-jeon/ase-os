import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Timeline } from '@ase-os/shared';
import { buildTimeline, sanitizeTimeline } from '@ase-os/timeline';
import { VIDEO_REPOSITORY, type VideoRepository } from './video-repository';
import { SCENE_REPOSITORY, type SceneRepository } from './scene-repository';
import { SUBTITLE_REPOSITORY, type SubtitleRepository } from './subtitle-repository';
import { TIMELINE_REPOSITORY, type TimelineRepository } from './timeline-repository';

@Injectable()
export class TimelineService {
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
    @Inject(SCENE_REPOSITORY) private readonly scenes: SceneRepository,
    @Inject(SUBTITLE_REPOSITORY) private readonly subtitles: SubtitleRepository,
    @Inject(TIMELINE_REPOSITORY) private readonly timelines: TimelineRepository,
  ) {}

  /** Return the user-edited timeline if saved, otherwise the auto-derived one. */
  get(videoId: string): Timeline {
    return this.timelines.findByVideoId(videoId) ?? this.derive(videoId);
  }

  /** Persist an edited timeline (client input is sanitized). */
  save(videoId: string, raw: unknown): Timeline {
    const video = this.videos.findById(videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    const timeline = sanitizeTimeline(videoId, video.metadata.durationSec, raw);
    this.timelines.save(timeline);
    return timeline;
  }

  /** Discard the saved edit and revert to the auto-derived timeline. */
  reset(videoId: string): Timeline {
    if (!this.videos.findById(videoId)) {
      throw new NotFoundException('Video not found');
    }
    this.timelines.delete(videoId);
    return this.derive(videoId);
  }

  private derive(videoId: string): Timeline {
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
