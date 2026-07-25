import type { SubtitleSegment } from './subtitle';

function parts(sec: number): { h: number; m: number; s: number; ms: number } {
  const totalMs = Math.max(0, Math.round(sec * 1000));
  return {
    ms: totalMs % 1000,
    s: Math.floor(totalMs / 1000) % 60,
    m: Math.floor(totalMs / 60000) % 60,
    h: Math.floor(totalMs / 3600000),
  };
}

const p2 = (n: number): string => String(n).padStart(2, '0');
const p3 = (n: number): string => String(n).padStart(3, '0');

function srtTime(sec: number): string {
  const { h, m, s, ms } = parts(sec);
  return `${p2(h)}:${p2(m)}:${p2(s)},${p3(ms)}`;
}

function vttTime(sec: number): string {
  const { h, m, s, ms } = parts(sec);
  return `${p2(h)}:${p2(m)}:${p2(s)}.${p3(ms)}`;
}

/** Render subtitle segments as SubRip (.srt). */
export function toSrt(segments: readonly SubtitleSegment[]): string {
  return (
    segments
      .map(
        (seg, i) =>
          `${i + 1}\n${srtTime(seg.startSec)} --> ${srtTime(seg.endSec)}\n${seg.text}`,
      )
      .join('\n\n') + '\n'
  );
}

/** Render subtitle segments as WebVTT (.vtt). */
export function toVtt(segments: readonly SubtitleSegment[]): string {
  const cues = segments
    .map((seg) => `${vttTime(seg.startSec)} --> ${vttTime(seg.endSec)}\n${seg.text}`)
    .join('\n\n');
  return `WEBVTT\n\n${cues}\n`;
}
