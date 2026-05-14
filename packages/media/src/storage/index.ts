/**
 * Storage driver selection.
 *
 * The driver is picked from env, not from the caller — keeps `generateImage()`
 * clean of environment branching. Override `MEDIA_STORAGE_DRIVER` to force a
 * specific backend (handy for testing the prod driver locally).
 *
 *   - `local-tmp`   → dev default
 *   - `vercel-blob` → set automatically when running on Vercel
 *
 * Future drivers (`r2`, `s3`) plug in here.
 */

import type { StorageDriver } from "../types";
import { createLocalTmpStorage } from "./local-tmp";
import { createVercelBlobStorage } from "./vercel-blob";

export type StorageDriverId = "local-tmp" | "vercel-blob";

let cached: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (cached) return cached;
  cached = createDriverFromEnv();
  return cached;
}

/** Test seam — replace the resolved driver. */
export function setStorage(driver: StorageDriver) {
  cached = driver;
}

function createDriverFromEnv(): StorageDriver {
  const explicit = process.env.MEDIA_STORAGE_DRIVER as StorageDriverId | undefined;
  const id: StorageDriverId =
    explicit ?? (process.env.VERCEL ? "vercel-blob" : "local-tmp");

  switch (id) {
    case "vercel-blob":
      return createVercelBlobStorage();
    case "local-tmp":
      return createLocalTmpStorage();
    default: {
      const _exhaustive: never = id;
      throw new Error(`Unknown MEDIA_STORAGE_DRIVER: ${_exhaustive}`);
    }
  }
}

export { createLocalTmpStorage, createVercelBlobStorage };
export { localTmpPath } from "./local-tmp";
