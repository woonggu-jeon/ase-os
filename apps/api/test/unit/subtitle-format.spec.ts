import { toSrt, toVtt } from '@ase-os/shared';

const segments = [
  { startSec: 0, endSec: 1.5, text: 'Hello world' },
  { startSec: 1.5, endSec: 3.25, text: 'Second line' },
];

describe('toSrt', () => {
  it('renders numbered cues with comma millisecond separators', () => {
    expect(toSrt(segments)).toBe(
      '1\n00:00:00,000 --> 00:00:01,500\nHello world\n\n' +
        '2\n00:00:01,500 --> 00:00:03,250\nSecond line\n',
    );
  });
});

describe('toVtt', () => {
  it('starts with WEBVTT and uses dot millisecond separators', () => {
    expect(toVtt(segments)).toBe(
      'WEBVTT\n\n' +
        '00:00:00.000 --> 00:00:01.500\nHello world\n\n' +
        '00:00:01.500 --> 00:00:03.250\nSecond line\n',
    );
  });
});
