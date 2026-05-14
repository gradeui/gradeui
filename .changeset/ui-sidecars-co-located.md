---
"@gradeui/ui": minor
---

Component sidecars now ship inside the package.

Every component in `@gradeui/ui` has a sidecar Markdown file at
`components/ui/<name>.md` — same folder as its `.tsx` source — describing
the component's API, when to reach for it, idiomatic examples, and any
gotchas. The `files` field in `package.json` now includes
`components/ui/*.md`, so the briefs travel with the published tarball.

The sidecars are what the Grade Studio chat reads to steer model
generations, and they're being added so that:

- Consumers building their own AI tooling (custom Studio forks, MCP
  servers, code-gen pipelines) can feed `node_modules/@gradeui/ui/components/ui/*.md`
  to their LLM of choice without depending on `@gradeui/studio`.
- The single-source-of-truth promise actually holds across the package
  boundary — change a component, change its sidecar, in the same commit.

Sidecars added in this release for every shipping component:
`accordion`, `ai-chat`, `alert`, `app-shell`, `avatar`, `badge`,
`breadcrumb`, `button`, `calendar`, `card`, `chart`, `checkbox`,
`collapsible`, `command`, `date-picker`, `dialog`, `dropdown-menu`,
`flex`, `grid`, `hover-card`, `input`, `label`, `map`, `media-surface`,
`popover`, `progress`, `radio-group`, `resizable`, `rive-player`, `row`,
`scroll-area`, `select`, `separator`, `shader-preset-picker`,
`shader-preset-preview`, `sheet`, `side-menu`, `simple-tabs`,
`skeleton`, `slider`, `stack`, `switch`, `table`, `tabs`, `textarea`,
`three-scene`, `toast`, `toggle`, `toggle-group`, `tooltip`,
`video-player`.

No runtime changes — this is purely a packaging change. Existing
imports keep working.
