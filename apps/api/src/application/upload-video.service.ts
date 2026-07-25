import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Video } from '@ase-os/shared';
import { probeMedia } from '@ase-os/ffmpeg';
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
  constructor(@Inject(VIDEO_REPOSITORY) private readonly repository: VideoRepository) {}

  async register(file: StoredFile): Promise<Video> {
    let info;
    try {
      info = await probeMedia(file.storedPath);
    } catch {
      // Not a readable media file — remove the orphaned upload and report clearly.
      rmSync(file.storedPath, { force: true });
      throw new BadRequestException('Could not read the uploaded file as media');
    }

    const video: Video = {
      id: randomUUID(),
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      storedPath: file.storedPath,
      metadata: {
        durationSec: info.durationSec,
        width: info.width,
        height: info.height,
        videoCodec: info.videoCodec,
        hasAudio: info.hasAudio,
      },
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
