/**
 * Pure URL helpers for captured layout snapshots.
 *
 * Lives in its own file (rather than next to the server-only `loadLayouts`)
 * because client components also need to compute the public URL for a
 * snapshot — and pulling them through `load-layouts.ts` would drag the
 * `import "server-only"` boundary into the client bundle, which Next.js
 * (correctly) refuses to compile.
 */

/**
 * Public URL for a captured screenshot, given the manifest's `file` field
 * (which is relative to `public/layout-checks/`). Next serves the public
 * folder at site root, so this is just a string concatenation.
 */
export function snapshotUrl(snapshotFile: string): string {
  return `/layout-checks/${snapshotFile}`;
}
