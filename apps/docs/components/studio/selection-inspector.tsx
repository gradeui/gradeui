"use client";

/**
 * SelectionInspector — Stage 3 of the highlight-and-comment feature.
 *
 * When the user clicks a DS component in the preview (so the selection
 * carries a `componentName` + `part`), this panel fetches the component's
 * prop manifest from /api/component-manifest and renders one control per
 * prop. Changing a control mutates the current App source directly via
 * `updateComponentProp` in lib/studio-source-mutator.ts — no LLM round-trip.
 *
 * Source mutation is deliberately scoped to the FIRST `<ComponentName>`
 * instance in the App source. See the docstring in
 * `lib/studio-source-mutator.ts` — one-instance-per-file is a known
 * limit of v1.
 *
 * Layout options: the panel can be rendered in two places, controlled by
 * the caller (page.tsx):
 *
 *   - `variant="inline"` — the original spot below the selection chip in
 *     the chat column. Compact, always visible when a DS component is
 *     selected.
 *   - `variant="docked"` — takes the whole right column. Used when the
 *     user wants the panel to have room to breathe (more props visible
 *     without scrolling, bigger controls). Replaces the theme builder
 *     temporarily.
 *
 * Both variants use the same internal rendering — only the outer shell
 * differs. The inline variant collapses by default so it doesn't crowd
 * the chat; the docked variant is always expanded.
 */

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as LucideIcons from "lucide-react";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Link as LinkIcon,
  Loader2,
  PanelBottom,
  PanelLeft,
  PanelRight,
  PanelRightClose,
  PanelTop,
  RotateCcw,
  Settings2,
  Unlink,
} from "lucide-react";
import { getComponentContract, Toggle } from "@gradeui/ui";
import type {
  ActionContract,
  ComponentContract,
} from "@gradeui/contracts";
import { contractToManifest } from "@/lib/contract-to-manifest";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  SelectionChainSegment,
  StudioSelection,
} from "@/lib/chat-sandpack";
import { injectSourceIds } from "@/lib/chat-sandpack";
import {
  findComponentOpenTag,
  findComponentOpenTagBySourceId,
  findElementChildren,
  isElementTextEditable,
  readComponentProp,
  updateComponentProp,
  updateElementText,
  type PropValue,
} from "@/lib/studio-source-mutator";
import {
  readDataArrayEntryField,
  updateDataArrayEntry,
  type SerialisableValue,
} from "@/lib/data-array-mutator";
import {
  FONT_SIZE_SCALE,
  FONT_WEIGHT_SCALE,
  GAP_SCALE,
  GRID_COLS_SCALE,
  MARGIN_SCALE,
  OPACITY_SCALE,
  PADDING_SCALE,
  RADIUS_SCALE,
  parseFontSize,
  parseFontWeight,
  parseGap,
  parseGridCols,
  parseMargin,
  parseMarginSides,
  parseOpacity,
  parsePadding,
  parsePaddingSides,
  parseRadius,
  setFontSize,
  setFontWeight,
  setGap,
  setGridCols,
  setMarginSides,
  setOpacity,
  setPaddingSides,
  setRadius,
  hasAnySide,
  sidesAreUniform,
  type FontSizeValue,
  type FontWeightValue,
  type RadiusValue,
  type SideValues,
} from "@/lib/tailwind-classes";
import {
  getSpacingCapabilities,
  hasAnyAppearanceCapability,
  hasAnyLayoutCapability,
} from "@/lib/spacing-capabilities";

// Shape returned by /api/component-manifest — sourced from
// `@gradeui/studio/playbook` which is now fs-free at runtime (sidecars are
// inlined into a TS string map at build time) so a client component can
// safely pull types from it without tripping the `fs` import.
import type {
  PropManifest as ManifestProp,
  ComponentManifest as Manifest,
} from "@gradeui/studio/playbook";

interface SelectionInspectorProps {
  /** Current preview selection — must have `componentName` + `part` for the
   *  panel to render meaningful controls. */
  selection: StudioSelection | null;
  /** The App.tsx source the preview is currently rendering. */
  appSource: string | null;
  /** Called with a new App.tsx source when a control changes. Parent should
   *  persist this into the per-design appSource map so Sandpack HMRs to it.
   *  The optional `label` parameter tags the resulting undo snapshot
   *  ("Change hint to poster", "Clear properties"). Older parents that
   *  don't read the label just ignore it. */
  onSourceChange: (next: string, label?: string) => void;
  /** Visual variant. `inline` (default) fits the chat column — collapsible,
   *  compact header. `docked` fills the right-column and is always expanded. */
  variant?: "inline" | "docked";
  /** Called when the user clicks the "Open in side panel" button in the inline
   *  variant. Parent can use this to promote the panel from the chat column
   *  to the right column (or vice-versa). Optional. */
  onRequestDock?: () => void;
  /** Called when the user clicks the close button in the docked variant to
   *  send the panel back to the chat column (and restore whatever lived in
   *  the right column — usually the theme builder). Optional. */
  onRequestUndock?: () => void;
  className?: string;
}

export function SelectionInspector({
  selection,
  appSource,
  onSourceChange,
  variant = "inline",
  onRequestDock,
  onRequestUndock,
  className,
}: SelectionInspectorProps) {
  const part = selection?.part;
  const componentName = selection?.componentName;

  // Contract-first: if the selected component has a typed contract
  // (Zod-based, see @gradeui/contracts), use it as the source of
  // truth for everything — props are filtered by `design` taxonomy
  // (no more `asChild` toggle on Stack), the panel renders action
  // buttons declared in `contract.actions`, and we skip the network
  // round-trip to /api/component-manifest entirely.
  // Components that haven't been migrated yet (most of them today)
  // continue to use the legacy manifest fetch.
  const contract = useMemo(
    () => getComponentContract(componentName ?? null),
    [componentName],
  );
  const contractManifest = useMemo(
    () => (contract ? contractToManifest(contract) : null),
    [contract],
  );

  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loadingPart, setLoadingPart] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Collapsed-by-default only in the inline variant. Docked is always open —
  // it's the whole point of being in a dedicated column.
  const [open, setOpen] = useState(variant !== "inline");

  // When variant switches docked ↔ inline, reset the collapsed state so the
  // docked variant is always visible and the inline variant starts collapsed
  // on the first selection of a new component.
  useEffect(() => {
    setOpen(variant !== "inline");
  }, [variant, part]);

  // Fetch the manifest for the selected component. Keyed by `part` so we
  // re-fetch on selection change but not on every appSource keystroke. We
  // don't aggressively cache on the client — the route sets a 30s
  // Cache-Control which is fine for this case.
  // Skipped entirely when a contract is available — `contractManifest`
  // covers the same surface synchronously, no network round-trip.
  useEffect(() => {
    if (!part || contract) {
      setManifest(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoadingPart(part);
    setError(null);
    fetch(`/api/component-manifest?part=${encodeURIComponent(part)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`manifest request failed (${r.status})`);
        return r.json();
      })
      .then((data: { manifest: Manifest[] }) => {
        if (cancelled) return;
        const found = data.manifest.find((m) => m.part === part);
        setManifest(found ?? null);
        setLoadingPart(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setManifest(null);
        setLoadingPart(null);
      });
    return () => {
      cancelled = true;
    };
  }, [part, contract]);

  // Effective manifest — contract-derived when present, network-fetched
  // otherwise. Downstream code reads `effectiveManifest` and doesn't
  // care which path produced it. The contract path always wins so even
  // a stale cached manifest from a previous selection can't override
  // the live contract.
  const effectiveManifest: Manifest | null = contractManifest ?? manifest;

  // Plumbing prop names that should NEVER reach the panel regardless
  // of where the manifest came from. Components with a contract have
  // these tagged `design: "plumbing"` already, so the contract path
  // filters them at the adapter. But components still on the legacy
  // `.md`-derived manifest path don't have that signal — and the .md
  // happily lists `asChild?: boolean`, which the manifest parser
  // turns into a perfectly serviceable Switch that nobody actually
  // wants to toggle in a design tool. This is the stopgap: blacklist
  // the universally-plumbing names by literal match. Once every
  // component has a contract, the list can be removed.
  const PLUMBING_PROP_NAMES = useMemo(
    () =>
      new Set<string>([
        "asChild",
        "className",
        "style",
        "id",
        "key",
        "ref",
        "tabIndex",
        // React event handlers — listing the common ones; the panel
        // wouldn't render most of them anyway because their kind is
        // "unknown", but `onClick?: () => void` etc. occasionally
        // gets misparsed and benefits from a belt-and-braces filter.
        "onClick",
        "onChange",
        "onSubmit",
        "onFocus",
        "onBlur",
        "onMouseEnter",
        "onMouseLeave",
        "onKeyDown",
        "onKeyUp",
      ]),
    [],
  );

  // Props the panel can actually render controls for. We drop kind "unknown"
  // (functions, object types, ReactNode) because there's no sensible UI for
  // them — the chat remains the escape hatch for those. Also drop known
  // plumbing prop names (see PLUMBING_PROP_NAMES above) so legacy-manifest
  // components don't surface `asChild` and friends.
  const settableProps = useMemo(() => {
    if (!effectiveManifest) return [] as ManifestProp[];
    return effectiveManifest.props.filter(
      (p) => p.kind !== "unknown" && !PLUMBING_PROP_NAMES.has(p.name),
    );
  }, [effectiveManifest, PLUMBING_PROP_NAMES]);

  // Layout-related prop names — pulled to the top of the inspector so
  // the most-frequently-touched controls (gap, align, justify, padding,
  // margin) are first. Everything else (variant, size, intent, content
  // strings, …) goes into the "Properties" group below. Match is
  // case-insensitive so a manifest typo or differing convention
  // (`columns` vs `cols`) still groups correctly.
  const LAYOUT_PROP_NAMES = useMemo(
    () =>
      new Set([
        "gap",
        "padding",
        "p",
        "margin",
        "m",
        "align",
        "justify",
        "wrap",
        "cols",
        "columns",
        "gridcols",
        "rounded",
        "radius",
      ]),
    [],
  );
  const layoutProps = useMemo(
    () =>
      settableProps.filter((p) => LAYOUT_PROP_NAMES.has(p.name.toLowerCase())),
    [settableProps, LAYOUT_PROP_NAMES],
  );
  const otherProps = useMemo(
    () =>
      settableProps.filter((p) => !LAYOUT_PROP_NAMES.has(p.name.toLowerCase())),
    [settableProps, LAYOUT_PROP_NAMES],
  );

  // Does the current App source actually contain this component? If not,
  // mutations would silently no-op — surface that to the user rather than
  // leaving them wondering why the Switch doesn't do anything.
  //
  // Critical detail: the stored `appSource` does NOT carry the
  // `data-gds-source-id="..."` attributes the iframe renders with.
  // Those are minted at render time by `injectSourceIds` inside the
  // `prepareAppSource` pipeline. If we probe the raw stored source,
  // the sourceId branch ALWAYS returns null and `componentPresent`
  // is false for every selection — which is what makes the amber
  // "not in source" banner show up everywhere.
  //
  // The mutators (updateComponentProp, etc.) already handle this:
  // they call `injectSourceIds` themselves before searching. Mirror
  // that here. The pass is idempotent + deterministic, so the same
  // node always gets the same id; the iframe's `data-gds-source-id`
  // and this in-memory id agree.
  const componentPresent = useMemo(() => {
    if (!appSource) return false;
    const ensured = injectSourceIds(appSource);
    // Prefer source-id lookup — robust to compound JSX names like
    // `<Sortable.Group>` where `componentName` (derived from
    // `data-gds-part` → kebabToPascal → "SortableGroup") wouldn't
    // match the source's dotted form. The id-based lookup walks
    // every PascalCase opening tag and matches on the stamped id,
    // so it doesn't care what the component is literally called.
    if (selection?.sourceId) {
      if (
        findComponentOpenTagBySourceId(ensured, selection.sourceId) !== null
      ) {
        return true;
      }
      // Fall through to name-based lookup — the sourceId miss can
      // happen if injection didn't stamp this fragment for some
      // reason (chat-generated JSX that arrived while injection
      // was disabled, etc.). The name match is the safety net
      // before we declare the component absent.
    }
    if (!componentName) return false;
    return findComponentOpenTag(ensured, componentName) !== null;
  }, [appSource, componentName, selection?.sourceId]);

  // Render whenever the selection carries SOMETHING actionable: a
  // DS component (componentName + part — drives the manifest +
  // contract sections) OR just a source-id (raw <div> etc. — drives
  // the Spacing & layout group via Tailwind class parsing). Bail
  // only when neither is present (e.g. a click on a non-instrumented
  // element or before injection has run).
  if ((!componentName || !part) && !selection?.sourceId) return null;

  // Routing rule for prop edits:
  //
  //   * "content" / "structured" props (per-item — alt, src, source) →
  //     mutate the data-array entry whose `id` matches the selection's
  //     `instanceId`. Only THAT row of the .map() is affected.
  //
  //   * "knob" props (template-wide — hint, aspect, radius, border) →
  //     mutate the JSX `<MediaSurface>` tag itself. Affects every
  //     rendered instance because they all come from the same template.
  //     The panel UI surfaces this as "Editing N items together" so the
  //     bulk semantic isn't a surprise.
  //
  //   * No contract for this component → fall back to the legacy
  //     `updateComponentProp` path (template-wide). Migration plan:
  //     each component gets a contract and the data-array path
  //     becomes its primary editor.
  //
  // Helper that figures out which path a given prop should take.
  type PropDesign = "knob" | "content" | "structured" | "plumbing" | "event" | "ref";
  const propDesignByName = useMemo<Record<string, PropDesign>>(() => {
    if (!contract) return {};
    const out: Record<string, PropDesign> = {};
    for (const [name, prop] of Object.entries(contract.props)) {
      out[name] = prop.design;
    }
    return out;
  }, [contract]);

  const handleChange = (propName: string, value: PropValue) => {
    if (appSource == null) return;
    if (!componentName) return;
    const design = propDesignByName[propName];
    const wantsPerItem = design === "content" || design === "structured";
    const instanceId = selection?.instanceId;

    // Short human label for the undo snapshot — captures the prop and
    // the new value so "Undo Change hint to poster" reads naturally in
    // the tooltip. Falls back to "Edit <propName>" for non-scalar
    // values where stringifying gets noisy.
    const literalPreview = describePropChange(propName, value);

    if (wantsPerItem && instanceId) {
      // Per-item via data-array mutation. Coerce PropValue to the
      // serialisable shape the mutator expects — PropValue is { kind,
      // value? } from the legacy path; we extract the actual literal
      // and pass it through. `null`/`undefined` value means "clear",
      // which removes the field from the entry so the JSX's `??`
      // fallback restores the default render.
      const literal = propValueToLiteral(value);
      const result = updateDataArrayEntry(
        appSource,
        instanceId,
        propName,
        literal,
      );
      if (result.ok && result.jsx && result.jsx !== appSource) {
        onSourceChange(result.jsx, literalPreview);
        return;
      }
      // No matching entry — fall through to template-wide mutation.
      // Common for components that aren't rendered through a data
      // array; happens to MediaSurface only if instanceId got lost.
    }

    // Template-wide (knob) or no-contract fallback.
    // Pass the source-id captured by the selection agent so mutating
    // "this Stack" targets the exact JSX node the user clicked, even
    // when it lives inside a `.map()` loop where many DOM nodes share
    // one source node. Falls back to first-instance when the
    // selection doesn't carry a sourceId (e.g. non-DS clicks).
    const next = updateComponentProp(
      appSource,
      componentName,
      propName,
      value,
      selection?.sourceId
    );
    if (next !== appSource) onSourceChange(next, literalPreview);
  };

  // ─── Reset ────────────────────────────────────────────────────
  // Clear every settable prop on the selected component / instance.
  // The undo snapshot is tagged "Reset properties" so the tooltip
  // reflects the bulk nature of the action.
  const handleReset = () => {
    if (!appSource) return;
    if (!componentName) return;
    const instanceId = selection?.instanceId;
    let next = appSource;
    for (const prop of settableProps) {
      const design = propDesignByName[prop.name];
      const wantsPerItem = design === "content" || design === "structured";
      if (wantsPerItem && instanceId) {
        const result = updateDataArrayEntry(
          next,
          instanceId,
          prop.name,
          undefined,
        );
        if (result.ok && result.jsx) next = result.jsx;
        continue;
      }
      next = updateComponentProp(
        next,
        componentName,
        prop.name,
        null,
        selection?.sourceId
      );
    }
    if (next !== appSource) onSourceChange(next, "Reset properties");
  };

  const headerBadge = (
    <span className="font-mono text-[11px] text-primary">
      &lt;{componentName}&gt;
    </span>
  );

  // Shell picks between the two variants. Body is the same.
  const body = (
    <>
      {/* Layer Name — user-supplied label for this node. Writes
          `data-gds-name` onto the JSX so it persists, reads back
          into the canvas path bar (which prefers data-gds-name over
          componentName) and any future tree views. Empty input
          means "use the default" — the path bar will fall back to
          the component name. */}
      {selection?.sourceId && appSource && (
        <LayerNameRow
          source={appSource}
          sourceId={selection.sourceId}
          componentName={selection.componentName ?? selection.tag}
          disabled={!componentPresent}
          onChange={(nextName) => {
            // Empty string clears the attribute; the mutator's null
            // path strips the prop entirely, restoring default-
            // label behavior in the path bar.
            const value = nextName.trim();
            const next = updateComponentProp(
              appSource,
              selection.componentName ?? selection.tag,
              "data-gds-name",
              value || null,
              selection.sourceId
            );
            if (next !== appSource) {
              onSourceChange(next, value ? `Name layer "${value}"` : "Clear layer name");
            }
          }}
        />
      )}

      {/* ============================================================
          PROPERTIES group — component-specific manifest props that
          are NOT layout-related (variant, size, intent, disabled,
          content strings, structured slots…). Sits right under
          Layer Name so the most "this is what the component IS"
          knobs are immediately visible. Layout-related manifest
          props (gap/align/justify/wrap/cols) live in the Layout
          group below, NOT here — keeps the mental model clean:
          Properties = what it is, Layout = how it sits.
          ============================================================ */}
      {otherProps.length > 0 && (
        <div className={cn("space-y-2.5", variant === "docked" && "space-y-3")}>
          <GroupHeader title="Properties" />
          {otherProps.map((prop) => {
            const design = propDesignByName[prop.name];
            const perItem =
              (design === "content" || design === "structured") &&
              Boolean(selection?.instanceId);
            return (
              <PropControl
                // Include both instanceId AND sourceId in the key
                // so switching between same-component clicks (Stack #1
                // → Stack #2) fully remounts the control. Without the
                // id, LiveInput's local draft state would persist
                // from the previous selection and the field would
                // appear "stuck" on the first Stack's value.
                key={`${prop.name}::${perItem ? selection?.instanceId : `src#${selection?.sourceId ?? "?"}`}`}
                prop={prop}
                source={appSource}
                componentName={componentName ?? ""}
                instanceId={perItem ? selection?.instanceId : undefined}
                sourceId={selection?.sourceId}
                disabled={!componentPresent}
                onChange={handleChange}
              />
            );
          })}
        </div>
      )}

      {/* Text content — sits below Properties. For Button it's the
          label; for h1–h6 it's the heading; for label/p/span it's
          the body text. Children with nested JSX or expressions
          are skipped (the row hides itself); the chat is still the
          escape hatch for those. No section header on purpose —
          it's a single field, not a group. */}
      {selection?.sourceId && appSource && (
        <TextEditRow
          source={appSource}
          sourceId={selection.sourceId}
          disabled={!componentPresent}
          onChange={(next) => {
            const updated = updateElementText(
              appSource,
              selection.sourceId!,
              next
            );
            if (updated !== appSource) {
              onSourceChange(updated, `Edit text`);
            }
          }}
        />
      )}

      {!componentPresent && appSource && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            <code className="font-mono">&lt;{componentName}&gt;</code> isn&rsquo;t
            in the current source — regenerate it via chat first, then these
            controls will mutate it in place.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-soft p-2 text-[11px] text-destructive-deep">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            Couldn&rsquo;t load settings: {error}. Use the chat to edit this
            component instead.
          </span>
        </div>
      )}

      {effectiveManifest && settableProps.length === 0 && !error && !contract?.actions && (
        <p className="text-[11px] text-muted-foreground">
          No quick controls for this component. Use the chat to edit it.
        </p>
      )}

      {/* ============================================================
          LAYOUT group — spatial knobs. Contains:
            1. Contract layout props (manifest's gap, align, justify,
               wrap, cols) via PropControl.
            2. Tailwind Layout controls (padding, margin, gap,
               grid-cols) via LayoutGroup. Contract owns the family
               → Tailwind row hides.
          The group renders a single header at the top via LayoutGroup.
          When only manifest layoutProps exist (no Tailwind classes),
          we render our own header so the section still reads as
          "Layout" rather than nameless rows.
          ============================================================ */}
      {(layoutProps.length > 0 || selection?.sourceId !== undefined) && (
        <div className={cn("space-y-2.5", variant === "docked" && "space-y-3")}>
          {layoutProps.length > 0 && (
            <>
              <GroupHeader title="Layout" />
              {layoutProps.map((prop) => {
                const design = propDesignByName[prop.name];
                const perItem =
                  (design === "content" || design === "structured") &&
                  Boolean(selection?.instanceId);
                return (
                  <PropControl
                    key={`${prop.name}::${perItem ? selection?.instanceId : `src#${selection?.sourceId ?? "?"}`}`}
                    prop={prop}
                    source={appSource}
                    componentName={componentName ?? ""}
                    instanceId={perItem ? selection?.instanceId : undefined}
                    sourceId={selection?.sourceId}
                    disabled={!componentPresent}
                    onChange={handleChange}
                  />
                );
              })}
            </>
          )}
          {selection?.sourceId !== undefined && (
            <LayoutGroup
              source={appSource}
              componentName={componentName ?? selection.tag}
              // Pass the raw tag alongside componentName so the
              // capability resolver inside LayoutGroup can see BOTH
              // the DS name (when present) and the underlying
              // intrinsic — needed for cases like `<Button>` which
              // renders a `<button>` tag, or `<h1>` which has no
              // componentName at all.
              tag={selection.tag}
              sourceId={selection?.sourceId}
              disabled={false}
              // Names of structured props the component's contract
              // already exposes. The Layout group hides the Tailwind
              // family for any name it sees here — so Row's `gap`
              // prop remains the canonical control.
              manifestPropNames={
                new Set(settableProps.map((p) => p.name.toLowerCase()))
              }
              onChangeClassName={(next) => {
                if (appSource == null || !componentName) return;
                const updated = updateComponentProp(
                  appSource,
                  componentName,
                  "className",
                  next,
                  selection?.sourceId
                );
                if (updated !== appSource) {
                  onSourceChange(updated, `Set className`);
                }
              }}
            />
          )}
        </div>
      )}

      {/* ============================================================
          APPEARANCE group — visual-feel knobs that aren't fill/
          stroke/effects. Currently Opacity + Border Radius. Self-
          hides for elements where neither applies (e.g. AppShell
          chrome). Fill / Stroke / Effects each get their own group
          when they land.
          ============================================================ */}
      {selection?.sourceId !== undefined && (
        <AppearanceGroup
          source={appSource}
          componentName={componentName ?? selection.tag}
          tag={selection.tag}
          sourceId={selection?.sourceId}
          disabled={!componentPresent}
          manifestPropNames={
            new Set(settableProps.map((p) => p.name.toLowerCase()))
          }
          onChangeClassName={(next) => {
            // CRITICAL: fall back to selection.tag — not just
            // componentName — so writes work for raw intrinsics
            // like <h1>/<p>/<span> that carry no data-gds-part
            // (componentName is undefined for them). Without this
            // fallback the write silently no-ops and the picked
            // opacity / radius never lands. updateComponentProp
            // accepts lowercase tag names (see task #76).
            if (!appSource) return;
            const target = componentName ?? selection?.tag;
            if (!target) return;
            const updated = updateComponentProp(
              appSource,
              target,
              "className",
              next,
              selection?.sourceId,
            );
            if (updated !== appSource) {
              onSourceChange(updated, `Set className`);
            }
          }}
        />
      )}

      {/* className override — global escape hatch, lives below every
          structured group. Captures responsive/state/arbitrary
          tokens the structured controls don't model. */}
      {selection?.sourceId !== undefined && appSource && (
        <ClassNameOverride
          source={appSource}
          componentName={componentName ?? selection.tag}
          sourceId={selection?.sourceId}
          disabled={!componentPresent}
          onChangeClassName={(next) => {
            if (!appSource) return;
            const target = componentName ?? selection?.tag;
            if (!target) return;
            const updated = updateComponentProp(
              appSource,
              target,
              "className",
              next,
              selection?.sourceId,
            );
            if (updated !== appSource) {
              onSourceChange(updated, `Set className`);
            }
          }}
        />
      )}

      {settableProps.length > 0 && componentPresent && (
        <button
          type="button"
          onClick={handleReset}
          className={cn(
            "flex items-center gap-1 self-start rounded-md border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors",
          )}
          title="Remove all panel-controllable attributes from the component"
        >
          <RotateCcw className="h-3 w-3" />
          Reset to defaults
        </button>
      )}

      {/* Contract-declared actions. Imperative things the user can DO with
          this component, distinct from prop edits. MediaSurface exposes
          "Fill image" + "Refresh" — the canvas listens for the dispatched
          `grade:component-action` event and runs the appropriate handler
          (resolve via the free providers, cache-bust + re-resolve, etc.). */}
      {contract?.actions && Object.keys(contract.actions).length > 0 && (
        <ActionsRow
          actions={contract.actions}
          componentName={contract.name}
          selection={selection}
          appSource={appSource}
        />
      )}
    </>
  );

  if (variant === "docked") {
    return (
      <div
        className={cn(
          "flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-3 overflow-y-auto",
          className
        )}
        data-gds-part="selection-inspector"
      >
        {/* Header — title + status badge only. The Settings2 icon
            was dropped (Nov 2026) because the inspector lives in a
            tabbed shell whose own tab label already says "Layout",
            and the in-panel icon was just visual noise. The
            verbose `when_to_use` paragraph below was removed too —
            see comment below. */}
        <header className="flex items-center gap-2 text-sm border-b border-border pb-2">
          <span className="font-semibold">Component settings</span>
          {headerBadge}
          {loadingPart === part && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
          {onRequestUndock && (
            <button
              type="button"
              onClick={onRequestUndock}
              title="Return to chat column and show the theme builder here again"
              className="ml-auto flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <PanelRightClose className="h-3 w-3" />
              Undock
            </button>
          )}
        </header>
        {/* `when_to_use` was a verbose component description pulled
            from the .md sidecar — useful for the docs site but just
            chrome inside the inspector, where the user already knows
            what they selected. Dropped Nov 2026. The text still
            powers the docs pages and the model's system prompt; only
            the inspector display is gone. */}
        {body}
      </div>
    );
  }

  // Inline variant — collapsible.
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-card/60 p-2.5",
        className
      )}
      data-gds-part="selection-inspector"
    >
      <header className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left hover:text-foreground transition-colors"
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">Settings</span>
          {headerBadge}
          {settableProps.length > 0 && (
            <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">
              {settableProps.length}
            </span>
          )}
        </button>
        {loadingPart === part && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        )}
        {onRequestDock && open && (
          <button
            type="button"
            onClick={onRequestDock}
            className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            title="Move settings to the side panel for more room"
          >
            Dock →
          </button>
        )}
      </header>

      {open && <div className="flex flex-col gap-2.5 pt-1">{body}</div>}
    </div>
  );
}

/**
 * One row per prop. Pattern-matches on `prop.kind` to pick the control.
 * Reads the current value out of `source` on every render so changes made
 * via the chat (regenerating the whole component) flow back into the
 * control immediately.
 *
 * Inputs (string + number) use a local draft state that syncs to the
 * source only on `onChange` via requestAnimationFrame-debounced commits.
 * This keeps typing snappy without throwing away intermediate keystrokes.
 */

/**
 * Layer Name field — user-supplied label for the selected node.
 * Reads/writes `data-gds-name` on the JSX so it persists and is
 * picked up by the canvas path bar (which prefers user names over
 * component names). Empty value clears the attribute.
 *
 * Placeholder shows the default label (componentName) so the user
 * can see what the path bar would fall back to without committing
 * to anything. Commits on blur and on Enter; local draft prevents
 * each keystroke from re-rewriting the JSX.
 */
function LayerNameRow({
  source,
  sourceId,
  componentName,
  disabled,
  onChange,
}: {
  source: string;
  sourceId: string;
  componentName: string;
  disabled?: boolean;
  onChange: (next: string) => void;
}) {
  const currentName = useMemo(() => {
    const read = readComponentProp(source, componentName, "data-gds-name", sourceId);
    return read?.kind === "string" ? read.value : "";
  }, [source, sourceId, componentName]);

  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(null);
  }, [sourceId]);

  const liveValue = draft ?? currentName;

  return (
    <div className="space-y-1">
      <Label htmlFor="layer-name" className="text-xs font-medium">
        Layer name
      </Label>
      <Input
        id="layer-name"
        ref={inputRef}
        size="sm"
        value={liveValue}
        placeholder={componentName}
        onChange={(e) => setDraft(e.currentTarget.value)}
        onBlur={() => {
          if (draft !== null && draft !== currentName) onChange(draft);
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            inputRef.current?.blur();
          }
        }}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * Compact ancestor breadcrumb — addresses "deeply-nested Stacks
 * are hard to click individually" by giving the user a one-click
 * way to walk UP the tree. Pinned at the top of the inspector.
 *
 * Visual shape (current is last, non-clickable; parent + grandparent
 * are clickable; everything above collapses to `…` when chain > 4):
 *
 *   AppShellMain[12] › … › Row[35] › Stack[36] › h1[42]
 *
 * Clicking a clickable segment dispatches a `grade:select-by-
 * source-id` postMessage at the focused iframe — the in-iframe
 * selection agent re-runs its standard heuristics on the matching
 * element and emits a fresh selection back, which the inspector
 * re-renders against. No round-trip through the source mutator.
 *
 * The `…` button (when present) jumps to the topmost in-shell
 * ancestor (chain[0]) — usually AppShellMain — letting the user
 * pop all the way out of a deep nesting in one click. Tooltip
 * lists the segments it skips so it isn't a black box.
 */
function SelectionBreadcrumb({
  chain,
}: {
  chain: SelectionChainSegment[];
}) {
  if (chain.length === 0) return null;
  const current = chain[chain.length - 1];
  // Ancestors are everything BUT the current selection.
  const ancestors = chain.slice(0, -1);
  // Compact mode: when there are more than 3 ancestors, show:
  //   topmost › … › grandparent › parent › current
  // The `…` keeps the bar at a stable visual width while still
  // letting the user reach into the middle (its tooltip enumerates
  // what it hides, and clicking it jumps to that middle ancestor).
  // Up to 3 ancestors: render the whole chain inline.
  const COMPACT_THRESHOLD = 3;
  let leadingAncestor: SelectionChainSegment | null = null;
  let collapsedAncestors: SelectionChainSegment[] = [];
  let tailAncestors: SelectionChainSegment[] = ancestors;
  if (ancestors.length > COMPACT_THRESHOLD) {
    leadingAncestor = ancestors[0];
    tailAncestors = ancestors.slice(-2);
    collapsedAncestors = ancestors.slice(1, -2);
  }
  const collapsedTooltip = collapsedAncestors
    .map((seg) => labelFor(seg))
    .join(" › ");
  // The `…` jumps to the deepest collapsed ancestor — one step
  // closer to the current selection — so a click feels like
  // "walk up partway" rather than "teleport to the root."
  const collapsedJumpTarget =
    collapsedAncestors.length > 0
      ? collapsedAncestors[collapsedAncestors.length - 1]
      : null;

  function selectSegment(sourceId: string) {
    // Direct post to the focused iframe — same path the canvas's
    // postToFocusedIframe uses. We avoid prop-drilling a callback
    // by relying on the `data-grade-focused-frame` contract.
    if (typeof window === "undefined") return;
    const container = document.querySelector<HTMLElement>(
      "[data-grade-focused-frame]"
    );
    const iframe = container?.querySelector("iframe");
    const win = iframe?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: "grade:select-by-source-id", id: sourceId }, "*");
    } catch {
      /* iframe gone — selection will refresh on next user click */
    }
  }

  return (
    <nav
      aria-label="Selection breadcrumb"
      className="flex items-center gap-0.5 flex-wrap text-[10px] text-muted-foreground"
    >
      {leadingAncestor && (
        <>
          <BreadcrumbButton
            label={labelFor(leadingAncestor)}
            title={`Select ${labelFor(leadingAncestor)}`}
            onClick={() => selectSegment(leadingAncestor!.sourceId)}
          />
          <ChevronRight className="h-2.5 w-2.5 shrink-0 opacity-60" />
        </>
      )}
      {collapsedJumpTarget && (
        <>
          <BreadcrumbButton
            label="…"
            title={`Jump to ${labelFor(collapsedJumpTarget)} — also skips: ${collapsedTooltip}`}
            onClick={() => selectSegment(collapsedJumpTarget.sourceId)}
          />
          <ChevronRight className="h-2.5 w-2.5 shrink-0 opacity-60" />
        </>
      )}
      {tailAncestors.map((seg, i) => (
        <React.Fragment key={`${seg.sourceId}::${i}`}>
          <BreadcrumbButton
            label={labelFor(seg)}
            title={`Select ${labelFor(seg)}`}
            onClick={() => selectSegment(seg.sourceId)}
          />
          <ChevronRight className="h-2.5 w-2.5 shrink-0 opacity-60" />
        </React.Fragment>
      ))}
      <span
        className="rounded px-1.5 py-0.5 bg-[oklch(var(--studio-accent,_0.62_0.18_264)/0.12)] text-[oklch(var(--studio-accent,_0.62_0.18_264))] font-mono"
        title="Current selection"
      >
        {labelFor(current)}
      </span>
    </nav>
  );
}

function BreadcrumbButton({
  label,
  title,
  onClick,
}: {
  label: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "rounded px-1.5 py-0.5 font-mono text-[10px]",
        "text-muted-foreground hover:text-foreground",
        "hover:bg-muted transition-colors",
      )}
    >
      {label}
    </button>
  );
}

/**
 * Format a chain segment as `ComponentName[12]` (or `tag[12]`
 * when there's no DS component name). Source id is small + muted
 * inline so users can disambiguate sibling rows without it
 * dominating the label.
 */
function labelFor(seg: {
  sourceId: string;
  tag: string;
  componentName?: string;
}): string {
  const name = seg.componentName || seg.tag;
  return `${name}[${seg.sourceId}]`;
}

/**
 * Plain-text content editor — renders whenever the selected JSX
 * element's children are a simple text node (no nested tags, no
 * `{expr}` interpolations). Covers the obvious cases: `<h1>Hello</h1>`,
 * `<Button>Save</Button>`, `<p>Some copy</p>`. The row hides itself
 * for elements whose children carry structure — the chat remains the
 * escape hatch for those.
 *
 * Local draft state so the user can type without each keystroke
 * re-running the JSX rewrite; commits on blur. Resyncs to the
 * underlying source when focus isn't here (so a chat regen / undo
 * flows back into the input cleanly).
 */
function TextEditRow({
  source,
  sourceId,
  disabled,
  onChange,
}: {
  source: string;
  sourceId: string;
  disabled?: boolean;
  onChange: (nextText: string) => void;
}) {
  const editable = isElementTextEditable(source, sourceId);
  // Read the verbatim children string. `findElementChildren` returns
  // it including any surrounding whitespace — trim for the input so
  // newlines/leading-spaces in the source don't show as awkward
  // caret artifacts. The whitespace is restored at commit time by
  // `updateElementText` writing the user's new value verbatim, which
  // is the right call: if the source had `<h1>Hello</h1>` we put
  // `Hello` in the input and write `Hello`/whatever-the-user-types
  // back without sneaking in newlines.
  const currentText = useMemo(() => {
    if (!editable) return "";
    const children = findElementChildren(source, sourceId);
    return children ? children.value : "";
  }, [editable, source, sourceId]);

  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Debounce timer for live commits. Each keystroke schedules a
  // 250ms commit; subsequent keystrokes cancel + reschedule. The
  // canvas re-renders ~once per typing pause rather than once per
  // character — feels live without thrashing the iframe HMR. Enter
  // and blur flush immediately so the commit isn't gated on the
  // timer when the user is "done".
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hold the latest onChange in a ref so the debounced flush always
  // calls the current closure (avoids stale-closure bugs when the
  // parent's onChange identity shifts between renders — common when
  // the parent inlines an arrow function).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Keep a ref to currentText too, so the flush can compare against
  // the live source without depending on `currentText` being in the
  // setTimeout's closure (which would re-create the timer every
  // render).
  const currentTextRef = useRef(currentText);
  useEffect(() => {
    currentTextRef.current = currentText;
  }, [currentText]);

  // Commit a pending value RIGHT NOW (cancel any pending timer
  // first). Called by Enter + blur, and by the unmount cleanup.
  const flush = (value: string | null) => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    if (value !== null && value !== currentTextRef.current) {
      onChangeRef.current(value);
    }
  };

  // Reset the local draft whenever the selection changes (different
  // sourceId) — otherwise the draft from a previous selection would
  // leak into the new element's input. Keying on sourceId is enough:
  // a chat regen that rewrites the same element keeps the same id and
  // we re-sync via the `currentText` read above. Also flush any
  // pending commit from the previous selection before swapping —
  // otherwise the timer fires later and writes the old draft into the
  // new element's source.
  useEffect(() => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    setDraft(null);
  }, [sourceId]);

  // Final flush on unmount — pending edits shouldn't vanish if the
  // inspector unmounts (selection cleared, panel closed, etc.).
  useEffect(() => {
    return () => {
      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
        // No flush here — we don't have the draft value in the
        // cleanup closure reliably. The blur path handles the
        // expected case; this just stops the timer firing post-
        // unmount which would warn about setState-after-unmount.
      }
    };
  }, []);

  if (!editable) return null;

  const liveValue = draft ?? currentText;

  return (
    <div className="space-y-1">
      <Label htmlFor="text-content" className="text-xs font-medium">
        Text
      </Label>
      <Input
        id="text-content"
        ref={inputRef}
        size="sm"
        value={liveValue}
        onChange={(e) => {
          const next = e.currentTarget.value;
          setDraft(next);
          // Schedule a live commit. Cancel any pending timer so
          // we only fire once per typing pause.
          if (commitTimerRef.current) {
            clearTimeout(commitTimerRef.current);
          }
          commitTimerRef.current = setTimeout(() => {
            commitTimerRef.current = null;
            if (next !== currentTextRef.current) {
              onChangeRef.current(next);
            }
          }, 250);
        }}
        onBlur={() => {
          // Flush whatever's in the draft (blur is the explicit
          // "done editing" signal — no reason to wait for the
          // debounce timer). Clear the draft so the input resyncs
          // to the live source.
          flush(draft);
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            // Flush immediately, THEN blur. Blur clears the draft
            // and rebinds liveValue to currentText.
            flush(draft);
            inputRef.current?.blur();
          }
        }}
        disabled={disabled}
        placeholder="(empty)"
      />
    </div>
  );
}

/**
 * "Spacing" group — Tailwind-class-driven controls that live outside
 * the component's structured manifest. v1: single Padding control
 * (all-sides `p-N`). Reads the current className via
 * `readComponentProp`, parses with `parsePadding`, and writes back
 * via `setPadding` → `updateComponentProp`. The wrapper is opt-in by
 * the inspector (it renders only when a DS component is selected),
 * not by the component itself — every DS primitive that accepts a
 * className gets these controls for free.
 *
 * Future expansion follows the same shape: add margin, gap, rounded,
 * text-size — each with its own parser/setter pair in
 * `lib/tailwind-classes.ts` and a select row here.
 */
/**
 * Section header — uppercase muted-tone label with optional right-
 * aligned hint. Used by every group (Properties, Layout, Appearance)
 * so the inspector reads as a coherent stack of labelled sections
 * rather than a soup of controls. The top border + padding give the
 * visual separator between groups.
 */
function GroupHeader({
  title,
  hint,
}: {
  title: string;
  hint?: React.ReactNode;
}) {
  return (
    // Sentence case — no uppercase, no wide tracking. Titles read
    // as labels ("Layout", "Appearance"), not shouted section
    // headings. House style across Studio.
    <div className="flex items-baseline justify-between gap-2 pt-2 border-t border-border/60">
      <h4 className="text-[11px] font-medium text-muted-foreground">
        {title}
      </h4>
      {hint}
    </div>
  );
}

/**
 * LayoutGroup — Tailwind-class-driven layout controls (padding,
 * margin, gap, grid-cols). Was previously the catch-all SpacingGroup;
 * Border Radius moved to AppearanceGroup, and the className override
 * moved to its own ClassNameOverride block that renders once at the
 * bottom of the inspector (the override is global, not Layout-
 * specific).
 *
 * Self-hiding: bails to null when no row applies — either because
 * the element type doesn't take any of these families, or because
 * every applicable family is already owned by a contract prop.
 */
function LayoutGroup({
  source,
  componentName,
  tag,
  sourceId,
  disabled,
  manifestPropNames,
  onChangeClassName,
}: {
  source: string | null;
  componentName: string;
  /** The underlying HTML tag (e.g. "h1", "button", "div"). Passed in
   *  alongside componentName so the capability resolver can classify
   *  text intrinsics correctly even when no DS componentName is set,
   *  and can downgrade `<Button>` to its button-like profile. */
  tag?: string;
  sourceId?: string;
  disabled?: boolean;
  /** Lowercased names of the structured props the component's
   *  contract already exposes. Used to suppress Tailwind family
   *  rows that the contract owns — keeps a single source of truth
   *  for any given semantic family. */
  manifestPropNames?: Set<string>;
  /** Receives the new className string; the parent splices it into
   *  the JSX via `updateComponentProp(..., "className", next, sourceId)`. */
  onChangeClassName: (nextClassName: string) => void;
}) {
  // What spacing controls actually make sense for this element type.
  // Text intrinsics get margin only; layout primitives drop grid-cols;
  // Grid keeps everything; AppShell drops margin/radius/grid-cols.
  // The full classification lives in lib/spacing-capabilities.ts.
  const caps = getSpacingCapabilities({ tag, componentName });

  // Per-family contract aliases: hide the Tailwind row whenever any
  // alias is in the manifest. This is the v1 dedup — when the
  // assistant emits `<Row gap="sm">`, the contract section above
  // shows the structured Gap control, and we don't render a second
  // (always-empty) Tailwind Gap dropdown in this section.
  const owns = (aliases: string[]) =>
    aliases.some((a) => manifestPropNames?.has(a) ?? false);
  const contractOwnsPadding = owns(["padding", "p"]);
  const contractOwnsMargin = owns(["margin", "m"]);
  const contractOwnsGap = owns(["gap"]);
  const contractOwnsGridCols = owns(["cols", "columns", "gridcols"]);
  const contractOwnsRadius = owns(["rounded", "radius"]);

  // A row renders only when it's BOTH applicable to the element type
  // AND not already represented by a structured contract prop. The
  // two filters compose: capability is the "does this make sense?"
  // filter; contract-ownership is the "is the structured control
  // already showing this above?" filter.
  const showPadding = caps.padding && !contractOwnsPadding;
  const showMargin = caps.margin && !contractOwnsMargin;
  const showGap = caps.gap && !contractOwnsGap;
  const showGridCols = caps.gridCols && !contractOwnsGridCols;
  const showRadius = caps.radius && !contractOwnsRadius;
  const currentClassName: string | null = (() => {
    if (!source) return null;
    const read = readComponentProp(source, componentName, "className", sourceId);
    return read?.kind === "string" ? read.value : null;
  })();
  // Padding + margin are per-side aware. Single-value families
  // (gap, grid-cols) still use the simple parsers + NumericSelectRow.
  const paddingSides = parsePaddingSides(currentClassName);
  const marginSides = parseMarginSides(currentClassName);
  const gap = parseGap(currentClassName);
  const gridCols = parseGridCols(currentClassName);

  // True when ANY structured control in this group has captured a
  // token — drives the small "Overrides theme defaults" hint next
  // to the group title.
  const anyOverride =
    hasAnySide(paddingSides) ||
    hasAnySide(marginSides) ||
    gap !== null ||
    gridCols !== null;

  // Self-hide when no row applies (e.g. media leaves whose only
  // applicable Layout capability is `margin`-but-contract-owned).
  const anyRowVisible =
    showPadding || showMargin || showGap || showGridCols;
  if (!anyRowVisible) return null;

  return (
    // Same tightened spacing as AppearanceGroup — see comment there.
    <div className="space-y-2">
      <GroupHeader
        title="Layout"
        hint={
          anyOverride ? (
            <span
              className="text-[11px] text-warning-deep leading-none"
              title="Structured values below override the component's theme defaults. Resetting them all to None restores theme behavior."
            >
              Overrides theme defaults
            </span>
          ) : null
        }
      />

      {showPadding && (
        <PerSideRow
          id="spacing-padding"
          label="Padding"
          tokenPrefix="p"
          scale={PADDING_SCALE}
          value={paddingSides}
          disabled={disabled}
          onValueChange={(next) =>
            onChangeClassName(setPaddingSides(currentClassName, next))
          }
        />
      )}
      {showMargin && (
        <PerSideRow
          id="spacing-margin"
          label="Margin"
          tokenPrefix="m"
          scale={MARGIN_SCALE}
          value={marginSides}
          disabled={disabled}
          onValueChange={(next) =>
            onChangeClassName(setMarginSides(currentClassName, next))
          }
        />
      )}
      {showGap && (
        <NumericSelectRow
          id="spacing-gap"
          label="Gap"
          tokenPrefix="gap"
          scale={GAP_SCALE}
          value={gap}
          disabled={disabled}
          onValueChange={(v) => onChangeClassName(setGap(currentClassName, v))}
        />
      )}
      {showGridCols && (
        <NumericSelectRow
          id="spacing-grid-cols"
          label="Grid columns"
          tokenPrefix="grid-cols"
          scale={GRID_COLS_SCALE}
          value={gridCols}
          disabled={disabled}
          onValueChange={(v) =>
            onChangeClassName(setGridCols(currentClassName, v))
          }
        />
      )}
    </div>
  );
}

/**
 * AppearanceGroup — visual-feel knobs that aren't fill/stroke/effects.
 * v1 holds Border Radius (moved out of the old SpacingGroup) and
 * Opacity. Fill / Stroke / Effects each get their own group when they
 * land — same shape as this one.
 *
 * Self-hides when nothing applies — text intrinsics that get neither
 * radius nor opacity won't render the section header at all.
 */
function AppearanceGroup({
  source,
  componentName,
  tag,
  sourceId,
  disabled,
  manifestPropNames,
  onChangeClassName,
}: {
  source: string | null;
  componentName: string;
  tag?: string;
  sourceId?: string;
  disabled?: boolean;
  manifestPropNames?: Set<string>;
  onChangeClassName: (nextClassName: string) => void;
}) {
  const caps = getSpacingCapabilities({ tag, componentName });
  const owns = (aliases: string[]) =>
    aliases.some((a) => manifestPropNames?.has(a) ?? false);
  const contractOwnsRadius = owns(["rounded", "radius"]);
  const contractOwnsOpacity = owns(["opacity"]);
  const contractOwnsFontWeight = owns(["weight", "fontweight", "font-weight"]);
  const contractOwnsFontSize = owns(["size", "fontsize", "font-size"]);
  const showRadius = caps.radius && !contractOwnsRadius;
  const showOpacity = caps.opacity && !contractOwnsOpacity;
  const showFontWeight = caps.fontWeight && !contractOwnsFontWeight;
  const showFontSize = caps.fontSize && !contractOwnsFontSize;

  const currentClassName: string | null = (() => {
    if (!source) return null;
    const read = readComponentProp(source, componentName, "className", sourceId);
    return read?.kind === "string" ? read.value : null;
  })();
  const radius = parseRadius(currentClassName);
  const opacity = parseOpacity(currentClassName);
  const fontWeight = parseFontWeight(currentClassName);
  const fontSize = parseFontSize(currentClassName);

  const anyOverride =
    radius !== null ||
    opacity !== null ||
    fontWeight !== null ||
    fontSize !== null;
  const anyRowVisible =
    showRadius || showOpacity || showFontWeight || showFontSize;
  if (!anyRowVisible) return null;

  return (
    // Tighter row stack than the default 3-unit gap. The Appearance
    // rows are small selects with their own internal label/control
    // spacing — at space-y-3 they read as four loose pages instead of
    // one coherent panel. space-y-2 brings them inside a single
    // perceptual block.
    <div className="space-y-2">
      <GroupHeader
        title="Appearance"
        hint={
          anyOverride ? (
            <span
              className="text-[11px] text-warning-deep leading-none"
              title="Structured values below override the component's theme defaults."
            >
              Overrides theme defaults
            </span>
          ) : null
        }
      />

      {/* Reading order inside Appearance: typography (size → weight)
          → whole-element knob (opacity) → corner treatment (radius).
          When the Typography group lands (leading, tracking, etc.)
          font-size + font-weight migrate there — the row bodies are
          simple Select rows that'll move with no changes. */}
      {showFontSize && (
        <div className="space-y-1">
          <Label htmlFor="appearance-font-size" className="text-xs font-medium">
            Font size
          </Label>
          <Select
            value={fontSize ?? "inherit"}
            onValueChange={(next) => {
              // "inherit" sentinel maps to null (strip family) —
              // matches the font-weight pattern. With no token set
              // the element inherits its size from parent / heading
              // semantics, which is exactly what designers expect
              // for h1-h6 by default.
              const v: FontSizeValue | null =
                next === "inherit" ? null : (next as FontSizeValue);
              onChangeClassName(setFontSize(currentClassName, v));
            }}
            disabled={disabled}
          >
            <SelectTrigger
              id="appearance-font-size"
              size="sm"
              className="w-full"
            >
              <SelectValue placeholder="Inherit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">Inherit</SelectItem>
              {FONT_SIZE_SCALE.map((s) => (
                // Plain label only. Rendering each option at its
                // actual rendered size makes the dropdown look
                // chaotic (5xl item dwarfs xs item) — dropdowns
                // shouldn't convey style, just the value name.
                <SelectItem key={s} value={s}>
                  text-{s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {showFontWeight && (
        <div className="space-y-1">
          <Label htmlFor="appearance-font-weight" className="text-xs font-medium">
            Font weight
          </Label>
          <Select
            value={fontWeight ?? "inherit"}
            onValueChange={(next) => {
              // "inherit" sentinel maps to null → setter strips
              // every font-weight token, leaving the element to
              // pick up weight from its parent / CSS defaults.
              // "Inherit" reads better than "None" here because
              // there's no zero-weight; absence of token = inherit.
              const v: FontWeightValue | null =
                next === "inherit" ? null : (next as FontWeightValue);
              onChangeClassName(setFontWeight(currentClassName, v));
            }}
            disabled={disabled}
          >
            <SelectTrigger
              id="appearance-font-weight"
              size="sm"
              className="w-full"
            >
              <SelectValue placeholder="Inherit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">Inherit</SelectItem>
              {FONT_WEIGHT_SCALE.map((w) => (
                // Plain label only — see the font-size row above
                // for the same call. Dropdowns shouldn't convey
                // style, just the value name.
                <SelectItem key={w} value={w}>
                  font-{w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {showOpacity && (
        <NumericSelectRow
          id="appearance-opacity"
          label="Opacity"
          tokenPrefix="opacity"
          scale={OPACITY_SCALE}
          value={opacity}
          disabled={disabled}
          // No token = visually 100% opaque; show that in the
          // dropdown rather than the misleading "None".
          noneLabel="100%"
          onValueChange={(v) =>
            onChangeClassName(setOpacity(currentClassName, v))
          }
        />
      )}

      {showRadius && (
        <div className="space-y-1">
          <Label htmlFor="appearance-radius" className="text-xs font-medium">
            Border radius
          </Label>
          <Select
            value={radius === null ? "none-set" : radius === "" ? "default" : radius}
            onValueChange={(next) => {
              const v: RadiusValue | null =
                next === "none-set"
                  ? null
                  : next === "default"
                    ? ""
                    : (next as RadiusValue);
              onChangeClassName(setRadius(currentClassName, v));
            }}
            disabled={disabled}
          >
            <SelectTrigger
              id="appearance-radius"
              size="sm"
              className="w-full"
            >
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none-set">None</SelectItem>
              {RADIUS_SCALE.map((r) => (
                <SelectItem
                  key={r || "default"}
                  value={r === "" ? "default" : r}
                >
                  {r === "" ? "rounded" : `rounded-${r}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

/**
 * ClassNameOverride — global escape hatch for anything the structured
 * controls don't model. Renders once per inspector at the bottom, not
 * inside any specific group, because className lives across families
 * (a `md:p-6 hover:bg-muted ring-2 ring-primary` mix touches Layout,
 * Fill, Stroke and Effects all at once). Local draft state so the
 * user can type without rewriting JSX on every keystroke; commits
 * on blur.
 */
function ClassNameOverride({
  source,
  componentName,
  sourceId,
  disabled,
  onChangeClassName,
}: {
  source: string | null;
  componentName: string;
  sourceId?: string;
  disabled?: boolean;
  onChangeClassName: (nextClassName: string) => void;
}) {
  const currentClassName: string | null = (() => {
    if (!source) return null;
    const read = readComponentProp(source, componentName, "className", sourceId);
    return read?.kind === "string" ? read.value : null;
  })();
  const [draft, setDraft] = useState<string | null>(null);
  const liveValue = draft ?? currentClassName ?? "";
  return (
    <div className="space-y-1 pt-2 border-t border-border/60">
      <Label htmlFor="classname-override" className="text-xs font-medium">
        className override
      </Label>
      <Input
        id="classname-override"
        size="sm"
        value={liveValue}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null && draft !== currentClassName) {
            onChangeClassName(draft);
          }
          setDraft(null);
        }}
        placeholder="e.g. md:p-6 hover:bg-muted"
        disabled={disabled}
        className="font-mono"
      />
      <p className="text-[10px] text-muted-foreground leading-snug">
        Edit the full className verbatim. Anything the structured
        controls above don't recognise (responsive variants, hover
        states, arbitrary values) is preserved here.
      </p>
    </div>
  );
}

/**
 * Numeric-scale select row — used for padding / margin / gap /
 * grid-cols. Renders a Tailwind token preview like "p-4" in the
 * options so the user sees the literal that will land in the JSX.
 */
function NumericSelectRow({
  id,
  label,
  tokenPrefix,
  scale,
  value,
  disabled,
  noneLabel = "None",
  onValueChange,
}: {
  id: string;
  label: string;
  tokenPrefix: string;
  scale: readonly number[];
  value: number | null;
  disabled?: boolean;
  /** Label for the "no token set" choice. Defaults to "None" — gap
   *  and grid-cols use that because 0 and "None" are visually
   *  distinct (gap-0 vs no gap class still differ in flex layouts).
   *  Opacity passes "100%" instead, because no token visually equals
   *  fully opaque — users expect to see the rendered state, not the
   *  storage state. */
  noneLabel?: string;
  onValueChange: (next: number | null) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
      </Label>
      <Select
        value={value === null ? "none" : String(value)}
        onValueChange={(next) =>
          onValueChange(next === "none" ? null : Number(next))
        }
        disabled={disabled}
      >
        <SelectTrigger id={id} size="sm" className="w-full">
          <SelectValue placeholder={noneLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{noneLabel}</SelectItem>
          {scale.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {tokenPrefix}-{n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Per-side numeric row — Figma-style four-sided spacing control.
 *
 * Renders a 2x2 grid of inputs, each prefixed with a lucide
 * Panel{Top,Right,Bottom,Left} icon so the user can identify which
 * side an input drives without reading the label every time. A
 * chain toggle to the right of the section label links/unlinks the
 * four sides:
 *
 *   - Linked (chain icon, primary-tinted): editing ANY side mirrors
 *     the value to all four. The serialiser collapses to a single
 *     `m-N` / `p-N` token on write.
 *   - Unlinked (broken-chain icon): each side is independent.
 *     Serialiser writes the minimal token set — axis pairs
 *     (`mx-X my-Y`) when both halves match, individual sides
 *     (`mt-T mr-R …`) otherwise.
 *
 * The "linked" mode auto-defaults to true when the parsed
 * SideValues is uniform (all four equal) OR fully empty. Once the
 * user explicitly clicks the toggle the local override sticks for
 * the lifetime of the selection.
 */
function PerSideRow({
  id,
  label,
  tokenPrefix,
  scale,
  value,
  disabled,
  onValueChange,
}: {
  id: string;
  label: string;
  /** "m" for margin, "p" for padding — used in the dropdown option
   *  labels (`m-4`, `p-4`) so the user sees the literal that lands
   *  in the JSX. */
  tokenPrefix: "m" | "p";
  scale: readonly number[];
  value: SideValues;
  disabled?: boolean;
  onValueChange: (next: SideValues) => void;
}) {
  // User's explicit toggle of the chain. `null` = "let the auto
  // rule decide" — auto-link when sides are uniform OR fully empty.
  const [userLinked, setUserLinked] = useState<boolean | null>(null);
  const autoLinked = sidesAreUniform(value) || !hasAnySide(value);
  const linked = userLinked ?? autoLinked;

  const setSide = (side: keyof SideValues, next: number | null) => {
    if (linked) {
      // Linked: mirror the new value to every side. Stripping is
      // handled by setMarginSides / setPaddingSides — they always
      // strip the family before reassembling, so null sides land as
      // "no token written" cleanly.
      onValueChange({ t: next, r: next, b: next, l: next });
    } else {
      onValueChange({ ...value, [side]: next });
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        {/* DS Toggle primitive — `pressed` + `onPressedChange` are
            the Radix-controlled API. The h-5/w-5/min-w-0/p-0/svg-size
            overrides shrink the default `size="sm"` (h-8/min-w-8)
            down to the tight 20px square the inspector chrome wants
            without forking the primitive. */}
        <Toggle
          size="sm"
          pressed={linked}
          onPressedChange={(next) => setUserLinked(next)}
          aria-label={
            linked
              ? "Sides linked — editing one updates all four. Click to unlink."
              : "Sides independent. Click to link all four sides."
          }
          title={
            linked
              ? "Sides linked — editing one updates all four"
              : "Sides independent — edit each side separately"
          }
          disabled={disabled}
          className="h-5 w-5 min-w-0 p-0 [&_svg]:size-3"
        >
          {linked ? <LinkIcon /> : <Unlink />}
        </Toggle>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <SideCell
          id={`${id}-t`}
          icon={<PanelTop />}
          value={value.t}
          scale={scale}
          tokenPrefix={tokenPrefix}
          disabled={disabled}
          onChange={(v) => setSide("t", v)}
        />
        <SideCell
          id={`${id}-r`}
          icon={<PanelRight />}
          value={value.r}
          scale={scale}
          tokenPrefix={tokenPrefix}
          disabled={disabled}
          onChange={(v) => setSide("r", v)}
        />
        <SideCell
          id={`${id}-b`}
          icon={<PanelBottom />}
          value={value.b}
          scale={scale}
          tokenPrefix={tokenPrefix}
          disabled={disabled}
          onChange={(v) => setSide("b", v)}
        />
        <SideCell
          id={`${id}-l`}
          icon={<PanelLeft />}
          value={value.l}
          scale={scale}
          tokenPrefix={tokenPrefix}
          disabled={disabled}
          onChange={(v) => setSide("l", v)}
        />
      </div>
    </div>
  );
}

/** Single cell of the per-side grid — small Select trigger with an
 *  inline side-icon on the leading edge and the numeric scale in
 *  the dropdown. */
function SideCell({
  id,
  icon,
  value,
  scale,
  tokenPrefix,
  disabled,
  onChange,
}: {
  id: string;
  icon: React.ReactNode;
  value: number | null;
  scale: readonly number[];
  tokenPrefix: "m" | "p";
  disabled?: boolean;
  onChange: (next: number | null) => void;
}) {
  return (
    <Select
      value={value === null ? "none" : String(value)}
      onValueChange={(next) =>
        onChange(next === "none" ? null : Number(next))
      }
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        size="sm"
        className="w-full gap-1.5 [&_svg]:size-3"
      >
        <span className="inline-flex items-center text-muted-foreground">
          {icon}
        </span>
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        {scale.map((n) => (
          <SelectItem key={n} value={String(n)}>
            {tokenPrefix}-{n}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PropControl({
  prop,
  source,
  componentName,
  instanceId,
  sourceId,
  disabled,
  onChange,
}: {
  prop: ManifestProp;
  source: string | null;
  componentName: string;
  /** When set, read the value from the data-array entry whose `id`
   *  matches `instanceId` (per-instance content/structured props).
   *  When omitted, fall back to the template-wide JSX-tag read. */
  instanceId?: string;
  /** Stable identifier for the JSX node to read from. Falls back to
   *  the first `<ComponentName>` when undefined or when no tag with
   *  this id is found in the source. */
  sourceId?: string;
  disabled?: boolean;
  onChange: (propName: string, value: PropValue) => void;
}) {
  const current = source
    ? instanceId
      ? readDataArrayEntryField(source, instanceId, prop.name)
      : readComponentProp(source, componentName, prop.name, sourceId)
    : undefined;

  if (prop.kind === "enum") {
    const values = prop.enum ?? [];
    const currentStr =
      current?.kind === "string"
        ? current.value
        : current?.kind === "expression"
          ? stripExprQuotes(current.raw)
          : undefined;
    // Radix Select does NOT accept "" as a value for the controlled `value`
    // prop — it throws at runtime. Use `undefined` to mean "no selection"
    // and let the placeholder show.
    return (
      <PropRow prop={prop}>
        <Select
          value={currentStr ?? undefined}
          onValueChange={(v) => {
            const match = values.find((val) => String(val) === v);
            onChange(prop.name, match ?? null);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={prop.defaultValue ?? "(default)"} />
          </SelectTrigger>
          <SelectContent>
            {values.map((v) => (
              <SelectItem
                key={String(v)}
                value={String(v)}
                className="text-xs"
              >
                {String(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PropRow>
    );
  }

  if (prop.kind === "boolean") {
    // Consider the attr "on" whenever it's present in any form. Boolean
    // shorthand (`controls`) → true. Expression `{true}` → on; `{false}` →
    // off; anything else is opaque and we default to on because the author
    // wrote something there. String-valued booleans (`controls="true"`) are
    // unusual but treated as on.
    let checked = false;
    if (current?.kind === "boolean") checked = true;
    else if (current?.kind === "expression") {
      checked = current.raw.trim() !== "{false}";
    } else if (current?.kind === "string") {
      checked = current.value.toLowerCase() !== "false";
    }
    return (
      <PropRow prop={prop}>
        <Switch
          checked={checked}
          onCheckedChange={(next) => onChange(prop.name, next)}
          disabled={disabled}
        />
      </PropRow>
    );
  }

  if (prop.kind === "number") {
    return (
      <LiveInput
        prop={prop}
        type="number"
        disabled={disabled}
        initialValue={
          current?.kind === "expression"
            ? current.raw.replace(/[{}]/g, "").trim()
            : current?.kind === "string"
              ? current.value
              : ""
        }
        commit={(raw) => {
          if (raw === "") {
            onChange(prop.name, null);
            return;
          }
          const n = Number(raw);
          if (Number.isFinite(n)) onChange(prop.name, n);
        }}
      />
    );
  }

  // string
  return (
    <LiveInput
      prop={prop}
      disabled={disabled}
      initialValue={current?.kind === "string" ? current.value : ""}
      commit={(raw) => onChange(prop.name, raw === "" ? null : raw)}
    />
  );
}

/**
 * Input that commits on every change (debounced to the next animation frame)
 * so typing in the chat column actually moves the preview live. We keep a
 * local draft so the input isn't "controlled" by source-round-tripped
 * values — that would make the caret jump and feel broken on fast typers.
 *
 * The draft resyncs whenever `initialValue` changes and the user isn't
 * actively editing (no focus) — that way a chat regen or a reset button
 * flows into the input without clobbering whatever the user was typing.
 */
function LiveInput({
  prop,
  type = "text",
  initialValue,
  disabled,
  commit,
}: {
  prop: ManifestProp;
  type?: "text" | "number";
  initialValue: string;
  disabled?: boolean;
  commit: (raw: string) => void;
}) {
  const [draft, setDraft] = useState(initialValue);
  const commitTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resync when the external value changes AND we're not the active input.
  // This handles: chat regeneration, reset, tab switch.
  useEffect(() => {
    if (inputRef.current && document.activeElement === inputRef.current) {
      return; // user is typing — don't stomp
    }
    setDraft(initialValue);
  }, [initialValue]);

  useEffect(() => {
    return () => {
      if (commitTimer.current !== null) {
        window.clearTimeout(commitTimer.current);
      }
    };
  }, []);

  const scheduleCommit = (raw: string) => {
    if (commitTimer.current !== null) {
      window.clearTimeout(commitTimer.current);
    }
    commitTimer.current = window.setTimeout(() => {
      commitTimer.current = null;
      commit(raw);
    }, 150);
  };

  return (
    <PropRow prop={prop}>
      <Input
        ref={inputRef}
        type={type}
        className={cn(
          "h-8 text-xs",
          type === "text" && "font-mono"
        )}
        value={draft}
        placeholder={prop.defaultValue ?? ""}
        disabled={disabled}
        onChange={(e) => {
          const next = e.currentTarget.value;
          setDraft(next);
          scheduleCommit(next);
        }}
        onBlur={(e) => {
          // Commit immediately on blur so a fast tab-away doesn't strand
          // the debounce timer.
          if (commitTimer.current !== null) {
            window.clearTimeout(commitTimer.current);
            commitTimer.current = null;
          }
          commit(e.currentTarget.value);
        }}
      />
    </PropRow>
  );
}

function PropRow({
  prop,
  children,
}: {
  prop: ManifestProp;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,96px)_minmax(0,1fr)] items-center gap-2">
      <Label
        htmlFor={`prop-${prop.name}`}
        className="truncate text-[11px] font-medium text-foreground"
        title={prop.description || prop.raw}
      >
        {prop.name}
        {!prop.optional && <span className="text-destructive">*</span>}
      </Label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/**
 * Turn a raw JSX expression like `{"wide"}` or `{'wide'}` into `wide` so
 * we can map it onto a Select value. For anything more complex than a
 * single string literal, returns undefined — the Select stays unselected.
 */
function stripExprQuotes(raw: string): string | undefined {
  const inner = raw.replace(/^\{/, "").replace(/\}$/, "").trim();
  const first = inner[0];
  const last = inner[inner.length - 1];
  if ((first === '"' || first === "'") && first === last) {
    return inner.slice(1, -1);
  }
  return undefined;
}

/**
 * Convert `PropValue` (`string | number | boolean | null`) to the
 * literal shape the data-array mutator expects. `null` means "clear"
 * upstream, which we pass through as `undefined` to make the mutator
 * remove the property entirely (the JSX's `??` fallback then restores
 * the default render).
 */
function propValueToLiteral(value: PropValue): SerialisableValue | undefined {
  if (value === null || value === undefined) return undefined;
  return value;
}

/**
 * Compose a short human label for an undo snapshot produced by a panel
 * edit. Surfaces in the undo button's tooltip as "Undo Change hint to
 * poster" etc. Falls back to "Edit <propName>" when the value is too
 * complex to render in one line (objects, arrays, very long strings).
 *
 * Kept terse — the tooltip is bounded width and the user only needs
 * enough context to recognise which edit they're about to revert.
 */
function describePropChange(propName: string, value: PropValue): string {
  if (value === null || value === undefined) return `Clear ${propName}`;
  if (typeof value === "string") {
    const trimmed = value.length > 24 ? `${value.slice(0, 24)}…` : value;
    return `Change ${propName} to ${trimmed}`;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return `Change ${propName} to ${value}`;
  }
  return `Edit ${propName}`;
}

// ─────────────────────────────────────────────────────────────────────
// Actions row
// ─────────────────────────────────────────────────────────────────────

/**
 * Renders one button per `action` declared on the component's contract.
 * The buttons dispatch a `grade:component-action` CustomEvent on the
 * window with the action's `kind`, the selection payload (including
 * `mediaSourceJson` for MediaSurface), and the component name. The
 * canvas-side listener routes by `kind` and runs the appropriate
 * handler — for MediaSurface today that's the Fill / Refresh flows
 * against `/api/media/resolve-batch`.
 *
 * The event-bus design keeps the panel decoupled from the canvas's
 * mediaUrls state. The panel doesn't need to know HOW to fill or
 * refresh — it just declares "the user clicked this action on this
 * source." Other hosts (an MCP server, a future codemod CLI) can
 * register their own handlers for the same action kinds.
 */
function ActionsRow({
  actions,
  componentName,
  selection,
  appSource,
}: {
  actions: NonNullable<ComponentContract["actions"]>;
  componentName: string;
  selection: StudioSelection | null;
  appSource: string | null;
}) {
  const entries = Object.entries(actions) as [string, ActionContract][];
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 pt-1 border-t border-border">
      {/* Sentence case, no uppercase — matches the rest of the
          inspector group headers. House style. */}
      <span className="text-[11px] font-medium text-muted-foreground">
        Actions
      </span>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([id, action]) => (
          <ActionButton
            key={id}
            action={action}
            componentName={componentName}
            selection={selection}
            appSource={appSource}
          />
        ))}
      </div>
    </div>
  );
}

function ActionButton({
  action,
  componentName,
  selection,
  appSource,
}: {
  action: ActionContract;
  componentName: string;
  selection: StudioSelection | null;
  appSource: string | null;
}) {
  // Disabled state: when the action declares `enabledWhen.propPresent: "<name>"`
  // we look for that prop on the selected element. For MediaSurface's
  // `source`, the propPresent check is satisfied if the element's
  // `data-media-source` attribute is set (which IS the source prop's
  // runtime stamp). For source-less knobs we'd fall back to grepping
  // appSource for the prop on the selected component — but that's a
  // follow-up; today only MediaSurface uses enabledWhen and it always
  // checks `source`.
  const disabled = useMemo(() => {
    const prop = action.enabledWhen?.propPresent;
    if (!prop) return false;
    if (prop === "source" && selection?.mediaSourceJson) return false;
    if (prop === "source" && !selection?.mediaSourceJson) return true;
    // Generic fallback: presence on the JSX source for this component.
    if (appSource && componentName) {
      const re = new RegExp(`<\\s*${componentName}[\\s\\S]*?\\b${prop}\\s*=`);
      return !re.test(appSource);
    }
    return true;
  }, [action.enabledWhen, selection, appSource, componentName]);

  // Resolve the lucide icon by name. The contract declares `icon:
  // "Sparkles"`; lucide exports each icon as a named React component.
  // The dynamic lookup is intentional — contracts are data, and we
  // shouldn't require the panel to be updated every time a new
  // contract uses a different icon.
  const Icon = action.icon
    ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
        action.icon
      ]
    : null;

  const handleClick = () => {
    if (disabled) return;
    // Parse the data-media-source JSON now (rather than carrying the
    // raw string in the event) so the listener can branch by kind
    // without re-parsing.
    let parsedSource: unknown = undefined;
    if (selection?.mediaSourceJson) {
      try {
        parsedSource = JSON.parse(selection.mediaSourceJson);
      } catch {
        /* malformed JSON on the element — let the listener decide */
      }
    }
    const detail = {
      kind: action.kind,
      componentName,
      part: selection?.part,
      source: parsedSource,
      sourceJson: selection?.mediaSourceJson,
      selection,
    };
    window.dispatchEvent(
      new CustomEvent("grade:component-action", { detail }),
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={action.description ?? action.label}
      className={cn(
        "flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs",
        "text-foreground hover:bg-muted transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background",
      )}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {action.label}
    </button>
  );
}
