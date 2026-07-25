# BOOTSTRAP_SPEC.md

Version: 1.0.0
Status: Active
Related: ADR 0003 (stack), ADR 0004 (package structure)

This document is the specification for the ASE-OS monorepo bootstrap. It defines the
repository structure and the rules that govern packages, naming, folders, dependencies,
the workspace, and builds. It is descriptive of the current setup and prescriptive for
future additions.

---

## Repository Structure

```
ase-os/
├── apps/
│   ├── web/            # Next.js (frontend + BFF; proxies /api → api)
│   └── api/            # NestJS backend (thin: HTTP + DI + persistence)
├── packages/
│   ├── config/         # shared TS config (tsconfig.base.json)
│   ├── shared/         # cross-app types/utils (framework-agnostic)
│   ├── ffmpeg/         # FFmpeg/ffprobe wrapper (audio, probe, scene detection)
│   └── ai/             # AI providers (TranscriptionProvider, Whisper.cpp, Mock)
│   # timeline/, editor/ — created when their feature lands (ADR 0004)
├── docs/               # Constitution, Knowledge, ADRs (Single Source of Truth)
├── scripts/            # dev/ops helper scripts
├── turbo.json          # task pipeline (build/typecheck/dev)
├── pnpm-workspace.yaml # workspace globs
├── eslint.config.mjs   # lint (flat config)
└── .prettierrc.json    # formatting
```

---

## Package Rules

- Every workspace is scoped `@ase-os/<name>` and `"private": true`.
- `packages/*` are **framework-agnostic**: no NestJS/Next imports. They export plain
  functions/classes/types.
- Framework wiring (NestJS DI, controllers, SQLite) lives only in `apps/api`.
- A package is created only when it has a **real consumer now** (YAGNI, ADR 0004).
- Each package exposes a single public entry: `src/index.ts` → built to `dist/index.js`
  with `main`, `types`, and `exports` set in its `package.json`.

## Naming Rules

- Workspace name: `@ase-os/<kebab>`. Directory name matches `<kebab>`.
- Files: `kebab-case.ts`. NestJS providers use suffix conventions:
  `*.service.ts`, `*.controller.ts`, `*.module.ts`, `*-repository.ts`.
- Types/interfaces/classes: `PascalCase`. Functions/vars: `camelCase`.
  Constants & DI tokens: `UPPER_SNAKE_CASE` (tokens are `Symbol('Name')`).

## Folder Rules

- Backend layering (inside `apps/api/src`): `domain-less` types live in `@ase-os/shared`;
  `application/` (use cases + interfaces + DI tokens), `infrastructure/` (adapters:
  persistence, database), `interface/http/` (controllers), plus `app.module.ts` +
  `main.ts` as the composition root.
- Prefer packages over deep nesting. Max ~3 levels under a `src/`.
- Runtime artifacts (`uploads/`, `data/`) and build output (`dist/`, `.next/`) are
  git-ignored and never imported from.

## Dependency Rules

- Dependency direction: `apps → packages`, and within api
  `interface → application → (shared)`, `infrastructure → application/shared`.
  Nothing depends on `apps`.
- Allowed package graph: `shared` (no deps) ← `ffmpeg` (no @ase-os deps) ← `ai`
  (depends on `ffmpeg`). No cycles.
- `packages/*` must not depend on `@nestjs/*` or `next`.
- Cross-app data shapes go in `@ase-os/shared`; never duplicate a type across apps.
- Third-party engines are hidden behind an interface (e.g. `TranscriptionProvider`); the
  concrete engine is chosen at the composition root only.

## Workspace Rules

- Package manager: **pnpm** (`packageManager` pinned in root `package.json`).
- Workspace globs: `apps/*`, `packages/*` (`pnpm-workspace.yaml`).
- Internal deps use `workspace:*`.
- Native build scripts must be allow-listed in `pnpm-workspace.yaml`
  (`onlyBuiltDependencies`, e.g. `better-sqlite3`).

## Build Rules

- **Turborepo** orchestrates tasks (`turbo.json`):
  - `build`: `dependsOn: ["^build"]` — dependencies build first; outputs `dist/**`, `.next/**`.
  - `typecheck`: `dependsOn: ["^build"]` — consumers see fresh `.d.ts`.
  - `dev`: `dependsOn: ["^build"]`, persistent, uncached.
- Packages compile with `tsc` (CommonJS + declarations) to `dist/`.
- `apps/api` builds with `nest build`; `apps/web` with `next build`.
- Strict TypeScript everywhere; **no `any`** (enforced by ESLint
  `@typescript-eslint/no-explicit-any`).
- Commands: `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm dev`.

---

## Verification Checklist (per change)

1. `pnpm typecheck` passes (strict).
2. `pnpm lint` passes (no `any`, no unused).
3. `pnpm build` passes (packages → api → web).
4. Feature exercised end-to-end against the running apps.
