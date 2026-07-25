# ASE-OS

> **Note:** This repository validates **ASE-OS** (an AI Software Engineering Operating System) by building a real product. The product below is the validation vehicle, not the goal. Documentation under [`/docs`](./docs) and the root operating files are the Single Source of Truth — see [`CLAUDE.md`](./CLAUDE.md).

## Product (Phase 1)

A **local AI video editing MVP**:

```
Video Upload → AI Processing → Timeline Generation → Preview
```

Phase 1 scope is defined in [`CURRENT_PHASE.md`](./CURRENT_PHASE.md). Anything outside it (auth, payment, cloud, multi-user, plugins, …) is intentionally **not** built.

## Repository layout

```
ase-os/
├─ apps/
│  ├─ api/   # Node + Express + TypeScript API server
│  └─ web/   # React + Vite + TypeScript frontend
├─ docs/     # Constitution + Knowledge (Single Source of Truth)
└─ *.md      # Project operating documents (status, phase, roadmap, rules)
```

This is a **pnpm workspaces** monorepo.

## Requirements

- Node.js >= 20 (developed on v23)
- pnpm (enable via `corepack enable`)
- `ffmpeg` (for video processing) — install with `brew install ffmpeg`

## Getting started

```bash
# 0. Enable pnpm (once)
corepack enable

# 1. Install dependencies for all workspaces
pnpm install

# 2. Configure environment
cp .env.example .env   # then fill in OPENAI_API_KEY when AI features land

# 3. Run both apps (api on :3001, web on :5173)
pnpm dev
```

Then open http://localhost:5173 — the page fetches `/api/health` (proxied to the API) and should display the API status, confirming the end-to-end dev environment works.

### Useful scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run api and web together |
| `pnpm dev:api` | Run only the API server |
| `pnpm dev:web` | Run only the web frontend |
| `pnpm build` | Build all workspaces |
| `pnpm typecheck` | Type-check all workspaces (strict, no `any`) |

## Conventions

- **Strict TypeScript**, no `any`, small functions, single responsibility.
- AI access goes through an `AIProvider` interface (OpenAI first, replaceable) — added when AI features are implemented.
- Build only the current phase. Documentation defines "today".
