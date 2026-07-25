import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { SceneList, SubtitleTrack, Timeline, VideoView } from '@ase-os/shared';
import { AppModule } from '../src/app.module';

// Integration test for the full Phase 1 workflow (ADR-driven, mock transcription so
// no model download). Exercises real ffmpeg (probe + scene detection) and SQLite.
describe('Videos workflow (e2e)', () => {
  let app: INestApplication;
  let tmp: string;
  let samplePath: string;

  beforeAll(async () => {
    process.env.TRANSCRIPTION_ENGINE = 'mock';

    tmp = mkdtempSync(path.join(tmpdir(), 'ase-os-e2e-'));
    samplePath = path.join(tmp, 'sample.mp4');
    // A 2s silent color clip — enough for probe + scene detection.
    spawnSync(
      'ffmpeg',
      [
        '-f', 'lavfi', '-i', 'color=c=red:s=160x120:r=10:d=2',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-loglevel', 'error', '-y',
        samplePath,
      ],
      { stdio: 'ignore' },
    );

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    rmSync(tmp, { recursive: true, force: true });
  });

  it('uploads → detects scenes → generates subtitles → composes timeline', async () => {
    const server = app.getHttpServer();

    const uploaded = await request(server)
      .post('/api/videos')
      .attach('video', samplePath)
      .expect(201);
    const video = uploaded.body as VideoView;
    expect(video.id).toBeTruthy();
    expect(video.metadata.durationSec).toBeGreaterThan(0);

    const scenesRes = await request(server)
      .post(`/api/videos/${video.id}/scenes`)
      .expect(201);
    const scenes = scenesRes.body as SceneList;
    expect(scenes.scenes.length).toBeGreaterThan(0);

    const subsRes = await request(server)
      .post(`/api/videos/${video.id}/subtitles`)
      .expect(201);
    const subs = subsRes.body as SubtitleTrack;
    expect(subs.engine).toBe('mock');
    expect(subs.segments.length).toBeGreaterThan(0);

    const timelineRes = await request(server)
      .get(`/api/videos/${video.id}/timeline`)
      .expect(200);
    const timeline = timelineRes.body as Timeline;
    expect(timeline.clips.length).toBe(scenes.scenes.length);
    expect(timeline.subtitles.length).toBe(subs.segments.length);
  });

  it('rejects a non-video upload with 400', async () => {
    await request(app.getHttpServer())
      .post('/api/videos')
      .attach('video', Buffer.from('not a video'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      })
      .expect(400);
  });
});
