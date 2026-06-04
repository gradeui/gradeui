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
  Eye,
  EyeOff,
  Loader2,
  Maximize,
  Maximize2,
  Minimize,
  Minimize2,
  Minus,
  PanelRightClose,
  Plus,
  Settings2,
  Grip,
  Square,
  RotateCcw,
} from "lucide-react";
import {
  PaddingTop,
  PaddingBottom,
  PaddingLeft,
  PaddingRight,
  PaddingVertical,
  PaddingHorizontal,
  MarginTop,
  MarginBottom,
  MarginLeft,
  MarginRight,
  MarginVertical,
  MarginHorizontal,
  BorderStrokeTop,
  BorderStrokeBottom,
  BorderStrokeLeft,
  BorderStrokeRight,
  BorderRadius,
  BorderRadiusTopLeft,
  BorderRadiusTopRight,
  BorderRadiusBottomLeft,
  BorderRadiusBottomRight,
  Opacity as OpacityIcon,
  BlendMode as BlendModeIcon,
} from "@/components/icons";
import {
  getComponentContract,
  listContractedComponents,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@gradeui/ui";
import { Image as ImageIcon } from "lucide-react";
import { getStudioStorage } from "@/lib/studio-storage";
import type { Asset } from "@/lib/studio-storage";
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
import {
  TokenField,
  ColorOpacityRow,
  CompactNumberField,
  CompactDimensionField,
  IconTip,
  evalMath,
  type TokenOption,
} from "./token-field";
// Scoped token lists per property area (Figma's "variables scoped to
// corner radius" model). Tailwind-backed today, backend-agnostic shape.
import {
  getAreaTokens,
  RADIUS_PX,
  FONT_SIZE_PX,
  FONT_SIZE_OVERRIDE_SCALE,
  FONT_WEIGHT_NUMBER,
} from "@/lib/token-registry";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  readInlineStyle,
  setInlineStyle,
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
  GRID_COLS_SCALE,
  RADIUS_SCALE,
  LINE_HEIGHT_SCALE,
  LINE_HEIGHT_HINT,
  TRACKING_SCALE,
  TRACKING_HINT,
  TEXT_ALIGN_SCALE,
  FAMILY_BODY,
  EDITABLE_BREAKPOINTS,
  parseBreakpointOverrides,
  parseBreakpointToken,
  setBreakpointToken,
  type ResponsiveBp,
  parseFontSize,
  parseFontWeight,
  parseLineHeight,
  parseTracking,
  parseTextAlign,
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
  setLineHeight,
  setTracking,
  setTextAlign,
  setGap,
  setGridCols,
  setMarginSides,
  setOpacity,
  setPaddingSides,
  setRadius,
  parseRadiusCorners,
  setRadiusCorners,
  hasAnyCorner,
  cornersUniform,
  hasAnySide,
  BORDER_WIDTH_SCALE,
  BORDER_POSITIONS,
  BORDER_SIDES,
  BORDER_SIDE_LABELS,
  BORDER_STYLE_SCALE,
  BORDER_COLOR_TOKENS,
  EMPTY_BORDER,
  parseBorder,
  setBorder,
  hasBorder,
  parseBorderList,
  serializeBorderList,
  parseBorderStyle,
  parseShadow,
  setShadow,
  DEFAULT_CUSTOM_SHADOW,
  customShadowToCss,
  cssToCustomShadow,
  hexOpacityToCssColor,
  cssColorToHexOpacity,
  BLEND_MODES,
  parseBlend,
  setBlend,
  parseFill,
  setFill,
  type FillColorToken,
  type BorderEntry,
  type BlendMode,
  type FontSizeValue,
  type FontWeightValue,
  type LineHeightValue,
  type TrackingValue,
  type TextAlignValue,
  type RadiusValue,
  type SideValues,
  type CornerValues,
  type BorderValue,
  type BorderPosition,
  type BorderSide,
  type BorderStyle,
  type BorderColorToken,
  type ShadowValue,
  type CustomShadow,
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
  // Image-like slot → offer the "Replace from library" asset picker.
  // Covers the DS MediaSurface and raw <img>.
  const isImageSlot =
    componentName === "MediaSurface" || selection?.tag === "img";

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
      settableProps.filter(
        (p) =>
          p.group !== "image" &&
          LAYOUT_PROP_NAMES.has(p.name.toLowerCase()),
      ),
    [settableProps, LAYOUT_PROP_NAMES],
  );
  // Props the component's contract tagged `group: "image"` — rendered in
  // the dedicated Image section (with the asset picker + Fill action),
  // not the generic Properties bucket.
  const imageProps = useMemo(
    () => settableProps.filter((p) => p.group === "image"),
    [settableProps],
  );
  const otherProps = useMemo(
    () =>
      settableProps.filter(
        (p) =>
          p.group !== "image" &&
          !LAYOUT_PROP_NAMES.has(p.name.toLowerCase()),
      ),
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
    // Fast path: the clicked element's id is LITERALLY in the stored
    // source. After a save the source can carry baked-in
    // `data-gds-source-id` attrs; re-running injectSourceIds on an
    // already-stamped source can mint a different sequence, so the
    // lookups below miss and we'd falsely report "not in source" — which
    // disables every control (and the asset picker). A direct substring
    // match on the live-clicked id is the most reliable "it's there"
    // signal and sidesteps brace-scanner edge cases on complex tags
    // (e.g. a MediaSurface with a nested `overlay={<Button/>}` prop).
    if (
      selection?.sourceId &&
      appSource.includes(`data-gds-source-id="${selection.sourceId}"`)
    ) {
      return true;
    }
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

  // Shared className writer for the style sections (Blending, Radius,
  // Shadow, Typography, Fill, Border). Falls back to selection.tag so
  // raw intrinsics (<h1>/<p>/<div>) — which carry no data-gds-part and
  // thus no componentName — still get their className mutated.
  const applyClassName = (next: string, label = "Set className") => {
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
    if (updated !== appSource) onSourceChange(updated, label);
  };

  const headerBadge = (
    <span className="font-mono text-2xs text-primary">
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
        <div className="px-3 py-2.5">
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
        </div>
      )}

      {/* ============================================================
          IMAGE group — everything about the image in one place:
          the asset picker (preview + Change), the contract props the
          component tagged `group: "image"` (src / alt / hint), and the
          Fill action. Driven by the contract's `group`, not a hardcoded
          name list — see the MediaSurface contract.
          ============================================================ */}
      {isImageSlot && selection?.sourceId && appSource && (
        <CollapsibleSection title="Image">
          <AssetSlotPicker
            appSource={appSource}
            selection={selection}
            disabled={!componentPresent}
            onSourceChange={onSourceChange}
          />
          {imageProps.map((prop) => {
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
          {/* Fill action lives here (not the bottom ActionsRow) since
              it's an image action — headerless so it reads as part of
              the Image group, not its own "Actions" section. */}
          {contract?.actions && Object.keys(contract.actions).length > 0 && (
            <ActionsRow
              actions={contract.actions}
              componentName={contract.name}
              selection={selection}
              appSource={appSource}
              hideHeader
            />
          )}
        </CollapsibleSection>
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
        <CollapsibleSection title="Properties">
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
        </CollapsibleSection>
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
        <div className="mx-3 my-2.5 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-2xs text-amber-700 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            <code className="font-mono">&lt;{componentName}&gt;</code> isn&rsquo;t
            in the current source — regenerate it via chat first, then these
            controls will mutate it in place.
          </span>
        </div>
      )}

      {error && (
        <div className="mx-3 my-2.5 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-soft p-2 text-2xs text-destructive-deep">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            Couldn&rsquo;t load settings: {error}. Use the chat to edit this
            component instead.
          </span>
        </div>
      )}

      {effectiveManifest && settableProps.length === 0 && !error && !contract?.actions && (
        <p className="px-3 py-2.5 text-2xs text-muted-foreground">
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
        <LayoutGroup
          source={appSource}
          componentName={componentName ?? selection.tag}
          // Pass the raw tag alongside componentName so the capability
          // resolver inside LayoutGroup can see BOTH the DS name (when
          // present) and the underlying intrinsic — needed for cases
          // like `<Button>` (renders a `<button>`) or `<h1>` (no
          // componentName at all).
          tag={selection.tag}
          sourceId={selection?.sourceId}
          disabled={false}
          // Names of structured props the component's contract already
          // exposes. LayoutGroup hides the Tailwind family for any name
          // it sees here — so e.g. Row's `gap` prop stays canonical.
          manifestPropNames={
            new Set(settableProps.map((p) => p.name.toLowerCase()))
          }
          // Contract layout props (gap/align/justify) render at the top
          // of the Layout section, above the Tailwind padding/margin
          // rows — one section, one header.
          leadingRows={layoutProps.map((prop) => {
            const design = propDesignByName[prop.name];
            const perItem =
              (design === "content" || design === "structured") &&
              Boolean(selection?.instanceId);
            // A contract "shortcut" gap resolves to the SAME TokenField
            // as every other property — the contract's enum values ARE
            // the scoped tokens; detaching writes a raw CSS gap inline
            // (renders in Fast Frame) and clears the prop.
            if (
              prop.name.toLowerCase() === "gap" &&
              prop.kind === "enum" &&
              selection?.sourceId &&
              appSource
            ) {
              const targetName = componentName ?? selection.tag;
              const read = readComponentProp(
                appSource,
                targetName,
                "gap",
                selection.sourceId,
              );
              const currentStr =
                read?.kind === "string"
                  ? read.value
                  : read?.kind === "expression"
                    ? stripExprQuotes(read.raw)
                    : undefined;
              const inlineGap =
                readInlineStyle(appSource, targetName, selection.sourceId)?.[
                  "gap"
                ] ?? null;
              const gapTokens: TokenOption[] = (prop.enum ?? []).map((v) => ({
                value: String(v),
                label: String(v),
              }));
              const applyBoth = (
                mutate: (src: string) => string,
                lbl: string,
              ) => {
                const next = mutate(appSource);
                if (next !== appSource) onSourceChange(next, lbl);
              };
              return (
                <TokenField
                  key={`${prop.name}::tokenfield`}
                  kind="gap"
                  label="Gap"
                  bound={inlineGap === null}
                  token={currentStr ?? null}
                  tokens={gapTokens}
                  placeholder="Default"
                  disabled={!componentPresent}
                  onPickToken={(t) =>
                    applyBoth((src) => {
                      const s1 = updateComponentProp(
                        src,
                        targetName,
                        "gap",
                        t,
                        selection.sourceId,
                      );
                      return setInlineStyle(
                        s1,
                        targetName,
                        { gap: null },
                        selection.sourceId,
                      );
                    }, "Set gap")
                  }
                  currentRaw={inlineGap ?? undefined}
                  onDetach={() =>
                    applyBoth((src) => {
                      const s1 = updateComponentProp(
                        src,
                        targetName,
                        "gap",
                        null,
                        selection.sourceId,
                      );
                      return setInlineStyle(
                        s1,
                        targetName,
                        { gap: "16px" },
                        selection.sourceId,
                      );
                    }, "Set custom gap")
                  }
                  onRebind={() =>
                    applyBoth((src) => {
                      const s1 = updateComponentProp(
                        src,
                        targetName,
                        "gap",
                        prop.defaultValue ?? prop.enum?.[0] ?? null,
                        selection.sourceId,
                      );
                      return setInlineStyle(
                        s1,
                        targetName,
                        { gap: null },
                        selection.sourceId,
                      );
                    }, "Re-bind gap to token")
                  }
                  renderRaw={(attach) => (
                    <CompactDimensionField
                      ariaLabel="Gap"
                      value={inlineGap ?? "16px"}
                      endExtra={attach}
                      disabled={!componentPresent}
                      onCommit={(v) =>
                        applyBoth((src) => {
                          const s1 = updateComponentProp(
                            src,
                            targetName,
                            "gap",
                            null,
                            selection.sourceId,
                          );
                          return setInlineStyle(
                            s1,
                            targetName,
                            { gap: v },
                            selection.sourceId,
                          );
                        }, "Set custom gap")
                      }
                    />
                  )}
                />
              );
            }
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
          onApplySource={(mutate, label) => {
            if (appSource == null) return;
            const next = mutate(appSource);
            if (next !== appSource) onSourceChange(next, label);
          }}
          computedStyle={selection?.computedStyle}
          defaultClasses={getContractDefaultClasses(
            componentName ?? selection.tag,
          )}
        />
      )}

      {/* ============================================================
          Style sections — each its own collapsible/addable section
          (Figma/Paper order). Typography (text only) → Blending
          (opacity + blend mode) → Radius → Fill → Border → Shadow.
          Every one self-hides when it doesn't apply to the element.
          ============================================================ */}
      {selection?.sourceId !== undefined &&
        (() => {
          const styleProps: StyleGroupProps = {
            source: appSource,
            componentName: componentName ?? selection.tag,
            tag: selection.tag,
            sourceId: selection?.sourceId,
            disabled: !componentPresent,
            manifestPropNames: new Set(
              settableProps.map((p) => p.name.toLowerCase()),
            ),
            onChangeClassName: applyClassName,
            onApplySource: (mutate, label) => {
              if (appSource == null) return;
              const next = mutate(appSource);
              if (next !== appSource) onSourceChange(next, label);
            },
            computedStyle: selection?.computedStyle,
            defaultClasses: getContractDefaultClasses(
              componentName ?? selection.tag,
            ),
            viewportPx: selection?.viewportPx,
          };
          return (
            <>
              <TypographyGroup {...styleProps} />
              <BlendingGroup {...styleProps} />
              <RadiusGroup {...styleProps} />
            </>
          );
        })()}

      {/* ============================================================
          FILL group — background colour token. Sits above Border
          (Paper order: Fill → Border). Self-hides for text + app-shell
          and for components whose contract owns the surface/fill.
          ============================================================ */}
      {selection?.sourceId !== undefined && (
        <FillGroup
          source={appSource}
          componentName={componentName ?? selection.tag}
          tag={selection.tag}
          sourceId={selection?.sourceId}
          disabled={!componentPresent}
          manifestPropNames={
            new Set(settableProps.map((p) => p.name.toLowerCase()))
          }
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
              onSourceChange(updated, `Set fill`);
            }
          }}
          onApplySource={(mutate, label) => {
            if (appSource == null) return;
            const next = mutate(appSource);
            if (next !== appSource) onSourceChange(next, label);
          }}
        />
      )}

      {/* ============================================================
          BORDER group — width / position (inside·centre·outside) /
          style / colour, all theme-token driven. Sits below
          Appearance, above the className override. Self-hides for
          text + app-shell via caps.border.
          ============================================================ */}
      {selection?.sourceId !== undefined && (
        <BorderGroup
          source={appSource}
          componentName={componentName ?? selection.tag}
          tag={selection.tag}
          sourceId={selection?.sourceId}
          disabled={!componentPresent}
          manifestPropNames={
            new Set(settableProps.map((p) => p.name.toLowerCase()))
          }
          computedStyle={selection?.computedStyle}
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
              onSourceChange(updated, `Set border`);
            }
          }}
        />
      )}

      {/* SHADOW — theme elevation, addable section (below Border). */}
      {selection?.sourceId !== undefined && (
        <ShadowGroup
          source={appSource}
          componentName={componentName ?? selection.tag}
          tag={selection.tag}
          sourceId={selection?.sourceId}
          disabled={!componentPresent}
          manifestPropNames={
            new Set(settableProps.map((p) => p.name.toLowerCase()))
          }
          computedStyle={selection?.computedStyle}
          onChangeClassName={(next) => applyClassName(next, "Set shadow")}
          onApplySource={(mutate, label) => {
            if (appSource == null) return;
            const next = mutate(appSource);
            if (next !== appSource) onSourceChange(next, label);
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

      {/* "Reset to defaults" removed — stripping every panel-controllable
          attribute at once is a blunt, surprising action for end users
          (it wipes intentional edits + can leave a component looking
          broken). Per-control clearing + undo cover the real need. */}

      {/* Contract-declared actions. Imperative things the user can DO with
          this component, distinct from prop edits. MediaSurface exposes
          "Fill image" + "Refresh" — the canvas listens for the dispatched
          `grade:component-action` event and runs the appropriate handler
          (resolve via the free providers, cache-bust + re-resolve, etc.).
          Skipped for image slots — their actions render inside the Image
          group above, not down here. */}
      {!isImageSlot && contract?.actions && Object.keys(contract.actions).length > 0 && (
        <CollapsibleSection title="Actions">
          <ActionsRow
            actions={contract.actions}
            componentName={contract.name}
            selection={selection}
            appSource={appSource}
            hideHeader
          />
        </CollapsibleSection>
      )}
    </>
  );

  if (variant === "docked") {
    return (
      <div
        className={cn(
          // No horizontal padding on the shell — each section owns its
          // own px-3, so the section dividers run edge-to-edge across
          // the whole surface (Figma/Paper style).
          "flex h-full flex-col rounded-lg border border-border bg-card overflow-y-auto",
          className
        )}
        // The docs site runs Lenis smooth-scroll, which hijacks wheel
        // events unless a scroll container opts out. Without this the
        // inspector can't scroll vertically and long panels get clipped.
        data-lenis-prevent
        data-gds-part="selection-inspector"
      >
        {/* Header — title + status badge only. The Settings2 icon
            was dropped (Nov 2026) because the inspector lives in a
            tabbed shell whose own tab label already says "Layout",
            and the in-panel icon was just visual noise. The
            verbose `when_to_use` paragraph below was removed too —
            see comment below. */}
        <header className="flex items-center gap-2 px-3 py-2.5 text-sm border-b border-border">
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
              className="ml-auto flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-2xs text-muted-foreground hover:text-foreground transition-colors"
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
        // No horizontal padding — sections own px-3 so dividers run
        // full-width. overflow-hidden clips section rules to the
        // rounded corners.
        "flex flex-col rounded-lg border border-border bg-card/60 overflow-hidden",
        className
      )}
      data-gds-part="selection-inspector"
    >
      <header className="flex items-center gap-2 px-3 py-2.5 text-xs">
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
            <span className="ml-1 rounded-full bg-muted px-1.5 text-2xs text-muted-foreground">
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
            className="text-2xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            title="Move settings to the side panel for more room"
          >
            Dock →
          </button>
        )}
      </header>

      {open && (
        <div className="flex flex-col border-t border-border">{body}</div>
      )}
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
 * AssetSlotPicker — the "Image" section for an image slot. Shows a small
 * preview of the CURRENT image + a "Change" button; the full library
 * lives in a dedicated dialog (opened on demand) rather than an
 * always-on grid, so the inspector stays compact. On pick, writes the
 * asset's permanent public URL into `src` — per-item when the slot is in
 * a `.map()` (instanceId present) so only that row changes; template-wide
 * otherwise. Durable across reload + share (public URL never expires).
 */
/** Tailwind aspect class that mirrors how a MediaSurface frames its
 *  image — explicit `aspect` prop wins, else derived from `hint` the same
 *  way the component does. Lets the preview show the real crop the canvas
 *  will apply (cover at this aspect), not a generic 16:9. */
function slotAspectClass(aspect?: string, hint?: string): string {
  const eff =
    aspect && aspect !== "auto"
      ? aspect
      : hint === "album" || hint === "product" || hint === "food"
        ? "square"
        : hint === "portrait" || hint === "poster"
          ? "portrait"
          : hint === "landscape"
            ? "wide"
            : "video";
  switch (eff) {
    case "square":
      return "aspect-square";
    case "portrait":
      return "aspect-[3/4]";
    case "wide":
      return "aspect-[21/9]";
    default:
      return "aspect-video";
  }
}

function AssetSlotPicker({
  appSource,
  selection,
  disabled,
  onSourceChange,
}: {
  appSource: string;
  selection: StudioSelection;
  disabled?: boolean;
  onSourceChange: (next: string, label?: string) => void;
}) {
  // Mirror the slot's framing in the preview so it crops the way the
  // canvas will (cover at this aspect).
  const previewAspect = useMemo(() => {
    const target = selection.componentName ?? selection.tag;
    const a = readComponentProp(appSource, target, "aspect", selection.sourceId);
    const h = readComponentProp(appSource, target, "hint", selection.sourceId);
    return slotAspectClass(
      a?.kind === "string" ? a.value : undefined,
      h?.kind === "string" ? h.value : undefined,
    );
  }, [appSource, selection.componentName, selection.tag, selection.sourceId]);
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);

  // The current literal `src` — drives the preview thumbnail. Per-item
  // when looped, else the tag's prop.
  const currentSrc = useMemo<string | undefined>(() => {
    try {
      // Per-item first — readDataArrayEntryField returns a tagged value
      // ({ kind: "string", value }), NOT a raw string.
      if (selection.instanceId) {
        const v = readDataArrayEntryField(
          appSource,
          selection.instanceId,
          "src",
        );
        if (v?.kind === "string" && v.value) return v.value;
      }
      const read = readComponentProp(
        appSource,
        selection.componentName ?? selection.tag,
        "src",
        selection.sourceId,
      );
      return read?.kind === "string" && read.value ? read.value : undefined;
    } catch {
      return undefined;
    }
  }, [
    appSource,
    selection.instanceId,
    selection.componentName,
    selection.tag,
    selection.sourceId,
  ]);

  // Lazy-load the library only when the dialog opens.
  useEffect(() => {
    if (!open) return;
    let live = true;
    setLoading(true);
    getStudioStorage()
      .listAssets({ type: "media" })
      .then((a) => live && setAssets(a))
      .catch(() => live && setAssets([]))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [open]);

  const writeSrc = (value: string | null, label: string) => {
    if (disabled) return;
    // Looped slot → write ONLY that item's data-array `src` (never a
    // template-wide attribute, which would clobber every instance).
    if (selection.instanceId) {
      const result = updateDataArrayEntry(
        appSource,
        selection.instanceId,
        "src",
        value ?? undefined,
      );
      if (result.ok && result.jsx && result.jsx !== appSource) {
        onSourceChange(result.jsx, label);
      }
      return;
    }
    const next = updateComponentProp(
      appSource,
      selection.componentName ?? selection.tag,
      "src",
      value,
      selection.sourceId,
    );
    if (next !== appSource) onSourceChange(next, label);
  };

  return (
    <div className="space-y-1.5">
      {/* Large, full-width preview — click it (or "Change image") to open
          the picker. Reads as a proper image well, not a tiny chip. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title="Change image"
        className={cn(
          "group/img flex w-full items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40 transition hover:border-primary disabled:opacity-50",
          previewAspect,
        )}
      >
        {currentSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentSrc}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-1 text-muted-foreground/60">
            <ImageIcon className="h-5 w-5" />
            <span className="text-2xs">No image</span>
          </span>
        )}
      </button>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
        >
          Change image
        </button>
        {currentSrc && (
          <button
            type="button"
            onClick={() => writeSrc(null, "Clear image")}
            disabled={disabled}
            className="text-2xs text-muted-foreground transition hover:text-foreground"
          >
            Remove
          </button>
        )}
      </div>

      {/* Dedicated picker — opens on demand so the inspector stays compact. */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose an image</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : assets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No media in your library yet. Upload images in the Assets panel
              (left), then pick one here.
            </p>
          ) : (
            <div className="grid max-h-[60vh] grid-cols-4 gap-2 overflow-y-auto p-0.5">
              {assets.map((a) => {
                const selected = a.url === currentSrc;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      if (a.url) {
                        writeSrc(a.url, `Set image to ${a.name}`);
                        // Trail entry — page logs via grade:image-action.
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(
                            new CustomEvent("grade:image-action", {
                              detail: { action: "image.set", name: a.name },
                            }),
                          );
                        }
                      }
                      setOpen(false);
                    }}
                    title={a.name}
                    className={cn(
                      "aspect-square overflow-hidden rounded-md border bg-muted/40 transition hover:border-primary",
                      selected ? "border-primary ring-2 ring-primary/30" : "border-border",
                    )}
                  >
                    {/* contain (not cover) — show the whole asset in the
                        picker, matching the library grid. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.url}
                      alt={a.name}
                      className="h-full w-full object-contain p-1"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
      <Label htmlFor="layer-name" className={FIELD_LABEL}>
        Layer name
      </Label>
      <Input
        id="layer-name"
        ref={inputRef}
        size="2xs"
        autoComplete="off"
        spellCheck={false}
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
      className="flex items-center gap-0.5 flex-wrap text-2xs text-muted-foreground"
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
        "rounded px-1.5 py-0.5 font-mono text-2xs",
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
  // Read the children string NORMALISED — collapse runs of whitespace
  // to single spaces and trim. The source carries JSX formatting
  // (indentation + newlines around the text node) that the browser
  // collapses at render time anyway; showing it raw made the input
  // look padded/centred with phantom leading space. Commit writes the
  // user's (single-line) value verbatim, so an untouched field never
  // rewrites the source, and an edited one flattens the text node to
  // one line — which is what the user typed.
  const currentText = useMemo(() => {
    if (!editable) return "";
    const children = findElementChildren(source, sourceId);
    return children
      ? children.value.replace(/\s+/g, " ").trim()
      : "";
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
    <div className="space-y-1 px-3 py-2.5 border-t border-border/60">
      <Label htmlFor="text-content" className={FIELD_LABEL}>
        Text
      </Label>
      <Input
        id="text-content"
        ref={inputRef}
        size="2xs"
        autoComplete="off"
        spellCheck={false}
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
 * CollapsibleSection — a full-width, collapsible inspector section
 * (Figma / Paper style). Two-tier hierarchy:
 *
 *   - the SECTION HEADER is the prominent tier — larger (text-sm),
 *     foreground, with a disclosure chevron.
 *   - field labels INSIDE a section sit a tier below — small + muted
 *     (see FIELD_LABEL).
 *
 * The top border runs edge-to-edge: the surrounding shell carries no
 * horizontal padding, and each section owns its own `px-3`, so the
 * divider spans the whole surface rather than stopping at a gutter.
 * `first:border-t-0` drops the leading rule (the panel header already
 * provides one).
 */
function CollapsibleSection({
  title,
  hint,
  defaultOpen = true,
  children,
}: {
  title: string;
  hint?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-t border-border/60 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-1.5 px-3 pt-2.5 text-left",
          // Tighter gap to the values when open; balanced when collapsed.
          open ? "pb-1.5" : "pb-2.5",
        )}
      >
        <ChevronDown
          aria-hidden
          className={cn(
            "h-3 w-3 shrink-0 text-muted-foreground transition-transform",
            !open && "-rotate-90",
          )}
        />
        <span className="text-xs font-medium text-foreground">{title}</span>
        {hint ? <span className="ml-auto pl-2">{hint}</span> : null}
      </button>
      {open && <div className="space-y-2 px-3 pb-3">{children}</div>}
    </section>
  );
}

/**
 * AddableSection — a full-width section for the "additive" style
 * families (Fill, Border, …) that mirror Figma/Paper's pattern: the
 * title is MUTED when the section is empty, and a ＋ on the right adds
 * an entry. Once populated the title goes foreground and the body (the
 * entry rows) shows. `headerExtra` slots a control (e.g. stroke style)
 * left of the ＋. Same edge-to-edge divider as CollapsibleSection.
 */
function AddableSection({
  title,
  empty,
  onAdd,
  addLabel,
  headerExtra,
  emptyHint,
  children,
}: {
  title: string;
  empty: boolean;
  onAdd: () => void;
  addLabel?: string;
  headerExtra?: React.ReactNode;
  /** Muted caption shown under the header while empty — used to surface a
   *  component-baked default ("Default · Set by component") so an unset
   *  section doesn't read as "nothing here" when the component supplies
   *  the value itself. */
  emptyHint?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-t border-border/60 first:border-t-0">
      <div
        className={cn(
          "flex items-center gap-2 px-3 pt-2.5",
          !empty && children ? "pb-1.5" : "pb-2.5",
        )}
      >
        <span
          className={cn(
            "shrink-0 text-xs font-medium",
            empty ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {title}
        </span>
        {/* Inline next to the title — a below-the-row caption costs a
            whole line in an otherwise-collapsed section. */}
        {empty && emptyHint ? <DefaultCaption value={emptyHint} /> : null}
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          {headerExtra}
          <button
            type="button"
            onClick={onAdd}
            aria-label={addLabel ?? `Add ${title.toLowerCase()}`}
            title={addLabel ?? `Add ${title.toLowerCase()}`}
            className="inline-flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-3.5"
          >
            <Plus />
          </button>
        </div>
      </div>
      {!empty && children ? (
        <div className="space-y-2 px-3 pb-3">{children}</div>
      ) : null}
    </section>
  );
}

/** Small square icon button used inside entry rows (eye / remove). */
function EntryIconButton({
  onClick,
  label,
  disabled,
  children,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-7 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 [&_svg]:size-3.5"
    >
      {children}
    </button>
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
  onApplySource,
  computedStyle,
  defaultClasses,
  leadingRows,
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
  /** One-undo-step source transform for TokenField writes (className +
   *  inline style together) — see StyleGroupProps.onApplySource. */
  onApplySource?: (mutate: (src: string) => string, label: string) => void;
  /** Live computed style of the selected element — ghosts the TRUE
   *  effective values (a CardContent's baked p-6 → "24") into unset
   *  spacing fields instead of a lying "0". */
  computedStyle?: StudioSelection["computedStyle"];
  /** Contract-shipped baked classes (styleDefaults) — parsed for REAL
   *  default chips on unset fields. */
  defaultClasses?: string | null;
  /** Contract layout props (gap / align / justify …) rendered by the
   *  parent. They sit at the TOP of the Layout section, above the
   *  Tailwind padding/margin rows. Passed in (rather than the parent
   *  rendering its own header) so Layout stays a single section. */
  leadingRows?: React.ReactNode;
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
  // Detached gap rides the inline `style` attr (Fast Frame — the default
  // renderer — can't render runtime-minted arbitrary classes).
  const inlineStyles = source
    ? readInlineStyle(source, componentName, sourceId)
    : {};
  // Full CSS length string ("13px", "1rem") — freeform units.
  const customGapDim = inlineStyles?.["gap"] ?? null;
  // Contract-shipped baked defaults, parsed once for ghost chips —
  // REAL classes from the component source (Grid's gap-4, a Card
  // part's p-6), never reverse-derived from computed px.
  const defaultPaddingSides = parsePaddingSides(defaultClasses ?? null);
  const defaultMarginSides = parseMarginSides(defaultClasses ?? null);
  const defaultGap = parseGap(defaultClasses ?? null);
  const writeGapToken = (v: number | null, label = "Set gap") =>
    onApplySource?.((src) => {
      const cnNow = readClassName(src, componentName, sourceId);
      const nextCn = setGap(cnNow, v);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        nextCn === "" ? null : nextCn,
        sourceId,
      );
      return setInlineStyle(src2, componentName, { gap: null }, sourceId);
    }, label);
  const writeGapDim = (dim: string) =>
    onApplySource?.((src) => {
      const cnNow = readClassName(src, componentName, sourceId);
      const strippedCn = setGap(cnNow, null);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        strippedCn === "" ? null : strippedCn,
        sourceId,
      );
      return setInlineStyle(src2, componentName, { gap: dim }, sourceId);
    }, "Set custom gap");

  // True when ANY structured control in this group has captured a
  // token OR a detached inline value — drives the "Custom" badge +
  // reset affordance next to the group title.
  const anyInlineLayout = [
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
    "gap",
  ].some((k) => inlineStyles?.[k] != null);
  const anyOverride =
    hasAnySide(paddingSides) ||
    hasAnySide(marginSides) ||
    gap !== null ||
    gridCols !== null ||
    anyInlineLayout;
  // Reset — strip every layout token AND inline value in one undo step,
  // restoring the component/theme defaults.
  const resetLayout = () =>
    onApplySource?.((src) => {
      const cnNow = readClassName(src, componentName, sourceId);
      let cn1 = setPaddingSides(cnNow, { t: null, r: null, b: null, l: null });
      cn1 = setMarginSides(cn1, { t: null, r: null, b: null, l: null });
      cn1 = setGap(cn1, null);
      cn1 = setGridCols(cn1, null);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        cn1 === "" ? null : cn1,
        sourceId,
      );
      return setInlineStyle(
        src2,
        componentName,
        {
          paddingTop: null,
          paddingRight: null,
          paddingBottom: null,
          paddingLeft: null,
          marginTop: null,
          marginRight: null,
          marginBottom: null,
          marginLeft: null,
          gap: null,
        },
        sourceId,
      );
    }, "Reset layout to defaults");

  // Self-hide when nothing applies — neither contract leading rows
  // (gap/align/justify from the parent) nor any Tailwind row.
  const anyRowVisible =
    showPadding || showMargin || showGap || showGridCols;
  const hasLeading = React.Children.count(leadingRows) > 0;
  if (!anyRowVisible && !hasLeading) return null;

  return (
    <CollapsibleSection
      title="Layout"
      hint={
        anyOverride ? (
          <span className="flex items-center gap-1">
            {/* Badge (token-lozenge styling, warning tone) instead of a
                sentence — plus a one-click reset back to defaults. */}
            <span className="rounded-[4px] border border-warning-deep/30 bg-warning-soft px-1 text-2xs leading-4 text-warning-deep">
              Custom
            </span>
            <IconTip label="Reset to defaults — clears this section's overrides">
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  resetLayout();
                }}
                aria-label="Reset layout to defaults"
                className="inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 [&_svg]:size-3"
              >
                <RotateCcw />
              </button>
            </IconTip>
          </span>
        ) : null
      }
    >
      {leadingRows}

      {showPadding && (
        <PerSideRow
          id="spacing-padding"
          label="Padding"
          area="padding"
          value={paddingSides}
          source={source}
          componentName={componentName}
          sourceId={sourceId}
          disabled={disabled}
          onApplySource={onApplySource}
          defaultValue={defaultPaddingSides}
          computedSides={{
            t: computedStyle?.paddingTop,
            r: computedStyle?.paddingRight,
            b: computedStyle?.paddingBottom,
            l: computedStyle?.paddingLeft,
          }}
        />
      )}
      {showMargin && (
        <PerSideRow
          id="spacing-margin"
          label="Margin"
          area="margin"
          value={marginSides}
          source={source}
          componentName={componentName}
          sourceId={sourceId}
          disabled={disabled}
          onApplySource={onApplySource}
          defaultValue={defaultMarginSides}
          computedSides={{
            t: computedStyle?.marginTop,
            r: computedStyle?.marginRight,
            b: computedStyle?.marginBottom,
            l: computedStyle?.marginLeft,
          }}
        />
      )}
      {showGap && (
        <TokenField
          kind="gap"
          label="Gap"
          labelCaption={(() => {
            if (gap !== null || customGapDim !== null) return undefined;
            const g = computedStyle?.gap;
            if (!g || g === "normal" || parseFloat(g) === 0) return undefined;
            return <DefaultCaption value={g} />;
          })()}
          bound={customGapDim === null}
          token={gap === null ? null : String(gap)}
          tokens={getAreaTokens("gap").map((t) => ({
            value: t.value,
            label: t.label,
            hint: t.hint,
          }))}
          ghostToken={
            gap === null && customGapDim === null && defaultGap !== null
              ? { label: `gap-${defaultGap}`, hint: `${defaultGap * 4}px` }
              : undefined
          }
          placeholder="0"
          placeholderHint="0px"
          unitSuffix="px"
          disabled={disabled}
          onPickToken={(t) =>
            writeGapToken(t === null ? null : Number(t))
          }
          currentRaw={customGapDim ?? undefined}
          onDetach={() => writeGapDim(`${gap !== null ? gap * 4 : 12}px`)}
          onRebind={() => writeGapToken(4, "Re-bind gap to token")}
          renderRaw={(attach) => (
            <div className="flex items-center gap-1">
              <CompactDimensionField
                ariaLabel="Gap"
                value={customGapDim ?? "12px"}
                disabled={disabled}
                onCommit={(v) => writeGapDim(v)}
                endExtra={attach}
              />
            </div>
          )}
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
    </CollapsibleSection>
  );
}

// Shared prop shape for the className-driven style sections.
interface StyleGroupProps {
  source: string | null;
  componentName: string;
  tag?: string;
  sourceId?: string;
  disabled?: boolean;
  manifestPropNames?: Set<string>;
  onChangeClassName: (nextClassName: string) => void;
  /** Apply an arbitrary source transformation in ONE undo step — used by
   *  TokenField sections to write className (token) + inline style
   *  (detached) together. Detached values ride inline style because
   *  Fast Frame — the DEFAULT renderer — compiles CSS at build time and
   *  can't see runtime-minted arbitrary classes. */
  onApplySource?: (mutate: (src: string) => string, label: string) => void;
  /** Effective computed style of the selected element (from the selection
   *  payload). Lets a group show the component-baked default (e.g. a
   *  Card's `rounded-xl` / `shadow`) when the JSX className carries no
   *  explicit token, instead of reading as "none". */
  computedStyle?: StudioSelection["computedStyle"];
  /** The component's baked-in classes from its CONTRACT (styleDefaults,
   *  extracted from source at generation time). Parsed with the same
   *  Tailwind parsers to ghost REAL default chips on unset fields. */
  defaultClasses?: string | null;
  /** Preview viewport width at click time (selection payload) — the
   *  responsive editor marks the breakpoint that currently wins. */
  viewportPx?: number;
}

/** Format a computed value for the muted "Default ·" caption — drops the
 *  noise (a `0px` radius / `none` shadow / `0px` border means "nothing
 *  baked in", so there's nothing to show). Returns null when there's no
 *  meaningful default to surface. */
function defaultHint(
  kind: "radius" | "shadow" | "border",
  cs: StudioSelection["computedStyle"] | undefined,
): string | null {
  if (!cs) return null;
  if (kind === "radius") {
    const r = cs.radius?.trim();
    if (!r || /^0px(\s+0px)*$/.test(r)) return null;
    return r;
  }
  if (kind === "shadow") {
    const s = cs.boxShadow?.trim();
    if (!s || s === "none") return null;
    return "Set by component";
  }
  // border
  const b = cs.border?.trim();
  if (!b || b.startsWith("0px")) return null;
  return b;
}

/** The muted caption itself — one consistent treatment across groups.
 *  Inline (a span) so it sits NEXT TO the field label rather than
 *  costing a line below the field. Debug aid; slated for removal. */
function DefaultCaption({ value }: { value: string }) {
  return (
    <span className="min-w-0 truncate text-2xs font-normal leading-none text-muted-foreground/70">
      Default · <span className="font-mono">{value}</span>
    </span>
  );
}

/** Read the live className off the selected node. */
function readClassName(
  source: string | null,
  componentName: string,
  sourceId?: string,
): string | null {
  if (!source) return null;
  const read = readComponentProp(source, componentName, "className", sourceId);
  return read?.kind === "string" ? read.value : null;
}

// ─── Contract style defaults ─────────────────────────────────────────
// Baked-in classes per component/part ("CardContent" → "p-6 pt-0"),
// shipped on contracts by generate-contracts.mjs. Lazily indexed across
// every contract so PART names resolve through their family contract
// (CardContent lives on the Card contract's styleDefaults map). These
// are REAL classes from the component source — legitimate to render as
// (dulled) token chips, unlike values reverse-derived from computed px.
let contractDefaultsIndex: Record<string, string> | null = null;
function getContractDefaultClasses(
  name: string | null | undefined,
): string | null {
  if (!name) return null;
  if (contractDefaultsIndex === null) {
    contractDefaultsIndex = {};
    for (const n of listContractedComponents()) {
      // Cast: dist types may predate the styleDefaults field until the
      // package is rebuilt; the data rides through regardless.
      const c = getComponentContract(n) as {
        styleDefaults?: Record<string, string>;
      } | null;
      if (!c?.styleDefaults) continue;
      for (const [part, classes] of Object.entries(c.styleDefaults)) {
        contractDefaultsIndex[part] = classes;
      }
    }
  }
  return contractDefaultsIndex[name] ?? null;
}

/** The contract's extracted cva defaultVariants for a component
 *  ({ variant: "default", size: "md" }). Lets unset enum props ghost
 *  the REAL resolved value ("md") instead of a meaningless "(default)". */
function getContractVariantDefault(
  componentName: string | null | undefined,
  propName: string,
): string | null {
  if (!componentName) return null;
  // Cast: dist types may predate the variantDefaults field until the
  // package is rebuilt; the data rides through regardless.
  const c = getComponentContract(componentName) as {
    variantDefaults?: Record<string, string>;
  } | null;
  return c?.variantDefaults?.[propName] ?? null;
}

/** "24px" → "24" for ghost placeholders (bare-number convention).
 *  Non-px values (normal, auto, %) → undefined so callers fall back. */
function pxGhost(v?: string): string | undefined {
  if (!v) return undefined;
  const m = /^(-?\d*\.?\d+)px$/.exec(v.trim());
  if (!m) return undefined;
  return String(Math.round(parseFloat(m[1]) * 100) / 100);
}

const ownsAny = (names: Set<string> | undefined, aliases: string[]) =>
  aliases.some((a) => names?.has(a) ?? false);

/** One pickable class in a breakpoint-override row. */
interface BpOption {
  /** Unprefixed class written into the override ("text-8xl"). */
  cls: string;
  label: string;
  hint?: string;
}

/**
 * BreakpointOverridesEditor — the per-property responsive editor.
 *
 * Sits in a field's label row. Collapsed: breakpoint badges (`md`,
 * `lg`) when overrides exist — the signal that the base field below
 * is NOT the whole story (the value is overridden by a CSS class at
 * that breakpoint) — or a ghost `+` when none do. Open: one row per
 * editable breakpoint (sm/md/lg) with a scoped token picker; "—"
 * clears the override.
 *
 * Deliberately EXPLICIT rather than Webflow's canvas-context model
 * (where the active viewport silently decides which breakpoint you're
 * editing — a model that routinely catches people out): here the
 * override lives on the property, you can see it at a glance, and you
 * change it on purpose. Tailwind is mobile-first, so a breakpoint
 * value applies from that width UP; the base field is everything
 * below the smallest authored override.
 *
 * xl/2xl overrides the model may emit aren't editable here (every
 * mintable class must be safelisted) — they surface read-only with a
 * pointer at the Class-names row / chat.
 */
/** Tailwind min-widths for the editable breakpoints — shown in the
 *  row labels and used to mark which breakpoint the preview's current
 *  viewport is actually applying. */
const BP_MIN_PX: Record<string, number> = { sm: 640, md: 768, lg: 1024 };

function BreakpointOverridesEditor({
  property,
  body,
  options,
  className0,
  baseCls,
  viewportPx,
  disabled,
  onChangeClassName,
}: {
  /** Human name for tooltips ("font size"). */
  property: string;
  /** FAMILY_BODY.* pattern for this property. */
  body: string;
  options: BpOption[];
  className0: string | null;
  /** The BASE (unprefixed) class currently authored, e.g. "text-3xl" —
   *  anchors the cascade readout: a breakpoint row without its own
   *  override shows "Inherit · <whatever wins below it>". Null when the
   *  base field is unset (element/theme default applies). */
  baseCls?: string | null;
  /** Preview viewport width at selection time — marks the "Current"
   *  breakpoint. Undefined (older selections) → no marker. */
  viewportPx?: number;
  disabled?: boolean;
  onChangeClassName: (next: string) => void;
}) {
  const overrides = parseBreakpointOverrides(className0, body);
  const byBp = new Map<ResponsiveBp, string>();
  for (const o of overrides) byBp.set(o.bp, o.cls); // last wins per bp
  const editableSet = new Set<string>(EDITABLE_BREAKPOINTS);
  const readOnly = [...byBp.entries()].filter(([bp]) => !editableSet.has(bp));

  // The class that WINS at a breakpoint when it has no override of its
  // own — mobile-first cascade: nearest authored breakpoint below it,
  // else the base class. Drives the "Inherit · text-3xl" row labels
  // (the answer to "is sm: the default?" — no, the base field is; sm
  // inherits it until overridden).
  const authoredAt = (bp: ResponsiveBp) =>
    parseBreakpointToken(className0, bp, body);
  const inheritedFor = (bp: ResponsiveBp): string | null => {
    const order = EDITABLE_BREAKPOINTS as readonly ResponsiveBp[];
    for (let i = order.indexOf(bp) - 1; i >= 0; i--) {
      const below = authoredAt(order[i]);
      if (below) return below;
    }
    return baseCls ?? null;
  };

  // Which row is the preview ACTUALLY applying right now? The largest
  // breakpoint whose min-width fits the captured viewport; below sm,
  // the base row is current. Undefined viewport → no marker at all.
  const currentBp: ResponsiveBp | "base" | null =
    viewportPx === undefined
      ? null
      : ([...EDITABLE_BREAKPOINTS]
          .reverse()
          .find((bp) => viewportPx >= BP_MIN_PX[bp]) as
          | ResponsiveBp
          | undefined) ?? "base";
  const currentBadge = (
    <span className="rounded-[3px] bg-primary/15 px-1 py-px font-mono text-[9px] leading-none text-primary">
      Current
    </span>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Responsive overrides for ${property}`}
          title={
            byBp.size > 0
              ? `Set by CSS override${byBp.size > 1 ? "s" : ""}: ${[...byBp.values()].join(", ")} — the field below edits the base value. Click to edit.`
              : `Add a responsive override (sm / md / lg) for ${property}`
          }
          className={cn(
            "inline-flex h-4 items-center gap-0.5 rounded-[3px] px-1 transition-colors",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            byBp.size > 0
              ? "border border-warning-deep/30 bg-warning-soft font-mono text-[9px] leading-none text-warning-deep hover:brightness-95"
              : "text-muted-foreground/50 hover:bg-muted hover:text-foreground [&_svg]:size-2.5",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          {byBp.size > 0 ? (
            [...byBp.keys()].map((bp) => <span key={bp}>{bp}</span>)
          ) : (
            <Plus />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-2.5 p-2.5">
        <p className="text-2xs leading-snug text-muted-foreground">
          Responsive {property} — each value applies from that breakpoint
          up (mobile-first).
        </p>
        {/* Base row — read-only anchor: this IS the main field below,
            shown here so the cascade has its starting point and the
            "Current" marker has somewhere to land below 640px. */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Label className={FIELD_LABEL}>Base · below 640px</Label>
            {currentBp === "base" && currentBadge}
          </div>
          <div className="rounded-md border border-border/60 bg-muted/40 px-2 py-1 font-mono text-2xs text-muted-foreground">
            {baseCls ?? "Inherit"}
          </div>
        </div>
        {EDITABLE_BREAKPOINTS.map((bp) => {
          const current = authoredAt(bp);
          const inherited = inheritedFor(bp);
          return (
            <div key={bp} className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Label
                  htmlFor={`bp-${property.replace(/\s+/g, "-")}-${bp}`}
                  className={FIELD_LABEL}
                >
                  {bp} · {BP_MIN_PX[bp]}px+
                </Label>
                {currentBp === bp && currentBadge}
              </div>
              <Select
                value={current ?? "none"}
                onValueChange={(next) =>
                  onChangeClassName(
                    setBreakpointToken(
                      className0,
                      bp,
                      body,
                      next === "none" ? null : next,
                    ),
                  )
                }
                disabled={disabled}
              >
                <SelectTrigger
                  id={`bp-${property.replace(/\s+/g, "-")}-${bp}`}
                  size="2xs"
                  className="w-full"
                >
                  <SelectValue placeholder="Inherit" />
                </SelectTrigger>
                <SelectContent size="2xs" position="item-aligned">
                  {/* The cascade made legible: an un-overridden
                      breakpoint inherits the nearest value below it
                      (ultimately the base field). */}
                  <SelectItem value="none">
                    {inherited ? `Inherit · ${inherited}` : "Inherit"}
                  </SelectItem>
                  {options.map((o) => (
                    <SelectItem key={o.cls} value={o.cls} hint={o.hint}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
        {readOnly.length > 0 && (
          <p className="text-2xs leading-snug text-muted-foreground">
            Also set: {readOnly.map(([, cls]) => cls).join(", ")} — edit via
            the Class names row or chat.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * TypographyGroup — font size, weight, line-height, letter-spacing,
 * and text alignment. Text intrinsics only (the capability layer
 * keeps these off containers). The three newer controls share the
 * fontSize capability gate — anything that can carry a size can carry
 * the rest of the type stack. Every control carries a
 * BreakpointOverridesEditor in its label row, so `md:text-8xl`-style
 * overrides are visible and editable instead of silently shadowing
 * the base field.
 */
function TypographyGroup({
  source,
  componentName,
  tag,
  sourceId,
  disabled,
  manifestPropNames,
  onChangeClassName,
  onApplySource,
  computedStyle,
  defaultClasses,
  viewportPx,
}: StyleGroupProps) {
  const caps = getSpacingCapabilities({ tag, componentName });
  const showFontSize =
    caps.fontSize && !ownsAny(manifestPropNames, ["size", "fontsize", "font-size"]);
  const showFontWeight =
    caps.fontWeight &&
    !ownsAny(manifestPropNames, ["weight", "fontweight", "font-weight"]);
  const showLineHeight =
    caps.fontSize &&
    !ownsAny(manifestPropNames, ["lineheight", "line-height", "leading"]);
  const showTracking =
    caps.fontSize &&
    !ownsAny(manifestPropNames, [
      "letterspacing",
      "letter-spacing",
      "tracking",
    ]);
  const showAlign =
    caps.fontSize &&
    !ownsAny(manifestPropNames, ["align", "textalign", "text-align"]);
  if (
    !showFontSize &&
    !showFontWeight &&
    !showLineHeight &&
    !showTracking &&
    !showAlign
  )
    return null;

  const cn0 = readClassName(source, componentName, sourceId);
  const fontSize = parseFontSize(cn0);
  const fontWeight = parseFontWeight(cn0);
  const lineHeight = parseLineHeight(cn0);
  const tracking = parseTracking(cn0);
  const textAlign = parseTextAlign(cn0);

  // Per-property responsive editors — shared wiring, one per control.
  // The size picker includes the display sizes (6xl–9xl): hero ladders
  // like `md:text-8xl` are the main reason overrides exist. `baseCls`
  // anchors each popover's "Inherit · <cls>" cascade readout.
  const bpEditor = (
    property: string,
    body: string,
    options: BpOption[],
    baseCls: string | null,
  ) => (
    <BreakpointOverridesEditor
      property={property}
      body={body}
      options={options}
      className0={cn0}
      baseCls={baseCls}
      viewportPx={viewportPx}
      disabled={disabled}
      onChangeClassName={onChangeClassName}
    />
  );
  const sizeBpOptions: BpOption[] = FONT_SIZE_OVERRIDE_SCALE.map((s) => ({
    cls: `text-${s}`,
    label: `text-${s}`,
    hint: FONT_SIZE_PX[s],
  }));
  const weightBpOptions: BpOption[] = FONT_WEIGHT_SCALE.map((w) => ({
    cls: `font-${w}`,
    label: `font-${w}`,
    hint: FONT_WEIGHT_NUMBER[w],
  }));
  const leadingBpOptions: BpOption[] = LINE_HEIGHT_SCALE.map((v) => ({
    cls: `leading-${v}`,
    label: `leading-${v}`,
    hint: LINE_HEIGHT_HINT[v],
  }));
  const trackingBpOptions: BpOption[] = TRACKING_SCALE.map((v) => ({
    cls: `tracking-${v}`,
    label: `tracking-${v}`,
    hint: TRACKING_HINT[v],
  }));
  const alignBpOptions: BpOption[] = TEXT_ALIGN_SCALE.map((v) => ({
    cls: `text-${v}`,
    label: `text-${v}`,
  }));

  // Detached (inline-style) values for the rest of the type stack —
  // same Fast Frame rule as font size: raw values ride `style`,
  // tokens ride classes. Detach seeds prefer the live computed value
  // ("normal" is useless as a seed — fall back to the token's hint).
  const inline = source
    ? readInlineStyle(source, componentName, sourceId)
    : {};
  const customLineHeight = inline?.["lineHeight"] ?? null;
  const customTracking = inline?.["letterSpacing"] ?? null;
  const seedLeading =
    computedStyle?.lineHeight && computedStyle.lineHeight !== "normal"
      ? computedStyle.lineHeight
      : LINE_HEIGHT_HINT[lineHeight ?? "normal"];
  const seedTracking =
    computedStyle?.letterSpacing && computedStyle.letterSpacing !== "normal"
      ? computedStyle.letterSpacing
      : TRACKING_HINT[tracking ?? "normal"];
  // Contract-shipped defaults (CardTitle's leading-none, tracking-tight)
  // → dulled ghost chips, same as font size.
  const defaultWeight = parseFontWeight(defaultClasses ?? null);
  const defaultLineHeight = parseLineHeight(defaultClasses ?? null);
  const defaultTracking = parseTracking(defaultClasses ?? null);
  const defaultAlign = parseTextAlign(defaultClasses ?? null);

  const writeLeadingToken = (v: LineHeightValue | null, lbl: string) =>
    onApplySource?.((src) => {
      const cnNow = readClassName(src, componentName, sourceId);
      const nextCn = setLineHeight(cnNow, v);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        nextCn === "" ? null : nextCn,
        sourceId,
      );
      return setInlineStyle(src2, componentName, { lineHeight: null }, sourceId);
    }, lbl);
  const writeLeadingDim = (dimV: string) =>
    onApplySource?.((src) => {
      const cnNow = readClassName(src, componentName, sourceId);
      const strippedCn = setLineHeight(cnNow, null);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        strippedCn === "" ? null : strippedCn,
        sourceId,
      );
      return setInlineStyle(src2, componentName, { lineHeight: dimV }, sourceId);
    }, "Set custom line height");
  const writeTrackingToken = (v: TrackingValue | null, lbl: string) =>
    onApplySource?.((src) => {
      const cnNow = readClassName(src, componentName, sourceId);
      const nextCn = setTracking(cnNow, v);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        nextCn === "" ? null : nextCn,
        sourceId,
      );
      return setInlineStyle(
        src2,
        componentName,
        { letterSpacing: null },
        sourceId,
      );
    }, lbl);
  const writeTrackingDim = (dimV: string) =>
    onApplySource?.((src) => {
      const cnNow = readClassName(src, componentName, sourceId);
      const strippedCn = setTracking(cnNow, null);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        strippedCn === "" ? null : strippedCn,
        sourceId,
      );
      return setInlineStyle(
        src2,
        componentName,
        { letterSpacing: dimV },
        sourceId,
      );
    }, "Set custom letter spacing");
  // Detached font size rides inline style (Fast Frame — see ShadowGroup);
  // `inline` itself is read once above, alongside the line-height /
  // letter-spacing customs.
  const customFontSize = inline?.["fontSize"] ?? null;
  const seedFont = `${FONT_SIZE_PX[fontSize ?? "base"] ?? "16"}px`;
  // Contract-shipped baked size (CardDescription's text-sm) → dulled chip.
  const defaultFontSize = parseFontSize(defaultClasses ?? null);
  const writeSizeToken = (v: FontSizeValue | null, lbl: string) =>
    onApplySource?.((src) => {
      const cnNow = readClassName(src, componentName, sourceId);
      const nextCn = setFontSize(cnNow, v);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        nextCn === "" ? null : nextCn,
        sourceId,
      );
      return setInlineStyle(src2, componentName, { fontSize: null }, sourceId);
    }, lbl);
  const writeSizeDim = (dimV: string) =>
    onApplySource?.((src) => {
      const cnNow = readClassName(src, componentName, sourceId);
      const strippedCn = setFontSize(cnNow, null);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        strippedCn === "" ? null : strippedCn,
        sourceId,
      );
      return setInlineStyle(src2, componentName, { fontSize: dimV }, sourceId);
    }, "Set custom font size");

  return (
    <CollapsibleSection title="Typography">
      {showFontSize && (
        <TokenField
          kind="font size"
          label="Font size"
          labelExtra={bpEditor(
            "font size",
            FAMILY_BODY.fontSize,
            sizeBpOptions,
            fontSize ? `text-${fontSize}` : null,
          )}
          labelCaption={
            fontSize === null &&
            customFontSize === null &&
            computedStyle?.fontSize ? (
              <DefaultCaption value={computedStyle.fontSize} />
            ) : undefined
          }
          bound={customFontSize === null}
          token={fontSize ?? null}
          tokens={getAreaTokens("fontSize").map((t) => ({
            value: t.value,
            label: t.label,
            hint: t.hint,
          }))}
          ghostToken={
            fontSize === null &&
            customFontSize === null &&
            defaultFontSize !== null
              ? {
                  label: `text-${defaultFontSize}`,
                  hint: FONT_SIZE_PX[defaultFontSize],
                }
              : undefined
          }
          placeholder="Inherit"
          unitSuffix="px"
          disabled={disabled}
          onPickToken={(t) =>
            writeSizeToken(
              t === null ? null : (t as FontSizeValue),
              "Set font size",
            )
          }
          currentRaw={customFontSize ?? undefined}
          onDetach={() => writeSizeDim(seedFont)}
          onRebind={() => writeSizeToken("base", "Re-bind font size to token")}
          renderRaw={(attach) => (
            <CompactDimensionField
              ariaLabel="Font size"
              value={customFontSize ?? seedFont}
              disabled={disabled}
              onCommit={(v) => writeSizeDim(v)}
              endExtra={attach}
            />
          )}
        />
      )}
      {showFontWeight && (
        // Token-only TokenField — weight has no meaningful raw value
        // worth a detach lane (the keyword ladder IS the scale).
        <TokenField
          kind="font weight"
          label="Font weight"
          labelExtra={bpEditor(
            "font weight",
            FAMILY_BODY.fontWeight,
            weightBpOptions,
            fontWeight ? `font-${fontWeight}` : null,
          )}
          bound
          token={fontWeight ?? null}
          tokens={FONT_WEIGHT_SCALE.map((w) => ({
            value: w,
            label: `font-${w}`,
            hint: FONT_WEIGHT_NUMBER[w],
          }))}
          ghostToken={
            fontWeight === null && defaultWeight !== null
              ? {
                  label: `font-${defaultWeight}`,
                  hint: FONT_WEIGHT_NUMBER[defaultWeight],
                }
              : undefined
          }
          placeholder="Inherit"
          disabled={disabled}
          onPickToken={(t) =>
            onChangeClassName(
              setFontWeight(cn0, t === null ? null : (t as FontWeightValue)),
            )
          }
        />
      )}
      {showLineHeight && (
        <TokenField
          kind="line height"
          label="Line height"
          labelExtra={bpEditor(
            "line height",
            FAMILY_BODY.lineHeight,
            leadingBpOptions,
            lineHeight ? `leading-${lineHeight}` : null,
          )}
          labelCaption={
            lineHeight === null &&
            customLineHeight === null &&
            computedStyle?.lineHeight &&
            computedStyle.lineHeight !== "normal" ? (
              <DefaultCaption value={computedStyle.lineHeight} />
            ) : undefined
          }
          bound={customLineHeight === null}
          token={lineHeight ?? null}
          tokens={getAreaTokens("lineHeight").map((t) => ({
            value: t.value,
            label: t.label,
            hint: t.hint,
          }))}
          ghostToken={
            lineHeight === null &&
            customLineHeight === null &&
            defaultLineHeight !== null
              ? {
                  label: `leading-${defaultLineHeight}`,
                  hint: LINE_HEIGHT_HINT[defaultLineHeight],
                }
              : undefined
          }
          placeholder="Inherit"
          disabled={disabled}
          onPickToken={(t) =>
            writeLeadingToken(
              t === null ? null : (t as LineHeightValue),
              "Set line height",
            )
          }
          currentRaw={customLineHeight ?? undefined}
          onDetach={() => writeLeadingDim(seedLeading)}
          onRebind={() =>
            writeLeadingToken("normal", "Re-bind line height to token")
          }
          renderRaw={(attach) => (
            <CompactDimensionField
              ariaLabel="Line height"
              value={customLineHeight ?? seedLeading}
              disabled={disabled}
              onCommit={(v) => writeLeadingDim(v)}
              endExtra={attach}
            />
          )}
        />
      )}
      {showTracking && (
        <TokenField
          kind="letter spacing"
          label="Letter spacing"
          labelExtra={bpEditor(
            "letter spacing",
            FAMILY_BODY.tracking,
            trackingBpOptions,
            tracking ? `tracking-${tracking}` : null,
          )}
          labelCaption={
            tracking === null &&
            customTracking === null &&
            computedStyle?.letterSpacing &&
            computedStyle.letterSpacing !== "normal" ? (
              <DefaultCaption value={computedStyle.letterSpacing} />
            ) : undefined
          }
          bound={customTracking === null}
          token={tracking ?? null}
          tokens={getAreaTokens("tracking").map((t) => ({
            value: t.value,
            label: t.label,
            hint: t.hint,
          }))}
          ghostToken={
            tracking === null &&
            customTracking === null &&
            defaultTracking !== null
              ? {
                  label: `tracking-${defaultTracking}`,
                  hint: TRACKING_HINT[defaultTracking],
                }
              : undefined
          }
          placeholder="Inherit"
          disabled={disabled}
          onPickToken={(t) =>
            writeTrackingToken(
              t === null ? null : (t as TrackingValue),
              "Set letter spacing",
            )
          }
          currentRaw={customTracking ?? undefined}
          onDetach={() => writeTrackingDim(seedTracking)}
          onRebind={() =>
            writeTrackingToken("normal", "Re-bind letter spacing to token")
          }
          renderRaw={(attach) => (
            <CompactDimensionField
              ariaLabel="Letter spacing"
              value={customTracking ?? seedTracking}
              disabled={disabled}
              onCommit={(v) => writeTrackingDim(v)}
              endExtra={attach}
            />
          )}
        />
      )}
      {showAlign && (
        // Token-only — a "raw" alignment has no meaning.
        <TokenField
          kind="text alignment"
          label="Align"
          labelExtra={bpEditor(
            "alignment",
            FAMILY_BODY.textAlign,
            alignBpOptions,
            textAlign ? `text-${textAlign}` : null,
          )}
          bound
          token={textAlign ?? null}
          tokens={getAreaTokens("textAlign").map((t) => ({
            value: t.value,
            label: t.label,
          }))}
          ghostToken={
            textAlign === null && defaultAlign !== null
              ? { label: `text-${defaultAlign}` }
              : undefined
          }
          placeholder="Inherit"
          disabled={disabled}
          onPickToken={(t) =>
            onChangeClassName(
              setTextAlign(cn0, t === null ? null : (t as TextAlignValue)),
            )
          }
        />
      )}
    </CollapsibleSection>
  );
}

/**
 * BlendingGroup — opacity + mix-blend-mode, the "Blending" section.
 * Both are whole-element knobs; gated on the opacity capability.
 */
function BlendingGroup({
  source,
  componentName,
  tag,
  sourceId,
  disabled,
  manifestPropNames,
  onChangeClassName,
  onApplySource,
}: StyleGroupProps) {
  const caps = getSpacingCapabilities({ tag, componentName });
  if (!caps.opacity || ownsAny(manifestPropNames, ["opacity"])) return null;

  const cn0 = readClassName(source, componentName, sourceId);
  const opacity = parseOpacity(cn0);
  const blend = parseBlend(cn0);
  // Detached opacity rides the inline `style` attr (Fast Frame — see
  // ShadowGroup). Stored as a 0–1 CSS value; surfaced as 0–100 %.
  const inline = source
    ? readInlineStyle(source, componentName, sourceId)
    : {};
  const customRaw = inline?.["opacity"];
  const customParsed = customRaw ? Math.round(parseFloat(customRaw) * 100) : NaN;
  const customPct = Number.isFinite(customParsed) ? customParsed : null;
  const bound = customPct === null;

  const writeToken = (v: number | null, label: string) =>
    onApplySource?.((src) => {
      const cn = readClassName(src, componentName, sourceId);
      const nextCn = setOpacity(cn, v);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        nextCn === "" ? null : nextCn,
        sourceId,
      );
      return setInlineStyle(src2, componentName, { opacity: null }, sourceId);
    }, label);
  const writeCustomPct = (pct: number) =>
    onApplySource?.((src) => {
      const cn = readClassName(src, componentName, sourceId);
      const strippedCn = setOpacity(cn, null);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        strippedCn === "" ? null : strippedCn,
        sourceId,
      );
      return setInlineStyle(
        src2,
        componentName,
        { opacity: String(Math.max(0, Math.min(100, pct)) / 100) },
        sourceId,
      );
    }, "Set custom opacity");

  return (
    <CollapsibleSection title="Blending">
      <div className="grid grid-cols-2 gap-1.5">
        <TokenField
          kind="opacity"
          label="Opacity"
          triggerIcon={
            <IconTip label="Opacity">
              <span className="flex items-center">
                <OpacityIcon aria-hidden />
              </span>
            </IconTip>
          }
          bound={bound}
          token={opacity === null ? null : String(opacity)}
          tokens={getAreaTokens("opacity").map((t) => ({
            value: t.value,
            label: t.label,
            hint: t.hint,
          }))}
          placeholder="100"
          unitSuffix="%"
          disabled={disabled}
          onPickToken={(t) =>
            writeToken(t === null ? null : Number(t), "Set opacity")
          }
          currentRaw={customPct != null ? String(customPct) : undefined}
          onDetach={() => writeCustomPct(opacity ?? 100)}
          onRebind={() => writeToken(null, "Re-bind opacity to token")}
          renderRaw={(attach) => (
            <div className="flex items-center gap-1">
              <CompactNumberField
                ariaLabel="Opacity percent"
                icon={<span className="text-2xs">%</span>}
                value={customPct ?? 100}
                min={0}
                disabled={disabled}
                onCommit={(v) => writeCustomPct(v)}
                endExtra={attach}
              />
            </div>
          )}
        />
        <div className="min-w-0 space-y-1">
          {/* min-h-4 + leading-none mirrors TokenField's label row so the
              two Blending columns align. */}
          <div className="flex min-h-4 items-center">
            <Label
              htmlFor="blending-mode"
              className={cn(FIELD_LABEL, "leading-none")}
            >
              Blend mode
            </Label>
          </div>
          <Select
            value={blend}
            onValueChange={(v) => onChangeClassName(setBlend(cn0, v as BlendMode))}
            disabled={disabled}
          >
            <SelectTrigger
              id="blending-mode"
              size="2xs"
              className="w-full"
              title="Blend mode"
              // Grade's blend-mode glyph (the industry-standard droplet;
              // Paper has one icon per mode — swap in a set if wanted).
              startSlot={<BlendModeIcon aria-hidden />}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent size="2xs" position="item-aligned">
              {/* Designer-cased ("Soft light", not "soft-light") — the
                  kebab value still lands in the class; only the label
                  de-devs. */}
              {BLEND_MODES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1).replace(/-/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </CollapsibleSection>
  );
}

/** A single radius-keyword select (None + the rounded-* scale, px-tagged). */
function RadiusSelect({
  id,
  value,
  disabled,
  onValueChange,
}: {
  id?: string;
  value: RadiusValue | null;
  disabled?: boolean;
  onValueChange: (v: RadiusValue | null) => void;
}) {
  return (
    <Select
      value={value === null ? "none-set" : value === "" ? "default" : value}
      onValueChange={(next) =>
        onValueChange(
          next === "none-set" ? null : next === "default" ? "" : (next as RadiusValue),
        )
      }
      disabled={disabled}
    >
      <SelectTrigger id={id} size="2xs" className="w-full">
        <SelectValue placeholder="None" />
      </SelectTrigger>
      <SelectContent size="2xs" position="item-aligned">
        <SelectItem value="none-set">None</SelectItem>
        {RADIUS_SCALE.map((r) => (
          <SelectItem key={r || "default"} value={r === "" ? "default" : r}>
            {r === "" ? "rounded" : `rounded-${r}`}
            {RADIUS_PX[r] ? ` · ${RADIUS_PX[r]}` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * RadiusGroup — corner radius with a combined ↔ per-corner toggle
 * (mirrors padding/margin). Combined edits all four corners at once;
 * per-corner exposes TL / TR / BL / BR individually. Auto-opens
 * per-corner when the parsed corners aren't uniform.
 */
/** Per-corner radius glyphs — Grade's corner-sweep icons. */
const CORNER_RADIUS_ICONS = {
  tl: <BorderRadiusTopLeft />,
  tr: <BorderRadiusTopRight />,
  bl: <BorderRadiusBottomLeft />,
  br: <BorderRadiusBottomRight />,
} as const;

function RadiusGroup({
  source,
  componentName,
  tag,
  sourceId,
  disabled,
  manifestPropNames,
  onApplySource,
  computedStyle,
  defaultClasses,
}: StyleGroupProps) {
  const caps = getSpacingCapabilities({ tag, componentName });
  const cn0 = readClassName(source, componentName, sourceId);
  const corners = parseRadiusCorners(cn0);
  // Detached radius rides the inline `style` attr — Fast Frame (the
  // default renderer) can't render runtime-minted arbitrary classes.
  const inline = source
    ? readInlineStyle(source, componentName, sourceId)
    : {};
  // Full CSS length string ("19px", "4rem", "50%") — freeform units.
  const customDim = inline?.["borderRadius"] ?? null;
  const uniform = cornersUniform(corners) || !hasAnyCorner(corners);
  const [userMode, setUserMode] = useState<"all" | "corners" | null>(null);

  if (!caps.radius || ownsAny(manifestPropNames, ["rounded", "radius"]))
    return null;

  // Bound = on the keyword token scale; detached = a custom CSS length.
  const bound = customDim === null;
  // A custom radius is all-corners by definition — force combined mode
  // while detached (the per-corner selects only speak tokens). While
  // corners DIFFER, per-corner mode is forced and the collapse toggle
  // disabled: a combined field can't truthfully show mixed values, and
  // collapsing anyway would either lie or wipe them (Paper does the
  // wipe — destructive). Make the corners equal and the toggle unlocks.
  const mode: "all" | "corners" = !bound
    ? "all"
    : uniform
      ? (userMode ?? "all")
      : "corners";

  // No explicit rounded-* token in the JSX → show the component's baked-in
  // radius (read off the live element) so the control doesn't read as "none".
  const radiusHint =
    bound && !hasAnyCorner(corners)
      ? defaultHint("radius", computedStyle)
      : null;

  // Inline-style keys for per-corner detached values.
  const CORNER_STYLE_KEYS: Record<keyof CornerValues, string> = {
    tl: "borderTopLeftRadius",
    tr: "borderTopRightRadius",
    br: "borderBottomRightRadius",
    bl: "borderBottomLeftRadius",
  };
  // Bind ALL corners: write token classes, clear every inline radius —
  // one undo step, never both carriers at once.
  const writeCorners = (next: CornerValues, label: string) =>
    onApplySource?.((src) => {
      const cnNow = readClassName(src, componentName, sourceId);
      const nextCn = setRadiusCorners(cnNow, next);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        nextCn === "" ? null : nextCn,
        sourceId,
      );
      return setInlineStyle(
        src2,
        componentName,
        {
          borderRadius: null,
          borderTopLeftRadius: null,
          borderTopRightRadius: null,
          borderBottomRightRadius: null,
          borderBottomLeftRadius: null,
        },
        sourceId,
      );
    }, label);
  const setAll = (v: RadiusValue | null) =>
    writeCorners({ tl: v, tr: v, br: v, bl: v }, "Set corner radius");
  // Bind ONE corner: token class for that corner, clearing only ITS
  // inline value (sibling corners may stay detached).
  const setCorner = (corner: keyof CornerValues, v: RadiusValue | null) =>
    onApplySource?.((src) => {
      const cnNow = readClassName(src, componentName, sourceId);
      const nextCn = setRadiusCorners(cnNow, { ...corners, [corner]: v });
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        nextCn === "" ? null : nextCn,
        sourceId,
      );
      return setInlineStyle(
        src2,
        componentName,
        { borderRadius: null, [CORNER_STYLE_KEYS[corner]]: null },
        sourceId,
      );
    }, "Set corner radius");
  // Detach ONE corner to a raw CSS length.
  const writeCornerDim = (corner: keyof CornerValues, dim: string) =>
    onApplySource?.((src) => {
      const cnNow = readClassName(src, componentName, sourceId);
      const nextCn = setRadiusCorners(cnNow, { ...corners, [corner]: null });
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        nextCn === "" ? null : nextCn,
        sourceId,
      );
      return setInlineStyle(
        src2,
        componentName,
        { borderRadius: null, [CORNER_STYLE_KEYS[corner]]: dim },
        sourceId,
      );
    }, "Set custom corner radius");
  // Detach: strip radius tokens from className, write a raw CSS length.
  const writeCustomDim = (dim: string) =>
    onApplySource?.((src) => {
      const cn = readClassName(src, componentName, sourceId);
      const strippedCn = setRadiusCorners(cn, {
        tl: null,
        tr: null,
        br: null,
        bl: null,
      });
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        strippedCn === "" ? null : strippedCn,
        sourceId,
      );
      return setInlineStyle(
        src2,
        componentName,
        { borderRadius: dim },
        sourceId,
      );
    }, "Set custom radius");

  // Combined value = the shared corner value when uniform, else null.
  const combined = uniform && hasAnyCorner(corners) ? corners.tl : null;

  // Radius tokens — scoped from the registry (Figma's "variables scoped
  // to corner radius"), with the resolved px readout per row.
  const tokens: TokenOption[] = getAreaTokens("radius").map((t) => ({
    value: t.value === "" ? "__default" : t.value,
    label: t.label,
    hint: t.hint,
  }));
  const tokenValue =
    combined === null ? null : combined === "" ? "__default" : combined;

  // Seed the detached value from the bound token's resolved value (or 8px).
  const seedPx =
    combined !== null ? parseInt(RADIUS_PX[combined] ?? "8", 10) || 8 : 8;
  const seedDim = `${seedPx}px`;
  // Contract-shipped baked radius (Card's rounded-xl) → dulled chip.
  const defaultRadius = parseRadius(defaultClasses ?? null);

  const modeToggle = (
    <IconTip
      label={
        !bound
          ? "Custom radius applies to all corners — re-bind to a token to edit corners individually"
          : !uniform
            ? "Corners differ — make them equal to set all corners together"
            : mode === "all"
              ? "Edit each corner"
              : "Set all corners together"
      }
    >
      {/* Ghost (no border/bg) — expand toggles read as quiet chrome. */}
      <button
        type="button"
        onClick={() => setUserMode(mode === "all" ? "corners" : "all")}
        disabled={disabled || !bound || !uniform}
        aria-label={
          mode === "all" ? "Edit each corner" : "Set all corners together"
        }
        className={cn(
          "inline-flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 [&_svg]:size-3",
          mode === "corners" && "bg-muted text-foreground",
        )}
      >
        {/* Maximize/Minimize (the FOUR-CORNERS glyphs) — radius is about
            corners, where the diagonal-arrow Maximize2 reads as resize. */}
        {mode === "all" ? <Maximize /> : <Minimize />}
      </button>
    </IconTip>
  );

  return (
    <CollapsibleSection title="Radius">
      <div className="space-y-1.5">
        {mode === "all" ? (
          <>
            <TokenField
              kind="radius"
              label="Corner radius"
              labelExtra={modeToggle}
              labelCaption={
                radiusHint ? <DefaultCaption value={radiusHint} /> : undefined
              }
              bound={bound}
              token={tokenValue}
              tokens={tokens}
              // Ghost-zero convention (same as spacing): unset shows a
              // greyed 0 with the unit in the suffix slot, not "None".
              placeholder="0"
              placeholderHint="0px"
              disabled={disabled}
              onPickToken={(t) =>
                setAll(
                  t === null
                    ? null
                    : t === "__default"
                      ? ""
                      : (t as RadiusValue),
                )
              }
              ghostToken={
                combined === null &&
                customDim === null &&
                !hasAnyCorner(corners) &&
                defaultRadius !== null
                  ? {
                      label:
                        defaultRadius === ""
                          ? "rounded"
                          : `rounded-${defaultRadius}`,
                      hint: RADIUS_PX[defaultRadius],
                    }
                  : undefined
              }
              unitSuffix="px"
              currentRaw={customDim ?? undefined}
              onDetach={() => writeCustomDim(seedDim)}
              onRebind={() => setAll("md")}
              renderRaw={(attach) => (
                <div className="flex items-center gap-1">
                  <CompactDimensionField
                    ariaLabel="Corner radius"
                    icon={<BorderRadius />}
                    value={customDim ?? seedDim}
                    disabled={disabled}
                    onCommit={(v) => writeCustomDim(v)}
                    endExtra={attach}
                  />
                </div>
              )}
            />
          </>
        ) : (
          <>
          <div className="flex items-center justify-between">
            <Label className={FIELD_LABEL}>Corner radius</Label>
            {modeToggle}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                ["tl", "Top left"],
                ["tr", "Top right"],
                ["bl", "Bottom left"],
                ["br", "Bottom right"],
              ] as [keyof CornerValues, string][]
            ).map(([corner, label]) => {
              // Same Field component as everywhere else — each corner is
              // individually bindable/detachable (Figma's per-field
              // variable model).
              const cornerDim = inline?.[CORNER_STYLE_KEYS[corner]] ?? null;
              const cornerToken =
                corners[corner] === null
                  ? null
                  : corners[corner] === ""
                    ? "__default"
                    : corners[corner];
              // Corner-specific labels (`rounded-tl-lg`, not `rounded-lg`)
              // — the chip must show the class that setRadiusCorners
              // actually writes, mirroring margin's per-side labels
              // (`mt-1.5`, not `m-1.5`).
              const cornerTokens: TokenOption[] = getAreaTokens("radius").map(
                (t) => ({
                  value: t.value === "" ? "__default" : t.value,
                  label:
                    t.value === ""
                      ? `rounded-${corner}`
                      : `rounded-${corner}-${t.value}`,
                  hint: t.hint,
                }),
              );
              return (
                <TokenField
                  key={corner}
                  kind="radius"
                  // No text label — the corner glyph carries the meaning
                  // (the IconTip supplies the name for hover + a11y).
                  triggerIcon={
                    <IconTip label={`${label} radius`}>
                      <span className="flex items-center">
                        {CORNER_RADIUS_ICONS[corner]}
                      </span>
                    </IconTip>
                  }
                  bound={cornerDim === null}
                  token={cornerToken}
                  tokens={cornerTokens}
                  placeholder="0"
                  placeholderHint="0px"
                  unitSuffix="px"
                  disabled={disabled}
                  onPickToken={(t) =>
                    setCorner(
                      corner,
                      t === null
                        ? null
                        : t === "__default"
                          ? ""
                          : (t as RadiusValue),
                    )
                  }
                  currentRaw={cornerDim ?? undefined}
                  onDetach={() => writeCornerDim(corner, seedDim)}
                  onRebind={() => setCorner(corner, "md")}
                  renderRaw={(attach) => (
                    <div className="flex items-center gap-1">
                      <CompactDimensionField
                        ariaLabel={`${label} radius`}
                        icon={CORNER_RADIUS_ICONS[corner]}
                        value={cornerDim ?? seedDim}
                        disabled={disabled}
                        onCommit={(v) => writeCornerDim(corner, v)}
                        endExtra={attach}
                      />
                    </div>
                  )}
                />
              );
            })}
          </div>
          </>
        )}
      </div>
    </CollapsibleSection>
  );
}

/**
 * ShadowGroup — theme-defined elevation, its own additive section.
 * Empty (no shadow token) → muted title + ＋ to add a default (md).
 * Populated → the elevation select + a remove (−).
 */
function ShadowGroup({
  source,
  componentName,
  tag,
  sourceId,
  disabled,
  manifestPropNames,
  onApplySource,
  computedStyle,
}: StyleGroupProps) {
  const caps = getSpacingCapabilities({ tag, componentName });
  if (!caps.shadow || ownsAny(manifestPropNames, ["shadow", "elevation"]))
    return null;

  const cn0 = readClassName(source, componentName, sourceId);
  const shadow = parseShadow(cn0);
  // Detached values ride the inline `style` attr — the only carrier that
  // renders in Fast Frame (the DEFAULT renderer), whose stylesheet is
  // precompiled: runtime-minted arbitrary classes produce no CSS there.
  const inline = source
    ? readInlineStyle(source, componentName, sourceId)
    : {};
  const custom = cssToCustomShadow(inline?.["boxShadow"]);
  const empty = shadow === null && custom === null;
  // Bound = on a theme elevation token; detached = a raw custom shadow.
  const bound = custom === null;
  const c = custom ?? DEFAULT_CUSTOM_SHADOW;
  // Detach: strip any shadow token from className, write the raw value
  // as inline style — one undo step, never both carriers at once.
  const writeCustom = (next: CustomShadow) =>
    onApplySource?.((src) => {
      const cn = readClassName(src, componentName, sourceId);
      const strippedCn = setShadow(cn, null);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        strippedCn === "" ? null : strippedCn,
        sourceId,
      );
      return setInlineStyle(
        src2,
        componentName,
        { boxShadow: customShadowToCss(next) },
        sourceId,
      );
    }, "Set custom shadow");
  // Bind: write the token class, clear any inline boxShadow.
  const writeToken = (v: ShadowValue | null, label: string) =>
    onApplySource?.((src) => {
      const cn = readClassName(src, componentName, sourceId);
      const nextCn = setShadow(cn, v);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        nextCn === "" ? null : nextCn,
        sourceId,
      );
      return setInlineStyle(src2, componentName, { boxShadow: null }, sourceId);
    }, label);

  // Elevation tokens — scoped from the registry (Tailwind-backed today).
  const tokens: TokenOption[] = getAreaTokens("shadow").map((t) => ({
    value: t.value === "" ? "__default" : t.value,
    label: t.label,
    hint: t.hint,
  }));
  const tokenValue =
    shadow === null ? null : shadow === "" ? "__default" : shadow;

  return (
    <AddableSection
      title="Shadow"
      empty={empty}
      addLabel="Add shadow"
      emptyHint={empty ? defaultHint("shadow", computedStyle) : undefined}
      onAdd={() => writeToken("md", "Add shadow")}
      headerExtra={
        !empty ? (
          <EntryIconButton
            label="Remove shadow"
            disabled={disabled}
            onClick={() => writeToken(null, "Remove shadow")}
          >
            <Minus />
          </EntryIconButton>
        ) : null
      }
    >
      <TokenField
        kind="shadow"
        label="Elevation"
        bound={bound}
        token={tokenValue}
        tokens={tokens}
        placeholder="None"
        disabled={disabled}
        onPickToken={(t) =>
          writeToken(
            t === null ? null : t === "__default" ? "" : (t as ShadowValue),
            "Set shadow",
          )
        }
        onDetach={() => writeCustom(DEFAULT_CUSTOM_SHADOW)}
        onRebind={() => writeToken("md", "Re-bind shadow to token")}
        renderRaw={(attach) => (
          <div className="space-y-1.5">
            {/* Compound row — X / Y / blur / spread inline, icon-prefixed
                (Paper-style). Blur + spread use placeholder glyphs (Grip /
                Square); swap in custom blur/spread icons here if you make
                them. */}
            <div className="flex items-center gap-1">
              <CompactNumberField
                ariaLabel="Shadow X offset"
                icon={<span className="text-2xs">X</span>}
                value={c.x}
                disabled={disabled}
                onCommit={(v) => writeCustom({ ...c, x: v })}
              />
              <CompactNumberField
                ariaLabel="Shadow Y offset"
                icon={<span className="text-2xs">Y</span>}
                value={c.y}
                disabled={disabled}
                onCommit={(v) => writeCustom({ ...c, y: v })}
              />
              <CompactNumberField
                ariaLabel="Shadow blur"
                icon={<Grip />}
                value={c.blur}
                min={0}
                disabled={disabled}
                onCommit={(v) => writeCustom({ ...c, blur: v })}
              />
              <CompactNumberField
                ariaLabel="Shadow spread"
                icon={<Square />}
                value={c.spread}
                disabled={disabled}
                onCommit={(v) => writeCustom({ ...c, spread: v })}
              />
              {attach}
            </div>
            <ColorOpacityRow
              hex={c.hex}
              opacity={c.opacity}
              disabled={disabled}
              onChange={(hex, opacity) => writeCustom({ ...c, hex, opacity })}
            />
          </div>
        )}
      />
    </AddableSection>
  );
}

// Single source of truth for inspector field-label typography. Every
// control label (Padding, Opacity, Width, Colour, gap, align, …) uses
// this so the panel reads as one consistent system. This is the LOWER
// tier — small + muted + regular weight. The prominent tier is the
// CollapsibleSection header (text-sm, foreground). Keeping the two
// deliberately distinct is the hierarchy Figma/Paper use.
const FIELD_LABEL = "text-2xs font-medium text-foreground/80";

// Fill swatch classes moved to lib/token-registry (the scoped fill
// tokens carry their own swatchClass).

/**
 * FillGroup — background colour as a theme token (`bg-card`, `bg-muted`,
 * …). Writes a className `bg-*` override; never a raw hex. Hides when a
 * component's contract already owns the surface/fill (Card's `surface`
 * prop is canonical — the generic override would just fight it), and
 * for element types where a fill makes no sense (text, app-shell).
 */
function FillGroup({
  source,
  componentName,
  tag,
  sourceId,
  disabled,
  manifestPropNames,
  onApplySource,
}: StyleGroupProps) {
  const caps = getSpacingCapabilities({ tag, componentName });
  // `surface` included so Card (whose contract owns its fill via the
  // surface prop) doesn't get a competing generic Fill control.
  const contractOwnsFill = ownsAny(manifestPropNames, [
    "fill",
    "background",
    "bg",
    "surface",
  ]);
  const cn0 = readClassName(source, componentName, sourceId);
  const fill = parseFill(cn0);
  // Detached fill rides the inline `style` attr (Fast Frame — see
  // ShadowGroup): backgroundColor as #hex or rgba() when translucent.
  const inline = source
    ? readInlineStyle(source, componentName, sourceId)
    : {};
  const custom = cssColorToHexOpacity(inline?.["backgroundColor"]);

  if (!caps.fill || contractOwnsFill) return null;

  const bound = custom === null;
  const empty = fill === null && custom === null;
  const c = custom ?? { hex: "ffffff", opacity: 100 };

  const writeToken = (v: FillColorToken | null, label: string) =>
    onApplySource?.((src) => {
      const cnNow = readClassName(src, componentName, sourceId);
      const nextCn = setFill(cnNow, v);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        nextCn === "" ? null : nextCn,
        sourceId,
      );
      return setInlineStyle(
        src2,
        componentName,
        { backgroundColor: null },
        sourceId,
      );
    }, label);
  const writeCustom = (hex: string, opacity: number) =>
    onApplySource?.((src) => {
      const cnNow = readClassName(src, componentName, sourceId);
      const strippedCn = setFill(cnNow, null);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        strippedCn === "" ? null : strippedCn,
        sourceId,
      );
      return setInlineStyle(
        src2,
        componentName,
        { backgroundColor: hexOpacityToCssColor(hex, opacity) },
        sourceId,
      );
    }, "Set custom fill");

  // Fill tokens — scoped from the registry, theme swatch chip per row.
  const tokens: TokenOption[] = getAreaTokens("fill").map((t) => ({
    value: t.value,
    label: t.label,
    preview: (
      <span
        className={cn(
          "inline-block h-3 w-3 shrink-0 rounded-[3px] border border-border/60",
          t.swatchClass,
        )}
      />
    ),
  }));

  return (
    <AddableSection
      title="Fill"
      empty={empty}
      addLabel="Add fill"
      // Default to the surface token so the added fill is visible.
      onAdd={() => writeToken("card", "Add fill")}
      headerExtra={
        !empty ? (
          <EntryIconButton
            label="Remove fill"
            disabled={disabled}
            onClick={() => writeToken(null, "Remove fill")}
          >
            <Minus />
          </EntryIconButton>
        ) : null
      }
    >
      <TokenField
        kind="fill"
        label="Colour"
        bound={bound}
        token={fill}
        tokens={tokens}
        placeholder="None"
        disabled={disabled}
        onPickToken={(t) =>
          writeToken(t as FillColorToken | null, "Set fill")
        }
        onDetach={() => writeCustom(c.hex, c.opacity)}
        onRebind={() => writeToken("card", "Re-bind fill to token")}
        renderRaw={(attach) => (
          <ColorOpacityRow
            hex={c.hex}
            opacity={c.opacity}
            disabled={disabled}
            onChange={(hex, opacity) => writeCustom(hex, opacity)}
            endExtra={attach}
          />
        )}
      />
    </AddableSection>
  );
}

// Static swatch classes for the border colour tokens. Kept as literal
// strings (not interpolated) so Tailwind's JIT keeps them in the build.
const BORDER_SWATCH: Record<BorderColorToken, string> = {
  border: "bg-border",
  foreground: "bg-foreground",
  primary: "bg-primary",
  "muted-foreground": "bg-muted-foreground",
  destructive: "bg-destructive",
  ring: "bg-ring",
};

// Default px for each Tailwind radius token (theme default scale). Used
// to show the rendered pixels alongside the token (rounded-lg · 8px).
// `full` is omitted (it's a 9999px pill, not a meaningful px value).
// RADIUS_PX moved to lib/token-registry — single source for the scoped
// radius tokens + their resolved readouts (imported above).

type UiBorderEntry = BorderEntry & { id: number; visible: boolean };

/**
 * BorderGroup — Paper-style multi-entry border stack. CSS can't paint
 * two borders on one edge, so a "stack" is one entry per edge (All /
 * Top / Right / Bottom / Left). The ＋ in the section header adds an
 * entry (next unused edge); each row has its own width / side / colour,
 * a visibility eye (hide without losing settings — held in local
 * state), and a remove (−). Stroke style is section-level (Tailwind has
 * no per-edge style utility). The section title is muted when empty.
 *
 * Visibility note: hidden entries persist for the lifetime of the
 * selection (component state), not across reloads — only visible
 * entries serialise into the className.
 */
/** Border-side glyphs — Grade's border-stroke icons (Square for all). */
const BORDER_SIDE_ICONS: Record<BorderSide, React.ReactNode> = {
  all: <Square aria-hidden />,
  t: <BorderStrokeTop aria-hidden />,
  r: <BorderStrokeRight aria-hidden />,
  b: <BorderStrokeBottom aria-hidden />,
  l: <BorderStrokeLeft aria-hidden />,
};

function BorderGroup({
  source,
  componentName,
  tag,
  sourceId,
  disabled,
  manifestPropNames,
  onChangeClassName,
  computedStyle,
}: StyleGroupProps) {
  const caps = getSpacingCapabilities({ tag, componentName });
  const contractOwnsBorder = ownsAny(manifestPropNames, [
    "border",
    "borderwidth",
    "border-width",
    "outline",
  ]);
  const cn0 = readClassName(source, componentName, sourceId);

  const idSeq = useRef(0);
  const [entries, setEntries] = useState<UiBorderEntry[]>([]);
  const [style, setStyle] = useState<BorderStyle>("solid");

  // Re-seed from the className whenever the SELECTION changes (not on
  // our own writes — keying on cn0 would wipe hidden entries the moment
  // we serialise). cn0 is read fresh each render, so the effect closure
  // sees the new selection's className when sourceId/componentName flip.
  useEffect(() => {
    const parsed = parseBorderList(cn0);
    setEntries(parsed.map((e) => ({ ...e, id: idSeq.current++, visible: true })));
    setStyle(parseBorderStyle(cn0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceId, componentName]);

  if (!caps.border || contractOwnsBorder) return null;

  const commit = (next: UiBorderEntry[], nextStyle: BorderStyle) => {
    setEntries(next);
    setStyle(nextStyle);
    const visible: BorderEntry[] = next
      .filter((e) => e.visible)
      .map(({ side, width, color }) => ({ side, width, color }));
    onChangeClassName(serializeBorderList(cn0, visible, nextStyle));
  };

  const addEntry = () => {
    const used = new Set(entries.map((e) => e.side));
    const nextSide =
      (BORDER_SIDES as readonly BorderSide[]).find((s) => !used.has(s)) ?? "t";
    commit(
      [
        ...entries,
        { id: idSeq.current++, side: nextSide, width: 1, color: null, visible: true },
      ],
      style,
    );
  };
  const patchEntry = (id: number, patch: Partial<UiBorderEntry>) =>
    commit(
      entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      style,
    );
  const removeEntry = (id: number) =>
    commit(
      entries.filter((e) => e.id !== id),
      style,
    );

  return (
    <AddableSection
      title="Border"
      empty={entries.length === 0}
      addLabel="Add border"
      emptyHint={
        entries.length === 0 ? defaultHint("border", computedStyle) : undefined
      }
      onAdd={addEntry}
    >
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={cn(
            "space-y-1.5 border-t border-border/40 pt-2 first:border-t-0 first:pt-0",
            !entry.visible && "opacity-50",
          )}
        >
          <div className="flex items-end gap-1.5">
            <div className="w-16 shrink-0 space-y-1">
              <Label className={FIELD_LABEL}>Width</Label>
              <Select
                value={String(entry.width)}
                onValueChange={(v) => patchEntry(entry.id, { width: Number(v) })}
                disabled={disabled}
              >
                <SelectTrigger size="2xs" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent size="2xs" position="item-aligned">
                  {BORDER_WIDTH_SCALE.filter((w) => w > 0).map((w) => (
                    <SelectItem key={w} value={String(w)}>
                      {w}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <Label className={FIELD_LABEL}>Side</Label>
              <Select
                value={entry.side}
                onValueChange={(v) => patchEntry(entry.id, { side: v as BorderSide })}
                disabled={disabled}
              >
                <SelectTrigger
                  size="2xs"
                  className="w-full"
                  startSlot={BORDER_SIDE_ICONS[entry.side]}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent size="2xs" position="item-aligned">
                  {BORDER_SIDES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {BORDER_SIDE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <EntryIconButton
              label={entry.visible ? "Hide border" : "Show border"}
              disabled={disabled}
              onClick={() => patchEntry(entry.id, { visible: !entry.visible })}
            >
              {entry.visible ? <Eye /> : <EyeOff />}
            </EntryIconButton>
            <EntryIconButton
              label="Remove border"
              disabled={disabled}
              onClick={() => removeEntry(entry.id)}
            >
              <Minus />
            </EntryIconButton>
          </div>
          <Select
            value={entry.color ?? "default"}
            onValueChange={(v) =>
              patchEntry(entry.id, {
                color: v === "default" ? null : (v as BorderColorToken),
              })
            }
            disabled={disabled}
          >
            <SelectTrigger size="2xs" className="w-full">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent size="2xs" position="item-aligned">
              <SelectItem value="default">Default colour</SelectItem>
              {BORDER_COLOR_TOKENS.map((c) => (
                <SelectItem key={c} value={c}>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-block h-3 w-3 rounded-[3px] border border-border/60",
                        BORDER_SWATCH[c],
                      )}
                    />
                    {c}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      {entries.length > 0 && (
        <div className="space-y-1 border-t border-border/40 pt-2">
          <Label htmlFor="border-style" className={FIELD_LABEL}>
            Stroke style
          </Label>
          <Select
            value={style}
            onValueChange={(v) => commit(entries, v as BorderStyle)}
            disabled={disabled}
          >
            <SelectTrigger id="border-style" size="2xs" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent size="2xs" position="item-aligned">
              {/* Designer-cased label; the lowercase value still lands
                  in the border-* class (same dressing as blend mode). */}
              {BORDER_STYLE_SCALE.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </AddableSection>
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
    // Advanced escape hatch — collapsed by default so it doesn't add
    // noise to the common path.
    <CollapsibleSection title="Class names" defaultOpen={false}>
      <Input
        id="classname-override"
        size="2xs"
        autoComplete="off"
        spellCheck={false}
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
      <p className="text-2xs text-muted-foreground leading-snug">
        The element's classes, verbatim. Anything the controls above
        don't recognise (responsive variants, hover states, arbitrary
        values) is kept here.
      </p>
    </CollapsibleSection>
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
  unit,
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
  /** Optional secondary readout appended to each option as " · <unit>"
   *  — e.g. gap maps the step to its px value (gap-4 · 16px) so the
   *  token AND its rendered size are both visible. */
  unit?: (n: number) => string;
  onValueChange: (next: number | null) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className={FIELD_LABEL}>
        {label}
      </Label>
      <Select
        value={value === null ? "none" : String(value)}
        onValueChange={(next) =>
          onValueChange(next === "none" ? null : Number(next))
        }
        disabled={disabled}
      >
        <SelectTrigger id={id} size="2xs" className="w-full">
          <SelectValue placeholder={noneLabel} />
        </SelectTrigger>
        <SelectContent size="2xs" position="item-aligned">
          <SelectItem value="none">{noneLabel}</SelectItem>
          {scale.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {tokenPrefix}-{n}
              {unit ? ` · ${unit(n)}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Per-side numeric row — Paper / Figma-style spacing control with a
 * combined ↔ individual toggle.
 *
 * Two layouts, switched by the button on the section label:
 *
 *   - Combined (default when sides are axis-symmetric): two compact
 *     inputs — Horizontal (drives left+right) and Vertical (drives
 *     top+bottom). Mirrors Figma auto-layout padding.
 *   - Individual: four inputs (T / R / B / L), each independent.
 *
 * Inputs are directly TYPEABLE — the value is the Tailwind spacing
 * step, so typing 6 writes `p-6`; an empty input clears that side.
 * Decimals (`0.5` → `p-0.5`) are accepted. The serialiser
 * (setPaddingSides / setMarginSides) folds the four-side state into
 * the minimal token set on write, so combined values still collapse
 * to `px-4 py-2` etc.
 *
 * Auto-opens in Individual mode when the parsed sides can't be
 * represented as an x/y pair (e.g. only `pt-4` set). The user can
 * flip either way; the override sticks for the selection's lifetime.
 */
function PerSideRow({
  id: _id,
  label,
  area,
  value,
  source,
  componentName,
  sourceId,
  disabled,
  onApplySource,
  defaultValue,
  computedSides,
}: {
  id: string;
  label: string;
  /** Which spacing family this row edits — drives the token prefix
   *  (p/m), the registry scope, and the per-side inline-style keys. */
  area: "padding" | "margin";
  /** Parsed side tokens (Tailwind spacing steps) from the className. */
  value: SideValues;
  source: string | null;
  componentName: string;
  sourceId?: string;
  disabled?: boolean;
  onApplySource?: (mutate: (src: string) => string, label: string) => void;
  /** Contract-shipped baked side tokens (parsed from styleDefaults) —
   *  REAL classes from the component source, ghosted as dulled chips. */
  defaultValue?: SideValues;
  /** Live computed per-side values ("24px") — drives the Default
   *  caption so a component's baked-in padding reads true. */
  computedSides?: Partial<Record<"t" | "r" | "b" | "l", string>>;
}) {
  const prefix = area === "padding" ? "p" : "m";
  const setter = area === "padding" ? setPaddingSides : setMarginSides;
  const STYLE_KEYS: Record<"t" | "r" | "b" | "l", string> = {
    t: `${area}Top`,
    r: `${area}Right`,
    b: `${area}Bottom`,
    l: `${area}Left`,
  };
  // Detached (raw CSS length) values ride inline style per side — the
  // only carrier Fast Frame renders.
  const inline = source
    ? readInlineStyle(source, componentName, sourceId)
    : {};
  const dim = (s: "t" | "r" | "b" | "l") => inline?.[STYLE_KEYS[s]] ?? null;

  // Sides collapse to an x/y pair only when opposite sides match —
  // bound tokens AND detached values both. When NOTHING is authored,
  // the contract defaults drive the picture too: CardFooter's `p-6
  // pt-0` is not axis-symmetric, so the row opens per-side rather than
  // showing a lying `py-0` chip.
  const nothingAuthored =
    value.t === null &&
    value.r === null &&
    value.b === null &&
    value.l === null &&
    dim("t") === null &&
    dim("r") === null &&
    dim("b") === null &&
    dim("l") === null;
  const defaultsAxisSymmetric =
    !defaultValue ||
    ((defaultValue.l ?? null) === (defaultValue.r ?? null) &&
      (defaultValue.t ?? null) === (defaultValue.b ?? null));
  const axisRepresentable =
    value.l === value.r &&
    value.t === value.b &&
    dim("l") === dim("r") &&
    dim("t") === dim("b") &&
    (!nothingAuthored || defaultsAxisSymmetric);
  const [userMode, setUserMode] = useState<"axes" | "sides" | null>(null);
  const mode: "axes" | "sides" =
    userMode ?? (axisRepresentable ? "axes" : "sides");

  // Bind side(s) to a token (clearing their inline values) / detach
  // side(s) to a raw CSS length (clearing their tokens) — one undo step.
  const writeTokens = (
    next: SideValues,
    clearSides: ("t" | "r" | "b" | "l")[],
    lbl: string,
  ) =>
    onApplySource?.((src) => {
      const cnNow = readClassName(src, componentName, sourceId);
      const nextCn = setter(cnNow, next);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        nextCn === "" ? null : nextCn,
        sourceId,
      );
      return setInlineStyle(
        src2,
        componentName,
        Object.fromEntries(clearSides.map((s) => [STYLE_KEYS[s], null])),
        sourceId,
      );
    }, lbl);
  const writeDims = (
    sides: ("t" | "r" | "b" | "l")[],
    cssDim: string,
    lbl: string,
  ) =>
    onApplySource?.((src) => {
      const cnNow = readClassName(src, componentName, sourceId);
      const cleared: SideValues = { ...value };
      for (const s of sides) cleared[s] = null;
      const nextCn = setter(cnNow, cleared);
      const src2 = updateComponentProp(
        src,
        componentName,
        "className",
        nextCn === "" ? null : nextCn,
        sourceId,
      );
      return setInlineStyle(
        src2,
        componentName,
        Object.fromEntries(sides.map((s) => [STYLE_KEYS[s], cssDim])),
        sourceId,
      );
    }, lbl);

  // One TokenField per side/axis — the SAME Field component as every
  // other property: bound chip, in-field detach/attach, freeform units.
  const field = (
    sides: ("t" | "r" | "b" | "l")[],
    suffix: string,
    icon: React.ReactNode,
    aria: string,
  ) => {
    const tokenStep = value[sides[0]];
    const sideDim = dim(sides[0]);
    // Multi-side (axis) fields only ghost a default when BOTH covered
    // sides agree — never average or pick one.
    const defSteps = sides.map((s) => defaultValue?.[s] ?? null);
    const defStep = defSteps.every((d) => d === defSteps[0])
      ? defSteps[0]
      : null;
    const tokens: TokenOption[] = getAreaTokens(area).map((t) => ({
      value: t.value,
      label: `${prefix}${suffix}-${t.value}`,
      hint: t.hint,
    }));
    const seed = `${(tokenStep ?? 0) * 4}px`;
    return (
      <TokenField
        kind={area}
        bound={sideDim === null}
        token={tokenStep === null ? null : String(tokenStep)}
        tokens={tokens}
        // Unset shows the CONTRACT-shipped baked default as a dulled
        // chip when one exists (REAL classes from the component source —
        // CardContent's p-6), else a plain greyed "0". Never derived
        // from computed px: no fabricated tokens.
        ghostToken={
          tokenStep === null && sideDim === null && defStep != null
            ? {
                label: `${prefix}${suffix}-${defStep}`,
                // Token explainer — unit stays WITH the number.
                hint: `${defStep * 4}px`,
              }
            : undefined
        }
        placeholder="0"
        placeholderHint="0px"
        unitSuffix="px"
        disabled={disabled}
        triggerIcon={
          <IconTip label={aria}>
            <span className="flex items-center">{icon}</span>
          </IconTip>
        }
        onPickToken={(t) => {
          const v = t === null ? null : Number(t);
          const next = { ...value };
          for (const s of sides) next[s] = v;
          writeTokens(next, sides, `Set ${label.toLowerCase()}`);
        }}
        currentRaw={sideDim ?? undefined}
        onDetach={() =>
          writeDims(sides, sideDim ?? seed, `Set custom ${label.toLowerCase()}`)
        }
        onRebind={() => {
          const next = { ...value };
          for (const s of sides) next[s] = 4;
          writeTokens(next, sides, `Re-bind ${label.toLowerCase()} to token`);
        }}
        renderRaw={(attach) => (
          <CompactDimensionField
            ariaLabel={aria}
            icon={icon}
            value={sideDim ?? seed}
            disabled={disabled}
            onCommit={(v) =>
              writeDims(sides, v, `Set custom ${label.toLowerCase()}`)
            }
            endExtra={attach}
          />
        )}
      />
    );
  };

  // Nothing authored → surface the component's baked default as a
  // display-only caption (same pattern as Radius/Border/Shadow). This
  // is the truthful answer for cva-styled components (Button, Card
  // parts) whose screen JSX carries no className at all.
  // (`nothingAuthored` is computed above, where the mode calc needs it.)
  const defaultCaption = (() => {
    if (!nothingAuthored || !computedSides) return null;
    const { t, r, b, l } = computedSides;
    if (!t || !r || !b || !l) return null;
    if ([t, r, b, l].every((v) => parseFloat(v) === 0)) return null;
    // CSS-shorthand style: one value when uniform, two when axis-
    // symmetric, else all four (T R B L).
    if (t === r && r === b && b === l) return t;
    if (t === b && l === r) return `${t} ${r}`;
    return `${t} ${r} ${b} ${l}`;
  })();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-baseline gap-2">
          <Label className={cn(FIELD_LABEL, "shrink-0")}>{label}</Label>
          {defaultCaption ? <DefaultCaption value={defaultCaption} /> : null}
        </span>
        {/* Mode toggle — Paper's little expand glyph. Maximize2 when
            combined (offers "break out into 4 sides"); Minimize2 when
            individual (offers "collapse to H/V"). Tinted when in the
            individual state so the panel reads its current mode at a
            glance. */}
        <IconTip
          label={
            mode === "axes"
              ? "Edit each side individually"
              : "Collapse to horizontal / vertical"
          }
        >
          {/* Ghost — expand toggles read as quiet chrome. */}
          <button
            type="button"
            onClick={() => setUserMode(mode === "axes" ? "sides" : "axes")}
            disabled={disabled}
            aria-label={
              mode === "axes"
                ? "Edit each side individually"
                : "Collapse to horizontal and vertical"
            }
            className={cn(
              "inline-flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 [&_svg]:size-3",
              mode === "sides" && "bg-muted text-foreground",
            )}
          >
            {mode === "axes" ? <Maximize2 /> : <Minimize2 />}
          </button>
        </IconTip>
      </div>
      {mode === "axes" ? (
        <div className="grid grid-cols-2 gap-1.5">
          {field(
            ["l", "r"],
            "x",
            area === "padding" ? <PaddingHorizontal /> : <MarginHorizontal />,
            `${label} horizontal`,
          )}
          {field(
            ["t", "b"],
            "y",
            area === "padding" ? <PaddingVertical /> : <MarginVertical />,
            `${label} vertical`,
          )}
        </div>
      ) : (
        // 2×2 — TokenFields carry a chip + detach affordance, too wide
        // for the old 4-up row.
        <div className="grid grid-cols-2 gap-1.5">
          {field(
            ["t"],
            "t",
            area === "padding" ? <PaddingTop /> : <MarginTop />,
            `${label} top`,
          )}
          {field(
            ["r"],
            "r",
            area === "padding" ? <PaddingRight /> : <MarginRight />,
            `${label} right`,
          )}
          {field(
            ["b"],
            "b",
            area === "padding" ? <PaddingBottom /> : <MarginBottom />,
            `${label} bottom`,
          )}
          {field(
            ["l"],
            "l",
            area === "padding" ? <PaddingLeft /> : <MarginLeft />,
            `${label} left`,
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact typeable spacing input — a small bordered field with a
 * leading side glyph (Paper-style). The value is the Tailwind spacing
 * step; empty means "no token on this side". Local draft + debounced
 * commit so typing stays snappy and the canvas only re-renders on a
 * typing pause; blur + Enter flush immediately. Resyncs from source
 * when not focused (chat regen / undo flows back in).
 */
function SideInput({
  id,
  icon,
  ariaLabel,
  value,
  disabled,
  onCommit,
}: {
  id: string;
  icon: React.ReactNode;
  ariaLabel: string;
  value: number | null;
  disabled?: boolean;
  onCommit: (next: number | null) => void;
}) {
  // px-PRIMARY: the input shows/accepts pixels (Paper-style) while the
  // stored value is the Tailwind spacing STEP (px ÷ 4). On commit we
  // snap to the nearest valid half-step so it always round-trips to a
  // real token (p-4, p-3.5, …) — no arbitrary p-[13px] ever lands.
  const stepToPx = (step: number) => step * 4;
  const [draft, setDraft] = useState(
    value === null ? "" : String(stepToPx(value)),
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (inputRef.current && document.activeElement === inputRef.current) return;
    setDraft(value === null ? "" : String(stepToPx(value)));
  }, [value]);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const commit = (raw: string): boolean => {
    const trimmed = raw.trim().replace(/px$/i, "").trim();
    if (trimmed === "") {
      onCommit(null);
      return true;
    }
    // Plain number first; then maths ("16/2", "4*4+2").
    let px = /^-?\d*\.?\d+$/.test(trimmed) ? Number(trimmed) : NaN;
    if (!Number.isFinite(px)) {
      const evaluated = evalMath(trimmed);
      px = evaluated === null ? NaN : evaluated;
    }
    if (!Number.isFinite(px) || px < 0) return false;
    // px → step, snapped to the nearest 0.5 (Tailwind's finest grain).
    const step = Math.round((px / 4) * 2) / 2;
    onCommit(step);
    return true;
  };
  const schedule = (raw: string) => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      commit(raw);
    }, 150);
  };

  // Built on the standard Input with start/end slots — the side glyph
  // leads, a muted "px" unit trails — so this is just a configured DS
  // input, not a bespoke field. Reusable anywhere a unit input is
  // wanted (shader params, etc.).
  return (
    <Input
      id={id}
      ref={inputRef}
      size="2xs"
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      aria-label={ariaLabel}
      title={ariaLabel}
      value={draft}
      // Ghost "0" for UNSET (placeholder styling = muted), not a dash.
      // The set/unset record lives in the JSX: no token = unset (the
      // component's own default applies), an explicit `p-0` = solid 0.
      // Clearing the field returns to unset. When ComputedStyleHint
      // grows per-side paddings, this ghost should show the TRUE
      // effective value instead of a blind 0.
      placeholder="0"
      disabled={disabled}
      className="tabular-nums"
      onChange={(e) => {
        setDraft(e.currentTarget.value);
        schedule(e.currentTarget.value);
      }}
      onBlur={(e) => {
        if (timer.current !== null) {
          window.clearTimeout(timer.current);
          timer.current = null;
        }
        // Failed input (bad maths, negative) reverts to the previous
        // value rather than lingering as garbage.
        if (!commit(e.currentTarget.value)) {
          setDraft(value === null ? "" : String(stepToPx(value)));
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          inputRef.current?.blur();
          return;
        }
        // ↑/↓ nudge by one spacing step (4px; ⇧ = 10 steps), committing
        // live. Steps (not raw px) so the snap never fights the arrows.
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          const t = draft.trim().replace(/px$/i, "").trim();
          const parsed =
            t === ""
              ? null
              : /^-?\d*\.?\d+$/.test(t)
                ? Number(t)
                : evalMath(t);
          const curPx =
            parsed !== null && Number.isFinite(parsed)
              ? (parsed as number)
              : value === null
                ? 0
                : stepToPx(value);
          const delta =
            (e.shiftKey ? 40 : 4) * (e.key === "ArrowUp" ? 1 : -1);
          const nextPx = Math.max(0, curPx + delta);
          setDraft(String(nextPx));
          commit(String(nextPx));
        }
      }}
      startSlot={
        <span aria-hidden className="inline-flex [&_svg]:size-4">
          {icon}
        </span>
      }
      endSlot={
        draft.trim() !== "" ? (
          <span className="text-[9px] text-muted-foreground/60">px</span>
        ) : undefined
      }
    />
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
    //
    // Unset → resolve the REAL default: the sidecar's declared default
    // if present, else the cva defaultVariants shipped on the contract
    // (Button size → "md"). The Select's value falls back to it so the
    // open menu shows the effective choice checked (standard menu
    // behaviour); the trigger renders it muted so set vs unset still
    // reads at a glance, same as the spacing ghost-zeros. Radix only
    // fires onValueChange on an actual change, so re-picking the
    // default while unset writes nothing — the prop stays unauthored.
    const resolvedDefault =
      prop.defaultValue ??
      getContractVariantDefault(componentName, prop.name) ??
      undefined;
    return (
      <PropRow prop={prop}>
        <Select
          value={currentStr ?? resolvedDefault}
          onValueChange={(v) => {
            const match = values.find((val) => String(val) === v);
            onChange(prop.name, match ?? null);
          }}
          disabled={disabled}
        >
          <SelectTrigger
            size="2xs"
            className={cn("w-full", !currentStr && "text-muted-foreground")}
          >
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent size="2xs" position="item-aligned">
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
          size="2xs"
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
        autoComplete="off"
        spellCheck={false}
        // size="2xs" gives a clean text-xs; relying on a `text-xs`
        // className override didn't beat the default size's `md:text-sm`
        // at desktop widths, which made the src/url field render oversized.
        size="2xs"
        className={cn(type === "text" && "font-mono")}
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
        className={cn("truncate", FIELD_LABEL)}
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
  hideHeader,
}: {
  actions: NonNullable<ComponentContract["actions"]>;
  componentName: string;
  selection: StudioSelection | null;
  appSource: string | null;
  /** Suppress the "Actions" header + top divider — used when the row is
   *  nested inside another group (e.g. Fill/Refresh inside the Image
   *  section) and shouldn't read as its own section. */
  hideHeader?: boolean;
}) {
  const entries = Object.entries(actions) as [string, ActionContract][];
  if (entries.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        !hideHeader && "pt-1 border-t border-border",
      )}
    >
      {!hideHeader && (
        // Sentence case, no uppercase — matches the rest of the
        // inspector group headers. House style.
        <span className="text-2xs font-medium text-muted-foreground">
          Actions
        </span>
      )}
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
