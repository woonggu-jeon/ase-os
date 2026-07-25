import { Inject, Injectable } from '@nestjs/common';
import type { Video } from '@ase-os/shared';
import type { VideoRepository } from '../../application/video-repository';
import { DATABASE, type Db } from '../database/sqlite';

interface VideoRow {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  stored_path: string;
  duration_sec: number;
  width: number | null;
  height: number | null;
  video_codec: string | null;
  has_audio: number;
  uploaded_at: string;
}

function toVideo(row: VideoRow): Video {
  return {
    id: row.id,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    storedPath: row.stored_path,
    metadata: {
      durationSec: row.duration_sec,
      width: row.width,
      height: row.height,
      videoCodec: row.video_codec,
      hasAudio: row.has_audio === 1,
    },
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
           (id, original_name, mime_type, size_bytes, stored_path,
            duration_sec, width, height, video_codec, has_audio, uploaded_at)
         VALUES
           (@id, @originalName, @mimeType, @sizeBytes, @storedPath,
            @durationSec, @width, @height, @videoCodec, @hasAudio, @uploadedAt)`,
      )
      .run({
        id: video.id,
        originalName: video.originalName,
        mimeType: video.mimeType,
        sizeBytes: video.sizeBytes,
        storedPath: video.storedPath,
        durationSec: video.metadata.durationSec,
        width: video.metadata.width,
        height: video.metadata.height,
        videoCodec: video.metadata.videoCodec,
        hasAudio: video.metadata.hasAudio ? 1 : 0,
        uploadedAt: video.uploadedAt,
      });
  }

  findById(id: string): Video | undefined {
    const row = this.db.prepare('SELECT * FROM videos WHERE id = ?').get(id) as
      VideoRow | undefined;
    return row ? toVideo(row) : undefined;
  }

  list(): readonly Video[] {
    const rows = this.db
      .prepare('SELECT * FROM videos ORDER BY uploaded_at DESC')
      .all() as VideoRow[];
    return rows.map(toVideo);
  }
}
