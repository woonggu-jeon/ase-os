import { sanitizeTimeline } from '@ase-os/timeline';

describe('sanitizeTimeline', () => {
  it('coerces clips/subtitles, reindexes clips, and uses authoritative duration', () => {
    const t = sanitizeTimeline('v1', 12, {
      videoId: 'SPOOFED',
      durationSec: 999,
      clips: [
        { startSec: 0, endSec: 4 },
        { startSec: 5, endSec: 5 }, // zero-length → dropped
        { startSec: 4, endSec: 8 },
      ],
      subtitles: [
        { startSec: 0, endSec: 1, text: '  hi  ' },
        { startSec: 1, endSec: 2, text: '   ' }, // empty → dropped
      ],
    });

    expect(t.videoId).toBe('v1');
    expect(t.durationSec).toBe(12); // not the spoofed 999
    expect(t.clips).toEqual([
      { index: 0, startSec: 0, endSec: 4 },
      { index: 1, startSec: 4, endSec: 8 },
    ]);
    expect(t.subtitles).toEqual([{ startSec: 0, endSec: 1, text: 'hi' }]);
  });

  it('tolerates garbage input', () => {
    const t = sanitizeTimeline('v2', 5, null);
    expect(t.clips).toEqual([]);
    expect(t.subtitles).toEqual([]);
    expect(t.durationSec).toBe(5);
  });
});
