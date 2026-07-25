'use client';

import { useEffect, useState } from 'react';
import type { Timeline } from '@ase-os/shared';
import { apiUrl } from './api-base';

function formatTime(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function TimelineEditor({ videoId }: { videoId: string }) {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function load(): Promise<void> {
    const res = await fetch(apiUrl(`/api/videos/${videoId}/timeline`));
    if (res.ok) {
      setTimeline((await res.json()) as Timeline);
      setStatus(null);
    }
  }

  useEffect(() => {
    void load();
  }, [videoId]);

  function editSubtitle(i: number, text: string): void {
    if (!timeline) return;
    setTimeline({
      ...timeline,
      subtitles: timeline.subtitles.map((s, idx) => (idx === i ? { ...s, text } : s)),
    });
  }

  function removeSubtitle(i: number): void {
    if (!timeline) return;
    setTimeline({
      ...timeline,
      subtitles: timeline.subtitles.filter((_, idx) => idx !== i),
    });
  }

  function removeClip(i: number): void {
    if (!timeline) return;
    setTimeline({
      ...timeline,
      clips: timeline.clips
        .filter((_, idx) => idx !== i)
        .map((c, index) => ({ ...c, index })),
    });
  }

  async function save(): Promise<void> {
    if (!timeline) return;
    setStatus('Saving…');
    const res = await fetch(apiUrl(`/api/videos/${videoId}/timeline`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(timeline),
    });
    if (res.ok) {
      setTimeline((await res.json()) as Timeline);
      setStatus('Saved');
    } else {
      setStatus(`Save failed (${res.status})`);
    }
  }

  async function reset(): Promise<void> {
    setStatus('Resetting…');
    const res = await fetch(apiUrl(`/api/videos/${videoId}/timeline`), { method: 'DELETE' });
    if (res.ok) {
      setTimeline((await res.json()) as Timeline);
      setStatus('Reset to auto');
    } else {
      setStatus(`Reset failed (${res.status})`);
    }
  }

  if (!timeline) return null;

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h3>Timeline (editable)</h3>

      <h4 style={{ margin: '0.5rem 0 0.25rem' }}>Clips</h4>
      <ul style={{ margin: 0 }}>
        {timeline.clips.map((clip, i) => (
          <li key={clip.index}>
            <code>
              #{clip.index + 1} {formatTime(clip.startSec)}–{formatTime(clip.endSec)}
            </code>{' '}
            <button type="button" onClick={() => removeClip(i)}>
              remove
            </button>
          </li>
        ))}
      </ul>

      <h4 style={{ margin: '0.5rem 0 0.25rem' }}>Subtitles</h4>
      {timeline.subtitles.length === 0 ? (
        <p style={{ color: '#666' }}>none</p>
      ) : (
        <ul style={{ margin: 0, listStyle: 'none', padding: 0 }}>
          {timeline.subtitles.map((sub, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              <code>
                {formatTime(sub.startSec)}–{formatTime(sub.endSec)}
              </code>{' '}
              <input
                value={sub.text}
                onChange={(e) => editSubtitle(i, e.target.value)}
                style={{ width: 320 }}
              />{' '}
              <button type="button" onClick={() => removeSubtitle(i)}>
                remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" onClick={() => void save()}>
          Save timeline
        </button>
        <button type="button" onClick={() => void reset()}>
          Reset to auto
        </button>
        {status && <span style={{ color: '#666' }}>{status}</span>}
      </div>
    </div>
  );
}
