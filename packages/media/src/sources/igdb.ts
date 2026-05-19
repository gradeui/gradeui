/**
 * IGDB (Internet Game Database) provider — real game cover art.
 *
 * **TODO (Ali, May 2026): Twitch app not yet registered.** Provider
 * is wired into the default router and ready to go — the only thing
 * missing is the env vars. To activate:
 *   1. https://dev.twitch.tv/console/apps → "Register Your Application"
 *      (Name: anything, OAuth redirect: http://localhost — unused,
 *      Category: "Application Integration")
 *   2. Copy the generated client ID + secret.
 *   3. Add to `apps/docs/.env.local`:
 *        TWITCH_CLIENT_ID=...
 *        TWITCH_CLIENT_SECRET=...
 *   4. Restart `pnpm dev` so Next picks up the env.
 * Free tier is 4 req/s — plenty for Fill batches.
 *
 * Auth (when wired): IGDB is wrapped by Twitch's OAuth. You register a
 * Twitch app, copy the client ID + client secret, exchange them for an
 * app-access token, then pass the token to IGDB. The token is good for
 * ~60 days; we cache it in-memory for the lifetime of the server
 * process and refresh on 401.
 *
 * Without `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in env, the
 * provider returns null for every call and the router falls through to
 * Picsum (same graceful-degradation pattern as TMDb).
 *
 * Search uses Apicalypse (IGDB's POST-body query language). One round
 * trip is enough: we fetch games with `cover.image_id` expanded, take
 * the first hit, then build the canonical URL from the image_id:
 *
 *   https://images.igdb.com/igdb/image/upload/t_cover_big/{image_id}.jpg
 *
 * `t_cover_big` is 264×374px. IGDB also serves `t_cover_med`,
 * `t_cover_small`, `t_1080p`, etc. `t_cover_big` matches the poster
 * sizing in our card grids without overshooting bandwidth.
 *
 * Rate limit: 4 req / second per token. Fill batches are well under
 * that even for 20-card screens.
 *
 * Docs: https://api-docs.igdb.com/
 */

import type {
  SourceDescriptor,
  SourceProvider,
  SourceResolution,
} from "./types";

const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_BASE = "https://api.igdb.com/v4";
const COVER_URL_BASE = "https://images.igdb.com/igdb/image/upload";
const COVER_SIZE = "t_cover_big" as const;

interface CachedToken {
  value: string;
  /** Epoch ms at which the token expires. We refresh ~5min early. */
  expiresAt: number;
}

interface TwitchTokenResponse {
  access_token: string;
  /** Seconds until expiry. */
  expires_in: number;
}

interface IgdbGameHit {
  id: number;
  name: string;
  cover?: {
    id: number;
    image_id: string;
  };
}

/**
 * Module-level token cache. Lives in the Node process between requests
 * so we don't OAuth-dance per Fill click. Re-acquired on expiry or
 * 401 from IGDB. For multi-instance deployments each process keeps its
 * own cache — fine, the tokens themselves are stateless.
 */
let cachedToken: CachedToken | null = null;

export function createIgdbProvider(): SourceProvider {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  return {
    id: "igdb",
    handles: ["game"],

    async resolve(source: SourceDescriptor): Promise<SourceResolution | null> {
      if (!clientId || !clientSecret) return null;
      if (source.kind !== "game") return null;
      if (!source.title) return null;

      const token = await ensureToken(clientId, clientSecret);
      if (!token) return null;

      const hit = await searchGame(clientId, token, source.title);
      // 401 retry: token might have expired mid-request. Wipe the
      // cache and try once more — saves a manual restart in the rare
      // case the cached expiry was wrong.
      if (hit === "AUTH_FAILED") {
        cachedToken = null;
        const fresh = await ensureToken(clientId, clientSecret);
        if (!fresh) return null;
        const retry = await searchGame(clientId, fresh, source.title);
        if (retry === "AUTH_FAILED" || !retry) return null;
        return formatResolution(retry);
      }
      if (!hit) return null;
      return formatResolution(hit);
    },
  };
}

function formatResolution(game: IgdbGameHit): SourceResolution | null {
  const imageId = game.cover?.image_id;
  if (!imageId) return null;
  return {
    url: `${COVER_URL_BASE}/${COVER_SIZE}/${imageId}.jpg`,
    provider: "igdb",
    alt: game.name,
  };
}

async function ensureToken(
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60_000) {
    return cachedToken.value;
  }
  try {
    const res = await fetch(TWITCH_TOKEN_URL, {
      method: "POST",
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as TwitchTokenResponse;
    cachedToken = {
      value: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return data.access_token;
  } catch {
    return null;
  }
}

/**
 * Searches IGDB games by name. Returns the first hit with a cover, or
 * `"AUTH_FAILED"` to signal a 401 (caller refreshes the token and
 * retries once), or null for any other miss.
 */
async function searchGame(
  clientId: string,
  token: string,
  title: string,
): Promise<IgdbGameHit | "AUTH_FAILED" | null> {
  // Apicalypse: POST body is a free-text query language. Escape
  // double-quotes in the title so a "Tony Hawk's "Pro Skater 2"" search
  // doesn't break parsing.
  const safeTitle = title.replace(/"/g, '\\"');
  const body = `search "${safeTitle}"; fields id,name,cover.image_id; where cover != null; limit 5;`;

  try {
    const res = await fetch(`${IGDB_BASE}/games`, {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
        Accept: "application/json",
      },
      body,
      signal: AbortSignal.timeout(8_000),
    });
    if (res.status === 401) return "AUTH_FAILED";
    if (!res.ok) return null;
    const data = (await res.json()) as IgdbGameHit[];
    return data.find((g) => g.cover?.image_id) ?? null;
  } catch {
    return null;
  }
}
