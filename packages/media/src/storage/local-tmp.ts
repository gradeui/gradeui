/**
 * Local-tmp storage driver — for development.
 *
 * Writes to `os.tmpdir()/gradeui-media/`. The OS will clean this up on a long
 * enough timeline; we never block on that. Returns a relative URL to a
 * Next.js route handler (`/api/media/[file]`) which streams the file back.
 *
 * Why not write to `apps/docs/public/_generated/`? Two reasons:
 *   1. Vercel's serverless filesystem is read-only at runtime, so a `public/`
 *      write strategy doesn't survive deployment — better to use a different
 *      driver in prod and keep dev → prod parity at the *URL* level, not the
 *      file-system level.
 *   2. `public/` writes pollute the repo / require gitignore discipline.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { StorageDriver } from "../types";

const ROOT = path.join(os.tmpdir(), "gradeui-media");

let initialized = false;
async function ensureRoot() {
  if (initialized) return;
  await fs.mkdir(ROOT, { recursive: true });
  initialized = true;
}

/**
 * Resolve the absolute path for a stored file. Exported so the API route
 * (apps/docs/app/api/media/[file]/route.ts) can stream from disk without
 * duplicating the path-joining logic.
 */
export function localTmpPath(filename: string): string {
  // Defense in depth — never let a `..` segment escape the root.
  const safe = path.basename(filename);
  return path.join(ROOT, safe);
}

export function createLocalTmpStorage(): StorageDriver {
  return {
    id: "local-tmp",

    async resolve(filename) {
      await ensureRoot();
      try {
        await fs.access(localTmpPath(filename));
        return `/api/media/${encodeURIComponent(filename)}`;
      } catch {
        return null;
      }
    },

    async write(filename, buffer) {
      await ensureRoot();
      await fs.writeFile(localTmpPath(filename), buffer);
      return `/api/media/${encodeURIComponent(filename)}`;
    },
  };
}
