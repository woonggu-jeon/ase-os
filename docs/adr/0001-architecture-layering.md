# ADR 0001 — Architecture Layering and AIProvider Placement

- Status: Accepted
- Date: 2026-07-25
- Layer: Execution / Governance
- Phase: 1

## Context

CLAUDE.md requires separating **UI / Application / Domain / Infrastructure**, keeping
the architecture modular, and accessing AI only through a replaceable `AIProvider`
interface. Before implementing the first feature (Video Upload) we must decide *where*
each layer lives so later features (Subtitle, Scene Detection, Timeline, Preview) follow
one consistent structure.

Constraints from the documentation:
- Prefer simplicity, avoid unnecessary abstraction (Core Value: Simplicity Wins).
- Build only Phase 1; do not prepare future-phase infrastructure (YAGNI).
- No database, cloud, or extra services in Phase 1.

## Decision

### 1. Layers live as folders inside each app, not as separate packages (yet)

For Phase 1 we keep the existing two workspaces (`apps/web`, `apps/api`) and express the
layers as folders **inside** `apps/api/src`:

```
apps/api/src/
├─ domain/          # Types + rules. No I/O, no framework imports.
├─ application/     # Use-case services orchestrating domain + infrastructure.
├─ infrastructure/  # Concrete adapters: storage, external providers (AI, ffmpeg).
├─ interface/http/  # Express routers (the delivery mechanism).
└─ index.ts         # Composition root: wires layers together.
```

Rationale: promoting layers to standalone packages now would be abstraction ahead of
need. Folders give the same separation with far less ceremony. We revisit package
extraction only when a layer is genuinely shared across apps.

### 2. Dependency direction points inward

`interface → application → domain` and `infrastructure → domain`.
Domain depends on nothing. Infrastructure implements interfaces the application depends
on, so concrete adapters are replaceable.

### 3. AIProvider is an application-owned interface, implemented in infrastructure

When AI features begin (Subtitle onward), the abstraction is:

```
application/ai/ai-provider.ts        # interface AIProvider (the contract)
infrastructure/ai/openai-provider.ts # OpenAIProvider implements AIProvider
```

The composition root injects the concrete provider. Feature code never imports the
OpenAI SDK directly, satisfying the "AI must be replaceable" rule. This is **documented
now but not implemented** until the first AI feature — Video Upload needs no AI.

### 4. Persistence for Phase 1 is in-memory metadata + local disk for bytes

Uploaded video bytes are written under `uploads/` on local disk. Their metadata is held
in an in-memory repository behind a `VideoRepository` interface. No database is
introduced (forbidden in Phase 1). The interface lets us swap in durable storage later
without touching application code.

## Consequences

- Positive: consistent, testable structure; AI stays replaceable; minimal tooling.
- Negative: in-memory metadata is lost on restart — acceptable for a local MVP, revisit
  if a feature needs persistence across runs.
- Follow-up: extract shared layers into packages only when a second consumer appears.

## Alternatives Considered

- **One file per feature (no layers):** simplest, but violates the documented layer
  separation and would not scale to the Timeline/Preview pipeline.
- **Separate packages per layer now:** matches "prefer packages" literally, but is
  over-engineering for two small apps (violates Simplicity Wins / YAGNI).
