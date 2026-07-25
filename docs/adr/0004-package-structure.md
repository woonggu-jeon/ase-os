# ADR 0004 — Monorepo Package Structure

- Status: Accepted
- Date: 2026-07-25
- Layer: Execution / Governance
- Phase: 1
- Relates to: ADR 0001 (layering), ADR 0003 (stack)
- Updates: ADR 0001's "layers as in-app folders, extract to packages only when shared"

## Context

ADR 0001 kept layers as folders inside each app and deferred package extraction. As the
codebase grows (FFmpeg use, transcription, upcoming scene detection and timeline), the
owner wants business logic in reusable `packages/*`, with `apps/*` kept thin — which is
what CLAUDE.md already prefers ("Prefer packages over deeply nested folders").

To respect YAGNI, we create packages only where a real consumer exists **now**, and defer
the rest until their feature lands.

## Decision

Target structure:

```
apps/
├── web/   # Next.js (frontend + BFF)
└── api/   # NestJS backend (thin: HTTP + DI wiring + persistence)
packages/
├── config/    # shared TS config
├── shared/    # common types/utils (framework-agnostic)
├── ffmpeg/    # FFmpeg wrapper (audio extraction, scene detection)
├── ai/        # AI providers (TranscriptionProvider + Whisper.cpp; Ollama later)
├── timeline/  # DEFERRED — created when Timeline generation is built
└── editor/    # DEFERRED — created when the editor/preview feature is defined
```

**Created now:** `config`, `shared`, `ffmpeg`, `ai` — each has a current consumer.
**Deferred:** `timeline`, `editor` — no implementation yet (creating them now would be
speculative, violating YAGNI and ADR 0001's "extract when real").

### Rules
- `packages/*` are **framework-agnostic** (no NestJS imports). They export plain
  functions/classes and types.
- NestJS wiring (DI tokens, `@Injectable` services, controllers, SQLite repositories)
  stays in `apps/api`. The api's composition root instantiates package classes (e.g.
  `new WhisperCppProvider()`) via `useFactory`.
- Cross-cutting data types live in `packages/shared` and are imported by both apps.
- Packages compile to `dist/` (CommonJS + d.ts) and are consumed via `workspace:*`.
  `pnpm -r build` builds them in dependency order before the apps.

## Consequences

- Positive: reusable, testable modules; thin apps; matches CLAUDE.md's package preference;
  packages carry no framework lock-in.
- Negative: monorepo build wiring (packages built before apps); during dev, api does not
  hot-reload on package changes without a restart. Acceptable for Phase 1.
- ADR 0001's layering intent is preserved; only its "keep in app" tactic is updated.

## Alternatives Considered

- **Create all six packages now:** matches the diagram exactly but adds empty
  `timeline`/`editor` packages with no code — rejected (YAGNI).
- **Keep everything in apps/api:** less wiring, but rejected as it diverges from the
  owner's intended modular structure and CLAUDE.md's package preference.
