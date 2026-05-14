/**
 * Vercel Blob storage driver — for production on Vercel.
 *
 * Writes via @vercel/blob, returns the public CDN URL. 1 GB free on the Hobby
 * plan; once images are WebP at q=80 (~150 KB avg) that's ~6,500 generated
 * images of headroom — more than enough until we outgrow it.
 *
 * Swap-out: when 1 GB is no longer enough, replace this with an R2 driver.
 * Same StorageDriver interface, same call sites — should be a single-file
 * change.
 *
 * Required env: BLOB_READ_WRITE_TOKEN (Vercel auto-injects this when a Blob
 * store is attached to the project).
 */

import { head, put } from "@vercel/blob";
import type { StorageDriver } from "../types";

export function createVercelBlobStorage(): StorageDriver {
  return {
    id: "vercel-blob",

    async resolve(filename) {
      try {
        const meta = await head(filename);
        return meta.url;
      } catch {
        // head() throws on 404. That's our cache-miss signal.
        return null;
      }
    },

    async write(filename, buffer, contentType) {
      const result = await put(filename, buffer, {
        access: "public",
        contentType,
        // Caches are content-addressed by hash; once written, the bytes never
        // change. Long max-age + immutable lets the CDN serve forever.
        cacheControlMaxAge: 60 * 60 * 24 * 365,
        // Prevent the random-suffix that Vercel Blob adds by default — we
        // *want* the filename to be the cache key.
        addRandomSuffix: false,
      });
      return result.url;
    },
  };
}
