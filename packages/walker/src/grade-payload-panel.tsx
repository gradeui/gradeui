"use client";

/**
 * GradePayloadPanel — the Code tab's tabbed view.
 *
 * One segmented control (JSX / JSON) + one action button. The button
 * label flips:
 *   - JSX tab active   → "Copy JSX"   (writes the canonicalised JSX to clipboard)
 *   - JSON tab active  → "Send to Figma"  (writes the Grade payload + emits a toast)
 *
 * Visual chrome is CSS-variables-only. No Tailwind, no @gradeui/ui import.
 * The walker package stays portable, and consumers wire it into their
 * own theme via the `--gds-walker-*` tokens at the bottom of this file
 * (they fall back to sensible defaults).
 *
 * Code rendering is a slot: `renderCode={({ code, language }) => ...}`
 * so the docs site can plug in its prism-react-renderer highlighter
 * without the walker package having to bundle one.
 */

import * as React from "react";
import { useGradeSerialize } from "./use-grade-serialize";
import type { WalkOptions } from "./walk";

type View = "source" | "jsx" | "json";

export interface GradePayloadPanelProps {
  /** JSX/TSX source string — the same text the Code tab was already showing. */
  source: string | null | undefined;
  /**
   * Optional initial tab. Defaults to "source" so the panel preserves the
   * old Code tab UX (full source, imports, data, function bodies). The
   * "jsx" tab shows the canonicalised walker output; "json" shows the
   * Grade payload bound for the Figma plugin.
   */
  defaultView?: View;
  /** Optional walker options. Forwarded to useGradeSerialize. */
  walkerOptions?: WalkOptions;
  /**
   * Slot that renders the active body. If omitted, falls back to a plain `<pre>`.
   * Receives the resolved code text plus a hint at the language ("tsx" for
   * both the source and walked-JSX views, "json" for the payload view) so
   * consumers can pass it to a highlighter.
   */
  renderCode?: (args: { code: string; language: "tsx" | "json" }) => React.ReactNode;
  /**
   * Toast handler. Called after a successful copy. The walker package
   * stays toast-library agnostic by leaving the actual surface to the
   * host app. Defaults to a no-op.
   */
  onToast?: (message: string) => void;
  /**
   * Optional analytics hook for the Send-to-Figma click. The PRD calls
   * out tracking the click as the primary interest signal — wire it up
   * here and the walker stays unopinionated about which framework you use.
   */
  onSendToFigma?: (json: string) => void;
  /** Optional className on the outer wrapper. */
  className?: string;
}

export function GradePayloadPanel({
  source,
  defaultView = "source",
  walkerOptions,
  renderCode,
  onToast,
  onSendToFigma,
  className,
}: GradePayloadPanelProps) {
  const [view, setView] = React.useState<View>(defaultView);
  // walkerOptions is referenced inside the hook; spread the scalars so we
  // don't trigger the "fresh-object every render" memo-bust pattern.
  const { json, jsx, ir } = useGradeSerialize(source, walkerOptions);

  // Source is shown verbatim — what the model emitted, full module with
  // imports, hooks, helpers. Walked JSX is the canonicalised tree the IR
  // produced (loses non-renderable code but reads like a clean tree).
  // JSON is the Grade payload.
  const sourceText = source ?? "";
  const code =
    view === "json" ? json : view === "jsx" ? jsx : sourceText;
  const language = view === "json" ? "json" : "tsx";

  const handleAction = React.useCallback(async () => {
    const payload =
      view === "json" ? json : view === "jsx" ? jsx : (source ?? "");
    const ok = await copyToClipboard(payload);
    if (view === "json") {
      onToast?.(
        ok
          ? "Payload copied. Switch to Figma and paste in the Grade plugin."
          : "Couldn't copy — select the JSON and copy manually.",
      );
      if (ok) onSendToFigma?.(payload);
    } else if (view === "jsx") {
      onToast?.(ok ? "Walked JSX copied." : "Couldn't copy.");
    } else {
      onToast?.(ok ? "Source copied." : "Couldn't copy.");
    }
  }, [view, json, jsx, source, onToast, onSendToFigma]);

  const buttonLabel =
    view === "json"
      ? "Send to Figma"
      : view === "jsx"
        ? "Copy walked JSX"
        : "Copy source";

  // Surface walker-level errors / dropped expressions so the user knows
  // why the payload looks different to what they wrote. Only shown when
  // the JSON view is active — the JSX views (source + walked) are
  // loss-free either at the source level or the IR level.
  const visibleDiagnostics =
    view === "json"
      ? ir.diagnostics.filter((d) => d.level === "warning" || d.level === "error")
      : [];

  return (
    <div className={className} data-gds-part="grade-payload-panel" style={WRAPPER_STYLE}>
      <div style={TOOLBAR_STYLE}>
        <div role="tablist" aria-label="Code view" style={TABS_STYLE}>
          <Tab active={view === "source"} onClick={() => setView("source")}>
            Source
          </Tab>
          <Tab active={view === "jsx"} onClick={() => setView("jsx")}>
            Walked
          </Tab>
          <Tab active={view === "json"} onClick={() => setView("json")}>
            JSON
          </Tab>
        </div>
        <button
          type="button"
          onClick={handleAction}
          style={
            view === "json"
              ? { ...BUTTON_STYLE, ...BUTTON_PRIMARY_STYLE }
              : BUTTON_STYLE
          }
          data-gds-part="grade-payload-panel-action"
        >
          {buttonLabel}
        </button>
      </div>

      {visibleDiagnostics.length ? (
        <ul style={DIAGNOSTICS_STYLE} aria-label="Walker diagnostics">
          {visibleDiagnostics.slice(0, 4).map((d, i) => (
            <li key={i} style={DIAGNOSTIC_ITEM_STYLE}>
              <span style={DIAGNOSTIC_LEVEL_STYLE}>{d.level}</span>
              <span style={DIAGNOSTIC_PATH_STYLE}>{d.path}</span>
              <span>{d.message}</span>
            </li>
          ))}
          {visibleDiagnostics.length > 4 ? (
            <li style={DIAGNOSTIC_ITEM_STYLE}>+{visibleDiagnostics.length - 4} more…</li>
          ) : null}
        </ul>
      ) : null}

      <div style={BODY_STYLE}>
        {renderCode ? (
          renderCode({ code, language })
        ) : (
          <pre style={FALLBACK_PRE_STYLE}>{code}</pre>
        )}
      </div>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-state={active ? "active" : "inactive"}
      onClick={onClick}
      style={{
        ...TAB_STYLE,
        ...(active ? TAB_ACTIVE_STYLE : null),
      }}
    >
      {children}
    </button>
  );
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  // Legacy fallback for clipboard-API-less environments. Browsers
  // sometimes reject `writeText` if the document isn't focused; this
  // keeps the action working in those cases.
  if (typeof document === "undefined") return false;
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// ─── Styles — CSS variables, no className dependency ─────────────────────

const WRAPPER_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  width: "100%",
  fontFamily:
    "var(--gds-walker-font, var(--font-sans, ui-sans-serif, system-ui, sans-serif))",
  background:
    "var(--gds-walker-surface, oklch(var(--rds-card, 1 0 0)))",
  color: "var(--gds-walker-foreground, oklch(var(--rds-foreground, 0.15 0 0)))",
};

const TOOLBAR_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--gds-walker-toolbar-gap, 0.5rem)",
  padding: "var(--gds-walker-toolbar-py, 0.5rem) var(--gds-walker-toolbar-px, 0.75rem)",
  borderBottom:
    "1px solid var(--gds-walker-border, oklch(var(--rds-border, 0.9 0 0)))",
  background:
    "var(--gds-walker-toolbar-bg, oklch(var(--rds-muted, 0.96 0 0) / 0.5))",
};

const TABS_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--gds-walker-tabs-gap, 0.125rem)",
  padding: "0.125rem",
  borderRadius: "var(--gds-walker-radius, 0.5rem)",
  background:
    "var(--gds-walker-tabs-bg, oklch(var(--rds-background, 1 0 0)))",
  border:
    "1px solid var(--gds-walker-border, oklch(var(--rds-border, 0.9 0 0)))",
};

const TAB_STYLE: React.CSSProperties = {
  appearance: "none",
  border: 0,
  background: "transparent",
  color: "var(--gds-walker-muted-foreground, oklch(var(--rds-muted-foreground, 0.5 0 0)))",
  font: "inherit",
  fontSize: "0.75rem",
  fontWeight: 500,
  letterSpacing: "0.01em",
  padding: "0.25rem 0.625rem",
  borderRadius: "calc(var(--gds-walker-radius, 0.5rem) - 0.125rem)",
  cursor: "pointer",
  transition: "background 120ms ease, color 120ms ease",
};

const TAB_ACTIVE_STYLE: React.CSSProperties = {
  color: "var(--gds-walker-foreground, oklch(var(--rds-foreground, 0.15 0 0)))",
  background:
    "var(--gds-walker-tab-active-bg, oklch(var(--rds-card, 1 0 0)))",
  boxShadow:
    "var(--gds-walker-tab-active-shadow, 0 1px 2px oklch(0 0 0 / 0.06))",
};

const BUTTON_STYLE: React.CSSProperties = {
  appearance: "none",
  border: "1px solid var(--gds-walker-border, oklch(var(--rds-border, 0.9 0 0)))",
  background:
    "var(--gds-walker-button-bg, oklch(var(--rds-background, 1 0 0)))",
  color: "var(--gds-walker-foreground, oklch(var(--rds-foreground, 0.15 0 0)))",
  font: "inherit",
  fontSize: "0.75rem",
  fontWeight: 500,
  padding: "0.3125rem 0.75rem",
  borderRadius: "var(--gds-walker-radius, 0.5rem)",
  cursor: "pointer",
  transition: "background 120ms ease, transform 60ms ease",
};

const BUTTON_PRIMARY_STYLE: React.CSSProperties = {
  background:
    "var(--gds-walker-primary, oklch(var(--rds-primary, 0.2 0 0)))",
  color:
    "var(--gds-walker-primary-foreground, oklch(var(--rds-primary-foreground, 0.98 0 0)))",
  borderColor:
    "var(--gds-walker-primary, oklch(var(--rds-primary, 0.2 0 0)))",
};

const BODY_STYLE: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
};

const FALLBACK_PRE_STYLE: React.CSSProperties = {
  margin: 0,
  padding: "1rem",
  height: "100%",
  overflow: "auto",
  fontFamily:
    "var(--gds-walker-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
  fontSize: "0.75rem",
  lineHeight: 1.6,
  whiteSpace: "pre",
  color: "inherit",
};

const DIAGNOSTICS_STYLE: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: "0.5rem 0.75rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  borderBottom:
    "1px solid var(--gds-walker-border, oklch(var(--rds-border, 0.9 0 0)))",
  background:
    "var(--gds-walker-diagnostic-bg, oklch(var(--rds-muted, 0.96 0 0) / 0.4))",
  fontSize: "0.6875rem",
  color: "var(--gds-walker-muted-foreground, oklch(var(--rds-muted-foreground, 0.5 0 0)))",
};

const DIAGNOSTIC_ITEM_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "0.5rem",
  fontVariantNumeric: "tabular-nums",
};

const DIAGNOSTIC_LEVEL_STYLE: React.CSSProperties = {
  textTransform: "uppercase",
  fontSize: "0.625rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  color: "var(--gds-walker-warning, oklch(0.6 0.18 60))",
};

const DIAGNOSTIC_PATH_STYLE: React.CSSProperties = {
  fontFamily:
    "var(--gds-walker-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
  color: "var(--gds-walker-foreground, oklch(var(--rds-foreground, 0.15 0 0)))",
};
