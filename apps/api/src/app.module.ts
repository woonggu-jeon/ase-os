import { Module } from '@nestjs/common';
import {
  MockTranscriptionProvider,
  WhisperCppProvider,
  type TranscriptionProvider,
} from '@ase-os/ai';
import { HealthController } from './interface/http/health.controller';
import { VideosController } from './interface/http/videos.controller';
import { UploadVideoService } from './application/upload-video.service';
import { GenerateSubtitlesService } from './application/generate-subtitles.service';
import { DetectScenesService } from './application/detect-scenes.service';
import { TimelineService } from './application/timeline.service';
import { VIDEO_REPOSITORY } from './application/video-repository';
import { SUBTITLE_REPOSITORY } from './application/subtitle-repository';
import { SCENE_REPOSITORY } from './application/scene-repository';
import { TIMELINE_REPOSITORY } from './application/timeline-repository';
import { TRANSCRIPTION_PROVIDER } from './application/transcription';
import { DATABASE, createDatabase } from './infrastructure/database/sqlite';
import { SqliteVideoRepository } from './infrastructure/persistence/sqlite-video-repository';
import { SqliteSubtitleRepository } from './infrastructure/persistence/sqlite-subtitle-repository';
import { SqliteSceneRepository } from './infrastructure/persistence/sqlite-scene-repository';
import { SqliteTimelineRepository } from './infrastructure/persistence/sqlite-timeline-repository';

// Composition root (ADR 0001/0003/0004): NestJS wires the layers and package modules.
@Module({
  controllers: [HealthController, VideosController],
  providers: [
    UploadVideoService,
    GenerateSubtitlesService,
    DetectScenesService,
    TimelineService,
    { provide: DATABASE, useFactory: createDatabase },
    { provide: VIDEO_REPOSITORY, useClass: SqliteVideoRepository },
    { provide: SUBTITLE_REPOSITORY, useClass: SqliteSubtitleRepository },
    { provide: SCENE_REPOSITORY, useClass: SqliteSceneRepository },
    { provide: TIMELINE_REPOSITORY, useClass: SqliteTimelineRepository },
    {
      // Transcription engine (ADR 0002/0003). TRANSCRIPTION_ENGINE=mock uses the
      // dependency-free provider; otherwise free/local Whisper.cpp.
      provide: TRANSCRIPTION_PROVIDER,
      useFactory: (): TranscriptionProvider =>
        process.env.TRANSCRIPTION_ENGINE === 'mock'
          ? new MockTranscriptionProvider()
          : new WhisperCppProvider(
              process.env.WHISPER_MODEL ?? 'base',
              process.env.WHISPER_LANGUAGE ?? 'auto',
            ),
    },
  ],
})
export class AppModule {}
