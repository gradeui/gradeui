/**
 * Serverless screenshot engine for preview_screen — the Vercel-function
 * counterpart of `screenshotEmbed` in preview.ts.
 *
 * Full Playwright can't run on serverless (no browser binaries, no
 * `playwright install`). This pairs `playwright-core` (driver only, no
 * downloads) with `@sparticuz/chromium-min`: at cold start it downloads
 * the Chromium "pack" tar from PACK_URL into /tmp and extracts it. The
 * -min variant (vs plain @sparticuz/chromium, which ships the binary
 * inside the npm package) is deliberate: Vercel's file tracer doesn't ship
 * the package's binary assets with the function (observed on first deploy:
 * "input directory …/bin does not exist"), and outputFileTracingIncludes
 * globs are fragile across pnpm layouts. A URL download is deterministic
 * everywhere. Warm functions reuse the extracted /tmp copy.
 *
 * VERSION LOCKSTEP (important): playwright-core only speaks the protocol
 * of the Chromium it was built against. playwright-core 1.59.x expects
 * Chromium 147, so @sparticuz/chromium-min AND the pack URL below are
 * pinned to v147.0.0. When bumping playwright, check
 * `node_modules/playwright-core/browsers.json` for the new chromium
 * `browserVersion`, then bump the package version and this URL together.
 * Override the URL (e.g. to self-host the pack on Supabase Storage) with
 * CHROMIUM_PACK_URL.
 *
 * Everything is imported lazily so this module costs nothing on hosts that
 * never call preview_screen, and so the local stdio server (which uses the
 * full Playwright path) never needs these deps installed at runtime.
 *
 * Timing: cold call ≈ 4–10s (extract + launch + navigate + settle) — well
 * inside the route's 60s maxDuration. Warm functions reuse the extracted
 * binary in /tmp.
 */

import type { ScreenshotResult } from "./preview";

/** sha256 e2a58b0c… — the official v147.0.0 x64 pack (Vercel fns are x64). */
const PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.x64.tar";

export async function screenshotEmbedServerless(
  url: string,
  width: number,
  height: number,
): Promise<ScreenshotResult> {
  let pwChromium;
  let sparticuz;
  try {
    [{ chromium: pwChromium }, { default: sparticuz }] = await Promise.all([
      import("playwright-core"),
      import("@sparticuz/chromium-min"),
    ]);
  } catch (err) {
    throw new Error(
      `Serverless screenshot deps missing (playwright-core / @sparticuz/chromium-min — dependencies of @gradeui/mcp-server): ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  let browser;
  try {
    browser = await pwChromium.launch({
      args: sparticuz.args,
      executablePath: await sparticuz.executablePath(
        process.env.CHROMIUM_PACK_URL ?? PACK_URL,
      ),
      headless: true,
    });
  } catch (err) {
    throw new Error(
      `Could not launch serverless Chromium (version lockstep? see preview-serverless.ts): ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  try {
    // Mirrors screenshotEmbed in preview.ts — keep the two in step.
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
