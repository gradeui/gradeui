# apps/docs — Claude orientation

Next.js 16 docs site for gradeui, deployed to [gradeui.com](https://gradeui.com). Hosts public component docs, pro/client-gated sections (NextAuth), and the **`/studio` chat-driven playground**.

## Where to look first

- **`STUDIO.md`** — the authoritative spec for `/studio`. Read this BEFORE touching anything under `components/studio/`, `lib/chat-sandpack.ts`, `app/studio/`, or `app/api/chat/`. Covers the selection protocol, `PLAYGROUND_SELECTION_AGENT_TSX` injection model, system-prompt stitching, per-design state maps, and the publish-lag gotcha.
- **`../../CLAUDE.md`** (repo root) — monorepo layout, tiering model, release flow.
- **`../../packages/ui/CLAUDE.md`** — component / theming / design-token reference.
- **`components/ui/<name>.md`** — per-component sidecar docs. Frontmatter is the prop manifest consumed by the Studio system prompt; body contains usage examples.

## The studio feature surface (fast orientation)

| File | Role |
|---|---|
| `app/studio/page.tsx` | Route. Owns tabs, per-design state (`messagesByDesign`, `appSourceByDesign`, `selectionByDesign`), chat↔preview wiring. |
| `app/api/chat/route.ts` | Server route. Builds the system prompt from refs + selection and streams the model. |
| `components/studio/studio-chat.tsx` | Left pane — message list, input, selection chip. |
| `components/studio/studio-preview.tsx` | Right pane — Sandpack preview, error boundary, select-mode toggle, postMessage listener. |
| `lib/chat-sandpack.ts` | Sandpack setup + `PLAYGROUND_SELECTION_AGENT_TSX` (in-iframe click-capture agent) + `buildStudioSystemPrompt()`. |

When changing the selection protocol (`grade:*` postMessage types), update BOTH sides of the bus AND `STUDIO.md`. They drift fast.

## Conventions

- Sidecar docs are the source of truth for component prop manifests. If you compile them into JSON for the Studio agent or a settings panel, keep `components/ui/<name>.md` authoritative — don't duplicate.
- The Studio preview pulls `@gradeui/ui` from npm, not from the workspace. Library changes don't appear in the playground until the package is bumped, published, and Sandpack's CDN cache expires. See `STUDIO.md` → "The publish-lag gotcha".
