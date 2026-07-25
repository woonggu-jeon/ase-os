// DI token for the TranscriptionProvider contract defined in @ase-os/ai.
// The interface is framework-agnostic (in the package); the token is a Nest wiring
// concern and therefore lives in the api application layer.
export const TRANSCRIPTION_PROVIDER = Symbol('TranscriptionProvider');
