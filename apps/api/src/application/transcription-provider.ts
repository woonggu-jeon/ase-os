// Application-owned AI contract (see ADR 0001 / 0002 / 0003).
// Feature code depends on this interface, never on a concrete engine.

export const TRANSCRIPTION_PROVIDER = Symbol('TranscriptionProvider');

export interface TranscriptionSegment {
  readonly startSec: number;
  readonly endSec: number;
  readonly text: string;
}

export interface TranscriptionResult {
  readonly language: string | null;
  readonly engine: string;
  readonly segments: readonly TranscriptionSegment[];
}

export interface TranscriptionProvider {
  /** Transcribe a media file into timed text segments (implementation-agnostic). */
  transcribe(mediaPath: string): Promise<TranscriptionResult>;
}
