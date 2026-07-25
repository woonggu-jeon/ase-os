import { Module } from '@nestjs/common';
import { HealthController } from './interface/http/health.controller';
import { VideosController } from './interface/http/videos.controller';
import { UploadVideoService } from './application/upload-video.service';
import { GenerateSubtitlesService } from './application/generate-subtitles.service';
import { VIDEO_REPOSITORY } from './application/video-repository';
import { SUBTITLE_REPOSITORY } from './application/subtitle-repository';
import { TRANSCRIPTION_PROVIDER } from './application/transcription-provider';
import { DATABASE, createDatabase } from './infrastructure/database/sqlite';
import { SqliteVideoRepository } from './infrastructure/persistence/sqlite-video-repository';
import { SqliteSubtitleRepository } from './infrastructure/persistence/sqlite-subtitle-repository';
import { WhisperCppProvider } from './infrastructure/ai/whisper-cpp-provider';

// Composition root (see ADR 0001/0003): NestJS modules wire the layers together.
@Module({
  controllers: [HealthController, VideosController],
  providers: [
    UploadVideoService,
    GenerateSubtitlesService,
    { provide: DATABASE, useFactory: createDatabase },
    { provide: VIDEO_REPOSITORY, useClass: SqliteVideoRepository },
    { provide: SUBTITLE_REPOSITORY, useClass: SqliteSubtitleRepository },
    { provide: TRANSCRIPTION_PROVIDER, useClass: WhisperCppProvider },
  ],
})
export class AppModule {}
