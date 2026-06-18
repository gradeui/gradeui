# Studio Typography — base styles, the step ladder, and prose

How a theme expresses *all* of its type from a few mixable base styles, with per-step inherit-or-override for total flexibility, without breaking the deterministic `ThemeInput` contract.

> Status: design doc / contract lock. Drafted 2026-06-18.
> Sibling of [`STUDIO-THEMES.md`](./STUDIO-THEMES.md) (the theme is a `ThemeInput`) and [`THEME-MIGRATION.md`](./THEME-MIGRATION.md) (the `--text-*` ladder + at-will scale). This doc locks the typography sub-contract before the editor is built, so the UI isn't built on sand.

---

## Problem

Today a theme has three font roles (display / body / mono), a modular `scale`, and a couple of global heading knobs. That can't express "h1 is the header font at 700 with tighter leading, h4 inherits the same but normal weight, body copy is its own thing, and long-form prose has its own rhythm." Designers think in **named styles that mix and inherit**, not in three global fonts.

The fix is a small, additive layer: a handful of **base styles** you mix from, and a **named step ladder** where each step inherits a base style and overrides only what differs. Everything stays token-bound (a step references a role or a base style, never a raw font), so it's still deterministic and portable, and an empty typography block generates byte-identically to today.

## Font roles

`typography` carries the font *families* as roles:

- **Display** — headings / large type.
- **Body** — the workhorse.
- **Mono** — code.

*(Italic is deferred. When it lands it's a supplementary font role, not a base style — a step or base style opts into it.)*

A style never names a raw family; it picks a **role**. The generator already resolves each role to a family stack (`resolveFontFamily`), so role selection stays portable and a step can't reference a font the theme doesn't carry.

## The two layers

### 1. Base styles — the mixers

A finite, locked set of reusable styles every theme has:

- **Body** — the catch-all default. Everything falls back here.
- **Header** — headings.
- **Mono** — code / tabular.
- **Prose** — long-form rich text (see below).

Each base style is a `TypeStyleProps` bundle: a font role + weight + line-height + letter-spacing. Unset properties fall back to the generator's default for that slot.

### 2. The step ladder — inherit, then override

The named steps that screens actually use:

```
display · h1 · h2 · h3 · h4 · h5 · h6 · body · small · caption
```

Each step **inherits from one base style** and may **override any individual property**. Size always comes from the modular `scale` (the `--text-*` ladder); everything else cascades **base default → base style → step override**. So `h1` inherits Header but can set its own leading; `h4` inherits Header at normal weight; `caption` inherits Body but smaller and tracked out. That cascade is where the flexibility comes from while the surface stays tiny.

## Prose

Prose is **not a single style** — it's the typography of a markdown / rich-text tree (`p`, headings, lists, blockquote, `code`, links), the Tailwind `prose` surface. A blog or an in-app editor renders into it. The Prose section says:

- which base style drives **prose body** and which drives **prose headings** (compose the same base styles), plus
- prose-only knobs: **paragraph spacing**, **measure** (max line length), and **link** treatment.

It reuses the base styles rather than redefining type, so changing the Header base restyles both app headings and prose headings.

## Responsive scale

The modular `scale` can differ **per breakpoint** — mobile commonly drops down a step so big display type doesn't blow out a narrow screen. Only the **sizes** change: line-height, letter-spacing, weight, and font are relative (unitless leading, em tracking) and ride along unchanged, so a single scale override per breakpoint re-pitches the whole `--text-*` ladder for that width without re-specifying anything else.

A base `scale` plus optional per-breakpoint overrides (`sm` / `md` / `lg`). The generator emits the `--text-*` ladder at `:root` and re-emits only the changed sizes inside the matching `@media (min-width: …)` block; everything keyed off `--text-*` re-scales at that breakpoint for free.

## Per-style weight, width, and the advanced tail

**Weight is per style, not global.** Body, Header, and Mono each carry their own `weight` (already in `TypeStyleProps`); steps override it. This supersedes the old single "Heading weight" knob.

**Width (font-stretch) is conditional.** It only does anything on a *variable* font with a `wdth` axis, so the width control is gated on the selected font actually carrying that axis, a static font hides the control rather than showing a dead knob. Modelled per style as an optional `stretch`.

**Advanced is deferred.** Ligatures and other OpenType features (`font-feature-settings`, `font-variant-*`) are real but niche; they sit behind a future per-style **Advanced** disclosure rather than cluttering the default controls.

**Inputs are value-aware.** The numeric fields (line-height, letter-spacing) parse what's typed the same way the font picker does, recognising unitless vs `rem` / `px` / `em` / `%` with sensible presets, so a field is never blank and never silently accepts nonsense.

## The contract (additive on `ThemeInput.typography`)

```ts
type FontRole = "display" | "body" | "mono";              // + "italic" later

interface TypeStyleProps {
  font?: FontRole;
  weight?: number;
  lineHeight?: string;       // "1.4" | "1.75rem"
  letterSpacing?: string;    // "-0.01em" — owned here, never a tracking-* utility
}

type TypeBaseStyleKey = "body" | "header" | "mono" | "prose";
type TypeStepKey =
  | "display" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  | "body" | "small" | "caption";

interface TypeStep extends TypeStyleProps {
  inheritsFrom?: TypeBaseStyleKey;   // default per step (h* → header, else body)
}

interface ProseStyle {
  bodyStyle?: TypeBaseStyleKey;      // default "body"
  headingStyle?: TypeBaseStyleKey;   // default "header"
  paragraphSpacing?: string;
  measure?: string;                  // max line length, e.g. "65ch"
  linkColor?: "primary" | "accent" | "foreground";
}

// added to ThemeInput.typography:
baseStyles?: Partial<Record<TypeBaseStyleKey, TypeStyleProps>>;
steps?:      Partial<Record<TypeStepKey, TypeStep>>;
prose?:      ProseStyle;
// `scale` stays the base; per-breakpoint overrides re-pitch sizes only:
scaleByBreakpoint?: Partial<Record<"sm" | "md" | "lg", TypeScale>>;
```

All optional and sparse. Empty → today's output, unchanged. This is a strict superset of the contract, never a fork (the `STUDIO-THEMES.md` invariant).

## Generator plan (default-preserving)

For each step, resolve `base default → baseStyles[inheritsFrom] → step override`, then emit the Tailwind v4 `--text-*` companions alongside the existing size:

- `--text-<step>--line-height`
- `--text-<step>--letter-spacing`
- `--text-<step>--font-weight`

Font role per step maps to a small `font-family` on the step's class (the one property `text-*` utilities don't carry). Prose compiles to the `prose` CSS var block. When a step has no overrides, the emitted values equal the current curve, so existing themes are byte-identical, the determinism the whole theme system rests on.

## The editor (preview + inputs together)

The Typography sub-tab is **one surface**, not a controls column plus a separate specimen:

- **Base styles** block at top: Body / Header / Mono / Prose, each with font-role + weight + line-height + letter-spacing.
- **Step ladder**: each row shows the live "Aa + sentence" specimen *and* its inputs together — an inherits-from picker plus the four override knobs. The specimen renders from the **resolved** props via inline styles, so it reflects edits instantly without waiting on the generator.
- **Prose** section: the two style pickers + paragraph spacing / measure / link.

Labels are sentence case and use the existing form primitives (`Label` / `Section` / `Field.Label`), never hand-rolled uppercase micro-labels (Studio convention, see `apps/docs/CLAUDE.md`).

## Rollout

- **TY0 — Contract** *(this doc + the types)*. Additive `ThemeInput.typography` fields. No behaviour change.
- **TY1 — Editor**. The co-located base-styles + step-ladder + prose editor, live preview via resolved inline styles, wired to `builder.patch`.
- **TY2 — Generator emit**. Per-step `--text-<step>--*` companions + per-step font-family + prose CSS. Default-preserving; needs screenshot/visual verification before it ships.
- **TY3 — Italic role**. Add the supplementary italic font role; steps/base styles can opt in.

## Constraints carried over

- **Deterministic generator stays load-bearing** (`STUDIO-THEMES.md` → "the seed must stay deterministic"). Per-step emission must equal the current curve when no overrides exist.
- **Token-bound, never raw.** A step references a role or a base style, never a literal family or a `tracking-*` utility. Letter-spacing is owned by the theme.
- **Finite, locked sets.** Base styles and steps are a fixed vocabulary, scalable by design. Bespoke named styles, if ever wanted, layer on top later; they don't expand this set now.
