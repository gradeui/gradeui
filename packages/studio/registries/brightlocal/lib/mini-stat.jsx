// @brightlocal/mini-stat — the "small insights" stat tile from the
// Figma reference (17 Jul): pale sage tile, title + icon row, big
// number with optional green delta, muted caption. Promoted from the
// AI Insights landing so All Locations / hub pages reuse it.
//
// TOKEN (Ali, 17 Jul): the tile surface maps to #f2f7f3 — a NEUTRAL
// surface shade (BrightLocal's neutrals carry a warm green cast; it
// is not a green-ramp value, don't map it to green-50). Exposed as
// --bl-surface-muted (hex is the FALLBACK only — override the var
// from the project's custom.css / a theme, never fork the component).
// Add further --bl-* component tokens here as they're minted.
import * as React from "react";
import { TrendingUp } from "@brightlocal/icons";

export const SURFACE_MUTED = "var(--bl-surface-muted, #f2f7f3)";

/** One tile. `delta` renders as the green ↗ chip when set; `valuePrefix`
 *  is a leading node beside the number (e.g. the filled review star). */
export function MiniStat({
  icon: Icon,
  title,
  value,
  valuePrefix,
  delta,
  caption,
  dataHook = "mini-stat",
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-4"
      style={{ background: SURFACE_MUTED }}
      data-hook={dataHook}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{title}</span>
        {Icon ? (
          <Icon className="size-5 text-[var(--ds-tailwind-colors-neutral-700)]" />
        ) : null}
      </div>
      <div className="flex items-baseline gap-2">
        {valuePrefix}
        <span className="text-3xl font-semibold leading-none">{value}</span>
        {delta != null ? (
          <span className="flex items-center gap-0.5 text-sm font-semibold text-[var(--ds-tailwind-colors-green-600)]">
            <TrendingUp className="size-4" />
            {delta}
          </span>
        ) : null}
      </div>
      {caption ? (
        <span className="text-sm text-[var(--ds-tailwind-colors-neutral-500)]">
          {caption}
        </span>
      ) : null}
    </div>
  );
}

/** Responsive 4-up strip wrapper (2-up under xl). */
export function MiniStatStrip({ children, dataHook = "mini-stats" }) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4" data-hook={dataHook}>
      {children}
    </div>
  );
}
