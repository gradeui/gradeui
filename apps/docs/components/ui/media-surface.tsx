"use client";

/**
 * MediaSurface — the shared shell used by VideoPlayer, RivePlayer, ThreeScene
 * AND the canonical "media slot" primitive for still images, posters, album
 * art, etc.
 *
 * Handles the surface area that's identical across all media types:
 *   - aspect ratio / radius / border (driven by CSS variables for theming)
 *   - loading skeleton
 *   - intersection-observer (for pause-when-offscreen)
 *   - reduced-motion query
 *   - **empty-state placeholder** with format-suggesting glyph + alt caption
 *
 * Design-system note: all visual dimensions are backed by CSS vars so
 * consumers can retheme via `--gds-media-radius`, `--gds-media-border`,
 * `--gds-media-placeholder-bg`, `--gds-media-placeholder-fg`. The
 * placeholder pair drives the empty-state treatment — it's the canonical
 * "image not yet loaded" surface across Grade until the image-generation
 * pipeline replaces empty slots with real pictures. Custom placeholder UI
 * elsewhere in the product should consume the same vars so we stay
 * visually coherent.
 * (These will rename to `--gds-*` when the broader codebase rename lands.)
 *
 * The placeholder uses a **size-tiered** rendering: sub-64px slots show
 * initials only (avatar-density), 64-160px show the format glyph alone,
 * and >160px add the alt text as a small caption beneath the glyph. The
 * tier is measured via ResizeObserver — we deliberately don't lean on CSS
 * container queries here so the component works in projects whose Tailwind
 * config doesn't have the container-queries plugin installed.
 *
 * **Do NOT wrap <Avatar> inside <MediaSurface>** to get a 2-letter initials
 * fallback. That pattern conflates two primitives — Avatar is for people
 * only (circular, social context); MediaSurface is for everything else
 * (square album art, wide landscapes, portrait posters). Set `alt` + `hint`
 * on MediaSurface directly and you get the same initials affordance with
 * the right semantics.
 */

import * as React from "react";
import {
  Book,
  Box,
  Clapperboard,
  Code2,
  Disc3,
  Film,
  Gamepad2,
  Image as ImageIcon,
  Mountain,
  Music,
  Package,
  Tv,
  User,
  UtensilsCrossed,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type MediaAspect =
  | "video"
  | "standard"
  | "square"
  | "portrait"
  | "wide"
  | "auto";
export type MediaRadius = "none" | "sm" | "md" | "lg" | "xl";

/**
 * What kind of media is this slot intended for? Drives three things:
 *   1. The glyph rendered in the empty-state placeholder.
 *   2. The default `aspect` when the caller hasn't pinned one.
 *   3. The future generation pipeline's provider routing (album →
 *      MusicBrainz cover-art, poster → TMDB, generic → Gemini, etc.).
 *
 * Kept as a small finite union so the Settings panel can render it as a
 * glyph-led toggle picker rather than a free-text input. Adding a hint
 * here means adding a glyph in `HINT_GLYPH` and a default aspect in
 * `HINT_DEFAULT_ASPECT` below — both maps are checked exhaustively.
 */
export type MediaHint =
  | "album"
  | "tv-show"
  | "movie"
  | "game"
  | "book"
  | "portrait"
  | "landscape"
  | "poster"
  | "product"
  | "food"
  | "video"
  | "audio"
  | "embed"
  | "3d"
  | "generic";

/**
 * Structured metadata the future generation pipeline reads to look up real
 * imagery for this slot. The component itself never renders from `source` —
 * it's purely declarative until the generator walks the JSX and patches in
 * `src` values. Discriminated by `kind` so we can route per-provider:
 *
 *   album    → MusicBrainz Cover Art Archive (free, no auth)
 *   tv-show  → TMDb (free with key)
 *   movie    → TMDb (free with key)
 *   game     → IGDB (free, Twitch OAuth)
 *   book     → OpenLibrary (free, no auth)
 *   poster   → Picsum (or wired generator)
 *   portrait → Picsum (until prompt-aware generator lands)
 *   landscape→ Picsum (until prompt-aware generator lands)
 *   product  → Picsum (until prompt-aware generator lands)
 *   food     → Picsum (until prompt-aware generator lands)
 *   generic  → Picsum
 *   video/audio/embed/3d → no auto-gen; user provides
 *
 * Every variant optionally carries a `description` string — populated
 * by Studio from the surface's `alt` prop via the Generate Image
 * action. Prompt-aware providers use it as the user-intent prompt;
 * lookup providers (MusicBrainz, TMDb, …) ignore unknown fields.
 */
export type MediaSource =
  | { kind: "album"; artist: string; title: string; year?: number; description?: string }
  | { kind: "tv-show"; title: string; year?: number; description?: string }
  | { kind: "movie"; title: string; year?: number; description?: string }
  | { kind: "game"; title: string; description?: string }
  | { kind: "book"; title?: string; author?: string; isbn?: string; description?: string }
  | { kind: "portrait"; name?: string; role?: string; description?: string }
  | { kind: "landscape"; location?: string; mood?: string; description?: string }
  | { kind: "poster"; title: string; year?: number; description?: string }
  | { kind: "product"; name?: string; brand?: string; description?: string }
  | { kind: "food"; dish?: string; cuisine?: string; description?: string }
  | { kind: "video" }
  | { kind: "audio" }
  | { kind: "embed" }
  | { kind: "3d" }
  | { kind: "generic"; prompt: string; description?: string };

const aspectClass: Record<MediaAspect, string> = {
  video: "aspect-video",
  standard: "aspect-[4/3]",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  wide: "aspect-[21/9]",
  auto: "",
};

// CSS aspect-ratio values, applied as an INLINE style when `aspect` is set
// EXPLICITLY (not derived from the hint). Inline beats a className utility, so
// an explicit `aspect` prop wins over a baked-in `className="aspect-video"` —
// otherwise setting the aspect in the inspector did nothing on slots the
// scaffolds had hard-coded. Derived (hint-default) aspect still rides the
// class so a deliberate `className="aspect-[2/1]"` can override it.
const aspectRatioStyle: Record<MediaAspect, string> = {
  video: "16 / 9",
  standard: "4 / 3",
  square: "1 / 1",
  portrait: "3 / 4",
  wide: "21 / 9",
  auto: "auto",
};

const radiusVar: Record<MediaRadius, string> = {
  none: "0",
  sm: "var(--radius, 0.25rem)",
  md: "calc(var(--radius, 0.375rem) * 1.25)",
  lg: "calc(var(--radius, 0.5rem) * 1.5)",
  xl: "calc(var(--radius, 0.75rem) * 2)",
};

/**
 * Hint → glyph map. Lucide icons chosen to be visually unambiguous at
 * placeholder size (the glyph fills roughly 1/3 of the surface). Override
 * per-instance via the `glyph` prop, or globally per-theme by overriding
 * `--gds-media-hint-{name}-glyph` with a `url(...)` value (advanced).
 */
const HINT_GLYPH: Record<MediaHint, React.ComponentType<{ className?: string }>> = {
  album: Disc3,
  "tv-show": Tv,
  movie: Clapperboard,
  game: Gamepad2,
  book: Book,
  portrait: User,
  landscape: Mountain,
  poster: Film,
  product: Package,
  food: UtensilsCrossed,
  video: Video,
  audio: Music,
  embed: Code2,
  "3d": Box,
  generic: ImageIcon,
};

/**
 * Hint → default aspect ratio. Applied when the caller didn't pin `aspect`
 * explicitly. Matches the natural framing each format gets in real layouts:
 * albums are square, posters and people are portrait, landscapes/video are
 * wide. Falls back to "video" (16:9) for anything where the convention is
 * less load-bearing (`embed`, `3d`, `generic`, `audio`).
 */
const HINT_DEFAULT_ASPECT: Record<MediaHint, MediaAspect> = {
  album: "square",
  "tv-show": "portrait",
  movie: "portrait",
  game: "portrait",
  book: "portrait",
  portrait: "portrait",
  landscape: "wide",
  poster: "portrait",
  product: "square",
  food: "square",
  video: "video",
  audio: "video",
  embed: "video",
  "3d": "square",
  generic: "video",
};

/**
 * Stable lookup key for a source descriptor. **MUST** match the
 * `sourceKey()` implementation in `@gradeui/media/sources/router.ts` —
 * they're the two halves of the runtime URL-map handshake. The server
 * keys its returned URL map by this string; MediaSurface looks up its
 * resolved URL with this same string.
 *
 * We duplicate the function here rather than importing from `@gradeui/media`
 * because `@gradeui/ui` cannot depend on a server-only package. Any
 * change to the algorithm needs to land in both places — the duplication
 * is tiny (one switch, no other state) and the risk of drift is bounded
 * by the discriminated-union shape.
 */
function sourceKeyFor(source: MediaSource | undefined): string | null {
  if (!source) return null;
  switch (source.kind) {
    case "album":
      return `album:${source.artist}|${source.title}|${source.year ?? ""}`;
    case "tv-show":
      return `tv-show:${source.title}|${source.year ?? ""}`;
    case "movie":
      return `movie:${source.title}|${source.year ?? ""}`;
    case "game":
      return `game:${source.title}`;
    case "book":
      return `book:${source.isbn ?? ""}|${source.title ?? ""}|${source.author ?? ""}`;
    case "poster":
      return `poster:${source.title}|${source.year ?? ""}`;
    case "portrait":
      return `portrait:${source.name ?? ""}|${source.role ?? ""}`;
    case "landscape":
      return `landscape:${source.location ?? ""}|${source.mood ?? ""}`;
    case "product":
      return `product:${source.brand ?? ""}|${source.name ?? ""}`;
    case "food":
      return `food:${source.dish ?? ""}|${source.cuisine ?? ""}`;
    case "generic":
      return `generic:${source.prompt}`;
    default:
      return `${(source as { kind: string }).kind}:`;
  }
}

/**
 * Subscribe to the runtime URL map exposed by Studio (and any other host
 * that wants to wire the same protocol). The map lives on `window.__gradeMediaUrls`
 * — a `Record<sourceKey, url>` — and emits `grade:media-urls-updated`
 * whenever it changes. Components reading the map re-render on the event.
 *
 * Headless / server-rendered consumers get an empty map; the resolution
 * only kicks in client-side.
 *
 * The map is intentionally **decoupled** from React context so consuming
 * apps don't have to thread a provider through their tree — MediaSurface
 * can be dropped anywhere in any layout and the URL map "just works"
 * once the host writes to the global. Studio's iframe agent writes to
 * the global in response to the "Fill images" flow; other integrations
 * (e.g. an MCP server, a CLI codemod) can use the same protocol.
 */
type MediaUrlMap = Record<string, string>;
/**
 * Per-instance prop overrides, keyed by the same `sourceKey` as the
 * URL map. Each entry is a partial MediaSurface props bag — only the
 * keys the user has customised for THIS specific slot. The studio
 * settings panel writes overrides via the `grade:component-action`
 * event with kind `"set-media-override"`; this component reads
 * `overrides[myKey]` at render and merges on top of its JSX props
 * so an edit on Discovery doesn't ripple to every other album in the
 * same `.map()`. See `useResolvedOverride` below.
 */
type MediaOverrideMap = Record<string, Partial<{
  hint: MediaHint;
  aspect: MediaAspect;
  radius: MediaRadius;
  border: boolean;
  loading: boolean;
  alt: string;
  src: string;
  emptyState: "auto" | "icon" | "none";
}>>;
declare global {
  interface Window {
    __gradeMediaUrls?: MediaUrlMap;
    __gradeMediaOverrides?: MediaOverrideMap;
    /** Source-keys with a Fill request currently in flight. Stamped by
     *  the sandbox agent on `grade:set-media-pending`; drives the
     *  placeholder's Presence shimmer (gds-aura-shimmer) so slots read
     *  as "being generated" rather than inert while the resolver works. */
    __gradeMediaPending?: Record<string, true>;
  }
}
function useResolvedSrc(source: MediaSource | undefined): string | undefined {
  const key = sourceKeyFor(source);
  const [version, setVersion] = React.useState(0);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setVersion((n) => n + 1);
    window.addEventListener("grade:media-urls-updated", handler);
    return () => window.removeEventListener("grade:media-urls-updated", handler);
  }, []);
  // `version` participates in the dep array so re-renders pick up the
  // latest map after an event fires. We don't store the URL itself in
  // state because the map is the source of truth — keeping it in state
  // would leave stale URLs behind if the map shrinks.
  React.useEffect(() => {
    // no-op — placeholder so `version` is consumed and the lint rule
    // doesn't complain about an unused variable in StrictMode.
  }, [version]);
  if (!key || typeof window === "undefined") return undefined;
  return window.__gradeMediaUrls?.[key];
}

/**
 * Fill-in-flight flag for this surface's sourceKey. Mirrors the
 * useResolvedSrc plumbing: the canvas posts `grade:set-media-pending`
 * into the iframe before it hits `/api/media/resolve-batch`, the
 * sandbox agent stamps `window.__gradeMediaPending` and dispatches
 * `grade:media-pending-updated`, and this hook re-renders the surface.
 * The canvas clears the map (posts `pending: []` replace) in its
 * `finally` block, so an error never strands a slot mid-shimmer.
 */
function useFillPending(source: MediaSource | undefined): boolean {
  const key = sourceKeyFor(source);
  const [version, setVersion] = React.useState(0);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setVersion((n) => n + 1);
    window.addEventListener("grade:media-pending-updated", handler);
    return () =>
      window.removeEventListener("grade:media-pending-updated", handler);
  }, []);
  React.useEffect(() => {
    // see useResolvedSrc — same dep-array trick to keep StrictMode quiet.
  }, [version]);
  if (!key || typeof window === "undefined") return false;
  return Boolean(window.__gradeMediaPending?.[key]);
}

/**
 * Per-instance prop override. Keyed by sourceKey — same trick the URL
 * map uses — so each rendered MediaSurface in a `.map()` reads only
 * its own customisations. The hook re-renders the component whenever
 * the global override map fires `grade:media-overrides-updated`. With
 * no source descriptor, there's no key, no override possible — returns
 * undefined so the caller falls through to the JSX-prop value.
 */
function useResolvedOverride(source: MediaSource | undefined):
  | MediaOverrideMap[string]
  | undefined {
  const key = sourceKeyFor(source);
  const [version, setVersion] = React.useState(0);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setVersion((n) => n + 1);
    window.addEventListener("grade:media-overrides-updated", handler);
    return () =>
      window.removeEventListener("grade:media-overrides-updated", handler);
  }, []);
  React.useEffect(() => {
    // see useResolvedSrc — same dep-array trick to keep StrictMode quiet.
  }, [version]);
  if (!key || typeof window === "undefined") return undefined;
  return window.__gradeMediaOverrides?.[key];
}

/**
 * Strip leading articles + connectors from a label and take the initials
 * of the first two meaningful words. Single-word labels fall back to the
 * first two characters. Used by the placeholder's small-tier render to
 * give the slot a meaningful glyph at avatar density.
 *
 * Examples:
 *   "Travelling Without Moving"             → "TW"
 *   "The Beatles"                           → "BE"  (skip "The", single word left)
 *   "Jamiroquai"                            → "JA"
 *   "Album cover for Jamiroquai"            → "AC"  (acceptable; alt text shape)
 */
function deriveInitials(alt: string | undefined): string {
  if (!alt) return "";
  const stop = /^(the|a|an|and|for|by|of|in|on|at|to)$/i;
  const words = alt.trim().split(/\s+/).filter((w) => w && !stop.test(w));
  if (words.length === 0) {
    return alt.replace(/\s+/g, "").slice(0, 2).toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Tier the placeholder render against the surface's actual rendered width.
 * Thresholds chosen empirically: avatar-shaped UI sits at 40-64px, content-
 * card thumbnails at 100-160px, hero-sized media at >160px.
 */
type PlaceholderTier = "sm" | "md" | "lg";
function tierFromWidth(w: number): PlaceholderTier {
  if (w < 64) return "sm";
  if (w >= 160) return "lg";
  return "md";
}

export interface MediaSurfaceProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  aspect?: MediaAspect;
  radius?: MediaRadius;
  border?: boolean;
  loading?: boolean;
  /** Callback fires when the surface enters / leaves the viewport. */
  onVisibilityChange?: (visible: boolean) => void;
  /** Fallback shown before `onReady` is signalled by the child. */
  fallback?: React.ReactNode;
  /**
   * Controls the empty-state placeholder shown when no `src`, `children`,
   * and no `loading` state are provided. Default `"auto"` renders the
   * size-tiered placeholder (initials / glyph / glyph + caption depending
   * on the slot's rendered width — see `tierFromWidth`). Use `"none"` for
   * a truly empty surface (e.g. a custom decorative overlay that needs
   * the surface clean), or pass a node to fully override.
   *
   * Legacy `"icon"` is kept as an alias for `"auto"` so the previous API
   * doesn't break.
   */
  emptyState?: "auto" | "icon" | "none" | React.ReactNode;
  /**
   * What kind of media is intended for this slot — drives the placeholder
   * glyph, the default `aspect` when unset, and the future generator's
   * provider routing. See `MediaHint`. Defaults to `"generic"` (image icon).
   */
  hint?: MediaHint;
  /**
   * Descriptive label for the slot. Used three ways:
   *   1. The `alt` attribute on the rendered `<img>` when `src` is set.
   *   2. The caption shown beneath the glyph in the large placeholder tier.
   *   3. The source string for derived 2-letter initials in the small tier.
   * Strongly recommended — without it the placeholder is anonymous and the
   * eventual image has no a11y label.
   */
  alt?: string;
  /**
   * Structured metadata for the generation pipeline. Opaque to MediaSurface
   * itself (it just stamps `data-media-source-kind` on the root for
   * inspector visibility); read by the generator AST walker to look up real
   * imagery from the right provider. See `MediaSource`.
   */
  source?: MediaSource;
  /**
   * When set, MediaSurface renders an `<img>` filling the slot via
   * object-cover. The wrapper keeps its aspect / radius / border chrome.
   * Convenience prop so callers don't have to write the `<img>` themselves;
   * also the target the future generator patches into when filling slots.
   */
  src?: string;
  /**
   * Override the hint-derived glyph for one-off cases. Most consumers
   * should pick a `hint` and let the map decide; this is the escape
   * hatch for special slots that don't fit the canonical set.
   */
  glyph?: React.ReactNode;
  /**
   * Stable identifier for this specific MediaSurface instance, stamped
   * on the root as `data-gds-instance-id`. When the JSX renders a list
   * of MediaSurfaces from a data array (`.map(a => <MediaSurface
   * instanceId={a.id} ... />)`), this is how Studio's selection agent
   * tells THIS card apart from its siblings — every other prop is
   * either shared via the template (hint, aspect) or content that
   * happens to differ but isn't guaranteed unique.
   *
   * Combined with the data-array-mutator path, this is what makes
   * "click Discovery, change its alt text, only Discovery's alt
   * changes" actually work — the panel finds the data entry whose
   * `id` matches `instanceId` and patches just that entry.
   *
   * No-op if omitted (standalone MediaSurfaces don't need it).
   */
  instanceId?: string;
  /**
   * Content layered ON TOP of the media (or placeholder) — play buttons,
   * hover gradients, corner badges, watch-progress bars. Renders in its
   * own absolutely-positioned layer at the highest z-index. Importantly,
   * an overlay does NOT suppress the empty-state placeholder: a play
   * button hovering over an unfilled album slot is still meaningfully
   * unfilled, and we want the placeholder to read through it. Use
   * `children` for content that REPLACES the media (custom canvas/video);
   * use `overlay` for content that DECORATES it.
   */
  overlay?: React.ReactNode;
  children?: React.ReactNode;
}

export const MediaSurface = React.forwardRef<HTMLDivElement, MediaSurfaceProps>(
  (
    {
      className,
      aspect: aspectProp,
      radius: radiusProp = "lg",
      border: borderProp = false,
      loading: loadingProp = false,
      onVisibilityChange,
      fallback,
      emptyState: emptyStateProp = "auto",
      hint: hintProp = "generic",
      alt: altProp,
      source,
      src: srcProp,
      glyph,
      overlay,
      instanceId,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLDivElement | null>(null);

    // Merge forwarded + internal refs.
    React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);

    // ─── Prop resolution ─────────────────────────────────────────
    // JSX is the single source of truth. Studio's "Fill images" and
    // settings-panel edits write directly into the data-array entries
    // that back these props (`src: "..."`, `hint: "poster"` etc.), so
    // there's no separate override store to merge from any more.
    //
    // The old override path (a per-instance prop map keyed by
    // sourceKey, persisted to localStorage and merged here on render)
    // had three failure modes that the JSX-as-truth model eliminates
    // in one move: stale entries surviving across designs, empty-
    // string entries that beat the JSX via `??`, and the export-to-
    // CodeSandbox blank-imagery problem (the override map didn't
    // travel with the JSX). All gone.
    const hint: MediaHint = hintProp;
    const aspect: MediaAspect | undefined = aspectProp;
    const radius: MediaRadius = radiusProp;
    const border: boolean = borderProp;
    const loading: boolean = loadingProp;
    const alt: string | undefined = altProp;
    const src: string | undefined = srcProp;
    const emptyState = emptyStateProp;

    // Resolve aspect: explicit prop wins; otherwise pick the natural default
    // for the hint (album → square, landscape → wide, etc.). Falls through
    // to "video" via HINT_DEFAULT_ASPECT if hint is unset.
    const resolvedAspect: MediaAspect = aspect ?? HINT_DEFAULT_ASPECT[hint];
    // Explicit prop → win over any className aspect via inline aspect-ratio.
    const aspectExplicit = aspect != null;

    // Visibility observer (existing behaviour — left in place).
    React.useEffect(() => {
      if (!onVisibilityChange || !innerRef.current) return;
      const el = innerRef.current;
      const io = new IntersectionObserver(
        ([entry]) => onVisibilityChange(entry.isIntersecting),
        { threshold: 0.05 },
      );
      io.observe(el);
      return () => io.disconnect();
    }, [onVisibilityChange]);

    // Effective src — straight from the JSX, resolved BEFORE the
    // placeholder gate below because the two are coupled: the
    // placeholder only exists while the slot is unfilled. Track broken
    // URLs so a 404/timeout doesn't leave the user staring at the
    // browser's generic "broken image" icon — when `onError` fires we
    // drop the src, the content layer unmounts, and the tiered
    // placeholder re-renders, so the slot reads as "not yet filled"
    // rather than "broken." Reset whenever the candidate src changes
    // (a new URL is its own retry).
    const candidateSrc = src;
    const [imgErrored, setImgErrored] = React.useState(false);
    React.useEffect(() => {
      setImgErrored(false);
    }, [candidateSrc]);
    const effectiveSrc = imgErrored ? undefined : candidateSrc;

    // Size observer for the tiered placeholder. The placeholder stays
    // MOUNTED beneath a filled `src` image but is hidden via CSS —
    // `[data-filled]` → `visibility: hidden` in styles/globals.css —
    // rather than unmounted. Two reasons:
    //   1. Transparent imagery: an always-*visible* placeholder leaked
    //      its glyph + `--gds-media-placeholder-bg` through the alpha
    //      pixels of transparent PNGs (logo slots). `visibility:
    //      hidden` fixes that without losing the layer.
    //   2. Wireframe mode: `[data-fidelity="wireframe"]` on any
    //      ancestor (Studio iframe root, an embed wrapper) flips the
    //      same pair of rules — content layer hidden, placeholder
    //      re-revealed — with zero React involvement, so a fidelity
    //      toggle works even in a static embed.
    // Custom `children` (escape hatch — caller fully owns the surface)
    // suppress the placeholder entirely: whatever they render IS the
    // content.
    const hasPlaceholder = !children && emptyState !== "none";
    const [tier, setTier] = React.useState<PlaceholderTier>("md");
    React.useEffect(() => {
      if (!hasPlaceholder) return;
      const el = innerRef.current;
      if (!el) return;
      const ro = new ResizeObserver(([entry]) => {
        const w = entry.contentRect.width;
        setTier(tierFromWidth(w));
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, [hasPlaceholder]);

    const initials = React.useMemo(() => deriveInitials(alt), [alt]);
    const HintGlyph = HINT_GLYPH[hint] ?? ImageIcon;
    // Legacy `emptyState="icon"` is treated as the new `"auto"` default.
    const useAutoPlaceholder =
      emptyState === "auto" || emptyState === "icon";

    // The DS stamps `data-media-source` as a JSON blob whenever a
    // `source` is present so an external walker (Studio's selection-
    // agent inside the Sandpack iframe) can collect runtime-evaluated
    // sources, hand them to a resolver, and write the resulting URL
    // back into the JSX. Once it's in the JSX it lives on `srcProp`
    // and just renders — no parallel URL map, no override merge.
    const sourceJson = React.useMemo(
      () => (source ? JSON.stringify(source) : undefined),
      [source],
    );

    // Fill-in-flight → Presence shimmer on the placeholder. Only while a
    // resolve is actually pending AND the slot is still unfilled — once
    // the URL lands in the JSX (or via the legacy URL map) the image
    // layer covers the placeholder and the sweep stops being visible,
    // and the canvas clears the pending map anyway.
    const fillPending = useFillPending(source) && !effectiveSrc;

    return (
      <div
        ref={innerRef}
        data-gds-part="media-surface"
        data-media-hint={hint}
        data-media-source-kind={source?.kind}
        data-media-source={sourceJson}
        data-media-alt={alt}
        data-gds-instance-id={instanceId}
        className={cn(
          // `w-full` is the default so the surface fills its parent — without
          // it, a flex parent (e.g. items-center justify-center) collapses the
          // surface to the intrinsic width of its children, which for Rive /
          // WebGL canvases is 0. Override via `className="w-96"` etc.
          //
          // No `bg-muted` on the wrapper any more — the placeholder div
          // below paints its own solid `--gds-media-placeholder-bg`, so
          // a wrapper background just risks a two-layer mismatch in
          // themes where `--muted` differs from the placeholder pair.
          // The surface is transparent under custom `children` (e.g. a
          // Three.js canvas), which is the intended behaviour.
          "gds-media-surface relative w-full overflow-hidden",
          // Derived aspect rides the class (a deliberate className aspect can
          // still override it); an EXPLICIT aspect prop goes inline below.
          !aspectExplicit && aspectClass[resolvedAspect],
          border && "border border-border",
          className,
        )}
        style={{
          ...(aspectExplicit
            ? { aspectRatio: aspectRatioStyle[resolvedAspect] }
            : {}),
          borderRadius: `var(--gds-media-radius, ${radiusVar[radius]})`,
          ...style,
        }}
        {...props}
      >
        {/* Tiered empty-state placeholder — rendered FIRST (lowest layer)
            beneath any `src` image / `children` / `overlay`. When the slot
            is filled, `data-filled` is stamped and a stylesheet rule
            (styles/globals.css, "MediaSurface fidelity") sets
            `visibility: hidden` so images with alpha never show the
            glyph/bg through their transparent pixels. Wireframe mode
            (`[data-fidelity="wireframe"]` on an ancestor) reverses both
            rules in pure CSS — content hidden, placeholder revealed — no
            React state, no re-mount, works in static embeds. Surface and
            icon colours come from the `--gds-media-placeholder-*` token
            pair so they retheme with the active mode. */}
        {hasPlaceholder && (
          <div
            data-gds-part="media-surface-placeholder"
            data-tier={tier}
            data-filled={effectiveSrc ? "" : undefined}
            data-fill-pending={fillPending || undefined}
            className={cn(
              "absolute inset-0 z-0 flex flex-col items-center justify-center gap-2 pointer-events-none px-3 text-center",
              // Presence shimmer (diagonal sweep) while a Fill request is
              // in flight for this slot's sourceKey — "generation in
              // progress" is exactly what the aura system's shimmer is
              // for. Tightened timing vs. the ambient default so it reads
              // as active work, not decoration.
              fillPending && "gds-aura-shimmer",
            )}
            style={{
              // `gds-aura-shimmer` sets `position: relative`; this layer
              // must stay absolutely positioned regardless of stylesheet
              // order, so pin it inline.
              position: "absolute",
              background: "var(--gds-media-placeholder-bg)",
              color: "var(--gds-media-placeholder-fg)",
              ...(fillPending
                ? ({
                    "--aura-shimmer-duration": "1400ms",
                    "--aura-shimmer-delay-between": "400ms",
                  } as React.CSSProperties)
                : null),
            }}
            aria-hidden
          >
            {!useAutoPlaceholder ? (
              // Caller-supplied node — full override, matches the legacy
              // escape hatch.
              (emptyState as React.ReactNode)
            ) : tier === "sm" ? (
              // Avatar-density: initials only. Falls back to the glyph
              // if the alt produced no initials (no `alt` supplied).
              initials ? (
                <span className="font-semibold text-sm tracking-tight">
                  {initials}
                </span>
              ) : (
                <HintGlyph className="h-1/2 w-1/2 max-h-6 max-w-6" />
              )
            ) : tier === "md" ? (
              // Thumbnail: just the glyph. Caller-supplied `glyph` wins
              // so unusual slots (e.g. a custom brand icon) can override
              // without leaving the hint vocabulary.
              <>
                {glyph ?? (
                  <HintGlyph className="h-1/3 w-1/3 max-h-10 max-w-10" />
                )}
              </>
            ) : (
              // Hero: glyph + alt caption. Caption truncates to 2 lines so
              // a verbose alt doesn't overflow the surface.
              <>
                {glyph ?? (
                  <HintGlyph className="h-1/4 w-1/4 max-h-12 max-w-12" />
                )}
                {alt && (
                  <span
                    className="text-xs leading-snug line-clamp-2 max-w-[80%]"
                    data-gds-part="media-surface-caption"
                  >
                    {alt}
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {/* Image layer — the target the generator patches into when
            filling slots. Both `src` and `children` are wrapped together
            in `media-surface-content` so the wireframe rule in
            globals.css can hide both with one selector and let the
            placeholder underneath show through. In full fidelity a
            transparent image sits directly on whatever's behind the
            surface (the placeholder beneath is visibility-hidden), as a
            plain <img> would. */}
        {(effectiveSrc || children) && (
          <div
            data-gds-part="media-surface-content"
            className="absolute inset-0 z-[1]"
          >
            {effectiveSrc && (
              <img
                src={effectiveSrc}
                alt={alt ?? ""}
                onError={() => setImgErrored(true)}
                className="absolute inset-0 h-full w-full object-cover"
                data-gds-part="media-surface-img"
              />
            )}
            {children}
          </div>
        )}

        {/* Loading skeleton — layered above content so it covers a
            transitioning image. */}
        {loading && (
          <div
            className="absolute inset-0 z-[2] flex items-center justify-center bg-muted animate-pulse"
            aria-hidden
          >
            {fallback}
          </div>
        )}

        {/* Decorative overlay layer — play buttons, hover gradients, badges.
            Highest z so it sits on top of content in BOTH wireframe and
            full mode; the badge stays meaningful whether the slot is filled
            or not. */}
        {overlay && (
          <div
            data-gds-part="media-surface-overlay"
            className="absolute inset-0 z-10"
          >
            {overlay}
          </div>
        )}
      </div>
    );
  },
);
MediaSurface.displayName = "MediaSurface";

/** Shared prop interface extended by each media primitive. */
export interface BaseMediaProps {
  /** src for the media — url or path. */
  src?: string;
  /** Show native-ish play/pause/scrubber controls. Default: `true` for video, `false` for Rive/three. */
  controls?: boolean;
  /** Autoplay when mounted (respects reduced-motion). */
  autoPlay?: boolean;
  /** Loop on end. */
  loop?: boolean;
  /** Pause rendering / playback when offscreen. Default `true` (big perf win for WebGL). */
  pauseOffscreen?: boolean;
  /** Aspect ratio of the surface. */
  aspect?: MediaAspect;
  /** Corner radius. */
  radius?: MediaRadius;
  /** Draw a subtle border around the surface. */
  border?: boolean;
  /** Poster / fallback image while loading. */
  poster?: string;
  /** Accessible label — used as `aria-label` on the surface. */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

/** Hook — returns `true` when the OS reports reduced-motion preference. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return reduced;
}
