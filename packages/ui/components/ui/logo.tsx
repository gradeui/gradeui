import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Logo — a brand mark with lockup, background-mode, and monochrome
 * variations, fed bespoke artwork per slot.
 *
 * A brand rarely has one logo: there's a square mark for tight spaces, a
 * horizontal lockup for headers, and single-colour versions for busy or
 * inverted backgrounds. This component holds that set and renders the right
 * one for the context, so a sidenav, toolbar, and footer can all reach for
 * `<Logo>` and ask for the lockup/mode they need.
 *
 * Artwork is yours: each slot is any React node — an inline `<svg>`, an
 * `<img>`, or a component. Supply only what you have; the component falls
 * back across appearances and lockups so a partial set still renders
 * something. Monochrome artwork should paint with `currentColor` so it
 * inherits the surrounding text colour.
 *
 * Selection is explicit, not theme-coupled: set `mode="dark"` when the logo
 * sits on a dark surface. (Wrap it in your own theme hook if you want it
 * automatic.)
 */

export type LogoLockup = "square" | "horizontal" | "icon";
export type LogoMode = "light" | "dark";
export type LogoSize = "sm" | "md" | "lg" | "xl";

/** Artwork for one lockup. `light`/`dark` are the full-colour versions for a
 *  light or dark background; `mono` is a single-colour treatment that
 *  inherits `currentColor` and works on any background. */
export interface LogoVariant {
  light?: React.ReactNode;
  dark?: React.ReactNode;
  mono?: React.ReactNode;
}

/** The brand artwork set, keyed by lockup then appearance. */
export interface LogoSources {
  square?: LogoVariant;
  horizontal?: LogoVariant;
  icon?: LogoVariant;
}

export interface LogoProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** The brand artwork. Supply only the slots you have. Optional — with
   *  no artwork at all the neutral placeholder renders, which keeps
   *  layout intact (and keeps a model-emitted bare `<Logo />` from
   *  crashing a Studio preview). */
  sources?: LogoSources;
  /** Which lockup to show. Falls back to another lockup if this one is
   *  empty. Default `"horizontal"`. */
  lockup?: LogoLockup;
  /** The background the logo sits on — selects the light/dark artwork.
   *  Explicit (not theme-coupled). Default `"light"`. */
  mode?: LogoMode;
  /** Render the monochrome artwork instead of full colour. Mono inherits
   *  `currentColor`, so set the text colour on a parent. Default `false`. */
  mono?: boolean;
  /** Height of the logo — a t-shirt token or a raw pixel number. Width is
   *  intrinsic (square/icon are 1:1, horizontal keeps its ratio).
   *  Default `"md"`. */
  size?: LogoSize | number;
  /** Accessible name (e.g. the brand name) → `aria-label` + `role="img"`.
   *  Omit and set `decorative` when something nearby already names it. */
  label?: string;
  /** Mark the logo decorative (`aria-hidden`, no role). Use when the brand
   *  name is already in the DOM beside it. */
  decorative?: boolean;
  /** Optional link target — renders the logo as an `<a>` (logo-links-home). */
  href?: string;
}

const SIZE_PX: Record<LogoSize, number> = {
  sm: 20,
  md: 28,
  lg: 40,
  xl: 56,
};

// Lockup fallback chains — if the requested lockup has no artwork at all, we
// show the next-best shape rather than nothing.
const LOCKUP_FALLBACK: Record<LogoLockup, LogoLockup[]> = {
  horizontal: ["horizontal", "square", "icon"],
  square: ["square", "icon", "horizontal"],
  icon: ["icon", "square", "horizontal"],
};

/** Resolve the best available node for the requested lockup/mode/mono,
 *  walking the fallback chain. Returns null when no artwork is supplied. */
function resolveArtwork(
  sources: LogoSources,
  lockup: LogoLockup,
  mode: LogoMode,
  mono: boolean,
): React.ReactNode | null {
  for (const lk of LOCKUP_FALLBACK[lockup]) {
    const variant = sources[lk];
    if (!variant) continue;
    // Within a lockup, prefer the requested appearance, then degrade.
    const colour =
      mode === "dark"
        ? variant.dark ?? variant.light
        : variant.light ?? variant.dark;
    const node = mono
      ? variant.mono ?? colour
      : colour ?? variant.mono;
    if (node != null) return node;
  }
  return null;
}

export const Logo = React.forwardRef<HTMLElement, LogoProps>(function Logo(
  {
    sources = {},
    lockup = "horizontal",
    mode = "light",
    mono = false,
    size = "md",
    label,
    decorative = false,
    href,
    className,
    style,
    ...props
  },
  ref,
) {
  const heightPx = typeof size === "number" ? size : SIZE_PX[size];
  const artwork = resolveArtwork(sources, lockup, mode, mono);

  // a11y: a named logo is an image; a decorative one is hidden. When the
  // logo links somewhere, the <a> carries the label instead.
  const a11y = decorative
    ? { "aria-hidden": true as const }
    : label
      ? href
        ? {}
        : { role: "img", "aria-label": label }
      : {};

  const body = artwork ?? <LogoPlaceholder label={label} mono={mono} />;

  // The wrapper sets the height; intrinsic artwork (svg/img) scales to it and
  // keeps its own aspect ratio. data-gds-part lets Studio target it.
  const inner = (
    <span
      className={cn(
        "gds-logo inline-flex shrink-0 select-none items-center",
        "[&_img]:h-full [&_img]:w-auto [&_svg]:h-full [&_svg]:w-auto",
        className,
      )}
      style={{ height: heightPx, ...style }}
      data-gds-part="logo"
      data-gds-lockup={lockup}
      data-gds-mode={mode}
      {...(href ? {} : a11y)}
      {...(href ? {} : props)}
    >
      {body}
    </span>
  );

  if (href) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        aria-label={!decorative ? label : undefined}
        className="inline-flex"
        {...(decorative ? { "aria-hidden": true } : {})}
        {...props}
      >
        {inner}
      </a>
    );
  }

  return React.cloneElement(inner, {
    ref: ref as React.Ref<HTMLSpanElement>,
  });
});

/** Neutral fallback shown when no artwork is supplied for the requested
 *  slot — keeps layout intact in Studio before the user wires real art. */
function LogoPlaceholder({
  label,
  mono,
}: {
  label?: string;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-full items-center gap-1.5 rounded-md border border-dashed px-2 text-xs font-medium",
        mono
          ? "border-current/40 text-current"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      <span
        aria-hidden
        className="inline-block h-3.5 w-3.5 rounded-[3px] bg-current opacity-60"
      />
      {label ?? "Logo"}
    </span>
  );
}
