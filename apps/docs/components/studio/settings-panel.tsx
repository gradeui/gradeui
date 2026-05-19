"use client";

/**
 * StudioSettingsPanel — Stage 3 of the highlight-and-comment feature.
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
  ChevronUp,
  Loader2,
  PanelRightClose,
  RotateCcw,
  Settings2,
} from "lucide-react";
import { getComponentContract } from "@gradeui/ui";
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
import type { StudioSelection } from "@/lib/chat-sandpack";
import {
  findComponentOpenTag,
  readComponentProp,
  updateComponentProp,
  type PropValue,
} from "@/lib/studio-source-mutator";
import {
  readDataArrayEntryField,
  updateDataArrayEntry,
  type SerialisableValue,
} from "@/lib/data-array-mutator";

// Shape returned by /api/component-manifest — sourced from
// `@gradeui/studio/playbook` which is now fs-free at runtime (sidecars are
// inlined into a TS string map at build time) so a client component can
// safely pull types from it without tripping the `fs` import.
import type {
  PropManifest as ManifestProp,
  ComponentManifest as Manifest,
} from "@gradeui/studio/playbook";

interface StudioSettingsPanelProps {
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

export function StudioSettingsPanel({
  selection,
  appSource,
  onSourceChange,
  variant = "inline",
  onRequestDock,
  onRequestUndock,
  className,
}: StudioSettingsPanelProps) {
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

  // Does the current App source actually contain this component? If not,
  // mutations would silently no-op — surface that to the user rather than
  // leaving them wondering why the Switch doesn't do anything.
  const componentPresent = useMemo(() => {
    if (!componentName || !appSource) return false;
    return findComponentOpenTag(appSource, componentName) !== null;
  }, [appSource, componentName]);

  if (!componentName || !part) return null;

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
    const next = updateComponentProp(appSource, componentName, propName, value);
    if (next !== appSource) onSourceChange(next, literalPreview);
  };

  // ─── Reset ────────────────────────────────────────────────────
  // Clear every settable prop on the selected component / instance.
  // The undo snapshot is tagged "Reset properties" so the tooltip
  // reflects the bulk nature of the action.
  const handleReset = () => {
    if (!appSource) return;
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
      next = updateComponentProp(next, componentName, prop.name, null);
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

      {settableProps.length > 0 && (
        <div className={cn("space-y-2.5", variant === "docked" && "space-y-3")}>
          {settableProps.map((prop) => {
            const design = propDesignByName[prop.name];
            const perItem =
              (design === "content" || design === "structured") &&
              Boolean(selection?.instanceId);
            return (
              <PropControl
                // Include instanceId in the key so switching from one
                // <MediaSurface> to another (same component name, same
                // part) fully remounts the control. Without this React
                // would re-use LiveInput's local draft state from the
                // previous selection and the field would appear "stuck"
                // on the first card's value.
                key={`${prop.name}::${perItem ? selection?.instanceId : "template"}`}
                prop={prop}
                source={appSource}
                componentName={componentName}
                // When the prop is per-item AND we have an instanceId,
                // read from the data-array entry. Otherwise fall back
                // to the template-wide JSX-tag read (knobs, no-contract
                // components, standalone surfaces with no instanceId).
                instanceId={perItem ? selection?.instanceId : undefined}
                disabled={!componentPresent}
                onChange={handleChange}
              />
            );
          })}
        </div>
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
        data-gds-part="studio-settings-panel"
      >
        <header className="flex items-center gap-2 text-sm border-b border-border pb-2">
          <Settings2 className="h-4 w-4 text-primary" />
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
        {effectiveManifest?.when_to_use && (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {effectiveManifest.when_to_use}
          </p>
        )}
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
      data-gds-part="studio-settings-panel"
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
function PropControl({
  prop,
  source,
  componentName,
  instanceId,
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
  disabled?: boolean;
  onChange: (propName: string, value: PropValue) => void;
}) {
  const current = source
    ? instanceId
      ? readDataArrayEntryField(source, instanceId, prop.name)
      : readComponentProp(source, componentName, prop.name)
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
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
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
