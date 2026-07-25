import { useState, type ChangeEvent } from 'react';

interface UploadedVideo {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

type UploadState =
  | { kind: 'idle' }
  | { kind: 'uploading' }
  | { kind: 'done'; video: UploadedVideo }
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

export function VideoUpload(): JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>({ kind: 'idle' });

  function handleSelect(event: ChangeEvent<HTMLInputElement>): void {
    setFile(event.target.files?.[0] ?? null);
    setState({ kind: 'idle' });
  }

  async function handleUpload(): Promise<void> {
    if (!file) return;
    setState({ kind: 'uploading' });
    try {
      const body = new FormData();
      body.append('video', file);
      const res = await fetch('/api/videos', { method: 'POST', body });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Upload failed (${res.status})`);
      }
      const video = (await res.json()) as UploadedVideo;
      setState({ kind: 'done', video });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState({ kind: 'error', message });
    }
  }

  return (
    <section>
      <h2>Upload a video</h2>
      <input type="file" accept="video/*" onChange={handleSelect} />
      <button
        type="button"
        onClick={() => void handleUpload()}
        disabled={!file || state.kind === 'uploading'}
        style={{ marginLeft: '0.5rem' }}
      >
        {state.kind === 'uploading' ? 'Uploading…' : 'Upload'}
      </button>

      {state.kind === 'done' && (
        <p>
          ✅ Uploaded <strong>{state.video.originalName}</strong> (
          {formatBytes(state.video.sizeBytes)}) — id {state.video.id}
        </p>
      )}
      {state.kind === 'error' && <p>❌ {state.message}</p>}
    </section>
  );
}
