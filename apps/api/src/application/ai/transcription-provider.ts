// Application-owned AI contract (see ADR 0001 / ADR 0002).
// Feature code depends on this interface, never on a concrete AI engine or SDK.

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
  /**
   * Transcribe the media file at the given path into timed text segments.
   * Implementations may be local (free) or hosted; callers do not care which.
   */
  transcribe(mediaPath: string): Promise<TranscriptionResult>;
}
