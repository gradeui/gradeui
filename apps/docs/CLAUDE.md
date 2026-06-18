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

## Marketing pages (homepage, /waitlist, future landing pages)

The marketing surfaces live here: `app/[locale]/page.tsx` (homepage), `app/waitlist/`, and `components/marketing/` (MarketingLayout, sections, GradeWordmark, WaitlistFlow). They render inside the scoped "Grade Marketing" theme (`lib/themes/inputs.ts` → `gradeMarketingInput`), dark only, one-pager funnelling to `/waitlist`.

### Copy rules — non-negotiable

- **NEVER use em dashes (—) or en dashes (–) in marketing copy.** Not in headlines, body copy, labels, FAQ answers, error messages, alt text, or aria labels. Rewrite around them: split into two sentences, use a comma, or use a colon. This applies to every user-visible string on a marketing surface.
- Designer-first voice. No npm install commands, no API talk, no "technical installation" framing on marketing pages. That belongs in /docs.
- Single CTA: "Join the waitlist". Don't add competing CTAs without being asked.

## Conventions

- Sidecar docs are the source of truth for component prop manifests. If you compile them into JSON for the Studio agent or a settings panel, keep `components/ui/<name>.md` authoritative — don't duplicate.
- The Studio preview pulls `@gradeui/ui` from npm, not from the workspace. Library changes don't appear in the playground until the package is bumped, published, and Sandpack's CDN cache expires. See `STUDIO.md` → "The publish-lag gotcha".
- **Studio chrome uses sentence case for labels — never all-caps / the `uppercase` utility.** This is a Studio-app convention (it is NOT enforced on user projects, whose themes/brands may legitimately use caps). And don't roll your own label markup: the form already has correct labels via the theme-builder `Label` / `Section` primitives and `Field.Label`. Reach for those instead of hand-rolling a `<span className="text-xs uppercase text-muted-foreground">` micro-label — they're already styled, sized, and cased correctly.
