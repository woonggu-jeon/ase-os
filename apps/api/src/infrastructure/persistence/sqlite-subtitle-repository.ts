import { Inject, Injectable } from '@nestjs/common';
import type { SubtitleSegment, SubtitleTrack } from '../../domain/subtitle';
import type { SubtitleRepository } from '../../application/subtitle-repository';
import { DATABASE, type Db } from '../database/sqlite';

interface SubtitleRow {
  video_id: string;
  language: string | null;
  engine: string;
  segments_json: string;
  generated_at: string;
}

@Injectable()
export class SqliteSubtitleRepository implements SubtitleRepository {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  save(track: SubtitleTrack): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO subtitle_tracks
           (video_id, language, engine, segments_json, generated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        track.videoId,
        track.language,
        track.engine,
        JSON.stringify(track.segments),
        track.generatedAt,
      );
  }

  findByVideoId(videoId: string): SubtitleTrack | undefined {
    const row = this.db
      .prepare('SELECT * FROM subtitle_tracks WHERE video_id = ?')
      .get(videoId) as SubtitleRow | undefined;
    if (!row) return undefined;

    const segments = JSON.parse(row.segments_json) as SubtitleSegment[];
    return {
      videoId: row.video_id,
      language: row.language,
      engine: row.engine,
      segments,
      generatedAt: row.generated_at,
    };
  }
}
