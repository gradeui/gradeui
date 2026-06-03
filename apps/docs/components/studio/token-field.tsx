"use client";

/**
 * TokenField — the inspector's universal value control, modelled on
 * Figma's "variable" binding.
 *
 * A field is either:
 *   - BOUND (default) — tied to a design token from its property's
 *     registry. Renders as a token picker with the hexagon "bound"
 *     glyph (the same signal Figma uses).
 *   - DETACHED — a raw, custom value. The same field flips to a raw
 *     editor (px, hex + opacity, X/Y/blur/spread…) supplied by the
 *     caller via `renderRaw`, and shows the unlink glyph + an
 *     "overrides theme defaults" tone.
 *
 * Binding is a property of the FIELD, not a separate mode sitting next
 * to it — so every style section (Radius, Shadow, Fill, Opacity,
 * spacing) reuses this one control and inherits identical treatments:
 * the 2xs size scale, the glyph, the detach/rebind toggle, the
 * override marker. The token list is registry-driven, which is the
 * seam the DTCG token migration plugs into later (see STUDIO-FILLS.md).
 */

import * as React from "react";
import { Hexagon, Link2, Link2Off } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const FIELD_LABEL = "text-2xs font-normal text-muted-foreground";

type ControlSize = "2xs" | "xs" | "sm";

export interface TokenOption {
  value: string;
  label: string;
  /** Optional swatch/preview shown left of the label (a colour chip,
   *  etc.) — mirrored into the trigger by Radix's SelectValue. */
  preview?: React.ReactNode;
  /** Resolved value shown right-aligned in the menu (e.g. "8", "12px") —
   *  Figma's token→value readout. */
  hint?: string;
}

export interface TokenFieldProps {
  /** Property kind — drives the detach/rebind tooltip copy only. */
  kind: string;
  label?: string;
  /** Bound to a token (true) or detached/raw (false). */
  bound: boolean;
  /** Current token key when bound (null = unset / "None"). */
  token?: string | null;
  tokens: TokenOption[];
  placeholder?: string;
  size?: ControlSize;
  disabled?: boolean;
  /** Pick a token (null clears to "None") — only used while bound. */
  onPickToken: (token: string | null) => void;
  /** Bound → detached. The caller seeds the raw value from whatever was
   *  resolved (token value / computed style / a sane default). */
  onDetach: () => void;
  /** Detached → bound (re-bind to a token). */
  onRebind: () => void;
  /** Raw editor, rendered when detached. */
  renderRaw?: () => React.ReactNode;
}

export function TokenField({
  kind,
  label,
  bound,
  token,
  tokens,
  placeholder = "None",
  size = "2xs",
  disabled,
  onPickToken,
  onDetach,
  onRebind,
  renderRaw,
}: TokenFieldProps) {
  return (
    <div className="space-y-1">
      {label ? (
        <div className="flex items-center justify-between">
          <span className={FIELD_LABEL}>{label}</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => (bound ? onDetach() : onRebind())}
            title={
              bound
                ? `Detach ${kind} — use a custom value`
                : `Bind ${kind} to a token`
            }
            aria-pressed={!bound}
            className={cn(
              "inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 [&_svg]:size-3",
              !bound && "text-warning-deep",
            )}
          >
            {bound ? <Link2 /> : <Link2Off />}
          </button>
        </div>
      ) : null}

      {bound ? (
        <Select
          value={token == null ? "__none" : token}
          onValueChange={(v) => onPickToken(v === "__none" ? null : v)}
          disabled={disabled}
        >
          <SelectTrigger size={size} className="w-full">
            {/* The selected item's ItemText (glyph + label) mirrors here
                via SelectValue — the bound glyph shows for free, no extra
                trigger markup (which previously double-rendered + wrapped). */}
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent size={size}>
            <SelectItem value="__none">{placeholder}</SelectItem>
            {tokens.map((t) => (
              <SelectItem key={t.value} value={t.value} hint={t.hint}>
                <span className="flex items-center gap-1.5">
                  {/* Bound-to-a-token glyph — Figma's variable indicator. */}
                  {t.preview ?? (
                    <Hexagon
                      className="size-3 shrink-0 text-muted-foreground/60"
                      aria-hidden
                    />
                  )}
                  <span className="truncate">{t.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        renderRaw?.()
      )}
    </div>
  );
}

/**
 * RawNumberField — a single labelled numeric input for detached values.
 * Commits on blur / Enter (local draft so typing stays snappy).
 */
export function RawNumberField({
  label,
  icon,
  value,
  min,
  disabled,
  onCommit,
}: {
  label?: string;
  icon?: React.ReactNode;
  value: number;
  min?: number;
  disabled?: boolean;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = React.useState(String(value));
  React.useEffect(() => {
    setDraft(String(value));
  }, [value]);
  const commit = () => {
    let n = parseInt(draft, 10);
    if (!Number.isFinite(n)) n = value;
    if (min !== undefined) n = Math.max(min, n);
    onCommit(n);
  };
  return (
    <div className="space-y-1">
      {label ? <span className={FIELD_LABEL}>{label}</span> : null}
      <Input
        size="2xs"
        type="number"
        value={draft}
        disabled={disabled}
        startSlot={icon}
        onChange={(e) => setDraft(e.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
        }}
      />
    </div>
  );
}

/**
 * CompactNumberField — an inline numeric field (icon + value on one
 * line, no stacked label) for the compound rows (shadow X/Y/blur/
 * spread). Commits on blur / Enter. `icon` is the leading glyph: a
 * letter (X/Y) or a small icon (blur/spread).
 */
export function CompactNumberField({
  icon,
  value,
  min,
  disabled,
  ariaLabel,
  onCommit,
}: {
  icon?: React.ReactNode;
  value: number;
  min?: number;
  disabled?: boolean;
  ariaLabel?: string;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = React.useState(String(value));
  React.useEffect(() => {
    setDraft(String(value));
  }, [value]);
  const commit = () => {
    let n = parseInt(draft, 10);
    if (!Number.isFinite(n)) n = value;
    if (min !== undefined) n = Math.max(min, n);
    onCommit(n);
  };
  return (
    // Slotted Input renders a w-full wrapper; size via this container so
    // the four fields share the row equally.
    <div className="min-w-0 flex-1">
      <Input
        size="2xs"
        type="number"
        aria-label={ariaLabel}
        title={ariaLabel}
        value={draft}
        disabled={disabled}
        startSlot={icon}
        onChange={(e) => setDraft(e.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
        }}
      />
    </div>
  );
}

/**
 * ColorOpacityRow — Paper/Figma's `■ 000000 / 100%`: a swatch, a hex
 * field, and an opacity field on one line. Shared by every detached
 * colour (fill, border, shadow). Hex is stored WITHOUT the leading "#".
 */
export function ColorOpacityRow({
  hex,
  opacity,
  disabled,
  onChange,
}: {
  hex: string;
  opacity: number;
  disabled?: boolean;
  onChange: (hex: string, opacity: number) => void;
}) {
  const [hexDraft, setHexDraft] = React.useState(hex);
  const [opDraft, setOpDraft] = React.useState(String(opacity));
  React.useEffect(() => setHexDraft(hex), [hex]);
  React.useEffect(() => setOpDraft(String(opacity)), [opacity]);

  const commitHex = () => {
    const h = hexDraft.replace(/^#/, "").toLowerCase();
    if (/^[0-9a-f]{6}$/.test(h)) onChange(h, opacity);
    else setHexDraft(hex);
  };
  const commitOp = () => {
    const n = parseInt(opDraft, 10);
    onChange(hex, Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : opacity);
  };

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="h-5 w-5 shrink-0 rounded border border-border"
        style={{ backgroundColor: `#${hex}`, opacity: opacity / 100 }}
        aria-hidden
      />
      {/* Slotted Inputs render a w-full wrapper, so width is controlled
          by these containers (className on a slotted Input lands on the
          inner <input>, not the wrapper). */}
      <div className="min-w-0 flex-1">
        <Input
          size="2xs"
          className="font-mono uppercase"
          value={hexDraft}
          disabled={disabled}
          startSlot={<span className="text-muted-foreground">#</span>}
          onChange={(e) => setHexDraft(e.currentTarget.value)}
          onBlur={commitHex}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
          }}
        />
      </div>
      <div className="w-16 shrink-0">
        <Input
          size="2xs"
          type="number"
          value={opDraft}
          disabled={disabled}
          endSlot={<span className="text-muted-foreground">%</span>}
          onChange={(e) => setOpDraft(e.currentTarget.value)}
          onBlur={commitOp}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
          }}
        />
      </div>
    </div>
  );
}
