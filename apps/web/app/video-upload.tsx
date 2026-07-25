'use client';

import { useState, type ChangeEvent } from 'react';
import type { SceneList, SubtitleTrack, Timeline, VideoView } from '@ase-os/shared';
import { VideoPreview } from './video-preview';
import { apiUrl } from './api-base';

type UploadState =
  | { kind: 'idle' }
  | { kind: 'uploading' }
  | { kind: 'done'; video: VideoView }
  | { kind: 'error'; message: string };

type AsyncState<T> =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'done'; data: T }
  | { kind: 'error'; message: string };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

function formatTime(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function readError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
  };
  return data.message ?? data.error ?? `Request failed (${res.status})`;
}

async function requestJson<T>(path: string, method: 'GET' | 'POST'): Promise<T> {
  const res = await fetch(apiUrl(path), { method });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as T;
}

export function VideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [upload, setUpload] = useState<UploadState>({ kind: 'idle' });
  const [subtitles, setSubtitles] = useState<AsyncState<SubtitleTrack>>({ kind: 'idle' });
  const [scenes, setScenes] = useState<AsyncState<SceneList>>({ kind: 'idle' });
  const [timeline, setTimeline] = useState<AsyncState<Timeline>>({ kind: 'idle' });
  const [sceneThreshold, setSceneThreshold] = useState(0.4);

  function handleSelect(event: ChangeEvent<HTMLInputElement>): void {
    setFile(event.target.files?.[0] ?? null);
    setUpload({ kind: 'idle' });
    setSubtitles({ kind: 'idle' });
    setScenes({ kind: 'idle' });
    setTimeline({ kind: 'idle' });
  }

  async function handleUpload(): Promise<void> {
    if (!file) return;
    setUpload({ kind: 'uploading' });
    setSubtitles({ kind: 'idle' });
    setScenes({ kind: 'idle' });
    try {
      const body = new FormData();
      body.append('video', file);
      const res = await fetch(apiUrl('/api/videos'), { method: 'POST', body });
      if (!res.ok) throw new Error(await readError(res));
      const video = (await res.json()) as VideoView;
      setUpload({ kind: 'done', video });
    } catch (err: unknown) {
      setUpload({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  async function run<T>(
    url: string,
    set: (s: AsyncState<T>) => void,
    method: 'GET' | 'POST' = 'POST',
  ): Promise<void> {
    set({ kind: 'running' });
    try {
      set({ kind: 'done', data: await requestJson<T>(url, method) });
    } catch (err: unknown) {
      set({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return (
    <section>
      <h2>Upload a video</h2>
      <input type="file" accept="video/*" onChange={handleSelect} />
      <button
        type="button"
        onClick={() => void handleUpload()}
        disabled={!file || upload.kind === 'uploading'}
        style={{ marginLeft: '0.5rem' }}
      >
        {upload.kind === 'uploading' ? 'Uploading…' : 'Upload'}
      </button>

      {upload.kind === 'done' && (
        <div style={{ marginTop: '1rem' }}>
          <p>
            ✅ Uploaded <strong>{upload.video.originalName}</strong> (
            {formatBytes(upload.video.sizeBytes)})
          </p>
          <p style={{ color: '#666' }}>
            {formatTime(upload.video.metadata.durationSec)} ·{' '}
            {upload.video.metadata.width && upload.video.metadata.height
              ? `${upload.video.metadata.width}×${upload.video.metadata.height}`
              : 'unknown size'}{' '}
            · {upload.video.metadata.videoCodec ?? 'n/a'} ·{' '}
            {upload.video.metadata.hasAudio ? 'audio' : 'no audio'}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() =>
                void run(`/api/videos/${upload.video.id}/subtitles`, setSubtitles)
              }
              disabled={subtitles.kind === 'running'}
            >
              {subtitles.kind === 'running' ? 'Generating…' : 'Generate subtitles'}
            </button>
            <button
              type="button"
              onClick={() =>
                void run(
                  `/api/videos/${upload.video.id}/scenes?threshold=${sceneThreshold}`,
                  setScenes,
                )
              }
              disabled={scenes.kind === 'running'}
            >
              {scenes.kind === 'running' ? 'Detecting…' : 'Detect scenes'}
            </button>
            <label style={{ fontSize: 12, color: '#555', display: 'flex', gap: 4 }}>
              threshold
              <input
                type="number"
                min={0.1}
                max={1}
                step={0.05}
                value={sceneThreshold}
                onChange={(e) => setSceneThreshold(Number(e.target.value))}
                style={{ width: 64 }}
              />
            </label>
            <button
              type="button"
              onClick={() =>
                void run(`/api/videos/${upload.video.id}/timeline`, setTimeline, 'GET')
              }
              disabled={timeline.kind === 'running'}
            >
              {timeline.kind === 'running' ? 'Building…' : 'Build timeline'}
            </button>
          </div>
          {subtitles.kind === 'running' && (
            <p>
              Transcribing locally with Whisper.cpp… first run builds/downloads the model.
            </p>
          )}
          {scenes.kind === 'running' && <p>Detecting scenes locally with FFmpeg…</p>}
          <VideoPreview videoId={upload.video.id} />
        </div>
      )}
      {upload.kind === 'error' && <p>❌ {upload.message}</p>}

      {subtitles.kind === 'done' && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Subtitles</h3>
          <p style={{ color: '#666' }}>
            engine: {subtitles.data.engine}
            {subtitles.data.segments.length > 0 && (
              <>
                {' · '}
                <a href={apiUrl(`/api/videos/${subtitles.data.videoId}/subtitles.srt`)}>
                  SRT
                </a>{' '}
                <a href={apiUrl(`/api/videos/${subtitles.data.videoId}/subtitles.vtt`)}>
                  VTT
                </a>
              </>
            )}
          </p>
          {subtitles.data.segments.length === 0 ? (
            <p>No speech detected.</p>
          ) : (
            <ul>
              {subtitles.data.segments.map((seg, i) => (
                <li key={i}>
                  <code>
                    {formatTime(seg.startSec)}–{formatTime(seg.endSec)}
                  </code>{' '}
                  {seg.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {subtitles.kind === 'error' && <p>❌ {subtitles.message}</p>}

      {scenes.kind === 'done' && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Scenes</h3>
          <p style={{ color: '#666' }}>
            engine: {scenes.data.engine} · {scenes.data.scenes.length} scene(s)
          </p>
          <ul>
            {scenes.data.scenes.map((scene) => (
              <li key={scene.index}>
                <code>
                  #{scene.index + 1} {formatTime(scene.startSec)}–
                  {formatTime(scene.endSec)}
                </code>
              </li>
            ))}
          </ul>
        </div>
      )}
      {scenes.kind === 'error' && <p>❌ {scenes.message}</p>}

      {timeline.kind === 'done' && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Timeline JSON</h3>
          <p style={{ color: '#666' }}>
            {formatTime(timeline.data.durationSec)} · {timeline.data.clips.length} clip(s) ·{' '}
            {timeline.data.subtitles.length} subtitle(s)
          </p>
          <pre
            style={{
              background: '#f4f4f4',
              padding: '0.75rem',
              borderRadius: 6,
              overflowX: 'auto',
              fontSize: 12,
            }}
          >
            {JSON.stringify(timeline.data, null, 2)}
          </pre>
        </div>
      )}
      {timeline.kind === 'error' && <p>❌ {timeline.message}</p>}
    </section>
  );
}
