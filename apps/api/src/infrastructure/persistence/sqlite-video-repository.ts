import { Inject, Injectable } from '@nestjs/common';
import type { Video } from '../../domain/video';
import type { VideoRepository } from '../../application/video-repository';
import { DATABASE, type Db } from '../database/sqlite';

interface VideoRow {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  stored_path: string;
  uploaded_at: string;
}

function toVideo(row: VideoRow): Video {
  return {
    id: row.id,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    storedPath: row.stored_path,
    uploadedAt: row.uploaded_at,
  };
}

@Injectable()
export class SqliteVideoRepository implements VideoRepository {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  save(video: Video): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO videos
           (id, original_name, mime_type, size_bytes, stored_path, uploaded_at)
         VALUES (@id, @originalName, @mimeType, @sizeBytes, @storedPath, @uploadedAt)`,
      )
      .run(video);
  }

  findById(id: string): Video | undefined {
    const row = this.db.prepare('SELECT * FROM videos WHERE id = ?').get(id) as
      | VideoRow
      | undefined;
    return row ? toVideo(row) : undefined;
  }

  list(): readonly Video[] {
    const rows = this.db
      .prepare('SELECT * FROM videos ORDER BY uploaded_at DESC')
      .all() as VideoRow[];
    return rows.map(toVideo);
  }
}
