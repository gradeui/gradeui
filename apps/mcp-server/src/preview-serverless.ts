/**
 * Serverless screenshot engine for preview_screen — the Vercel-function
 * counterpart of `screenshotEmbed` in preview.ts.
 *
 * Full Playwright can't run on serverless (no browser binaries, no
 * `playwright install`). This pairs `playwright-core` (driver only, no
 * downloads) with `@sparticuz/chromium` (a brotli-compressed Chromium that
 * self-extracts to /tmp on first launch — built exactly for AWS
 * Lambda/Vercel functions).
 *
 * VERSION LOCKSTEP (important): playwright-core only speaks the protocol
 * of the Chromium it was built against. playwright-core 1.59.x expects
 * Chromium 147, so @sparticuz/chromium is pinned to 147.0.0 in
 * package.json. When bumping playwright, check
 * `node_modules/playwright-core/browsers.json` for the new chromium
 * `browserVersion` and bump @sparticuz/chromium to the matching major.
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
      import("@sparticuz/chromium"),
    ]);
  } catch (err) {
    throw new Error(
      `Serverless screenshot deps missing (playwright-core / @sparticuz/chromium — dependencies of @gradeui/mcp-server): ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  let browser;
  try {
    browser = await pwChromium.launch({
      args: sparticuz.args,
      executablePath: await sparticuz.executablePath(),
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
