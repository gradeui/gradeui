/**
 * Server-side helper for the /skills page.
 *
 * Lists the reference layouts shipped in `@gradeui/studio/playbook` and
 * pairs each with its captured-screenshot manifest (when one exists in
 * `public/layout-checks/<id>/manifest.json`). The page uses this to render
 * the layout picker with "ready to review" vs "needs capture" indicators.
 *
 * The captured-screenshots manifest is produced by the Playwright runner at
 * `apps/docs/scripts/check-layouts.mjs`. Run it via:
 *
 *   pnpm -F @gradeui/docs check:layouts                 # all layouts
 *   pnpm -F @gradeui/docs check:layouts --layout <id>   # one layout
 *
 * Manifests live in the public folder so they can be re-served as static
 * URLs and cross-referenced by id.
 */

import "server-only";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { REFERENCE_LAYOUTS } from "@gradeui/studio/playbook";

/** Shape of a manifest snapshot — matches what `check-layouts.mjs` writes. */
export interface ManifestSnapshot {
  viewportWidth: number;
  /** Filesystem path relative to `public/layout-checks/`. e.g. "airbnb-listings/375.png". */
  file: string | null;
  consoleErrors: string[];
}

export interface LayoutManifest {
  layoutId: string;
  capturedAt: string;
  base: string;
  snapshots: ManifestSnapshot[];
}

export interface LayoutListing {
  id: string;
  label: string;
  description: string;
  tags: readonly string[];
  /** True if a manifest.json exists for this layout. */
  hasManifest: boolean;
  /** Manifest contents when `hasManifest` is true; otherwise null. */
  manifest: LayoutManifest | null;
  /** Public URL for the layout-preview page. Used for "view raw" links. */
  previewUrl: string;
}

/** Resolve the absolute path to a manifest file. */
export function manifestPath(layoutId: string): string {
  return path.join(
    process.cwd(),
    "public",
    "layout-checks",
    layoutId,
    "manifest.json",
  );
}

/** Resolve the absolute path to a captured screenshot, given its `file` field. */
export function snapshotPath(snapshotFile: string): string {
  // `file` is relative to `public/layout-checks/` per the runner's
  // `path.relative(OUT_ROOT, file)` call. Join from the same anchor.
  return path.join(process.cwd(), "public", "layout-checks", snapshotFile);
}

// `snapshotUrl` lives in `./snapshot-url` because client components need
// it too; importing it through this file (which declares `server-only`)
// would drag the server-only boundary into the client bundle.
export { snapshotUrl } from "./snapshot-url";

async function readManifest(layoutId: string): Promise<LayoutManifest | null> {
  const p = manifestPath(layoutId);
  if (!existsSync(p)) return null;
  try {
    const raw = await readFile(p, "utf8");
    return JSON.parse(raw) as LayoutManifest;
  } catch {
    // A corrupt manifest shouldn't 500 the whole page — surface as "no manifest".
    return null;
  }
}

/**
 * Materialize the full layout listing for the /skills page.
 * Reads manifests in parallel; cheap enough to do on every request.
 */
export async function loadLayouts(): Promise<LayoutListing[]> {
  return Promise.all(
    REFERENCE_LAYOUTS.map(async (l): Promise<LayoutListing> => {
      const manifest = await readManifest(l.id);
      return {
        id: l.id,
        label: l.label,
        description: l.description,
        tags: l.tags,
        hasManifest: manifest !== null,
        manifest,
        previewUrl: `/layout-preview/${l.id}`,
      };
    }),
  );
}
