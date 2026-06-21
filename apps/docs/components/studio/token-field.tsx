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
import { Hexagon, Link2Off } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const FIELD_LABEL = "text-2xs font-medium text-foreground/80";

/**
 * IconTip — a styled tooltip for icon-only affordances (the native
 * `title` attr is too quiet for a design tool). Self-provides the Radix
 * provider so it works anywhere in the tree.
 */
export function IconTip({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}) {
  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className="px-2 py-1 text-2xs">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

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
   *  resolved (token value / computed style / a sane default). OPTIONAL —
   *  omit (with onRebind/renderRaw) for a TOKEN-ONLY field (e.g. text
   *  alignment, where a "raw" value has no meaning): the detach
   *  affordance simply doesn't render. */
  onDetach?: () => void;
  /** Detached → bound (re-bind to a token). */
  onRebind?: () => void;
  /** Raw editor, rendered when detached. Receives the ATTACH affordance
   *  (hexagon button) to host INSIDE its input (endSlot, next to the
   *  unit) so field bounds stay identical bound↔detached — no layout
   *  jump. */
  renderRaw?: (attach: React.ReactNode) => React.ReactNode;
  /** Extra affordance(s) rendered in the label row, left of the
   *  detach/rebind toggle (e.g. Radius' per-corner mode toggle). */
  labelExtra?: React.ReactNode;
  /** Muted caption rendered INLINE next to the label ("Default · 6px")
   *  — saves the vertical line a below-field caption costs. */
  labelCaption?: React.ReactNode;
  /** Property glyph rendered at the left edge of the bound trigger
   *  (Paper/Figma's per-property icons — opacity checker, droplet…).
   *  Pass a span with a `title` for its tooltip. */
  triggerIcon?: React.ReactNode;
  /** The current raw value while detached ("19px", "1.5rem", "37") —
   *  drives the attach menu's "Closest match" suggestion. */
  currentRaw?: string;
  /** The element's baked-in DEFAULT shown while unset — rendered as a
   *  DULLED grey token chip (derived classname + resolved value, e.g.
   *  "pt-6 · 24") so it's clear the value is applied without being
   *  authored here. Falls back to `placeholder` text when absent. */
  ghostToken?: { label: string; hint?: string };
  /** Unit rendered in the SUFFIX SLOT at the field's right edge while
   *  unset/ghost ("px", "%") — never concatenated with the number. */
  unitSuffix?: string;
  /** Resolved-value hint for the "unset" menu row ("0px") — every other
   *  row carries one, so a blank first row reads broken. */
  placeholderHint?: string;
  /** OPTIONAL bound-token control override. When provided, it REPLACES
   *  the built-in Select used for the bound case (the detach button +
   *  unit suffix wrapper are still rendered around it). Used by colour
   *  fields, which swap the token Select for a swatch-led ColorPicker
   *  while keeping the rest of TokenField's detach/raw machinery. The
   *  detach button only renders when `token != null && onDetach` — same
   *  rule as the Select path — so callers that own their own picker but
   *  want detach should pass `onDetach`. */
  renderToken?: () => React.ReactNode;
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
  labelExtra,
  labelCaption,
  triggerIcon,
  currentRaw,
  ghostToken,
  unitSuffix,
  placeholderHint,
  renderToken,
}: TokenFieldProps) {
  // Suffix shows only for PLAIN ghost numbers ("0"). Token explainers
  // (ghost chips, menu rows) keep the unit WITH the number — "pt-6 ·24px"
  // explains the token; a bare field value defers its unit to the edge.
  const showSuffix =
    token == null &&
    !!unitSuffix &&
    ghostToken == null &&
    /^\d/.test(placeholder);
  // "Closest match" for the attach menu — normalise the raw value to
  // px-ish (rem/em ≈ ×16; %/vh/etc. aren't comparable) and find the
  // token whose resolved readout is nearest.
  const rawForMatch = (() => {
    if (currentRaw == null) return NaN;
    const m = /^\s*(-?\d*\.?\d+)\s*([a-z%]*)\s*$/i.exec(currentRaw);
    if (!m) return NaN;
    const n = Number(m[1]);
    if (!Number.isFinite(n)) return NaN;
    const u = m[2].toLowerCase();
    if (u === "" || u === "px") return n;
    if (u === "rem" || u === "em") return n * 16;
    return NaN;
  })();
  // Resolved value for the BOUND chip's "· 12px" explainer — same
  // registry hint the menu rows carry.
  const boundHint =
    token != null ? tokens.find((t) => t.value === token)?.hint : undefined;
  const closest = Number.isFinite(rawForMatch)
    ? tokens.reduce<{ t: TokenOption; d: number } | null>((best, t) => {
        const n = parseFloat(t.hint ?? "");
        if (!Number.isFinite(n)) return best;
        const d = Math.abs(n - rawForMatch);
        return best === null || d < best.d ? { t, d } : best;
      }, null)
    : null;
  return (
    <div className="space-y-1">
      {label ? (
        // min-h-4 + leading-none keep label rows the same height whether
        // or not they carry extras — sibling fields stay aligned.
        <div className="flex min-h-4 items-center justify-between gap-2">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className={cn(FIELD_LABEL, "shrink-0 leading-none")}>
              {label}
            </span>
            {labelCaption}
          </span>
          {/* Both link affordances live INSIDE the field (Figma) — the
              label row only carries section-specific extras. */}
          {labelExtra ? (
            <span className="flex shrink-0 items-center gap-1">
              {labelExtra}
            </span>
          ) : null}
        </div>
      ) : null}

      {bound ? (
        <div className="relative">
        {renderToken ? (
          // Caller-owned bound control (e.g. colour swatch ColorPicker).
          // Pad the right edge so the absolutely-positioned detach button
          // doesn't overlap when a token is bound.
          <div className={cn("w-full", token != null && onDetach && "pr-7")}>
            {renderToken()}
          </div>
        ) : (
        <Select
          value={token == null ? "__none" : token}
          onValueChange={(v) => onPickToken(v === "__none" ? null : v)}
          disabled={disabled}
        >
          <SelectTrigger
            size={size}
            // No chevron (Figma fields don't carry one) — the right edge
            // belongs to the detach affordance when a token is bound, or
            // to the unit suffix while unset/ghost.
            className={cn("w-full", (token != null || showSuffix) && "pr-7")}
            startSlot={triggerIcon}
            chevron={false}
          >
            {/* The selected item's ItemText (glyph + label) mirrors here
                via SelectValue — the bound glyph shows for free; the
                property glyph rides SelectTrigger's startSlot. A picked
                token renders inside a CHIP so it reads as a bound
                variable, Figma-style (a div, not a span — the trigger's
                [&>span]:line-clamp-1 would stack a span vertically). */}
            {token != null ? (
              // Chip tint rides --studio-accent (theme-independent
              // editing chrome, same var as the canvas selection chip) —
              // subtle, but unmistakably "this is a token", not neutral.
              // Carries the same "· value" explainer as the ghost chip
              // (token explainers keep the unit WITH the number). Tight
              // gap-0.5 so the interpunct hugs the label.
              <div className="flex min-w-0 items-center gap-0.5 rounded-[4px] border border-[oklch(var(--studio-accent,_0.62_0.18_264)/0.25)] bg-[oklch(var(--studio-accent,_0.62_0.18_264)/0.08)] px-1 [&>span]:truncate">
                <SelectValue placeholder={placeholder} />
                {boundHint ? (
                  // Same accent family as the chip surround, dialled
                  // down. 0.5: the border's 0.25 works for a 1px line
                  // but thin glyphs vanish at that alpha.
                  <span className="shrink-0 text-[oklch(var(--studio-accent,_0.62_0.18_264)/0.5)]">
                    · {boundHint}
                  </span>
                ) : null}
              </div>
            ) : ghostToken ? (
              // Dulled token chip — the baked-in DEFAULT (grey, not
              // accent): the classname is visibly applied, just not
              // authored on this node. The label rides SelectValue
              // (mirroring the __none item) — item-aligned positioning
              // NEEDS a SelectValue node in the trigger to measure
              // against; a chip that draws its own text kills the menu.
              <div className="flex min-w-0 items-center gap-0.5 rounded-[4px] border border-border/60 bg-muted/50 px-1 text-muted-foreground [&>span]:truncate">
                <SelectValue placeholder={placeholder} />
                {ghostToken.hint ? (
                  <span className="shrink-0 text-muted-foreground/60">
                    {/* Interpunct convention: "label · value", one space
                        each side — identical to the Default captions. */}
                    · {ghostToken.hint}
                  </span>
                ) : null}
              </div>
            ) : (
              <SelectValue placeholder={placeholder} />
            )}
          </SelectTrigger>
          {/* item-aligned (macOS-style): the menu opens with the
              checked row over the trigger — neighbouring values are a
              one-notch mouse move, not a travel down a popover. */}
          <SelectContent size={size} position="item-aligned">
            <SelectItem
              value="__none"
              hint={ghostToken?.hint ?? placeholderHint}
            >
              {/* The "default / unset" choice reads muted — it isn't a
                  token, just the inherited default. When a contract
                  default exists, this row reads ITS label ("pt-6") so
                  the ghost chip mirrors it via SelectValue (the trigger
                  needs a SelectValue node for item-aligned to work).
                  Brightens on the highlighted row (muted-on-accent is
                  unreadable); the trigger has no highlight, so it stays
                  grey there. */}
              <span className="text-muted-foreground group-focus:text-accent-foreground group-data-[highlighted]:text-accent-foreground">
                {ghostToken?.label ?? placeholder}
              </span>
            </SelectItem>
            {tokens.map((t) => (
              <SelectItem key={t.value} value={t.value} hint={t.hint}>
                <span className="flex items-center gap-1.5">
                  {/* No token glyph — the CHIP border in the field does
                      the "this is a token" signalling (the glyph also
                      forced truncation). Colour swatches still render. */}
                  {t.preview}
                  <span className="truncate">{t.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        )}
        {/* Detach — INSIDE the field, Figma's "Detach variable". Only
            rendered when a token is actually bound (an unset field has
            nothing to detach). Absolutely positioned because a button
            can't nest inside the trigger button. */}
        {token != null && onDetach ? (
          <IconTip label={`Detach ${kind} — use a custom value`}>
            <button
              type="button"
              disabled={disabled}
              onClick={onDetach}
              aria-label={`Detach ${kind}`}
              className="absolute right-1.5 top-1/2 inline-flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 [&_svg]:size-3"
            >
              <Link2Off />
            </button>
          </IconTip>
        ) : null}
        {/* Unit suffix — the SUFFIX SLOT, never glued to the number. */}
        {showSuffix ? (
          <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-2xs text-muted-foreground/60">
            {unitSuffix}
          </span>
        ) : null}
        </div>
      ) : (
        (renderRaw?.(
          /* Attach — hosted INSIDE the raw input (endSlot) so fields
             don't resize across bind/detach. Opens a DISMISSABLE scoped
             token menu (Figma's apply-variable popover) — it never
             writes by itself; only picking an item binds. "Closest
             match" to the typed raw value leads the list. */
          <DropdownMenu>
            <IconTip label={`Attach ${kind} to a token`}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Attach ${kind} to a token`}
                  className="pointer-events-auto inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 [&_svg]:size-3"
                >
                  <Hexagon />
                </button>
              </DropdownMenuTrigger>
            </IconTip>
            <DropdownMenuContent align="end" className="min-w-[11rem]">
              {closest ? (
                <>
                  <DropdownMenuLabel className="text-2xs font-normal text-muted-foreground">
                    Closest match
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    className="group gap-1.5 text-xs"
                    onSelect={() => onPickToken(closest.t.value)}
                  >
                    {closest.t.preview}
                    <span className="truncate">{closest.t.label}</span>
                    {closest.t.hint ? (
                      <span className="ml-auto pl-3 tabular-nums text-muted-foreground/60 group-focus:text-accent-foreground/80">
                        {closest.t.hint}
                      </span>
                    ) : null}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              {tokens.map((t) => (
                <DropdownMenuItem
                  key={t.value}
                  className="group gap-1.5 text-xs"
                  onSelect={() => onPickToken(t.value)}
                >
                  {t.preview}
                  <span className="truncate">{t.label}</span>
                  {t.hint ? (
                    <span className="ml-auto pl-3 tabular-nums text-muted-foreground/60 group-focus:text-accent-foreground/80">
                      {t.hint}
                    </span>
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>,
        ) ?? null)
      )}
    </div>
  );
}

/**
 * evalMath — evaluate a numeric input that may contain simple maths
 * ("16/2", "4*4+2"). Strictly digits, decimal points, + - * / ( ) and
 * whitespace — anything else rejects, so the Function() below can never
 * see arbitrary code. Returns null on failure (callers fall back to the
 * previous value, per the Figma behaviour).
 */
export function evalMath(expr: string): number | null {
  const cleaned = expr.trim();
  if (cleaned === "") return null;
  if (!/^[\d.+\-*/()\s]+$/.test(cleaned)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const n = new Function(`"use strict"; return (${cleaned});`)() as unknown;
    return typeof n === "number" && Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
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
        autoComplete="off"
        spellCheck={false}
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
  endExtra,
}: {
  icon?: React.ReactNode;
  value: number;
  min?: number;
  disabled?: boolean;
  ariaLabel?: string;
  onCommit: (v: number) => void;
  /** Extra affordance rendered inside the field's trailing edge (the
   *  TokenField attach button). */
  endExtra?: React.ReactNode;
}) {
  const [draft, setDraft] = React.useState(String(value));
  React.useEffect(() => {
    setDraft(String(value));
  }, [value]);
  const commit = () => {
    // Plain number first; then maths ("16/2"); invalid → previous value.
    const direct = /^\s*-?\d+(?:\.\d+)?\s*$/.test(draft)
      ? Number(draft)
      : null;
    let n = direct ?? evalMath(draft) ?? value;
    n = Math.round(n);
    if (min !== undefined) n = Math.max(min, n);
    setDraft(String(n));
    onCommit(n);
  };
  return (
    // Slotted Input renders a w-full wrapper; size via this container so
    // the four fields share the row equally. type="text" (not number) so
    // maths characters are typable.
    <div className="min-w-0 flex-1">
      <Input
        size="2xs"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        aria-label={ariaLabel}
        title={ariaLabel}
        value={draft}
        disabled={disabled}
        startSlot={icon}
        className={endExtra ? "pr-7" : undefined}
        endSlot={endExtra}
        onChange={(e) => setDraft(e.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.currentTarget as HTMLInputElement).blur();
            return;
          }
          // Figma physics: ↑/↓ nudge by 1 (⇧ = 10), committing live.
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const direct = /^\s*-?\d+(?:\.\d+)?\s*$/.test(draft)
              ? Number(draft)
              : null;
            const base = direct ?? evalMath(draft) ?? value;
            const delta =
              (e.shiftKey ? 10 : 1) * (e.key === "ArrowUp" ? 1 : -1);
            let next = Math.round(base + delta);
            if (min !== undefined) next = Math.max(min, next);
            setDraft(String(next));
            onCommit(next);
          }
        }}
      />
    </div>
  );
}

/** CSS length units accepted by CompactDimensionField's freeform input. */
const CSS_LENGTH_UNITS: string[] = [
  "px",
  "%",
  "rem",
  "em",
  "vh",
  "vw",
  "vmin",
  "vmax",
  "ch",
  "svh",
  "svw",
  "dvh",
  "dvw",
  "lvh",
  "lvw",
  "pt",
];

/**
 * CompactDimensionField — a freeform CSS-length field for detached
 * values. Type `19` and the active unit applies (px by default, shown
 * as the suffix); type `4rem` / `50vh` / `33%` and the unit switches
 * live. Commits the full CSS string ("19px", "4rem") on blur / Enter;
 * invalid input reverts.
 */
export function CompactDimensionField({
  icon,
  value,
  disabled,
  ariaLabel,
  onCommit,
  endExtra,
}: {
  icon?: React.ReactNode;
  /** Full CSS length string, e.g. "19px", "4rem", "50vh". */
  value: string;
  disabled?: boolean;
  ariaLabel?: string;
  onCommit: (v: string) => void;
  /** Extra affordance rendered inside the field after the unit (the
   *  TokenField attach button). */
  endExtra?: React.ReactNode;
}) {
  const parse = (raw: string): { n: number; unit: string } | null => {
    const m = /^\s*(-?\d*\.?\d+)\s*([a-z%]*)\s*$/i.exec(raw);
    if (!m) return null;
    const n = Number(m[1]);
    if (!Number.isFinite(n)) return null;
    const unit = (m[2] || "px").toLowerCase();
    if (!CSS_LENGTH_UNITS.includes(unit)) return null;
    return { n, unit };
  };
  const initial = parse(value) ?? { n: 0, unit: "px" };
  const [draft, setDraft] = React.useState(String(initial.n));
  const [unit, setUnit] = React.useState(initial.unit);
  React.useEffect(() => {
    const p = parse(value) ?? { n: 0, unit: "px" };
    setDraft(String(p.n));
    setUnit(p.unit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const commit = () => {
    let p = parse(draft);
    if (!p) {
      // Maths fallback — "16/2", "4*4+2", optional trailing unit
      // ("100/3px"). Failure reverts to the previous value below.
      const m = /^(.*?)([a-z%]+)?\s*$/i.exec(draft.trim());
      const n = evalMath(m?.[1] ?? "");
      const unitPart = (m?.[2] ?? "").toLowerCase();
      if (
        n !== null &&
        (unitPart === "" || CSS_LENGTH_UNITS.includes(unitPart))
      ) {
        p = { n: Math.round(n * 100) / 100, unit: unitPart || unit };
      }
    }
    if (!p) {
      const r = parse(value) ?? { n: 0, unit: "px" };
      setDraft(String(r.n));
      setUnit(r.unit);
      return;
    }
    // A bare number/expression keeps the active unit; an explicit unit
    // switches it.
    const u = /[a-z%]/i.test(draft) ? p.unit : unit;
    setUnit(u);
    setDraft(String(p.n));
    onCommit(`${p.n}${u}`);
  };
  return (
    <div className="min-w-0 flex-1">
      <Input
        size="2xs"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        aria-label={ariaLabel}
        title={ariaLabel}
        value={draft}
        disabled={disabled}
        startSlot={icon}
        className={endExtra ? "pr-10" : undefined}
        endSlot={
          <span className="flex items-center gap-1">
            <span className="text-2xs">{unit}</span>
            {endExtra}
          </span>
        }
        onChange={(e) => {
          const next = e.currentTarget.value;
          setDraft(next);
          // Live unit preview while typing one ("4re…" → "4rem").
          const p = parse(next);
          if (p && /[a-z%]/i.test(next)) setUnit(p.unit);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.currentTarget as HTMLInputElement).blur();
            return;
          }
          // Figma physics: ↑/↓ nudge by 1 (⇧ = 10), committing live.
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const p = parse(draft);
            const base = p?.n ?? evalMath(draft) ?? parse(value)?.n ?? 0;
            const delta =
              (e.shiftKey ? 10 : 1) * (e.key === "ArrowUp" ? 1 : -1);
            const next = Math.round((base + delta) * 100) / 100;
            const u = p && /[a-z%]/i.test(draft) ? p.unit : unit;
            setDraft(String(next));
            setUnit(u);
            onCommit(`${next}${u}`);
          }
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
  endExtra,
}: {
  hex: string;
  opacity: number;
  disabled?: boolean;
  onChange: (hex: string, opacity: number) => void;
  /** Extra affordance hosted inside the opacity field after the "%"
   *  (the TokenField attach button). */
  endExtra?: React.ReactNode;
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
          autoComplete="off"
          spellCheck={false}
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
      <div className={endExtra ? "w-24 shrink-0" : "w-16 shrink-0"}>
        <Input
          size="2xs"
          type="number"
          autoComplete="off"
          spellCheck={false}
          value={opDraft}
          disabled={disabled}
          className={endExtra ? "pr-10" : undefined}
          endSlot={
            <span className="flex items-center gap-1">
              <span className="text-muted-foreground">%</span>
              {endExtra}
            </span>
          }
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
