# ASE-OS

> **Note:** This repository validates **ASE-OS** (an AI Software Engineering Operating System) by building a real product. The product below is the validation vehicle, not the goal. Documentation under [`/docs`](./docs) and the root operating files are the Single Source of Truth — see [`CLAUDE.md`](./CLAUDE.md).

## Product (Phase 1)

A **local AI video editing MVP**:

```
Video Upload → AI Processing → Timeline Generation → Preview
```

Phase 1 scope is in [`CURRENT_PHASE.md`](./CURRENT_PHASE.md). Anything outside it (auth,
payment, cloud, multi-user, plugins, …) is intentionally **not** built.

## Tech stack (ADR 0003)

Everything runs locally and **free** (ADR 0002 — no paid APIs):

| Concern | Choice |
| --- | --- |
| Frontend | Next.js (App Router) — proxies `/api/*` to the backend |
| Backend | NestJS |
| Media | FFmpeg |
| Persistence | SQLite (`better-sqlite3`) |
| Transcription | Whisper.cpp (`nodejs-whisper`) |
| Local LLM | Ollama — *deferred until a feature needs it* |

Architecture layering (domain / application / infrastructure / interface) is described in
[ADR 0001](./docs/adr/0001-architecture-layering.md) and expressed through NestJS modules.

## Repository layout

```
ase-os/
├─ apps/
│  ├─ api/   # NestJS backend (:3001)
│  └─ web/   # Next.js frontend (:3000)
├─ docs/     # Constitution + Knowledge + ADRs (Single Source of Truth)
└─ *.md      # Project operating documents
```

pnpm workspaces monorepo.

## Requirements

- Node.js >= 20 (developed on v23)
- pnpm (`corepack enable`)
- `ffmpeg` (`brew install ffmpeg`)
- `cmake` + a C/C++ toolchain (`brew install cmake`; Xcode CLT) — Whisper.cpp builds on first run

## Getting started

```bash
corepack enable          # once
pnpm install

cp .env.example .env      # optional; defaults work out of the box

pnpm dev                  # api on :3001, web on :3000
```

Open http://localhost:3000, upload a video, then "Generate subtitles". The first
transcription builds Whisper.cpp and downloads the model (one-time), then runs offline.

### Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run api + web together |
| `pnpm dev:api` / `pnpm dev:web` | Run one app |
| `pnpm build` | Build all workspaces |
| `pnpm typecheck` | Type-check all workspaces (strict, no `any`) |

## Conventions

- Strict TypeScript, no `any`, small functions, single responsibility.
- AI access goes through interfaces (e.g. `TranscriptionProvider`); engines are swappable.
- Build only the current phase. Documentation defines "today".
