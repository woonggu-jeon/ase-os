import { cleanSegments, parseWhisperSrt } from '@ase-os/ai';

describe('cleanSegments', () => {
  it('trims text and drops empty / non-speech / invalid segments', () => {
    const cleaned = cleanSegments([
      { startSec: 0, endSec: 1, text: '  hello  ' },
      { startSec: 1, endSec: 2, text: '   ' },
      { startSec: 2, endSec: 3, text: '[Music]' },
      { startSec: 3, endSec: 4, text: '(applause)' },
      { startSec: 5, endSec: 4, text: 'reversed' },
      { startSec: 4, endSec: 5, text: 'world' },
    ]);
    expect(cleaned).toEqual([
      { startSec: 0, endSec: 1, text: 'hello' },
      { startSec: 4, endSec: 5, text: 'world' },
    ]);
  });
});

describe('parseWhisperSrt', () => {
  it('parses timestamped cues into segments', () => {
    const srt = [
      '1',
      '00:00:00,000 --> 00:00:01,500',
      'Hello world',
      '',
      '2',
      '00:00:01,500 --> 00:00:03,000',
      'Second line',
      '',
    ].join('\n');
    const segs = parseWhisperSrt(srt);
    expect(segs).toHaveLength(2);
    expect(segs[0]).toEqual({ startSec: 0, endSec: 1.5, text: 'Hello world' });
    expect(segs[1].startSec).toBe(1.5);
  });
});
