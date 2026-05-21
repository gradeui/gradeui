/**
 * Pure stage resolver for the Studio right-hand panel.
 *
 * The right panel adapts to where the user is in the workflow:
 *
 *   A → blank / trivial design — show reference-layout starter picker.
 *   B → design has content, nothing selected — show page-level
 *       structure controls (placeholder until Stage B ships).
 *   C → a non-layout DS component is selected — show the existing
 *       StudioSettingsPanel (Stage 3 of highlight-and-comment).
 *   D → a layout primitive is selected — same settings panel shell but
 *       with gap/cols/align/justify lifted to the top. Routed identically
 *       to C in v1; the lifting happens inside the settings panel.
 *
 * Routing logic must stay pure and serialisable — it's the boundary
 * between the design state machine and the panel UI. Side effects belong
 * in the components, not here.
 */

import type { StudioSelection } from "@/lib/chat-sandpack";
import { isLayoutPrimitiveName } from "./studio-layout-primitives";

export type RightPanelStage = "A" | "B" | "C" | "D";

export interface ResolveRightPanelStageArgs {
  /** The active design's current JSX source, or null/empty for a fresh slot. */
  appSource: string | null | undefined;
  /** Current selection (highlight-and-comment payload), or null. */
  selection: StudioSelection | null | undefined;
}

/**
 * Pick the active stage from `(appSource, selection)`. Pure — same input
 * always returns the same output. Easy to unit-test.
 *
 * Precedence:
 *   1. ANY actionable selection wins over everything else (Stage C/D).
 *      The user explicitly pointed at something; the panel should
 *      respond to that — even when the selected element is a plain
 *      intrinsic like `<h1>` / `<button>` that carries no DS
 *      componentName, just a `sourceId` + `tag`. The SelectionInspector
 *      itself is happy with either (its bail-out is
 *      `!(componentName && part) && !sourceId`); the resolver needs
 *      to mirror that so h1/h2/h3/button selections actually land on
 *      the inspector instead of falling through to Stage B's
 *      "nothing selected" view.
 *   2. Otherwise, an empty-or-trivial design routes to Stage A so the
 *      starter picker is visible.
 *   3. Anything else falls through to Stage B.
 *
 * "Actionable" means the SelectionInspector has something it can hang
 * controls on:
 *   - `componentName` — a DS-registered component (drives manifest /
 *     contract sections).
 *   - `sourceId` — a stamped JSX node, even if it's not a DS component
 *     (drives Layer Name + Text + Spacing controls for raw
 *     intrinsics).
 */
export function resolveRightPanelStage({
  appSource,
  selection,
}: ResolveRightPanelStageArgs): RightPanelStage {
  if (selection?.componentName) {
    return isLayoutPrimitiveName(selection.componentName) ? "D" : "C";
  }
  // No componentName, but a sourceId means it's a text-bearing
  // intrinsic (h1/h2/.../button/label/p/etc.) the user picked
  // directly. Route to C — the inspector handles intrinsics in the
  // same panel shell as DS components; no separate stage needed.
  if (selection?.sourceId) {
    return "C";
  }
  if (isEmptyDesign(appSource)) {
    return "A";
  }
  return "B";
}

/**
 * Heuristic: is this design effectively empty?
 *
 * Conservative on purpose — Stage A reappearing after the user has
 * already started shaping a screen would feel like the panel is
 * second-guessing them. So we only flag a design as "empty" when there
 * is genuinely no structural JSX to edit.
 *
 * Rules (any one is sufficient):
 *   1. `appSource` is null/undefined.
 *   2. `appSource` is whitespace-only.
 *   3. `appSource` has fewer than ~3 JSX opening tags AND none of those
 *      tags is a layout primitive. The token count alone would trip on
 *      a single `<AppShell>` with sparse children; combining it with the
 *      no-layout-primitive check covers the "user just started" case
 *      without stomping on a legitimate three-tag prototype.
 *
 * This is a regex pass on purpose — Stage A trigger sensitivity is more
 * important to keep cheap than to get exactly right; the worst failure
 * mode is "starters showed up when they shouldn't have", easily fixed by
 * the user typing once.
 */
export function isEmptyDesign(
  appSource: string | null | undefined,
): boolean {
  if (!appSource) return true;
  const trimmed = appSource.trim();
  if (trimmed.length === 0) return true;

  // Count opening tags. `<Foo` matches; closing tags `</Foo>` don't.
  // Fragment shorthand `<>` also doesn't count — we only care about
  // named components.
  const openTagMatches = trimmed.match(/<[A-Za-z][A-Za-z0-9.]*\b/g) ?? [];
  const openTagCount = openTagMatches.length;

  if (openTagCount === 0) return true;
  if (openTagCount >= 3) return false;

  // 1-2 tags. If any of them is a layout primitive (AppShell, Stack,
  // Row, Grid, Flex), treat the design as non-empty — the user has
  // committed to a shell already.
  const LAYOUT_TAG_PATTERN = /<(AppShell|Stack|Row|Grid|Flex)\b/;
  return !LAYOUT_TAG_PATTERN.test(trimmed);
}
