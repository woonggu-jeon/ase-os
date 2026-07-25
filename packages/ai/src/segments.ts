import type { TranscriptionSegment } from './transcription-provider';

// Whisper often emits non-speech markers on silence/music, e.g. "[Music]",
// "(applause)", "[BLANK_AUDIO]". Treat a segment whose whole text is a single
// bracketed/parenthesised token as non-speech.
const NON_SPEECH_ONLY = /^[[(][^\])]*[\])]$/;

/**
 * Post-process raw transcription segments: trim text, drop empty segments and
 * pure non-speech markers, and drop zero/negative-length segments.
 */
export function cleanSegments(
  segments: readonly TranscriptionSegment[],
): TranscriptionSegment[] {
  const cleaned: TranscriptionSegment[] = [];
  for (const seg of segments) {
    const text = seg.text.trim();
    if (text === '') continue;
    if (NON_SPEECH_ONLY.test(text)) continue;
    if (seg.endSec < seg.startSec) continue;
    cleaned.push({ startSec: seg.startSec, endSec: seg.endSec, text });
  }
  return cleaned;
}

const SRT_TIME =
  /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/;

function toSeconds(h: string, m: string, s: string, ms: string): number {
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;
}

/** Parse an SRT document into raw (uncleaned) transcription segments. */
export function parseWhisperSrt(srt: string): TranscriptionSegment[] {
  const segments: TranscriptionSegment[] = [];

  for (const block of srt.split(/\r?\n\r?\n/)) {
    const lines = block.split(/\r?\n/).filter((l) => l.trim() !== '');
    const timeLine = lines.find((l) => SRT_TIME.test(l));
    if (!timeLine) continue;
    const m = SRT_TIME.exec(timeLine);
    if (!m) continue;

    const text = lines
      .slice(lines.indexOf(timeLine) + 1)
      .join(' ')
      .trim();
    segments.push({
      startSec: toSeconds(m[1], m[2], m[3], m[4]),
      endSec: toSeconds(m[5], m[6], m[7], m[8]),
      text,
    });
  }

  return segments;
}
