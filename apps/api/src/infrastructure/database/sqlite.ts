import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

/** DI token for the shared SQLite database handle. */
export const DATABASE = Symbol('Database');

export type Db = Database.Database;

/** Open (creating if needed) the local SQLite database and ensure the schema. */
export function createDatabase(): Db {
  const dir = path.resolve(process.cwd(), 'data');
  mkdirSync(dir, { recursive: true });

  const db = new Database(path.join(dir, 'ase-os.db'));
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id            TEXT PRIMARY KEY,
      original_name TEXT NOT NULL,
      mime_type     TEXT NOT NULL,
      size_bytes    INTEGER NOT NULL,
      stored_path   TEXT NOT NULL,
      uploaded_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subtitle_tracks (
      video_id      TEXT PRIMARY KEY,
      language      TEXT,
      engine        TEXT NOT NULL,
      segments_json TEXT NOT NULL,
      generated_at  TEXT NOT NULL,
      FOREIGN KEY (video_id) REFERENCES videos(id)
    );

    CREATE TABLE IF NOT EXISTS scene_lists (
      video_id    TEXT PRIMARY KEY,
      engine      TEXT NOT NULL,
      scenes_json TEXT NOT NULL,
      detected_at TEXT NOT NULL,
      FOREIGN KEY (video_id) REFERENCES videos(id)
    );
  `);

  return db;
}
