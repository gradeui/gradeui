# STUDIO-COMPONENTS — Shared components

**Status:** Core vertical + Stage 1 visibility SHIPPED (Aug 8, 2026 — commits `2490e0c`, `08d405a`). Stage 2 (edit-the-master) is design only.
**Companions:** `STUDIO-BYODS.md` (the registry contract this generalises toward), `apps/docs/STUDIO.md` (renderer/protocol detail), `STUDIO-PERSISTENCE.md` (save semantics).

## What it is

Project-scoped reusable JSX modules — an `OnboardingLayout`, a `Wordmark`, a chart wrapper — stored as **rows in Supabase** (`shared_components` table, migration `0025`) and imported by screens via ONE stable specifier:

```jsx
import { OnboardingLayout } from "@project/components";
```

Born from the Glint onboarding flow (many screens, one wizard chrome): copy-paste per screen was "fine in principle, a pain in practice", and the Brightlocal-style checked-in registry required repo checkins per tweak. Shared components are **data**: same substance as `designs.state.appSource`, compiled by the same kernels, live-updatable — edit the row, every importing screen picks it up on next render. No copies, no checkins.

## The model

- **One row = one module exporting one named component.** `name` (PascalCase, live-unique per project) is both the export and the import name. Compound parts (`OnboardingLayout.Actions`) live inside the module via `Object.assign`-style attachment and ride the same export.
- **Modules may import**: `@gradeui/ui`, the allowed externals (lucide, recharts, motion…), and **each other** via `@project/components`. Resolution is LAZY per-name with a cycle guard — mutual imports only fail on true circular *initialization* access.
- **Authoring is MCP-first**: `save_shared_component` / `list_shared_components` / `get_shared_component` / `delete_shared_component` (apps/mcp-server). Saves run the same registry contract gate as screens plus an export-name check; updates are compare-and-swap guarded (`expectedUpdatedAt`); delete is soft (`deleted_at`). Studio is read-only (Stage 1).

## Resolution per surface

The sources are data and must travel every channel the screen source travels:

| Surface | Channel | Resolver |
|---|---|---|
| Studio canvas / live embed / share view | `sharedModules` prop → `FastIframeHost` → `modules` field on `grade:fast-compile` | `fast-sandbox/page.tsx` module cache (duplicate kernel) |
| Flat render (`/e/?flat=1`, posters, `preview_image`) | `FlatScreen sharedModules` prop | `setProjectModules()` in `lib/studio-render-core.tsx` |
| MCP interactive View | `structuredContent.sharedComponents` | same core seam via `preview-view/view.tsx` |
| Sandpack (parity / BYODS-pinned) | `buildSandpackFiles({ sharedModules })` | `/shared-<Name>.jsx` files + `/project-components.jsx` barrel, specifier rewritten |
| CodeSandbox export | `openInCodeSandboxNpm({ sharedModules })` | real `src/shared/<Name>.jsx` files + barrel (exports run standalone) |

Server pages (`/e/[token]`, `/s/[token]`) fetch the rows directly; the Studio page loads them via the storage adapters (`listSharedComponents` rich rows + `listSharedComponentSources` name→source map — the map is the compatibility seam every renderer prop keeps).

## Stage 1 (SHIPPED): sealed instances + visibility

The Figma instance/master model, instance half:

- **Boundary stamper** — the kernels wrap each shared export (`wrapWithBoundary` in fast-sandbox + studio-render-core + the Sandpack barrel — **keep all three in sync**) pinning `data-gds-boundary=<Name>`, `data-gds-name`, and the usage tag's `data-gds-source-id` onto the component's real ROOT node. Needed because the screen-source stamp never reaches the DOM when a component destructures its props.
- **Selection**: a click on the component's OWN chrome seals to the nearest boundary whose root carries a screen stamp (walking outward past module-internal, unstamped boundaries). `SelectionPayload`/`StudioSelection` carry `boundary?: string`; the path bar shows `App › <Name>`; the inspector renders a shared-component card instead of the contract panel (which also closed a live mis-target hazard: internal-part clicks used to edit the first same-named component in screen source).
- **Slot carve-out (8 Aug 2026)**: children the SCREEN passes into a component's slot render inside the boundary's subtree but carry the screen's `data-gds-source-id` stamps, while module internals stay unstamped until Stage 2. A stamped nearest ancestor inside the boundary (that is not itself a boundary root) therefore means screen-owned slot content: it selects and edits like any screen node instead of sealing. Without this, wrapping a whole screen in a layout component (OnboardingLayout) locked every form field out of visual editing.
- **Visibility**: project rail → **Shared components** (`ProjectSection "components"`): name / description / version (`updatedAt`) / "used in N screens" (parsed from `@project/components` import bindings client-side), with a read-only `CodeView` Sheet viewer.

## Stage 2 (design only): enter the master

Namespaced source-id stamping inside module sources (`OnboardingLayout:line:col`), breadcrumb paths INTO the component, and an explicit enter-the-master gesture that retargets mutations from the screen to the component row — with "editing this changes every screen" framing and the existing version guards. Hold until the editing semantics are deliberately chosen; settings-panel edits inside a shared component are undefined until then.

## Named exports (8 Aug 2026)

Shared modules can export more than their name-matched component: hooks and helpers (`export function useFlowField(...)` in a FlowStore module) resolve by name from `"@project/components"`. Semantics: module names always shadow helpers; among helpers the first module in name order wins; `default` never crosses the barrel. The Fast/render-core kernels implement this with a lazy Proxy fallthrough (a helper miss compiles modules one by one, then caches); the Sandpack barrel appends `export *` per module, where explicit component exports shadow stars and cross-module helper collisions drop as ESM-ambiguous names. Before this, helper exports silently resolved to `undefined` and importers crashed with "Cannot read properties of undefined (reading 'call')".

## Gotchas (learned the hard way, all on Aug 8 2026)

1. **Three wrappers, one behavior**: `wrapWithBoundary` exists in fast-sandbox, studio-render-core, AND the Sandpack barrel generator (`chat-sandpack.ts sharedModuleFiles`). Change one → change all three. The same rule covers the named-export fallthrough above.
2. **The MCP panel bundle is frozen at build time**: `apps/mcp-server/src/preview-view-html.ts` inlines a compiled copy of studio-render-core. After render-core changes run `pnpm -F @gradeui/docs build:preview-view`. Resource URIs carry the bundle's content hash so host caches bust automatically — do not remove that.
3. **Publish lag bites exports**: the CodeSandbox export installs `@gradeui/ui@latest` from npm. Screens using components newer than the last publish fail with "Element type is invalid: got undefined". Check `npm view @gradeui/ui time.modified` before debugging anything else.
4. **`@floating-ui/react-dom`** must stay in the export package.json (CodeSandbox can't resolve radix-popper's transitive dep; any Select/Popover screen needs it).
5. **The stored screen source may carry `data-gds-source-id` stamps** (Studio's mutation pipeline persists them). The exporters strip them; don't be surprised seeing them in `designs.state.appSource`.
6. **Freshness**: Studio loads shared components once per project switch. MCP edits mid-session need a project reload to appear (same model as the theme draft).
