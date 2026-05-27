# @gradeui/walker

React-to-Figma walker for the Grade Design System.

Parses JSX/TSX source (or a runtime React element) into a **Grade payload** — the JSON shape consumed by the `code-to-figma` Figma plugin. The plugin instantiates the same composition in Figma as **linked component instances**, not detached frames.

## What it does

- `walk(source)` — JSX/TSX source string → IR (intermediate representation)
- `toPayload(ir)` / `toPayloadString(ir, name?)` — IR → Grade payload JSON
- `toJsx(ir)` — IR → pretty-printed JSX source (round-trip)
- `useGradeSerialize(source)` — React hook: `{ json, jsx, diagnostics }`, memoised on `source`
- `GradePayloadPanel` — JSX / JSON tab strip + "Send to Figma" button (copies JSON to clipboard, emits a toast hook)
- `registerAll(modules)` — soft name registry; unknown component names produce diagnostics

## Why text-based?

Grade's Studio is a chat-driven composer that emits JSX as a string. The "live tree" lives inside a sandboxed iframe. Parsing the text directly means:

- The Figma payload matches the JSX the user is reading, byte-for-byte
- No postMessage bridge into the iframe to extract a runtime tree
- Conditionals, variable bindings, and `{expr}` content are emitted as opaque expression placeholders (good enough for v1)

If a later product surface needs runtime-tree walking (live React app in the same window), add a `walkElement(reactNode)` sibling that produces the same IR. Public API is stable.

## Payload contract

Mirrors the [`code-to-figma`](../../gradeui-figma/code-to-figma-ready-latest/README.md) plugin schema. Component names are PascalCase and exact-match to the Figma file. The primary slot is named `content`; multi-region components use descriptive names (`leading`, `center`, `trailing`).

```json
{
  "name": "Single button",
  "root": {
    "type": "Button",
    "props": { "variant": "default", "size": "md" },
    "slots": { "content": ["Sign in"] }
  }
}
```

## Known limits (v1)

The v1 walker emits the JSX faithfully. It does **not** know about three flavours of drift between the React API and the Figma component layer:

- **Boolean visibility variants.** Figma components like `Toolbar` use boolean variants (`"show leading": true`) to gate region visibility. The React API derives the same intent from slot presence, so the walker has no way to know which variants to emit. Result: structurally-correct payload, but those booleans land at their defaults — you may need to flip them manually in Figma's property panel until the sidecar layer ships.

- **Component name drift.** If a React component gets renamed without a matching Figma rename (or vice versa), the walker keeps emitting the React name and the plugin throws "No component named X found in this Figma file." The diagnostic is clear; the fix is to keep the names in sync.

- **Prop name format.** Walker emits prop names verbatim from JSX (`showLeading`). Figma variant names sometimes use spaces (`"show leading"`). The walker doesn't bridge that today.

The follow-up — extending the existing sidecar pattern (`packages/ui/components/ui/*.md`) with an optional `figma:` block in the frontmatter — is fully designed in [`FIGMA-MAPPINGS.md`](./FIGMA-MAPPINGS.md). Authoring + generator + walker plumbing are all sketched there, including a backfill priority list and anti-patterns.

Until that lands, the rule of thumb for which components round-trip cleanly in v1:

- **Clean:** any single-region component where React's `children` is the only slot — `Button`, `Badge`, `Input`, `Label`, etc.
- **Mostly clean:** multi-region components where the Figma file doesn't use boolean visibility variants — `Stack`, `Row`, `Grid`, `Breadcrumbs`.
- **Needs the sidecar layer:** `Toolbar`, `Card`, `AppShell`, `Sidebar`, and anything with `show <region>` boolean variants on the Figma side.

See `gradeui/PRD-walker.md` (root) for the full design spec.
