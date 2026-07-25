import { Inject, Injectable } from '@nestjs/common';
import type { Timeline } from '@ase-os/shared';
import type { TimelineRepository } from '../../application/timeline-repository';
import { DATABASE, type Db } from '../database/sqlite';

interface TimelineRow {
  video_id: string;
  timeline_json: string;
  updated_at: string;
}

@Injectable()
export class SqliteTimelineRepository implements TimelineRepository {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  save(timeline: Timeline): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO timelines (video_id, timeline_json, updated_at)
         VALUES (?, ?, ?)`,
      )
      .run(timeline.videoId, JSON.stringify(timeline), new Date().toISOString());
  }

  findByVideoId(videoId: string): Timeline | undefined {
    const row = this.db
      .prepare('SELECT * FROM timelines WHERE video_id = ?')
      .get(videoId) as TimelineRow | undefined;
    return row ? (JSON.parse(row.timeline_json) as Timeline) : undefined;
  }

  delete(videoId: string): void {
    this.db.prepare('DELETE FROM timelines WHERE video_id = ?').run(videoId);
  }
}
