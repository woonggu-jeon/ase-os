# ADR 0003 — Technology Stack

- Status: Accepted
- Date: 2026-07-25
- Layer: Execution / Governance
- Phase: 1
- Relates to: ADR 0001 (layering), ADR 0002 (free-only)
- Supersedes: the concrete choices in the initial bootstrap (Vite + Express + in-memory
  + Transformers.js). The *principles* of ADR 0001/0002 are retained.

## Context

The initial bootstrap used Vite + React, Express, in-memory storage, and Transformers.js.
The project owner's intended stack is different and explicit:

```
Next.js → NestJS → FFmpeg → SQLite → Ollama → Whisper.cpp
```

We are still early (bootstrap + 2 features), so realigning now is cheap. The intended
stack is fully free/local, satisfying ADR 0002's zero-cost constraint, and NestJS's
module/DI system expresses ADR 0001's layering at the framework level.

## Decision

Adopt the following for Phase 1:

| Concern | Choice | Notes |
| --- | --- | --- |
| Frontend | **Next.js** (App Router, TS) | proxies `/api/*` to NestJS via rewrites |
| Backend | **NestJS** (TS) | modules/providers = Application/Infra layers of ADR 0001 |
| Media | **FFmpeg** | unchanged; audio extraction, scene detection |
| Persistence | **SQLite** (`better-sqlite3`) | replaces in-memory repositories from ADR 0001 |
| Transcription | **Whisper.cpp** (`nodejs-whisper`) | replaces Transformers.js; still free/local |
| Local LLM | **Ollama** | **deferred** — introduced only when a feature needs it (YAGNI) |

### Layering under NestJS
- `domain/`: plain types + rules (no Nest, no I/O).
- `application/`: use-case services as Nest providers; depend on interfaces.
- `infrastructure/`: SQLite repositories, ffmpeg, Whisper.cpp provider (implement the
  interfaces). Ollama, when added, becomes an `LlmProvider` implementation here.
- `interface/`: Nest controllers.
- Composition happens in Nest modules instead of a hand-written root.

### Impact on prior ADRs
- **ADR 0001**: layering preserved; "folders inside an app" now realized as Nest modules.
- **ADR 0002**: free-only intent preserved; the transcription engine changes from
  Transformers.js to Whisper.cpp (both free/local). The `TranscriptionProvider` interface
  is unchanged, so this is an implementation swap.

## Consequences

- Positive: matches owner's intent; durable persistence (SQLite); framework-enforced
  structure; entirely free/offline.
- Negative: Whisper.cpp and better-sqlite3 involve native builds (need cmake/clang for
  whisper.cpp; better-sqlite3 uses prebuilds or node-gyp). One-time setup cost.
- The two existing features (upload, subtitles) are re-implemented on the new stack; no
  new product scope is added during the migration.

## Alternatives Considered

- **Keep Vite/Express/in-memory/Transformers.js:** less setup, but diverges from the
  owner's intended architecture. Rejected.
- **`node:sqlite` (built-in):** no dependency, but experimental and flag-gated; chose
  `better-sqlite3` for a stable synchronous API that fits the repository pattern.
