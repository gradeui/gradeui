# @gradeui/studio

The Grade Design System **Studio** workbench — a chat + preview tool for designing UIs against `@gradeui/ui`.

This package is **private** and consumed via pnpm `workspace:*`. It is not published to npm. Its contents churn heavily (reference layouts, retrieval heuristics, evals) and the npm-versioning tax would add overhead with no upside until the surface stabilises. Revisit publishing if/when Studio spins out of this monorepo.

## What's in here

```
src/
├── index.ts              # top-level barrel — everything re-exports here
├── playbook/             # ◀ MODEL-FACING CONTENT (populated now)
│   ├── sidecars/         # per-component markdown briefs (the model reads these)
│   ├── components/       # frontmatter parser, retrieval, render, manifest, allowlist
│   ├── prompts/          # system prompt + pinned components
│   ├── templates/        # starter prompts for the launchpad
│   └── layouts/          # (future) hand-authored reference compositions for retrieval
├── ui/                   # (future) React chrome — canvas, chat, settings-panel
└── runtime/              # (future) Sandpack harness — file tree, virtual component source
```

The folder split mirrors the three distinct concerns inside Studio:

- **playbook** — *what the model reads*. Pure data + pure functions, no React, no DOM, no fs at runtime. Lift-and-shift-ready: anything a non-Grade consumer (e.g. `@gradeui/mcp`) might want to serve lives here.
- **ui** *(future)* — the React chrome that sits around the preview iframe. Depends on `@gradeui/ui`, React, Lucide.
- **runtime** *(future)* — the Sandpack file-tree builder, the in-iframe selection agent, the component-source strings shipped as virtual files. Depends on `@codesandbox/sandpack-react` via the consuming app, not directly.

## Playbook: zero-runtime-dep guarantee

The `playbook/` folder has a strict rule: **no runtime dependencies** — no React, no Sandpack, no Lucide, no `fs`. It's pure data + pure functions. This is what makes `@gradeui/mcp` (future) a trivial wrapper and what makes the playbook portable to non-browser / non-Node environments (e.g. serving over MCP from an edge runtime).

Sidecars are authored as Markdown but consumed through a generated TypeScript module (`sidecars.generated.ts`) so there's no `fs.readFileSync` at runtime. Run `pnpm -F @gradeui/studio generate:sidecars` whenever you edit a `.md`. The generated file is committed.

## Consuming

```ts
// Model-facing content
import {
  buildSystemPrompt,
  ALLOWED_COMPONENTS,
  renderComponentRefsBlock,
  relevantComponentNames,
  STUDIO_TEMPLATES,
} from "@gradeui/studio";

// Or, scoped:
import { buildSystemPrompt } from "@gradeui/studio/playbook";
```

## Not in here (and why)

- **Source transformation** (`autoImportGradeComponents`, `prepareAppSource`, etc.) — operates *on* model output; not read *by* the model. Stays in `apps/docs/lib/chat-sandpack.ts` (to become `runtime/` in a future carve-out).
- **`StudioSelection` type** — the wire protocol between the in-iframe selection overlay and the model. UI-adjacent, stays with the app.
- **Studio UI components** (`studio-canvas`, `studio-chat`, `settings-panel`) — React chrome, future `ui/` carve-out.
- **`/api/chat` route** — consumer of the playbook, not part of it.
