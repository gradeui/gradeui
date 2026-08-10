# STUDIO-BRANDING.md — every project has a brand, and the AI knows it

The per-project **brand profile**: who this project is for, what it is, and
what it looks like — attached files + structured facts, distilled by AI into
a design brief that rides every generation payload. The outcome: prompt
"make me a dashboard" in the Acme project and you get *Acme's* dashboard —
their logo, their voice, their vertical's conventions — without saying
"Acme" once. And when no brand exists, the brand is **Grade**.

> Status: design doc. Drafted 2026-06-05. Siblings: [`STUDIO-STORAGE.md`](./STUDIO-STORAGE.md)
> (where brand files live), [`STUDIO-THEMES.md`](./STUDIO-THEMES.md) (colour/type — the
> *look* half; branding is the *identity* half), [`STUDIO-DIRECTOR.md`](./STUDIO-DIRECTOR.md)
> (Motion exports carry the brand + watermark).

## The principle — defaults are Grade, supplied brands win everywhere

The `<Logo>` component renders the Grade mark (square G-arrow) when no
artwork is supplied — SHIPPED. The agent's rule (in the Logo sidecar —
SHIPPED): always use `<Logo>` where a screen carries a brand; never fake a
mark. The brand profile is what upgrades this from a fallback into a
system: once a project carries brand artwork, **every** `<Logo>` in every
screen and Motion in that project renders *their* mark, because the profile
feeds the generation context AND (later) a project-scoped default-sources
mechanism. Showing your brand flowing into generated UI is the product
demo; Grade-by-default is the same mechanism with our own profile.

## The brand profile (per project)

```ts
interface BrandProfile {
  name: string;                      // "Acme"
  logo: {                            // project-owned assets (see ownership)
    square?: AssetRef;               // light/dark/mono variants per slot,
    horizontal?: AssetRef;           // mirroring LogoSources
    icon?: AssetRef;
  };
  category?: "app" | "website" | "ecommerce" | "saas" | "property" |
             "marketing" | "internal" | (string & {});
  vertical?: string;                 // "fintech", "real estate", "health"
  model?: "paid" | "free" | "freemium" | "b2b" | "b2c" | (string & {});
  audience?: string;                 // free text
  tone?: string[];                   // ["calm", "premium", "technical"]
  links?: string[];                  // site, app store, socials — fetchable
  docs?: AssetRef[];                 // attached brand guides, decks, PDFs
  brief?: {                          // THE DISTILLATE (see below)
    markdown: string;
    generatedAt: number;
    sourceHash: string;              // re-distill only when inputs change
  };
}
```

Stored on the project (snapshot field locally; `projects.brand_json` JSONB
in Supabase — one nullable column, migration `0018`). Defaults when absent:
`{ name: "Grade" }` — which is what makes a bare `<Logo />` correct.

## Ownership — project-owned brand assets, user-owned library

The general asset library stays **user-owned** (STUDIO-STORAGE as designed:
your photos and files travel with you, taggable to projects). Brand assets
are different: a logo is part of the project's *identity*, so brand assets
are **project-owned** — rows keyed by `project_id`, RLS mirroring
`project_access` (the policy shape STUDIO-STORAGE already uses). Share or
hand off a project and its brand goes with it; leave the team and your
personal library leaves with you, but the project keeps its logo. Uploading
brand art from your library COPIES it into project ownership (same
degrade-to-copy philosophy as Motion screen references).

**Uploaded vs generated.** The library currently holds uploads only —
correct as the default shelf, but AI-generated images deserve their own
**"Generated" section**: anything the model produces auto-lands there
(STUDIO-STORAGE's provenance metadata already records the generating
model/prompt), kept separate from the user's own files so neither pollutes
the other. Both sections show **usage state**: assets not referenced by any
screen or Motion render grayed out (a reverse index over sources for asset
URLs — the same scan that powers screen-reference "used by"), making
clean-up obvious and "what is this even for?" answerable at a glance.

## The distillation — files in, design brief out

On profile change (fields edited, doc attached, link added), a background
AI pass produces the **brand brief**: a compact, design-led markdown
distillate (~30-50 lines) written FOR a generating model — name, what the
product is, audience, vertical conventions worth honouring, tone words
mapped to concrete design moves (spacing, contrast, motion pace), logo
usage notes, do/don't list extracted from attached guides. Cached with a
`sourceHash` so it only regenerates when inputs actually change; editable
by hand (the AI draft is a starting point, the user owns the text).

**Payload stitching:** the brief rides every chat request for that project,
exactly the `MOTION_GUIDE` mechanism (conditional stanza appended in
`prepareSendMessagesRequest`) — per-project, zero tokens for profile-less
projects. This is also where the mood/display axes (STUDIO-LEARNING) get
their brand anchor: "premium + calm" in the brief biases every generation
without per-prompt repetition.

## Brand pops — `--brand-1 … --brand-8` (SHIPPED)

Themes deliberately mute their primary/background for legibility, which left
nothing **vivid** for an interface to reach for — so generated shaders read
murky and didn't track the brand. Fixed: every theme now ships eight
saturated **brand-pop** slots, `--brand-1` … `--brand-8` (OKLCH triplets,
composed as `oklch(var(--brand-N))`), auto-derived from the chart hues +
the brightest primary/accent ramp stops — so they're loud *and* tonally
cohesive with the theme. They're the slots for shader fills, highlights,
gradient stops, scene fills — anywhere the UI needs to pop. `ThreeScene`'s
default palette now reads `--brand-1..3`, so an unconfigured shader is vivid
and brand-aware with zero wiring.

The **Branding section** (below) lets a project **override** any of the 8 —
typed in, or AI-generated from the brand's primary (a vivid, accessible
spread the way the chart palette is derived). Default = the theme's
auto-derived set; override = the customer's exact pops flowing into every
screen, shader, and Motion in the project.

## The Styles panel — "Branding" section

Styles (the theme tab) gains a **Branding** section, per project: name,
category/vertical/model/audience/tone fields, logo slots (upload or pick →
project-owned assets), links, attached docs, and the brief itself
(generated state + edit affordance + "regenerate"). Same collapsible
section idiom as the rest of the inspector. The section header shows the
active mark — Grade's until theirs lands.

## Watermarking exports — SHIPPED (v1)

Every Motion export carries a **minimal corner watermark**: a 16px mark at
~55% opacity in `difference` blend (legible on any footage), bottom-left
(the transport owns bottom-right; transport chrome is hidden from
recordings via export mode). Today the mark is Grade's; with a brand
profile it becomes the project's mark — and the *Grade* mark moves to the
mp4 metadata + the imperceptible corner pattern (STUDIO-DIRECTOR D7
provenance), keeping honest AI-generated-content marking without taxing
the customer's brand surface. Filename provenance
(`grade-motion_<designId>_<timestamp>`) is also shipped.

## Rollout

- **B0 — Profile storage + Branding section.** BrandProfile on the project
  (local + `brand_json`), the Styles panel section with fields + logo
  upload (project-owned asset rows).
- **B1 — Payload stitching.** Hand-written brief textarea rides the chat
  payload per project (the mechanism, before the AI).
- **B2 — Distillation.** The AI pass (fields + fetched links + attached
  docs → brief), sourceHash caching, regenerate + hand-edit.
- **B3 — Logo flow-through.** Project logo assets auto-feed `<Logo>`
  defaults in that project's screens/Motions (a project-scoped sources
  default the component reads from context or generated source).
- **B4 — Branded exports.** Watermark uses the project mark; Grade
  provenance moves to metadata + the imperceptible pattern.

## See also

- `packages/ui/components/ui/logo.tsx` — the Grade-default mark (shipped).
- `STUDIO-DIRECTOR.md` D7 — export provenance the watermark pairs with.
- `STUDIO-STORAGE.md` — the asset substrate brand files ride on.
