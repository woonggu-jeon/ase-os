import { Module } from '@nestjs/common';
import { WhisperCppProvider } from '@ase-os/ai';
import { HealthController } from './interface/http/health.controller';
import { VideosController } from './interface/http/videos.controller';
import { UploadVideoService } from './application/upload-video.service';
import { GenerateSubtitlesService } from './application/generate-subtitles.service';
import { DetectScenesService } from './application/detect-scenes.service';
import { VIDEO_REPOSITORY } from './application/video-repository';
import { SUBTITLE_REPOSITORY } from './application/subtitle-repository';
import { SCENE_REPOSITORY } from './application/scene-repository';
import { TRANSCRIPTION_PROVIDER } from './application/transcription';
import { DATABASE, createDatabase } from './infrastructure/database/sqlite';
import { SqliteVideoRepository } from './infrastructure/persistence/sqlite-video-repository';
import { SqliteSubtitleRepository } from './infrastructure/persistence/sqlite-subtitle-repository';
import { SqliteSceneRepository } from './infrastructure/persistence/sqlite-scene-repository';

// Composition root (ADR 0001/0003/0004): NestJS wires the layers and package modules.
@Module({
  controllers: [HealthController, VideosController],
  providers: [
    UploadVideoService,
    GenerateSubtitlesService,
    DetectScenesService,
    { provide: DATABASE, useFactory: createDatabase },
    { provide: VIDEO_REPOSITORY, useClass: SqliteVideoRepository },
    { provide: SUBTITLE_REPOSITORY, useClass: SqliteSubtitleRepository },
    { provide: SCENE_REPOSITORY, useClass: SqliteSceneRepository },
    {
      // Free/local transcription engine (ADR 0002/0003). Swap the class to change engines.
      provide: TRANSCRIPTION_PROVIDER,
      useFactory: () => new WhisperCppProvider(process.env.WHISPER_MODEL ?? 'tiny'),
    },
  ],
})
export class AppModule {}
