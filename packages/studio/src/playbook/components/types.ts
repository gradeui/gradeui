/**
 * Pure types for the component knowledge base.
 *
 * Kept in their own file so non-server code (e.g. the Studio settings panel)
 * can import the type shapes without pulling in the full refs module. There
 * are no runtime imports here — only `type`/`interface` declarations.
 */

/**
 * Parsed form of a `<name>.md` sidecar. Matches the frontmatter schema 1:1;
 * missing keys are `undefined` so downstream formatters can skip empty slots
 * cleanly.
 */
export interface ComponentRef {
  /** Display name, e.g. "Button". Matches the exported component name. */
  name: string;
  /** Package the component ships from — almost always `@gradeui/ui`. The
   *  formatter renders this as a full `import { … } from "<pkg>"` line so
   *  the model doesn't guess at named-vs-default or invent relative paths. */
  import?: string;
  /** Variant names — strings from the component's CVA `variant` slot. */
  variants?: string[];
  /** Size tokens — strings from the component's CVA `size` slot. */
  sizes?: string[];
  /** Compact prop list; each entry is the prop's descriptor line verbatim. */
  props?: string[];
  /** Short human sentence on when the model should reach for it. */
  when_to_use?: string;
  /** Components that pair well with this one. */
  composes_with?: string[];
  /** Sub-exports the model can import alongside the root (e.g. CardHeader). */
  subcomponents?: string[];
  /**
   * Informal terms that should pull this ref into the prompt even when the
   * user doesn't say the canonical name. Word-boundary matched, case-insensitive.
   *
   * Example: `aliases: [rive, riv, animation]` on RivePlayer means the prompt
   * "make a rive animation" resolves to RivePlayer even though neither
   * "rive" nor "animation" matches "RivePlayer" via word-boundary equality.
   * Not rendered in the prompt block — matching-only.
   */
  aliases?: string[];
  /**
   * Free-form prose appended to the rendered ref block. Use for non-obvious
   * gotchas the model needs to see — valid preset ids, required props, public
   * demo URLs, "do NOT invent X" warnings. Supports YAML `|` block scalars
   * for multi-paragraph text.
   *
   * Notes are the highest-leverage field for anti-hallucination: you are
   * talking directly to the model at the moment it reasons about this
   * component. Spend tokens here liberally.
   */
  notes?: string;
  /**
   * Full prose body of the sidecar `.md` file — everything after the closing
   * `---` of the frontmatter. Holds canonical JSX examples + ### Anti-patterns
   * sections.
   *
   * Pinned into the system prompt by `formatRef` whenever the sidecar wins
   * retrieval. This is the difference between "the model gets the prop list
   * and guesses the API from training-data familiarity" and "the model gets
   * shown the canonical composition verbatim". Without this, the chatty
   * `### Anti-patterns` text the sidecar author wrote never reaches the model
   * — only the docs page renders it.
   *
   * Empty string when the .md has only frontmatter and no body.
   */
  body?: string;
}

// ─── Structured prop manifest ─────────────────────────────────────────────
//
// The machine-readable counterpart to the human-readable text block produced
// by `renderComponentRefsBlock`. The Studio settings panel reads these
// manifests to decide which control to render per prop. Source of truth is
// still the sidecar `.md` frontmatter — we just re-shape its props strings
// into discriminated-union objects the UI can pattern-match on.
//
// Design choices:
//   - Kind "unknown" is a first-class citizen. Functions, complex object
//     types (`Partial<Palette>`, `SceneHandle`), React nodes, and anything
//     else the parser can't decode land here. The settings panel just hides
//     these — the user can still reach them via the chat.
//   - Enum values keep their original type (string | number) so the UI can
//     decide whether to quote them when regenerating source.
//   - `defaultValue` is kept as the *raw text* from the descriptor, not
//     coerced. "min(devicePixelRatio, 2)" and `1` both make it through
//     intact; the consumer decides how to render it.

export type PropKind =
  | "string"
  | "number"
  | "boolean"
  | "enum"
  | "unknown";

export interface PropManifest {
  /** Prop name (no trailing `?`). */
  name: string;
  /** Declared optional via `name?:` — used by the settings panel to decide
   *  whether a "clear" control makes sense. */
  optional: boolean;
  /** Discriminator for the render strategy in the settings panel. */
  kind: PropKind;
  /** Present when `kind === "enum"`. Values preserve their declared type —
   *  quoted strings stay strings, bare numerics become numbers. */
  enum?: ReadonlyArray<string | number>;
  /** Raw default-value text lifted from `(default X)` in the descriptor.
   *  Not coerced — `"video"` and `1` both survive as strings. */
  defaultValue?: string;
  /** Free-form prose from the trailing ` — description` portion of the
   *  descriptor. Rendered as helper text in the settings panel. */
  description?: string;
  /** The original descriptor line, verbatim. Useful when the parser falls
   *  back to `kind: "unknown"` — the UI can still surface the raw hint. */
  raw: string;
}

export interface ComponentManifest {
  /** Canonical component name, e.g. "ThreeScene". */
  name: string;
  /** kebab-case identifier matching `data-gds-part`, e.g. "three-scene". */
  part: string;
  /** Import path, almost always `@gradeui/ui`. */
  import?: string;
  /** CVA variant slot — modelled as a synthetic enum prop when present. */
  variants?: string[];
  /** CVA size slot — modelled as a synthetic enum prop when present. */
  sizes?: string[];
  /** Parsed props. Only props the parser could make sense of are emitted
   *  as typed kinds; everything else falls through to `kind: "unknown"` with
   *  `raw` intact. */
  props: PropManifest[];
  /** From the frontmatter `when_to_use` — shown as the panel subtitle. */
  when_to_use?: string;
}
