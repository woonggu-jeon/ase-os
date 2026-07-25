import { buildTimeline } from '@ase-os/timeline';

describe('buildTimeline', () => {
  it('maps scenes to clips and keeps subtitles', () => {
    const t = buildTimeline({
      videoId: 'v1',
      durationSec: 6,
      scenes: [
        { index: 0, startSec: 0, endSec: 4 },
        { index: 1, startSec: 4, endSec: 6 },
      ],
      subtitles: [{ startSec: 0, endSec: 1, text: 'hi' }],
    });
    expect(t.videoId).toBe('v1');
    expect(t.clips).toHaveLength(2);
    expect(t.clips[1]).toEqual({ index: 1, startSec: 4, endSec: 6 });
    expect(t.subtitles).toHaveLength(1);
  });

  it('falls back to a single full-duration clip when there are no scenes', () => {
    const t = buildTimeline({ videoId: 'v2', durationSec: 10 });
    expect(t.clips).toEqual([{ index: 0, startSec: 0, endSec: 10 }]);
    expect(t.subtitles).toEqual([]);
  });
});
