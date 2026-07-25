import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Request, Response } from 'express';
import {
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_VIDEO_SIZE_BYTES,
  isAllowedVideoMimeType,
  toVideoView,
  type SceneList,
  type SubtitleTrack,
  type Timeline,
  type VideoView,
} from '@ase-os/shared';
import { UploadVideoService } from '../../application/upload-video.service';
import { GenerateSubtitlesService } from '../../application/generate-subtitles.service';
import { DetectScenesService } from '../../application/detect-scenes.service';
import { BuildTimelineService } from '../../application/build-timeline.service';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

const uploadOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      if (!existsSync(UPLOAD_DIR)) {
        mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(16).slice(2, 10)}${ext}`);
    },
  }),
  limits: { fileSize: MAX_VIDEO_SIZE_BYTES },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ): void => {
    cb(null, isAllowedVideoMimeType(file.mimetype));
  },
};

@Controller('videos')
export class VideosController {
  constructor(
    private readonly uploads: UploadVideoService,
    private readonly subtitles: GenerateSubtitlesService,
    private readonly scenes: DetectScenesService,
    private readonly timeline: BuildTimelineService,
  ) {}

  @Post()
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('video', uploadOptions))
  async upload(@UploadedFile() file?: Express.Multer.File): Promise<VideoView> {
    if (!file) {
      throw new BadRequestException(
        `No valid video file. Allowed types: ${ALLOWED_VIDEO_MIME_TYPES.join(', ')}`,
      );
    }
    const video = await this.uploads.register({
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storedPath: file.path,
    });
    return toVideoView(video);
  }

  @Get()
  list(): VideoView[] {
    return this.uploads.list().map(toVideoView);
  }

  @Get(':id')
  get(@Param('id') id: string): VideoView {
    const video = this.uploads.findById(id);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    return toVideoView(video);
  }

  @Post(':id/subtitles')
  @HttpCode(201)
  generateSubtitles(@Param('id') id: string): Promise<SubtitleTrack> {
    return this.subtitles.generate(id);
  }

  @Get(':id/subtitles')
  getSubtitles(@Param('id') id: string): SubtitleTrack {
    return this.subtitles.get(id);
  }

  @Post(':id/scenes')
  @HttpCode(201)
  detectScenes(@Param('id') id: string): Promise<SceneList> {
    return this.scenes.detect(id);
  }

  @Get(':id/scenes')
  getScenes(@Param('id') id: string): SceneList {
    return this.scenes.get(id);
  }

  // Timeline is a projection over metadata + scenes + subtitles, built on demand.
  @Get(':id/timeline')
  getTimeline(@Param('id') id: string): Timeline {
    return this.timeline.build(id);
  }

  // Serve the stored video file for playback. res.sendFile handles Range requests
  // (seeking) and Content-Type automatically.
  @Get(':id/file')
  streamFile(@Param('id') id: string, @Res() res: Response): void {
    const video = this.uploads.findById(id);
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }
    res.sendFile(video.storedPath);
  }
}
