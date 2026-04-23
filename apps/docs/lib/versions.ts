/**
 * Build-time version strings for the packages this app ships against.
 *
 * Imports the raw `package.json` from each workspace package via the
 * `./package.json` subpath export we added on both packages. Next.js /
 * Webpack treats JSON imports as static modules and tree-shakes every
 * field except `version`, so the bundle cost is three short strings.
 *
 * Exposed here (rather than inlined in the component) so the Studio
 * header isn't the only place that can read them — next up this will
 * also feed into the "Send issue" button, telemetry pings, and whatever
 * else needs to pin a bug report to a specific library revision.
 */

import uiPkg from "@gradeui/ui/package.json";
import studioPkg from "@gradeui/studio/package.json";

/** Semver of `@gradeui/ui` currently linked into this app. */
export const GRADEUI_VERSION: string = uiPkg.version;

/** Semver of `@gradeui/studio` — the model-facing playbook package.
 *  Still `0.0.0` while the package is pre-release. */
export const STUDIO_VERSION: string = studioPkg.version;
