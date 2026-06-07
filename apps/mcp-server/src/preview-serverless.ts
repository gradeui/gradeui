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

import type { PreviewColorMode, ScreenshotResult } from "./preview";

/** sha256 e2a58b0c… — the official v147.0.0 x64 pack (Vercel fns are x64). */
const PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.x64.tar";

// ONE browser per warm instance, ONE capture at a time. Fluid compute
// routes CONCURRENT invocations into the same container — launching a
// fresh ~300MB Chromium per call (×2 when calls overlap) is what drove
// the box into ERR_INSUFFICIENT_RESOURCES, and each crash left the warm
// instance more degraded. The singleton launches once and is recycled on
// any capture failure; the queue serializes captures so two never run
// shoulder-to-shoulder in 2GB.
// Minimal structural type — playwright-core's Browser without importing
// its types at module scope (the lib loads lazily).
interface PwPage {
  route(glob: string, handler: (route: PwRoute) => unknown): Promise<void>;
  goto(url: string, opts: object): Promise<unknown>;
  waitForTimeout(ms: number): Promise<void>;
  screenshot(opts: { type: "png" }): Promise<Buffer>;
  close(): Promise<void>;
}
interface PwRoute {
  request(): { resourceType(): string };
  abort(): Promise<void>;
  continue(): Promise<void>;
}
interface PwBrowser {
  close(): Promise<void>;
  isConnected(): boolean;
  newPage(opts: object): Promise<PwPage>;
}
let cachedBrowser: PwBrowser | null = null;
let captureQueue: Promise<unknown> = Promise.resolve();

async function getBrowser() {
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

  if (cachedBrowser && cachedBrowser.isConnected()) return cachedBrowser;
  cachedBrowser = null;
  try {
    cachedBrowser = await pwChromium.launch({
      // --disable-dev-shm-usage is NOT in sparticuz's list but is the
      // canonical fix for shared-memory exhaustion on serverless: /dev/shm
      // is tiny there, so Chromium must use /tmp instead of failing
      // allocations mid-pageload.
      args: [...sparticuz.args, "--disable-dev-shm-usage"],
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
  return cachedBrowser;
}

/** Drop the cached browser (after a failure) so the next call relaunches
 *  clean instead of reusing a wedged instance. */
async function recycleBrowser() {
  const b = cachedBrowser;
  cachedBrowser = null;
  if (b) await b.close().catch(() => undefined);
}

export function screenshotEmbedServerless(
  url: string,
  width: number,
  height: number,
  colorMode: PreviewColorMode = "dark",
): Promise<ScreenshotResult> {
  const run = captureQueue.then(() =>
    captureOnce(url, width, height, colorMode),
  );
  // Failures must not wedge the queue for the next caller.
  captureQueue = run.catch(() => undefined);
  return run;
}

async function captureOnce(
  url: string,
  width: number,
  height: number,
  colorMode: PreviewColorMode,
): Promise<ScreenshotResult> {
  const browser = await getBrowser();
  let page: PwPage | null = null;
  try {
    // Same shape as screenshotEmbed in preview.ts, tuned for a 2GB box:
    // "domcontentloaded" instead of "networkidle" (waiting for idle keeps
    // every in-flight resource buffered at once — the memory peak that was
    // killing 1-vCPU/2GB functions) + a longer settle for hydration, and
    // analytics/video requests aborted before they cost anything.
    page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
      colorScheme: colorMode,
    });
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (type === "media" || type === "websocket") return route.abort();
      return route.continue();
    });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    // EmbedScreen hydrates + applies the theme var block client-side —
    // give it longer than the local engine since we no longer wait for
    // network idle.
    await page.waitForTimeout(3000);
    const buf = await page.screenshot({ type: "png" });
    return { base64: buf.toString("base64"), width, height };
  } catch (err) {
    // A failed capture may have wedged the shared browser — recycle so the
    // retry (and the next caller) gets a clean launch.
    await recycleBrowser();
    throw err;
  } finally {
    if (page) await page.close().catch(() => undefined);
  }
}
