import type {
  TranscriptionProvider,
  TranscriptionResult,
} from './transcription-provider';

/**
 * Deterministic, dependency-free transcription provider for tests and fast local
 * runs (no model download, no ffmpeg). Selected via TRANSCRIPTION_ENGINE=mock.
 */
export class MockTranscriptionProvider implements TranscriptionProvider {
  async transcribe(_mediaPath: string): Promise<TranscriptionResult> {
    return {
      language: 'en',
      engine: 'mock',
      segments: [
        { startSec: 0, endSec: 1, text: 'Mock subtitle segment one.' },
        { startSec: 1, endSec: 2, text: 'Mock subtitle segment two.' },
      ],
    };
  }
}
