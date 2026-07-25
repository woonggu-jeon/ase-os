import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { SubtitleTrack } from '@ase-os/shared';
import type { TranscriptionProvider } from '@ase-os/ai';
import { VIDEO_REPOSITORY, type VideoRepository } from './video-repository';
import { SUBTITLE_REPOSITORY, type SubtitleRepository } from './subtitle-repository';
import { TRANSCRIPTION_PROVIDER } from './transcription';

@Injectable()
export class GenerateSubtitlesService {
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
    @Inject(SUBTITLE_REPOSITORY) private readonly subtitles: SubtitleRepository,
    @Inject(TRANSCRIPTION_PROVIDER) private readonly provider: TranscriptionProvider,
  ) {}

  async generate(videoId: string): Promise<SubtitleTrack> {
    const video = this.videos.findById(videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const result = await this.provider.transcribe(video.storedPath);
    const track: SubtitleTrack = {
      videoId,
      language: result.language,
      engine: result.engine,
      segments: result.segments,
      generatedAt: new Date().toISOString(),
    };

    this.subtitles.save(track);
    return track;
  }

  get(videoId: string): SubtitleTrack {
    const track = this.subtitles.findByVideoId(videoId);
    if (!track) {
      throw new NotFoundException('No subtitles for this video');
    }
    return track;
  }
}
