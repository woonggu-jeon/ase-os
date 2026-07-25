import { buildScenesFromCuts } from '@ase-os/ffmpeg';

describe('buildScenesFromCuts', () => {
  it('builds contiguous scenes between cuts and duration', () => {
    const scenes = buildScenesFromCuts([2, 4], 6);
    expect(scenes).toEqual([
      { index: 0, startSec: 0, endSec: 2 },
      { index: 1, startSec: 2, endSec: 4 },
      { index: 2, startSec: 4, endSec: 6 },
    ]);
  });

  it('returns a single scene when there are no cuts', () => {
    expect(buildScenesFromCuts([], 5)).toEqual([{ index: 0, startSec: 0, endSec: 5 }]);
  });

  it('ignores cuts outside the clip and de-duplicates boundaries', () => {
    const scenes = buildScenesFromCuts([-1, 3, 3, 99], 6);
    expect(scenes).toEqual([
      { index: 0, startSec: 0, endSec: 3 },
      { index: 1, startSec: 3, endSec: 6 },
    ]);
  });

  it('returns nothing for a zero-duration clip', () => {
    expect(buildScenesFromCuts([], 0)).toEqual([]);
  });
});
