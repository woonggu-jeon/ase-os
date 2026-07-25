# ADR 0002 — Free, Local Transcription (deviation from Rule 6)

- Status: Accepted
- Date: 2026-07-25
- Layer: Execution / Governance
- Phase: 1
- Supersedes: none
- Relates to: ADR 0001

## Context

Subtitle Generation is the first AI-backed Phase 1 feature. Two documents point at
OpenAI:

- `DEVELOPMENT_RULES.md` **Rule 6**: "Use OpenAI API first. Do not build custom AI."
- `SYSTEM_OVERVIEW.md` shows OpenAI in the architecture.

The project owner has set a hard constraint: **the project must run at zero API cost
("무조건 무료")**. OpenAI's transcription models are all paid (`whisper-1` ≈ $0.006/min;
`gpt-4o-transcribe` higher) with no free tier. This makes Rule 6 and the free-only
constraint mutually exclusive for transcription.

Per CLAUDE.md priority order, DEVELOPMENT_RULES outranks user instructions, so this
deviation is recorded here rather than applied silently. CLAUDE.md's AI Provider section
already anticipates a `LocalProvider` alongside `OpenAIProvider`, so a local engine is
compatible with the intended architecture.

## Decision

1. **Transcription runs locally and free**, via `@huggingface/transformers`
   (Transformers.js) running a Whisper model (`Xenova/whisper-tiny` to start). No paid
   API is called. Audio is extracted with the already-installed local `ffmpeg`.

2. **"Do not build custom AI" is still honored.** We do not train or build a model; we
   run an existing open-source model through a library — the local analogue of calling a
   hosted API.

3. **The OpenAI path is preserved, not deleted.** Following ADR 0001, transcription sits
   behind an application-owned `TranscriptionProvider` interface. Today's implementation
   is `LocalWhisperProvider`; an `OpenAIProvider` can be added later without touching
   application or domain code. The provider is selected at the composition root.

4. **Rule 6 text is left unchanged** (owner's choice). This ADR is the recorded
   exception. If free-only becomes a permanent project-wide principle, a future RFC/ADR
   may amend DEVELOPMENT_RULES.

## Consequences

- Positive: zero cost; fully offline after the first model download; no API key needed
  for subtitles; provider remains swappable.
- Negative: first run downloads the model (~tens of MB) and transcription uses local CPU,
  so it is slower and lower-accuracy than hosted models. Acceptable for a local MVP.
- The `OPENAI_API_KEY` in `.env` is currently unused by the subtitle feature; it remains
  available for a future `OpenAIProvider` if the constraint changes.

## Alternatives Considered

- **OpenAI Whisper API (Rule 6 literal):** rejected — violates the free-only constraint.
- **whisper.cpp (nodejs-whisper):** viable and fast on Apple Silicon, but needs a native
  (cmake/make) build. Transformers.js needs no native build and stays in the Node/TS
  stack, so it was chosen for lower setup friction.
- **Mock provider only:** rejected as the primary path — it would not deliver a working
  end-to-end feature (Development Rule 4).
