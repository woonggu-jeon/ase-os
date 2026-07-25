import { randomUUID } from 'node:crypto';
import type { Video } from '../domain/video.js';
import type { VideoRepository } from '../infrastructure/video-repository.js';

/** A file already persisted to disk by the delivery layer (e.g. multer). */
export interface StoredFile {
  readonly originalName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly storedPath: string;
}

/** Application use case: register an uploaded video and expose read queries. */
export class UploadVideoService {
  readonly #repository: VideoRepository;

  constructor(repository: VideoRepository) {
    this.#repository = repository;
  }

  register(file: StoredFile): Video {
    const video: Video = {
      id: randomUUID(),
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      storedPath: file.storedPath,
      uploadedAt: new Date().toISOString(),
    };
    this.#repository.save(video);
    return video;
  }

  list(): readonly Video[] {
    return this.#repository.list();
  }

  findById(id: string): Video | undefined {
    return this.#repository.findById(id);
  }
}
