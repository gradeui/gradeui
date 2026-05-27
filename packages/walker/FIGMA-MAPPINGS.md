# Figma mappings — per-component sidecar layer

Status: Design doc. Not implemented. Follow-up to the v1 walker.
Last updated: 2026-05-26

## Why this exists

The v1 walker emits a Grade payload that's faithful to the JSX source: `<Toolbar leading={...}/>` becomes `{ type: "Toolbar", slots: { leading: [...] } }`. For most components this is exactly what the Figma plugin needs — the component name is the same on both sides, the slot keys are the same, and prop values flow through.

For some components it isn't. Three flavours of drift show up in practice, and the walker has no way to fix any of them by looking at the JSX alone:

**1. Boolean visibility variants.** A Figma component often gates the visibility of its sub-regions with boolean variant properties — `"show leading": true`, `"show footer": false`, etc. The React component derives the same information from slot presence: if `leading={<Breadcrumbs/>}` is passed, the leading region renders. The two sides agree on intent but encode it differently, and the walker sees only the React side.

The reference `gradeui-figma/code-to-figma-ready-latest/example/05-toolbar.json` shows this exactly:

```json
{
  "type": "Toolbar",
  "props": {
    "size": "md",
    "variant": "default",
    "show leading": true,
    "show center": true,
    "show trailing": true
  },
  "slots": { "leading": [...], "center": [...], "trailing": [...] }
}
```

The three `show *` booleans are derivable from slot presence, but the walker doesn't know which props to derive or which components have them.

**2. Name drift.** Today the walker emits `type: "Toolbar"` because the React component is named `Toolbar` and the Figma component is named `Toolbar`. If `Toolbar` ever gets renamed in React without a coordinated Figma rename — or vice versa — the payload silently stops matching. The plugin throws "No component named X found in this Figma file", which is a clearer error than a layout bug but still surfaces late.

**3. Prop name format.** React conventions are camelCase: `showLeading`, `variantStyle`. Figma allows spaces in property names and the reference payloads above use the spaced form: `"show leading"`, `"variant style"`. There's no algorithmic way to know which props need translation — `variant` stays `variant`, but `showLeading` becomes `"show leading"`. The mapping is per-prop, per-component.

## The shape of the fix

Extend the existing sidecar pattern (`packages/ui/components/ui/<name>.md`) with an optional `figma:` block in the YAML frontmatter. Sidecars are already the canonical place to put "things the model and tooling need to know about a component beyond its TypeScript signature," so adding a Figma mapping there matches the architecture rather than fighting it.

The block is fully optional. Components where the default rules work (component name matches, slots use `content` or named regions identically, props are 1:1) don't need a `figma:` section at all. Around 80% of the library should be in this bucket — `Button`, `Badge`, `Stack`, `Row`, `Grid`, etc. The block exists for the components that drift.

Proposed shape:

```yaml
---
name: Toolbar
import: "import { Toolbar } from '@gradeui/ui'"
when_to_use: ...
props: |
  size: "sm" | "md" | "lg"
  variant: "default" | "ghost"
figma:
  # Override the Figma component name (default: same as `name` above).
  name: Toolbar
  # When the keyed slot is non-empty, also set the named prop to true.
  # Drops the prop entirely when the slot is empty.
  slot_implies_boolean:
    leading: "show leading"
    center: "show center"
    trailing: "show trailing"
  # Explicit React-prop-name → Figma-prop-name overrides.
  # Default behaviour is identity; only list the ones that need a rename.
  prop_aliases:
    showLeading: "show leading"
---
```

Three rules, all optional. A component with only one drift case lists only the relevant rule.

## Where the work lives

Two pieces. Both are small and well-isolated.

### Generator side — `packages/studio/scripts/generate-sidecars.mjs`

The script already reads every `.md` sidecar and inlines its content as a string map in `playbook/components/sidecars.generated.ts`. Extend it to also parse the YAML frontmatter, extract the `figma:` block from each, and emit a structured `FIGMA_MAPPINGS` constant alongside the existing inlined strings:

```ts
// packages/studio/src/playbook/components/figma-mappings.generated.ts (new)
export const FIGMA_MAPPINGS = {
  Toolbar: {
    name: "Toolbar",
    slot_implies_boolean: {
      leading: "show leading",
      center: "show center",
      trailing: "show trailing",
    },
  },
  // ...
} as const;
```

The generator already runs as a `prebuild` script, so it picks up sidecar changes automatically.

### Walker side — new optional `mappings` parameter

`toPayload()` gains an optional second argument:

```ts
import { toPayload } from "@gradeui/walker";
import { FIGMA_MAPPINGS } from "@gradeui/studio/playbook";

const { payload } = toPayload(ir, { mappings: FIGMA_MAPPINGS });
```

`toPayload` walks the IR and, for each IRNode, looks up `mappings[node.type]`. If present:
- Rename the payload `type` to `mappings[node.type].name` (or leave alone if unset)
- For each entry in `slot_implies_boolean`, check whether the named slot has any non-empty children; if so, add the boolean prop to `payload.props`
- For each entry in `prop_aliases`, rename the prop key in `payload.props`

The walker's existing diagnostic flow handles the failure modes: missing mapping for a component is silent (correct default), and mismatches between mapping and IR (e.g. mapping references a slot that doesn't exist) generate info-level diagnostics.

`GradePayloadPanel` accepts `mappings` as a top-level prop and threads it down to `useGradeSerialize`.

In `apps/docs/components/studio/fast-frame.tsx`:

```tsx
import { FIGMA_MAPPINGS } from "@gradeui/studio/playbook";

<GradePayloadPanel
  source={preparedForCodeView}
  walkerOptions={{ permissive: true }}
  mappings={FIGMA_MAPPINGS}
  // ...
/>
```

That's the whole wire-up.

## Backfill strategy — lazy, empirical

Don't backfill the whole library. The shortlist of components that almost certainly need a `figma:` block based on shape:

- **`Toolbar`** — three regions, three boolean variants
- **`Card`** — header / footer slots, likely boolean variants for each
- **`AppShell`** — nav variants and the `header` / `footer` / `aside` slots
- **`Sidebar`** — header / footer / sections
- **`Breadcrumbs`** — depends on the Figma component; might be auto

Everything else should be left until someone hits an issue. The cost of an unneeded sidecar block is permanent noise in the frontmatter; the cost of a missing one is one Send-to-Figma click that surfaces a clear diagnostic. The asymmetry favours empiricism.

When a missing mapping is identified:
1. Add the `figma:` block to the component's sidecar
2. Run `pnpm -F @gradeui/studio generate:sidecars`
3. Verify in Studio with one Send-to-Figma click

No build step beyond the generator.

## What does NOT belong in `figma:`

Sidecars are model-facing knowledge first; the Figma block is a small bolt-on. Things that should NOT live here:

- **Layout hints** (gaps, padding, alignment for `$frame` directives). Those belong on the React component's API or in the layout primitives. If `Toolbar` needs a 12px gap between regions in Figma, that's a Figma component property, not a walker mapping rule.

- **Component implementations.** The `figma:` block declares mappings, not behaviour. "When `variant=ghost`, the background should be transparent" is a Figma styling concern that lives in the Figma component, not here.

- **Default prop values.** The walker emits the props the user wrote. If `<Button>` without a `variant` prop should resolve to `"default"` in the Figma instance, that's the Figma component's variant default, not a walker concern.

The rule of thumb: `figma:` exists to bridge unambiguous identity drift. Anything that involves a judgment call about how something *looks* lives somewhere else.

## Anti-patterns to call out in the sidecar authoring guide

- **Don't list every prop in `prop_aliases`.** It's identity-by-default. Only list the renames.
- **Don't infer `slot_implies_boolean` from prop names.** If the React component has `showLeading` as a prop already, you don't need `slot_implies_boolean: { leading: "show leading" }` — the walker emits the prop directly. The boolean rule is for the case where React doesn't expose the boolean and derives behaviour from slot presence.
- **Don't fork the name.** If you find yourself wanting `figma.name` to differ from the React name, ask whether you should rename one side. Persistent name drift is a smell, not a feature.

## Open questions for the implementer

These would have shaped the doc but I didn't have enough context to resolve them:

1. **Does the Figma file actually have a `Toolbar` component, or is it a component set with `size` / `variant` variants?** The walker payload schema accepts both, but the boolean variants are conventionally encoded on component sets, not components. Worth verifying against the live Figma file before backfilling.

2. **Is there an existing list of "components that exist on both sides"?** If not, the first task is enumerating that — possibly via `figma.search_components` against the actual file. The sidecar layer is only useful if you know which components have a Figma counterpart at all.

3. **Should `figma.name` accept a component-set key vs a variant key?** A Toolbar component set might be keyed by `size`, so the payload would emit `Toolbar` with `props: { size: "md" }` and the plugin resolves to the right variant. This is already how the v1 walker works, so probably nothing changes — but worth a sentence in the sidecar authoring guide.

## Related memory

The walker's text-based architecture is captured in the `walker-text-based` memory. The sidecar layer extends, but doesn't change, that architecture — the IR stays the same, only `toPayload`'s emission step learns the per-component mappings.

## Implementation checklist (for the follow-up PR)

- [ ] Update `packages/studio/scripts/generate-sidecars.mjs` to parse `figma:` from frontmatter and emit `playbook/components/figma-mappings.generated.ts`
- [ ] Export `FIGMA_MAPPINGS` from `@gradeui/studio/playbook`
- [ ] Add `mappings` parameter to `toPayload()` + `toPayloadString()` in `packages/walker/src/to-payload.ts`
- [ ] Add `mappings` prop to `GradePayloadPanel` + thread through `useGradeSerialize`
- [ ] Wire `FIGMA_MAPPINGS` into `fast-frame.tsx`'s `GradePayloadPanel` call
- [ ] Backfill `figma:` blocks on `Toolbar`, `Card`, `AppShell`, `Sidebar`. Add others only when reported.
- [ ] Document the `figma:` shape in `apps/docs/STUDIO.md` under the "Playbook — the model's knowledge layer" section
- [ ] Add a `Walker compatibility` row to `packages/ui/COMPONENTS.md` indicating which components have explicit mappings
