/**
 * TMDb (The Movie Database) provider.
 *
 * Real posters for TV shows and films. Same model as MusicBrainz for
 * albums: search by title (+ optional year), take the top result, build
 * the canonical image URL from the response's `poster_path`. No bytes
 * proxied through our server — JSX gets the image.tmdb.org CDN URL and
 * the browser loads it directly.
 *
 * Auth: requires a v3 API key (free; `https://www.themoviedb.org/settings/api`).
 * Set `TMDB_API_KEY` in env. Without it, the provider returns null for
 * every call and the router falls through to Picsum — Fill keeps
 * working, just with content-blind fallbacks for TV/film slots.
 *
 * Handles two kinds:
 *   - `tv-show` → /search/tv  (filter by `first_air_date_year`)
 *   - `movie`   → /search/movie  (filter by `year`)
 *
 * Rate limit: 50 req / sec per API key, no daily cap (TMDb's
 * documented terms). Plenty for human-driven fills.
 *
 * Docs: https://developer.themoviedb.org/reference/intro/getting-started
 */

import type {
  SourceDescriptor,
  SourceProvider,
  SourceResolution,
} from "./types";

const TMDB_BASE = "https://api.themoviedb.org/3";
// w500 mirrors MusicBrainz's COVER_SIZE — large enough for hero cards,
// small enough to load fast on grids. TMDb also serves w185 / w342 / w780
// / original; w500 is the sweet spot for our card grid sizes.
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

interface TmdbSearchHit {
  id: number;
  poster_path: string | null;
  // TV results carry `name` + `first_air_date`; movies carry `title` +
  // `release_date`. Union here so one shape handles both responses.
  name?: string;
  title?: string;
  first_air_date?: string;
  release_date?: string;
}

interface TmdbSearchResponse {
  results?: TmdbSearchHit[];
}

export function createTmdbProvider(): SourceProvider {
  const apiKey = process.env.TMDB_API_KEY;

  return {
    id: "tmdb",
    handles: ["tv-show", "movie"],

    async resolve(source: SourceDescriptor): Promise<SourceResolution | null> {
      if (!apiKey) return null;
      if (source.kind !== "tv-show" && source.kind !== "movie") return null;

      const path = source.kind === "tv-show" ? "/search/tv" : "/search/movie";
      // TMDb's year-filter param differs between endpoints — see the
      // docs link above. Movies use `year` (release year); TV uses
      // `first_air_date_year`. Same calendar year semantics either way.
      const yearParam =
        source.kind === "tv-show" ? "first_air_date_year" : "year";

      const params = new URLSearchParams({
        api_key: apiKey,
        query: source.title,
        include_adult: "false",
        language: "en-US",
        page: "1",
      });
      if (source.year) params.set(yearParam, String(source.year));

      const url = `${TMDB_BASE}${path}?${params.toString()}`;

      try {
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8_000),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as TmdbSearchResponse;
        const hit = (data.results ?? []).find((r) => r.poster_path);
        if (!hit?.poster_path) return null;

        return {
          url: `${POSTER_BASE}${hit.poster_path}`,
          provider: "tmdb",
          alt: hit.name || hit.title || source.title,
        };
      } catch {
        return null;
      }
    },
  };
}
