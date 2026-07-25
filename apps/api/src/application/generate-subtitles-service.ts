import type { SubtitleTrack } from '../domain/subtitle.js';
import type { VideoRepository } from '../infrastructure/video-repository.js';
import type { SubtitleRepository } from '../infrastructure/subtitle-repository.js';
import type { TranscriptionProvider } from './ai/transcription-provider.js';

export class VideoNotFoundError extends Error {
  constructor(videoId: string) {
    super(`Video not found: ${videoId}`);
    this.name = 'VideoNotFoundError';
  }
}

/** Application use case: generate (and retrieve) subtitles for an uploaded video. */
export class GenerateSubtitlesService {
  readonly #videos: VideoRepository;
  readonly #subtitles: SubtitleRepository;
  readonly #provider: TranscriptionProvider;

  constructor(
    videos: VideoRepository,
    subtitles: SubtitleRepository,
    provider: TranscriptionProvider,
  ) {
    this.#videos = videos;
    this.#subtitles = subtitles;
    this.#provider = provider;
  }

  async generate(videoId: string): Promise<SubtitleTrack> {
    const video = this.#videos.findById(videoId);
    if (!video) {
      throw new VideoNotFoundError(videoId);
    }

    const result = await this.#provider.transcribe(video.storedPath);
    const track: SubtitleTrack = {
      videoId,
      language: result.language,
      engine: result.engine,
      segments: result.segments,
      generatedAt: new Date().toISOString(),
    };

    this.#subtitles.save(track);
    return track;
  }

  get(videoId: string): SubtitleTrack | undefined {
    return this.#subtitles.findByVideoId(videoId);
  }
}
