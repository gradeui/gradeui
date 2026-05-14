/**
 * Public, referrer-locked MapTiler API key for the @gradeui/ui demo.
 *
 * This key is intentionally hard-coded and ships in the published bundle.
 * Safety comes from MapTiler's referrer restriction — the key only works
 * for requests originating from `gradeui.com`, `*.gradeui.com`, and
 * `localhost`. Outside those origins MapTiler returns 403 and the
 * adapter emits `onError({ code: "tile-load-failed", ... })`.
 *
 * Consumers using `<Map provider="maplibre">` from any other domain
 * MUST supply their own MapTiler key via the `tilerKey` prop:
 *
 *   <Map provider="maplibre" tilerKey={env.MAPTILER_KEY} ... />
 *
 * Rotating: replace the value below, run `pnpm changeset` (patch bump),
 * publish. No env vars, no CI secrets, one-line PR.
 *
 * Setup checklist when registering the key:
 *   1. Create a MapTiler account (free tier — 100k req/mo).
 *   2. Dashboard → Account → Keys → Create new key.
 *   3. Set "Allowed origins" — MapTiler wants BARE HOSTNAMES (not full URLs;
 *      no protocol, no port). Add each on its own line:
 *        - localhost
 *        - 127.0.0.1
 *        - gradeui.com
 *        - *.gradeui.com
 *   4. Paste below, replacing `YOUR_KEY_HERE`.
 *   5. Commit + changeset.
 */
// Annotated as `string` (not the inferred literal type) so the runtime
// comparisons in `isDemoKeyConfigured` aren't flagged by TypeScript as
// tautologies. Without this, `KEY !== "YOUR_KEY_HERE"` narrows to a
// constant boolean at compile time.
export const GRADE_DEMO_MAPTILER_KEY: string = "2pMfyvhpuKonkf7h8HzH";

/**
 * Whether the demo key has actually been pasted in (vs left as the
 * `YOUR_KEY_HERE` placeholder). Used by the adapter to emit a
 * dev-only console warning when the placeholder is detected.
 */
export const isDemoKeyConfigured = (): boolean =>
  GRADE_DEMO_MAPTILER_KEY !== "YOUR_KEY_HERE" && GRADE_DEMO_MAPTILER_KEY.length > 0;
