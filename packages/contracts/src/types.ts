/**
 * Public types for the @gradeui/contracts package.
 *
 * A `ComponentContract` is the single machine-readable description of a
 * Grade DS component. It replaces the informal `.md` props frontmatter
 * that the playbook used to parse with regexes — same data lives here as
 * actual TypeScript, with a Zod schema per prop so types, allowed
 * values, and runtime validation all derive from one declaration.
 *
 * Three consumers read contracts:
 *
 *   1. **Studio's settings panel** — renders one control per
 *      `design: "knob" | "content" | "structured"` prop, plus action
 *      buttons declared in `actions`. Plumbing props (`asChild`, `ref`,
 *      `style`, `className`, event handlers) are filtered out by
 *      `design`, so you don't get an "asChild" switch on a Stack.
 *
 *   2. **The playbook** — flattens contracts into the model-facing
 *      prompt block (variants, prop names, allowed values). Reading
 *      from Zod enums + descriptions instead of parsed-Markdown means
 *      the model and the panel see exactly the same surface.
 *
 *   3. **Runtime validation** (optional) — server-side resolvers can
 *      `.parse()` incoming prop values against the schema before they
 *      hit the renderer, catching "model picked a variant that doesn't
 *      exist" before it explodes at render time.
 *
 * Contracts are co-located with their component
 * (`media-surface.contract.ts` lives next to `media-surface.tsx`) so
 * the two evolve together — adding a prop to the component without
 * adding it to the contract surfaces as a TypeScript error the next
 * time the consuming code reads the contract.
 */

import type { z } from "zod";

// ─── Design taxonomy ─────────────────────────────────────────────────
//
// Every prop on a component falls into one of these buckets. The Studio
// settings panel filters its rendered controls by this axis — "plumbing"
// and "event" and "ref" never reach the panel, "knob" / "content" /
// "structured" do.
//
//   knob       — discrete design choice. Variants ("primary" / "secondary"),
//                booleans (`border`, `loading`), small numbers (`radius` scale).
//                Renders as Select / Switch / Number / ToggleGroup / GlyphPicker.
//
//   content    — text or URL the user authors. `alt`, `title`, `src`,
//                `placeholder`. Renders as Input / Textarea.
//
//   structured — discriminated union with per-kind sub-fields. MediaSurface's
//                `source` is the canonical case: `kind` picks one of N
//                shapes, and the panel reveals only the fields that
//                shape exposes. Renders as a sub-form keyed off the
//                discriminator.
//
//   plumbing   — needed at the code layer, meaningless to designers.
//                `asChild`, `className`, `style`, `id`. Hidden from
//                the panel; still in the schema for runtime validation
//                and prop typing.
//
//   event      — `onClick`, `onChange`, etc. Same as plumbing for the
//                panel, kept distinct so future tooling (e.g. a
//                prototype-mode "wire this to an action" affordance)
//                can find them.
//
//   ref        — React refs. Plumbing-shaped but kept distinct for the
//                same reason.

export type Design =
  | "knob"
  | "content"
  | "structured"
  | "plumbing"
  | "event"
  | "ref";

// ─── Control kinds ───────────────────────────────────────────────────
//
// What UI control the panel renders for a knob/content prop. "auto" (the
// default) lets the panel pick based on the schema shape:
//
//   ZodEnum / ZodLiteral union  → "select" if >4 options, "toggle-group" if ≤4
//   ZodBoolean                  → "switch"
//   ZodNumber                   → "number"
//   ZodString                   → "text"
//
// Explicit overrides matter when the default isn't right:
//
//   glyph-picker  — variants that map to visual icons (MediaSurface.hint:
//                   album-disc, portrait-person, landscape-mountain…).
//                   Renders as a row of clickable glyphs.
//   slider        — numeric scale that feels more like a continuous
//                   adjustment than a discrete pick (radius? opacity?).
//   textarea      — long-form text (descriptions, prompts).
//   url           — text with URL-shaped validation hints + a
//                   "preview link" affordance.
//   color         — colour picker (CSS colour string).

export type Control =
  | "auto"
  | "select"
  | "toggle-group"
  | "glyph-picker"
  | "switch"
  | "checkbox"
  | "number"
  | "slider"
  | "text"
  | "textarea"
  | "url"
  | "color";

// ─── Per-prop contract ───────────────────────────────────────────────

export interface PropContract<T = unknown> {
  /** Zod schema. Single source of truth for the prop's runtime + TS shape.
   *  Use `.optional()` for optional props; the panel reads this to know
   *  whether the prop can be cleared. Discriminated unions express
   *  "structured" props (see MediaSurface.source). */
  schema: z.ZodType<T>;
  /** Which design axis this prop sits on. Drives panel filtering. */
  design: Design;
  /** Override the panel's default control kind. Most knobs pick a sensible
   *  default from the Zod shape; this is for cases like
   *  `hint: { control: "glyph-picker" }`. */
  control?: Control;
  /** Human-readable label shown above the control in the panel. Defaults
   *  to a Title-cased version of the prop name. */
  label?: string;
  /** Short prose explaining the prop. Surfaces as a tooltip / help text
   *  in the panel. Also seeds the playbook prop description. */
  description?: string;
  /** Default value the component uses when this prop is omitted. Drives
   *  the "Reset to defaults" button. Also shipped to the model. */
  default?: T;
  /** Concrete example values. Surfaces in tooltips and is included in
   *  the model-facing prompt block. */
  examples?: T[];
  /** Per-kind sub-field hints for structured (discriminated union) props.
   *  The panel uses this to render a sub-form for each `kind`. If
   *  omitted, the panel falls back to walking the Zod schema. */
  perKindFields?: Record<string, Record<string, string>>;
}

// ─── Actions ─────────────────────────────────────────────────────────
//
// Actions are imperative things the user can DO with a selected
// component, distinct from changing its props. MediaSurface's "Fill
// image" and "Refresh image" are the canonical case — they don't write
// to a prop, they trigger a host-mediated workflow (resolve-via-providers
// → update runtime URL map). The contract DECLARES the action and tags
// it with a `kind` the host recognises; the host wires the actual
// behaviour. Different hosts (Studio, an MCP server, a future codemod)
// can implement different kinds or skip ones they don't support.

export interface ActionContract {
  /** Display label for the action button in the panel. */
  label: string;
  /** Lucide icon name (`Sparkles`, `RotateCw`, etc.). The host renders it. */
  icon?: string;
  /** One-line tooltip. */
  description?: string;
  /** Host-defined action kind. Studio currently recognises:
   *    - "resolve-media-source"   — fill an empty MediaSurface
   *    - "refresh-media-source"   — cache-bust + re-resolve
   *    - "force-open"             — force-render a stateful component open
   *  Add new kinds as Studio grows; unknown kinds are skipped silently
   *  by the host so contracts stay forward-compatible. */
  kind: string;
  /** Conditional availability. Currently supports `propPresent: "<name>"` —
   *  the action button is disabled when that prop is missing/empty. Useful
   *  for actions that need a `source` to operate on. */
  enabledWhen?: {
    propPresent?: string;
  };
}

// ─── Component contract ──────────────────────────────────────────────

export interface ComponentContract<P extends Record<string, PropContract> = Record<string, PropContract>> {
  /** PascalCase component name. Matches the JSX tag. */
  name: string;
  /** One-line description. Shown in the panel header and in the playbook. */
  description: string;
  /** Longer prose for "when to reach for this." Renders in the panel's
   *  collapsed info section and gets stitched into the playbook. */
  when?: string;
  /** Don't-do-this list. Shows up as the "Anti-patterns" callout. */
  antipatterns?: string[];
  /** Sister components that compose well. Strictly informational. */
  composesWith?: string[];
  /** Names the model might reach for that should redirect to this
   *  component ("media", "image slot", "cover"). Used by the relevance
   *  matcher in the playbook. */
  aliases?: string[];
  /** Import specifier. Defaults to "@gradeui/ui". Override when a
   *  component lives in a different package (`@gradeui/pro`, a per-client
   *  package). */
  import?: string;
  /** Subcomponents the consumer imports alongside (`AvatarImage`,
   *  `DialogTrigger`). The model needs these in the same import line. */
  subcomponents?: string[];
  /** The prop map. Generic so `z.infer<typeof Contract.props.foo.schema>`
   *  preserves narrow types per-prop. */
  props: P;
  /** Actions discoverable on a selected instance. Keyed by stable id;
   *  the host dispatches by the action's `kind`. */
  actions?: Record<string, ActionContract>;
}

/**
 * Type helper: given a contract, derive the React props type. Each prop
 * gets its `z.infer<typeof schema>` shape, optionally wrapped in
 * `Partial` (every prop is allowed-optional at the JSX boundary since
 * defaults exist).
 *
 * Use in component files:
 *
 *     export type MediaSurfaceProps = InferProps<typeof MediaSurfaceContract>;
 */
export type InferProps<C extends ComponentContract> = {
  [K in keyof C["props"]]?: C["props"][K] extends PropContract<infer T> ? T : never;
};
