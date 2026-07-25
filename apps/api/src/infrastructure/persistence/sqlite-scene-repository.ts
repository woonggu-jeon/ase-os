import { Inject, Injectable } from '@nestjs/common';
import type { Scene, SceneList } from '@ase-os/shared';
import type { SceneRepository } from '../../application/scene-repository';
import { DATABASE, type Db } from '../database/sqlite';

interface SceneRow {
  video_id: string;
  engine: string;
  scenes_json: string;
  detected_at: string;
}

@Injectable()
export class SqliteSceneRepository implements SceneRepository {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  save(list: SceneList): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO scene_lists
           (video_id, engine, scenes_json, detected_at)
         VALUES (?, ?, ?, ?)`,
      )
      .run(list.videoId, list.engine, JSON.stringify(list.scenes), list.detectedAt);
  }

  findByVideoId(videoId: string): SceneList | undefined {
    const row = this.db
      .prepare('SELECT * FROM scene_lists WHERE video_id = ?')
      .get(videoId) as SceneRow | undefined;
    if (!row) return undefined;

    const scenes = JSON.parse(row.scenes_json) as Scene[];
    return {
      videoId: row.video_id,
      engine: row.engine,
      scenes,
      detectedAt: row.detected_at,
    };
  }
}
