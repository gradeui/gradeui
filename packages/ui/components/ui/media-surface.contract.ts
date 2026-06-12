/**
 * MediaSurface — component contract.
 *
 * First contract in the codebase, so this file is the reference template
 * other components will copy. Five rules of thumb worth carrying over:
 *
 *   1. **One contract file per component**, co-located with the .tsx.
 *      The two evolve together; the contract is the source of truth
 *      for both the playbook prompt and the settings panel.
 *
 *   2. **Every prop in the component's TS interface has a contract entry.**
 *      Even plumbing escapes (`asChild`, `className`, `style`) — they go
 *      under `design: "plumbing"` so the panel filters them out, but
 *      they exist for runtime validation and type derivation.
 *
 *   3. **Discriminated unions express structured props.** MediaSurface's
 *      `source` is the canonical case: kind-based shapes that the panel
 *      reveals as per-kind sub-forms. Zod's `discriminatedUnion` keeps
 *      the type narrowing intact through `z.infer`.
 *
 *   4. **Actions are first-class.** Anything imperative ("Fill image",
 *      "Refresh", future "Force open this dialog") lives under `actions`,
 *      not as a prop. Host (Studio) wires the action handler by `kind`.
 *
 *   5. **Keep descriptions terse and concrete.** They surface in three
 *      places: panel tooltips, the playbook prompt, generated docs.
 *      A 200-character paragraph reads badly in all three.
 */

import { z } from "zod";
import { contract, type InferProps } from "@gradeui/contracts";

// ─── Source descriptor schema ──────────────────────────────────────
//
// Discriminated union mirroring MediaSource in `media-surface.tsx`.
// The component's own type and this schema MUST stay in lock-step;
// changing one without the other surfaces at the next typecheck
// because the component will import `InferProps<typeof
// MediaSurfaceContract>` once the migration completes.

const AlbumSource = z.object({
  kind: z.literal("album"),
  artist: z.string(),
  title: z.string(),
  year: z.number().optional(),
  description: z.string().optional(),
});

const TvShowSource = z.object({
  kind: z.literal("tv-show"),
  title: z.string(),
  year: z.number().optional(),
  description: z.string().optional(),
});

const MovieSource = z.object({
  kind: z.literal("movie"),
  title: z.string(),
  year: z.number().optional(),
  description: z.string().optional(),
});

const GameSource = z.object({
  kind: z.literal("game"),
  title: z.string(),
  description: z.string().optional(),
});

const BookSource = z.object({
  kind: z.literal("book"),
  title: z.string().optional(),
  author: z.string().optional(),
  isbn: z.string().optional(),
  description: z.string().optional(),
});

const PosterSource = z.object({
  kind: z.literal("poster"),
  title: z.string(),
  year: z.number().optional(),
  description: z.string().optional(),
});

const PortraitSource = z.object({
  kind: z.literal("portrait"),
  name: z.string().optional(),
  role: z.string().optional(),
});

const LandscapeSource = z.object({
  kind: z.literal("landscape"),
  location: z.string().optional(),
  mood: z.string().optional(),
});

const ProductSource = z.object({
  kind: z.literal("product"),
  name: z.string().optional(),
  brand: z.string().optional(),
});

const FoodSource = z.object({
  kind: z.literal("food"),
  dish: z.string().optional(),
  cuisine: z.string().optional(),
});

const GenericSource = z.object({
  kind: z.literal("generic"),
  prompt: z.string(),
});

const NoSubFieldsSource = z.union([
  z.object({ kind: z.literal("video") }),
  z.object({ kind: z.literal("audio") }),
  z.object({ kind: z.literal("embed") }),
  z.object({ kind: z.literal("3d") }),
]);

const MediaSourceSchema = z.union([
  AlbumSource,
  TvShowSource,
  MovieSource,
  GameSource,
  BookSource,
  PosterSource,
  PortraitSource,
  LandscapeSource,
  ProductSource,
  FoodSource,
  GenericSource,
  NoSubFieldsSource,
]);

// ─── Enums ─────────────────────────────────────────────────────────

const AspectSchema = z.enum(["video", "square", "portrait", "wide", "auto"]);
const RadiusSchema = z.enum(["none", "sm", "md", "lg", "xl"]);
const HintSchema = z.enum([
  "album",
  "tv-show",
  "movie",
  "game",
  "book",
  "portrait",
  "landscape",
  "poster",
  "product",
  "food",
  "video",
  "audio",
  "embed",
  "3d",
  "generic",
]);
const EmptyStateSchema = z.union([
  z.literal("auto"),
  z.literal("icon"),
  z.literal("none"),
]);

// ─── Contract ──────────────────────────────────────────────────────

export const MediaSurfaceContract = contract({
  name: "MediaSurface",
  description:
    "The canonical media slot for ALL non-person imagery — album art, posters, hero images, landscape photos, video and 3D containers.",
  when:
    "Pass `hint` + `alt` + (optionally) `source` so the empty-state placeholder is meaningful and the generation pipeline can later fill the slot with a real image. Use directly for declarative slots; the higher-level VideoPlayer / RivePlayer / ThreeScene wrap this for runtime-heavy media.",
  antipatterns: [
    "Don't wrap <Avatar> inside <MediaSurface> to get an initials fallback. Set `alt` + `hint` on MediaSurface directly — the placeholder renders initials at small sizes derived from `alt`.",
    "Don't use <Avatar> for album art, posters, products, food, landscapes, etc. Avatar is for PEOPLE only.",
    "Don't inline manual gradient backgrounds (`bg-gradient-to-br …`) on MediaSurface as a 'placeholder vibe' — the empty-state is already styled via `--gds-media-placeholder-bg/-fg` tokens.",
  ],
  composesWith: ["Card", "CardBlock", "MediaBlock", "VideoPlayer", "RivePlayer", "ThreeScene"],
  aliases: [
    "media",
    "image slot",
    "media slot",
    "image placeholder",
    "cover",
    "thumbnail",
    "poster slot",
  ],
  import: "@gradeui/ui",

  props: {
    // ── Knobs — design choices ──────────────────────────────────────
    hint: {
      schema: HintSchema.optional(),
      design: "knob",
      group: "image",
      control: "glyph-picker",
      label: "Slot kind",
      description:
        "Picks the placeholder glyph + the default aspect + the future generation provider. Defaults to 'generic'.",
      default: "generic",
      examples: ["album", "portrait", "landscape", "poster"],
    },
    aspect: {
      schema: AspectSchema.optional(),
      design: "knob",
      control: "toggle-group",
      label: "Aspect ratio",
      description:
        "Override the slot's natural framing. When omitted, derived from `hint`: album/product/food → square, portrait/poster → portrait, landscape → wide, video/audio/embed/generic → video.",
    },
    radius: {
      schema: RadiusSchema.optional(),
      design: "knob",
      control: "toggle-group",
      label: "Corner radius",
      default: "lg",
      description: "Driven by the `--gds-media-radius` CSS variable.",
    },
    border: {
      schema: z.boolean().optional(),
      design: "knob",
      label: "Show border",
      default: false,
    },
    loading: {
      schema: z.boolean().optional(),
      design: "knob",
      label: "Loading state",
      default: false,
      description: "Overlays the muted-pulse skeleton on top of the slot.",
    },
    emptyState: {
      schema: EmptyStateSchema.optional(),
      design: "knob",
      control: "select",
      label: "Empty state",
      default: "auto",
      description:
        "'auto' renders the size-tiered placeholder (initials → glyph → glyph + caption). 'icon' is a legacy alias. 'none' renders a truly empty surface.",
    },

    // ── Content — text / URL the user authors ──────────────────────
    alt: {
      schema: z.string().optional(),
      design: "content",
      group: "image",
      control: "text",
      label: "Alt text",
      description:
        "Becomes the eventual `<img alt>`. Also drives the placeholder caption (>160px slots) and the 2-letter initials fallback (<64px slots).",
      examples: [
        "Travelling Without Moving — Jamiroquai",
        "Sunset over Mount Fuji",
      ],
    },
    src: {
      schema: z.string().url().optional(),
      design: "content",
      group: "image",
      control: "url",
      label: "Image URL",
      description:
        "When set, renders an `<img>` filling the slot via object-cover. The wrapper keeps its aspect/radius/border. Generators patch this prop; manual values always win.",
    },
    instanceId: {
      schema: z.string().optional(),
      design: "content",
      group: "image",
      control: "text",
      label: "Instance id",
      description:
        "Stable per-instance id stamped as `data-gds-instance-id`. Use when rendering MediaSurfaces from a data array (`.map(item => <MediaSurface instanceId={item.id} …/>)`) — it's how Studio's selection + Fill flows tell one card apart from its siblings and patch only that entry. Was missing from this hand-authored contract while the component documented it, which made save validation reject the documented pattern (June 2026).",
    },

    // ── Structured — discriminated union with sub-form per kind ────
    source: {
      schema: MediaSourceSchema.optional(),
      design: "structured",
      label: "Source descriptor",
      description:
        "Structured metadata for the generation pipeline. Opaque to MediaSurface itself; read by the resolver to look up real imagery from the right provider (MusicBrainz / Pollinations / etc.).",
      perKindFields: {
        album: { artist: "string", title: "string", year: "number?" },
        poster: { title: "string", year: "number?" },
        portrait: { name: "string?", role: "string?" },
        landscape: { location: "string?", mood: "string?" },
        product: { name: "string?", brand: "string?" },
        food: { dish: "string?", cuisine: "string?" },
        generic: { prompt: "string" },
        video: {},
        audio: {},
        embed: {},
        "3d": {},
      },
    },

    // ── Plumbing — needed in code, hidden from the design panel ────
    className: {
      schema: z.string().optional(),
      design: "plumbing",
    },
    style: {
      schema: z.record(z.string(), z.unknown()).optional(),
      design: "plumbing",
    },
    children: {
      schema: z.unknown().optional(),
      design: "plumbing",
      description:
        "Escape hatch for putting a custom <video>, <canvas>, Rive runtime, etc. inside. When supplied, the placeholder is suppressed.",
    },
    overlay: {
      schema: z.unknown().optional(),
      design: "plumbing",
      description:
        "Decorative layer rendered ABOVE the media/placeholder (play buttons, hover gradients, corner badges). Does NOT suppress the placeholder.",
    },
    glyph: {
      schema: z.unknown().optional(),
      design: "plumbing",
      description:
        "Per-instance override of the hint-derived placeholder glyph. Most consumers should pick a `hint` and let the map decide.",
    },
    fallback: {
      schema: z.unknown().optional(),
      design: "plumbing",
      description: "Custom node shown while `loading` is true.",
    },

    // ── Events ─────────────────────────────────────────────────────
    onVisibilityChange: {
      schema: z.function().optional(),
      design: "event",
      description: "Fires when the surface enters / leaves the viewport (IntersectionObserver).",
    },
  },

  // ─── Actions ─────────────────────────────────────────────────────
  actions: {
    fill: {
      label: "Fill image",
      icon: "Sparkles",
      description:
        "Resolve this slot's source via the free providers (MusicBrainz → Pollinations → Picsum) and patch the result into the runtime URL map.",
      kind: "resolve-media-source",
      // Only meaningful when we have something to resolve from. Without
      // a `source`, the providers have no descriptor to look up — the
      // chat is the right path for that case (regenerate the JSX with
      // a `source` first).
      enabledWhen: { propPresent: "source" },
    },
    // "Refresh" (refresh-media-source) removed — its cache-bust re-resolve
    // read as "step the image back" and confused more than it helped. Fill
    // re-resolves anyway; a dedicated retry can return behind a clearer
    // affordance if a real need resurfaces.
  },
});

/** Source descriptor type, derived from the schema so it stays in sync. */
export type MediaSource = z.infer<typeof MediaSourceSchema>;

/** Inferred React props type — one entry per prop in the contract.
 *  All optional at the JSX boundary because every prop has a defaulted
 *  or genuinely optional shape in the schema. */
export type MediaSurfacePropsContract = InferProps<typeof MediaSurfaceContract>;
