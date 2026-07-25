import { pipeline } from '@huggingface/transformers';
import type {
  TranscriptionProvider,
  TranscriptionResult,
  TranscriptionSegment,
} from '../../application/ai/transcription-provider.js';
import { extractPcm16kMono } from '../audio/audio-extractor.js';

const DEFAULT_MODEL = 'Xenova/whisper-tiny';

// Minimal view of the Transformers.js ASR output we rely on.
interface WhisperChunk {
  readonly timestamp: readonly [number, number | null];
  readonly text: string;
}
interface WhisperOutput {
  readonly text: string;
  readonly chunks?: readonly WhisperChunk[];
}
type Transcriber = (
  audio: Float32Array,
  options: Record<string, unknown>,
) => Promise<WhisperOutput>;

/**
 * Free, offline transcription using a local Whisper model via Transformers.js
 * (see ADR 0002). The model is downloaded once on first use and cached.
 */
export class LocalWhisperProvider implements TranscriptionProvider {
  readonly #model: string;
  #transcriber: Promise<Transcriber> | undefined;

  constructor(model: string = DEFAULT_MODEL) {
    this.#model = model;
  }

  #load(): Promise<Transcriber> {
    if (!this.#transcriber) {
      this.#transcriber = pipeline('automatic-speech-recognition', this.#model).then(
        (p) => p as unknown as Transcriber,
      );
    }
    return this.#transcriber;
  }

  async transcribe(mediaPath: string): Promise<TranscriptionResult> {
    const audio = await extractPcm16kMono(mediaPath);
    const transcriber = await this.#load();

    const output = await transcriber(audio.samples, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
    });

    const chunks = output.chunks ?? [
      { timestamp: [0, audio.durationSec] as const, text: output.text },
    ];

    const segments: TranscriptionSegment[] = chunks.map((chunk) => ({
      startSec: chunk.timestamp[0],
      // Whisper can leave the final end timestamp null; fall back to clip duration.
      endSec: chunk.timestamp[1] ?? audio.durationSec,
      text: chunk.text.trim(),
    }));

    return {
      language: null,
      engine: `local-whisper:${this.#model}`,
      segments,
    };
  }
}
