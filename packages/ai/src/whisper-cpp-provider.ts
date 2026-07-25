import { readdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { nodewhisper } from 'nodejs-whisper';
import { extractWav16k, hasAudioStream } from '@ase-os/ffmpeg';
import type {
  TranscriptionProvider,
  TranscriptionResult,
  TranscriptionSegment,
} from './transcription-provider';
import { cleanSegments, parseWhisperSrt } from './segments';

/**
 * Free, offline transcription using Whisper.cpp via nodejs-whisper (see ADR 0003).
 * The model and whisper.cpp binary are downloaded/built once on first use.
 *
 * `model`: multilingual `tiny` | `base` (default) | `small` ... — larger = more accurate.
 * `language`: `auto` (detect) or a code like `en`, `ko`.
 */
export class WhisperCppProvider implements TranscriptionProvider {
  readonly #model: string;
  readonly #language: string;

  constructor(model = 'base', language = 'auto') {
    this.#model = model;
    this.#language = language;
  }

  async transcribe(mediaPath: string): Promise<TranscriptionResult> {
    const engine = `whisper.cpp:${this.#model}`;
    const language = this.#language === 'auto' ? null : this.#language;

    // A video with no audio track has nothing to transcribe.
    if (!(await hasAudioStream(mediaPath))) {
      return { language, engine, segments: [] };
    }

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
          language: this.#language,
          wordTimestamps: false,
          splitOnWord: true,
        },
      });

      return { language, engine, segments: cleanSegments(readSegments(dir)) };
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
    const parsed = JSON.parse(
      readFileSync(path.join(dir, jsonFile), 'utf8'),
    ) as WhisperJson;
    return (parsed.transcription ?? []).map((item) => ({
      startSec: (item.offsets?.from ?? 0) / 1000,
      endSec: (item.offsets?.to ?? 0) / 1000,
      text: item.text ?? '',
    }));
  }

  const srtFile = files.find((f) => f.endsWith('.srt'));
  if (srtFile) {
    return parseWhisperSrt(readFileSync(path.join(dir, srtFile), 'utf8'));
  }

  return [];
}
