'use client';

import { useEffect, useRef, useState } from 'react';
import type { Timeline } from '@ase-os/shared';

function formatTime(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Phase 1 Preview: play the uploaded video with the composed timeline overlaid —
 * synced subtitles and a clickable scene strip. Ties the whole pipeline together.
 */
export function VideoPreview({ videoId }: { videoId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);

  async function loadTimeline(): Promise<void> {
    try {
      const res = await fetch(`/api/videos/${videoId}/timeline`);
      if (!res.ok) throw new Error(`Timeline request failed (${res.status})`);
      setTimeline((await res.json()) as Timeline);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  useEffect(() => {
    void loadTimeline();
  }, [videoId]);

  const duration = timeline?.durationSec ?? 0;
  const activeSubtitle = timeline?.subtitles.find(
    (s) => current >= s.startSec && current < s.endSec,
  );

  function seek(seconds: number): void {
    const el = videoRef.current;
    if (el) {
      el.currentTime = seconds;
      void el.play();
    }
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h3>Preview</h3>
      <div style={{ position: 'relative', maxWidth: 640 }}>
        <video
          ref={videoRef}
          src={`/api/videos/${videoId}/file`}
          controls
          style={{ width: '100%', background: '#000', display: 'block' }}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        />
        {activeSubtitle && (
          <div
            style={{
              position: 'absolute',
              bottom: '12%',
              left: 0,
              right: 0,
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                background: 'rgba(0,0,0,0.65)',
                color: '#fff',
                padding: '2px 10px',
                borderRadius: 4,
                fontSize: 18,
                lineHeight: 1.6,
              }}
            >
              {activeSubtitle.text}
            </span>
          </div>
        )}
      </div>

      {timeline && duration > 0 && (
        <div style={{ maxWidth: 640, marginTop: 8 }}>
          <div style={{ display: 'flex', height: 28, border: '1px solid #ccc' }}>
            {timeline.clips.map((clip) => {
              const active = current >= clip.startSec && current < clip.endSec;
              return (
                <button
                  key={clip.index}
                  type="button"
                  title={`Scene #${clip.index + 1} · ${formatTime(clip.startSec)}–${formatTime(clip.endSec)}`}
                  onClick={() => seek(clip.startSec)}
                  style={{
                    flexGrow: (clip.endSec - clip.startSec) / duration,
                    flexBasis: 0,
                    border: 'none',
                    borderRight: '1px solid #fff',
                    background: active ? '#4a90d9' : '#dfe3ee',
                    color: active ? '#fff' : '#333',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {clip.index + 1}
                </button>
              );
            })}
          </div>
          <p style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
            {timeline.clips.length} scene(s) · {timeline.subtitles.length} subtitle(s) ·{' '}
            click a scene to seek
          </p>
        </div>
      )}

      <button type="button" onClick={() => void loadTimeline()} style={{ marginTop: 4 }}>
        Refresh timeline
      </button>
      {error && <p>❌ {error}</p>}
    </div>
  );
}
