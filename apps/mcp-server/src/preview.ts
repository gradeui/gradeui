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
 * Screenshot the embed with Playwright. Waits for network idle plus a
 * settle delay (EmbedScreen hydrates client-side; fonts + theme vars need
 * a beat). Returns base64 PNG sized to the requested viewport.
 */
export async function screenshotEmbed(
  url: string,
  width: number,
  height: number,
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
      colorScheme: "dark",
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
