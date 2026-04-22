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
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  PanelRightClose,
  RotateCcw,
  Settings2,
} from "lucide-react";
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

// Mirrors the shape returned by /api/component-manifest. Duplicated here
// (rather than imported from lib/component-refs) because that module imports
// `fs` at top-level — a client component importing it would blow up the
// build. The contract is narrow enough that manual sync is cheap; if it
// ever grows we can extract a shared type to a server-safe file.
interface ManifestProp {
  name: string;
  optional: boolean;
  kind: "string" | "number" | "boolean" | "enum" | "unknown";
  enum?: ReadonlyArray<string | number>;
  defaultValue?: string;
  description?: string;
  raw: string;
}
interface Manifest {
  name: string;
  part: string;
  import?: string;
  props: ManifestProp[];
  when_to_use?: string;
}

interface StudioSettingsPanelProps {
  /** Current preview selection — must have `componentName` + `part` for the
   *  panel to render meaningful controls. */
  selection: StudioSelection | null;
  /** The App.tsx source the preview is currently rendering. */
  appSource: string | null;
  /** Called with a new App.tsx source when a control changes. Parent should
   *  persist this into the per-design appSource map so Sandpack HMRs to it. */
  onSourceChange: (next: string) => void;
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
  useEffect(() => {
    if (!part) {
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
  }, [part]);

  // Props the panel can actually render controls for. We drop kind "unknown"
  // (functions, object types, ReactNode) because there's no sensible UI for
  // them — the chat remains the escape hatch for those.
  const settableProps = useMemo(() => {
    if (!manifest) return [] as ManifestProp[];
    return manifest.props.filter((p) => p.kind !== "unknown");
  }, [manifest]);

  // Does the current App source actually contain this component? If not,
  // mutations would silently no-op — surface that to the user rather than
  // leaving them wondering why the Switch doesn't do anything.
  const componentPresent = useMemo(() => {
    if (!componentName || !appSource) return false;
    return findComponentOpenTag(appSource, componentName) !== null;
  }, [appSource, componentName]);

  if (!componentName || !part) return null;

  const handleChange = (propName: string, value: PropValue) => {
    if (appSource == null) return;
    const next = updateComponentProp(appSource, componentName, propName, value);
    if (next !== appSource) onSourceChange(next);
  };

  const handleReset = () => {
    if (!appSource) return;
    let next = appSource;
    for (const prop of settableProps) {
      next = updateComponentProp(next, componentName, prop.name, null);
    }
    if (next !== appSource) onSourceChange(next);
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

      {manifest && settableProps.length === 0 && !error && (
        <p className="text-[11px] text-muted-foreground">
          No quick controls for this component. Use the chat to edit it.
        </p>
      )}

      {settableProps.length > 0 && (
        <div className={cn("space-y-2.5", variant === "docked" && "space-y-3")}>
          {settableProps.map((prop) => (
            <PropControl
              key={prop.name}
              prop={prop}
              source={appSource}
              componentName={componentName}
              disabled={!componentPresent}
              onChange={handleChange}
            />
          ))}
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
        {manifest?.when_to_use && (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {manifest.when_to_use}
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
  disabled,
  onChange,
}: {
  prop: ManifestProp;
  source: string | null;
  componentName: string;
  disabled?: boolean;
  onChange: (propName: string, value: PropValue) => void;
}) {
  const current = source
    ? readComponentProp(source, componentName, prop.name)
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
