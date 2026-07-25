'use client';

import { useState, type ChangeEvent } from 'react';

interface UploadedVideo {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

interface SubtitleSegment {
  startSec: number;
  endSec: number;
  text: string;
}

interface SubtitleTrack {
  videoId: string;
  language: string | null;
  engine: string;
  segments: SubtitleSegment[];
  generatedAt: string;
}

type UploadState =
  | { kind: 'idle' }
  | { kind: 'uploading' }
  | { kind: 'done'; video: UploadedVideo }
  | { kind: 'error'; message: string };

type SubtitleState =
  | { kind: 'idle' }
  | { kind: 'generating' }
  | { kind: 'done'; track: SubtitleTrack }
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
  const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
  return data.message ?? data.error ?? `Request failed (${res.status})`;
}

export function VideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [upload, setUpload] = useState<UploadState>({ kind: 'idle' });
  const [subtitles, setSubtitles] = useState<SubtitleState>({ kind: 'idle' });

  function handleSelect(event: ChangeEvent<HTMLInputElement>): void {
    setFile(event.target.files?.[0] ?? null);
    setUpload({ kind: 'idle' });
    setSubtitles({ kind: 'idle' });
  }

  async function handleUpload(): Promise<void> {
    if (!file) return;
    setUpload({ kind: 'uploading' });
    setSubtitles({ kind: 'idle' });
    try {
      const body = new FormData();
      body.append('video', file);
      const res = await fetch('/api/videos', { method: 'POST', body });
      if (!res.ok) throw new Error(await readError(res));
      const video = (await res.json()) as UploadedVideo;
      setUpload({ kind: 'done', video });
    } catch (err: unknown) {
      setUpload({ kind: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  async function handleGenerate(videoId: string): Promise<void> {
    setSubtitles({ kind: 'generating' });
    try {
      const res = await fetch(`/api/videos/${videoId}/subtitles`, { method: 'POST' });
      if (!res.ok) throw new Error(await readError(res));
      const track = (await res.json()) as SubtitleTrack;
      setSubtitles({ kind: 'done', track });
    } catch (err: unknown) {
      setSubtitles({
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
          <button
            type="button"
            onClick={() => void handleGenerate(upload.video.id)}
            disabled={subtitles.kind === 'generating'}
          >
            {subtitles.kind === 'generating' ? 'Generating…' : 'Generate subtitles'}
          </button>
          {subtitles.kind === 'generating' && (
            <p>Transcribing locally with Whisper.cpp… first run builds/downloads the model.</p>
          )}
        </div>
      )}
      {upload.kind === 'error' && <p>❌ {upload.message}</p>}

      {subtitles.kind === 'done' && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Subtitles</h3>
          <p style={{ color: '#666' }}>engine: {subtitles.track.engine}</p>
          {subtitles.track.segments.length === 0 ? (
            <p>No speech detected.</p>
          ) : (
            <ul>
              {subtitles.track.segments.map((seg, i) => (
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
    </section>
  );
}
