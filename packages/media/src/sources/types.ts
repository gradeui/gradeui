/**
 * Sourced-imagery types — parallel to (but independent of) the generative
 * MediaProvider types in `../types.ts`.
 *
 * The split exists because sourced providers return URLs we don't host (album
 * art on Cover Art Archive, generated images on Pollinations' CDN, etc.) — no
 * Buffer to process, no Vercel Blob upload, no content hash needed beyond
 * what the caller passes us. Treating these as the same shape as Gemini's
 * "give me bytes" provider muddies both.
 *
 * `SourceDescriptor` is duplicated from MediaSource in `@gradeui/ui` rather
 * than imported, so this server-only package stays free of UI dependencies.
 * If the union ever drifts, the chat-route's JSX walker will surface the
 * mismatch (an unknown kind falls through to the generic fallback).
 */

/** Which kind of slot this descriptor describes. Mirror of `MediaHint`. */
export type SourceKind =
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
 * Discriminated union describing what should go in a slot. Mirror of the
 * `MediaSource` prop type in `@gradeui/ui` MediaSurface. Per-kind shape:
 *
 *   album    → artist, title, year?                — MusicBrainz / Cover Art Archive
 *   tv-show  → title, year?                        — TMDb TV search
 *   movie    → title, year?                        — TMDb movie search
 *   game     → title                               — IGDB
 *   book     → title?, author?, isbn?              — OpenLibrary
 *   poster   → title, year?                        — generic Picsum (or TMDb if title hints at film)
 *   portrait → name?, role?                        — Picsum (until prompt-aware generator)
 *   landscape→ location?, mood?                    — Picsum
 *   product  → name?, brand?                       — Picsum
 *   food     → dish?, cuisine?                     — Picsum
 *   video/audio/embed/3d → (none; not auto-fillable, returns null)
 *   generic  → prompt                              — Picsum
 *
 * Real-lookup providers (MusicBrainz, TMDb, IGDB, OpenLibrary) return
 * actual licensed/cached imagery for known content; generators can
 * compose prompts from these fields when a paid path is wired.
 *
 * Every descriptor optionally carries a `description` field — a free-text
 * prompt-style intent string, surfaced by Studio from the MediaSurface's
 * `alt` prop via the Generate Image action. Lookup providers ignore it;
 * future prompt-aware generators use it as the user-intent prompt.
 */
export type SourceDescriptor =
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

/** A resolved source — the URL to put in `<img src=>` plus light metadata. */
export interface SourceResolution {
  /** Public URL of the resolved image. Lives on the provider's CDN. */
  url: string;
  /** Provider id, for diagnostics + the `data-resolved-by` attribute we
   *  stamp on the eventual <img>. e.g. "musicbrainz-caa", "pollinations". */
  provider: string;
  /** Optional canonical alt the provider knows (e.g. MusicBrainz's
   *  release title). Caller can decide whether to overwrite the existing
   *  alt with this — we never force it. */
  alt?: string;
}

/** A swap-in sourced-imagery provider. */
export interface SourceProvider {
  readonly id: string;
  /** Which `kind`s this provider handles. The router consults this to skip
   *  providers that wouldn't apply. A provider returning `null` from
   *  `resolve` for a handled kind is treated as a soft miss — router falls
   *  through to the next eligible provider. */
  readonly handles: ReadonlyArray<SourceKind>;
  resolve(source: SourceDescriptor): Promise<SourceResolution | null>;
}
