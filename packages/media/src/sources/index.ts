/**
 * Public surface of the sourced-imagery module.
 *
 * Sourced providers return URLs they don't host — MusicBrainz Cover Art
 * Archive for album covers, Pollinations for prompt-aware generation,
 * Lorem Picsum for last-resort deterministic placeholders. They're the
 * keyless, zero-cost-at-rest half of the @gradeui/media surface — what
 * Studio's "Fill images" button reaches for first, before any paid
 * generative provider gets considered.
 *
 * Pair these with the `resolveMediaSource` / `resolveMediaSources` router
 * (see `./router.ts`) — direct use of an individual provider is fine for
 * testing but consumers normally want the per-hint provider chain the
 * router gives them.
 */

export type {
  SourceKind,
  SourceDescriptor,
  SourceResolution,
  SourceProvider,
} from "./types";
export { createMusicBrainzProvider } from "./musicbrainz";
export { createTmdbProvider } from "./tmdb";
export { createIgdbProvider } from "./igdb";
export { createOpenLibraryProvider } from "./openlibrary";
export { createPollinationsUrlProvider } from "./pollinations-url";
export { createPicsumProvider } from "./picsum";
export {
  resolveMediaSource,
  resolveMediaSources,
  buildDefaultRouter,
  sourceKey,
  type SourceRouter,
  type ResolveOptions,
  type ResolutionEntry,
} from "./router";
