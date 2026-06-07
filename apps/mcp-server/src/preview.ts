/**
 * preview_screen support — render a saved screen through the LIVE embed
 * route (gradeui.com/e/<token>) and hand the host model an actual PNG.
 *
 * This is the "capture as MCP image" loop: the embed route already does
 * the faithful render (real components, real theme, service-role data
 * fetch — see apps/docs/app/e/[token]/page.tsx), so the MCP just needs a
 * share token + Playwright pointed at it. No facsimiles: what the model
 * sees is what the user sees.
 *
 * Share links double as embed capability keys (STUDIO-EMBED: "an embed IS
 * a share link"). `ensureShareLink` reuses a live, unpinned, view-mode
 * link for the screen when one exists, and mints one otherwise — so
 * repeated previews don't pile up rows. NOTE: minting a link makes the
 * screen viewable by anyone holding the token (unguessable UUID, read-
 * only) — same trust model as sharing from Studio.
 *
 * Playwright is imported lazily inside the screenshot call so the server
 * boots fine on machines without browser binaries; the error message
 * tells you the one command to fix it.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const nowMs = () => Date.now();

export interface EnsureShareResult {
  token: string;
  created: boolean;
}

/** Find-or-create the view-mode, latest-revision share link for a screen. */
export async function ensureShareLink(
  sb: SupabaseClient,
  projectId: string,
  designId: string,
  colorMode: "light" | "dark" = "dark",
): Promise<EnsureShareResult> {
  const { data: existing, error: selErr } = await sb
    .from("share_links")
    .select("token, revoked, expires_at, revision_id, mode")
    .eq("project_id", projectId)
    .eq("design_id", designId)
    .eq("mode", "view")
    .is("revision_id", null)
    .eq("revoked", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (selErr) throw selErr;

  const live =
    existing &&
    (!existing.expires_at || (existing.expires_at as number) > nowMs());
  if (live) {
    return { token: existing.token as string, created: false };
  }

  const { data: inserted, error: insErr } = await sb
    .from("share_links")
    .insert({
      project_id: projectId,
      design_id: designId,
      mode: "view",
      color_mode: colorMode,
      // created_by: omitted — service-role inserts have no auth.uid();
      // the column is nullable by design.
    })
    .select("token")
    .single();
  if (insErr) throw insErr;
  return { token: inserted.token as string, created: true };
}

/** Compose the public embed URL for a token. `motion=off` stills CSS
 *  animation + pauses ThreeScene so the screenshot is deterministic;
 *  `w` pins the virtual render width so breakpoints fire predictably. */
export function embedUrl(
  siteUrl: string,
  token: string,
  width: number,
): string {
  const base = siteUrl.replace(/\/+$/, "");
  return `${base}/e/${token}?w=${width}&motion=off`;
}

export interface ScreenshotResult {
  /** Base64-encoded PNG. */
  base64: string;
  width: number;
  height: number;
}

/**
 * Persist a preview PNG to disk and return its absolute path.
 *
 * Why a file as well as MCP image content: hosts vary in whether they
 * surface image tool-results to the HUMAN (Claude's desktop app shows
 * them to the model only). The file is the lowest-common-denominator
 * hand-off — any host/agent can open, present, or link it.
 *
 * Location: `apps/mcp-server/previews/` resolved relative to THIS module
 * (stable however the host spawns the process — cwd is never trusted).
 * Override with GRADE_PREVIEW_DIR. The directory is gitignored.
 */
export function previewFileName(name: string, screenId: string): string {
  const slug =
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ||
    "screen";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `${slug}-${screenId}-${stamp}.png`;
}

export async function savePreviewPng(
  name: string,
  screenId: string,
  base64: string,
): Promise<string> {
  const dir =
    process.env.GRADE_PREVIEW_DIR ??
    // dist/index.js (bundled) → ../previews ⇒ apps/mcp-server/previews
    join(dirname(fileURLToPath(import.meta.url)), "..", "previews");
  await mkdir(dir, { recursive: true });
  const file = join(dir, previewFileName(name, screenId));
  await writeFile(file, Buffer.from(base64, "base64"));
  return file;
}

/**
 * Persist a preview PNG to Supabase Storage and return its public URL.
 *
 * LATEST-ONLY, BY CONSTRUCTION: every capture of a screen overwrites the
 * same deterministic path — `<screenId>/latest.png` — so the bucket holds
 * exactly one poster per screen and anything (Studio sidebar thumbnails,
 * share cards, the MCP app panel) can address it knowing only the
 * screenId. No designs-table column needed, and designs.state stays
 * untouched (it's dirty-tracked by Studio; writing metadata into it from
 * here would fight the autosave). The returned URL carries a ?v=
 * cache-buster because the underlying path is stable and CDN-cached.
 *
 * Bucket is created on first use (public, read-only by URL: same trust
 * model as the share token the screenshot came from — unguessable id,
 * read-only pixels).
 */
const PREVIEW_BUCKET = "screen-previews";

export type PreviewColorMode = "light" | "dark";

/** Deterministic poster path for a screen — one per color mode. */
export function previewStoragePath(
  screenId: string,
  colorMode: PreviewColorMode,
): string {
  return `${screenId}/latest-${colorMode}.png`;
}

export async function uploadPreviewPng(
  sb: SupabaseClient,
  screenId: string,
  colorMode: PreviewColorMode,
  base64: string,
): Promise<string> {
  const path = previewStoragePath(screenId, colorMode);
  const bytes = Buffer.from(base64, "base64");
  const doUpload = () =>
    sb.storage
      .from(PREVIEW_BUCKET)
      .upload(path, bytes, { contentType: "image/png", upsert: true });

  let { error } = await doUpload();
  if (error && /not.?found/i.test(error.message)) {
    // First ever upload: bucket doesn't exist yet. Service role may create it.
    const { error: mkErr } = await sb.storage.createBucket(PREVIEW_BUCKET, {
      public: true,
    });
    if (mkErr && !/already exists/i.test(mkErr.message)) throw mkErr;
    ({ error } = await doUpload());
  }
  if (error) throw error;

  const { data } = sb.storage.from(PREVIEW_BUCKET).getPublicUrl(path);
  // Stable path + CDN caching = stale posters without a buster.
  return `${data.publicUrl}?v=${Date.now()}`;
}

export interface StoredPreview {
  base64: string;
  url: string;
  /** Epoch ms the poster was captured (storage object updated_at). */
  capturedAt: number;
}

/**
 * Fetch the stored poster for a screen+mode IF it postdates `sinceMs`
 * (the screen's last save). Returns null when there's no poster, it's
 * stale, or anything errors — callers fall through to a live capture.
 * This is what makes preview cheap: a poster captured on the desktop
 * serves phone/hosted previews with zero Chromium involvement.
 */
export async function getStoredPreview(
  sb: SupabaseClient,
  screenId: string,
  colorMode: PreviewColorMode,
  sinceMs: number,
): Promise<StoredPreview | null> {
  try {
    const fileName = `latest-${colorMode}.png`;
    const { data: objects, error: listErr } = await sb.storage
      .from(PREVIEW_BUCKET)
      .list(screenId, { search: fileName });
    if (listErr) return null;
    const obj = objects?.find((o) => o.name === fileName);
    if (!obj?.updated_at) return null;
    const capturedAt = new Date(obj.updated_at).getTime();
    if (!Number.isFinite(capturedAt) || capturedAt < sinceMs) return null;

    const path = previewStoragePath(screenId, colorMode);
    const { data: blob, error: dlErr } = await sb.storage
      .from(PREVIEW_BUCKET)
      .download(path);
    if (dlErr || !blob) return null;
    const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");
    const { data } = sb.storage.from(PREVIEW_BUCKET).getPublicUrl(path);
    return { base64, url: `${data.publicUrl}?v=${capturedAt}`, capturedAt };
  } catch {
    return null;
  }
}

/**
 * Screenshot the embed with Playwright. Waits for network idle plus a
 * settle delay (EmbedScreen hydrates client-side; fonts + theme vars need
 * a beat). Returns base64 PNG sized to the requested viewport.
 */
export async function screenshotEmbed(
  url: string,
  width: number,
  height: number,
  colorMode: PreviewColorMode = "dark",
): Promise<ScreenshotResult> {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error(
      "Playwright isn't resolvable from the MCP server. Run `pnpm install` in the gradeui repo (playwright is a dependency of @gradeui/mcp-server).",
    );
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    throw new Error(
      `Could not launch Chromium — browser binaries may be missing. Run \`npx playwright install chromium\` in the gradeui repo. (${
        err instanceof Error ? err.message : String(err)
      })`,
    );
  }

  try {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
      colorScheme: colorMode,
    });
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    // EmbedScreen hydrates + applies the theme var block client-side.
    await page.waitForTimeout(1500);
    const buf = await page.screenshot({ type: "png" });
    return { base64: buf.toString("base64"), width, height };
  } finally {
    await browser.close();
  }
}
