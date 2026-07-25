import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { Video } from '../domain/video';
import { VIDEO_REPOSITORY, type VideoRepository } from './video-repository';

/** A file already persisted to disk by the delivery layer (multer). */
export interface StoredFile {
  readonly originalName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly storedPath: string;
}

@Injectable()
export class UploadVideoService {
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly repository: VideoRepository,
  ) {}

  register(file: StoredFile): Video {
    const video: Video = {
      id: randomUUID(),
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      storedPath: file.storedPath,
      uploadedAt: new Date().toISOString(),
    };
    this.repository.save(video);
    return video;
  }

  list(): readonly Video[] {
    return this.repository.list();
  }

  findById(id: string): Video | undefined {
    return this.repository.findById(id);
  }
}
