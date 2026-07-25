import { readdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { Injectable } from '@nestjs/common';
import { nodewhisper } from 'nodejs-whisper';
import type {
  TranscriptionProvider,
  TranscriptionResult,
  TranscriptionSegment,
} from '../../application/transcription-provider';
import { extractWav16k } from '../audio/audio-extractor';

/**
 * Free, offline transcription using Whisper.cpp via nodejs-whisper (see ADR 0003).
 * The model and whisper.cpp binary are downloaded/built once on first use.
 *
 * Default model is multilingual `tiny` (smallest). Set WHISPER_MODEL to a larger
 * model (e.g. `base`, `small`) for higher accuracy — still free/local.
 */
@Injectable()
export class WhisperCppProvider implements TranscriptionProvider {
  readonly #model: string = process.env.WHISPER_MODEL ?? 'tiny';

  async transcribe(mediaPath: string): Promise<TranscriptionResult> {
    const wavPath = await extractWav16k(mediaPath);
    const dir = path.dirname(wavPath);

    try {
      await nodewhisper(wavPath, {
        modelName: this.#model,
        autoDownloadModelName: this.#model,
        removeWavFileAfterTranscription: false,
        withCuda: false,
        whisperOptions: {
          outputInJson: true,
          outputInSrt: true,
          outputInText: false,
          outputInVtt: false,
          outputInCsv: false,
          translateToEnglish: false,
          wordTimestamps: false,
          splitOnWord: true,
        },
      });

      const segments = readSegments(dir);
      return {
        language: null,
        engine: `whisper.cpp:${this.#model}`,
        segments,
      };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
}

interface WhisperJsonSegment {
  offsets?: { from?: number; to?: number };
  text?: string;
}
interface WhisperJson {
  transcription?: WhisperJsonSegment[];
}

/** Read whisper.cpp output from the temp dir, preferring JSON, falling back to SRT. */
function readSegments(dir: string): TranscriptionSegment[] {
  const files = readdirSync(dir);

  const jsonFile = files.find((f) => f.endsWith('.json'));
  if (jsonFile) {
    const raw = readFileSync(path.join(dir, jsonFile), 'utf8');
    const parsed = JSON.parse(raw) as WhisperJson;
    const items = parsed.transcription ?? [];
    return items.map((item) => ({
      startSec: (item.offsets?.from ?? 0) / 1000,
      endSec: (item.offsets?.to ?? 0) / 1000,
      text: (item.text ?? '').trim(),
    }));
  }

  const srtFile = files.find((f) => f.endsWith('.srt'));
  if (srtFile) {
    return parseSrt(readFileSync(path.join(dir, srtFile), 'utf8'));
  }

  return [];
}

const SRT_TIME = /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/;

function parseSrt(srt: string): TranscriptionSegment[] {
  const blocks = srt.split(/\r?\n\r?\n/);
  const segments: TranscriptionSegment[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).filter((l) => l.trim() !== '');
    const timeLine = lines.find((l) => SRT_TIME.test(l));
    if (!timeLine) continue;
    const m = SRT_TIME.exec(timeLine);
    if (!m) continue;

    const start = toSeconds(m[1], m[2], m[3], m[4]);
    const end = toSeconds(m[5], m[6], m[7], m[8]);
    const text = lines.slice(lines.indexOf(timeLine) + 1).join(' ').trim();
    if (text) segments.push({ startSec: start, endSec: end, text });
  }

  return segments;
}

function toSeconds(h: string, m: string, s: string, ms: string): number {
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;
}
