import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Logo — a brand mark with lockup, background-mode, and monochrome
 * variations, fed bespoke artwork per slot. (Vendored copy of
 * packages/ui/components/ui/logo.tsx — keep in sync.)
 *
 * A brand rarely has one logo: there's a square mark for tight spaces, a
 * horizontal lockup for headers, and single-colour versions for busy or
 * inverted backgrounds. This component holds that set and renders the right
 * one for the context. Artwork is yours — each slot is any React node.
 * Selection is explicit via `mode`, not theme-coupled.
 */

export type LogoLockup = "square" | "horizontal" | "icon";
export type LogoMode = "light" | "dark";
export type LogoSize = "sm" | "md" | "lg" | "xl";

export interface LogoVariant {
  light?: React.ReactNode;
  dark?: React.ReactNode;
  mono?: React.ReactNode;
}

export interface LogoSources {
  square?: LogoVariant;
  horizontal?: LogoVariant;
  icon?: LogoVariant;
}

export interface LogoProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  sources: LogoSources;
  lockup?: LogoLockup;
  mode?: LogoMode;
  mono?: boolean;
  size?: LogoSize | number;
  label?: string;
  decorative?: boolean;
  href?: string;
}

const SIZE_PX: Record<LogoSize, number> = {
  sm: 20,
  md: 28,
  lg: 40,
  xl: 56,
};

const LOCKUP_FALLBACK: Record<LogoLockup, LogoLockup[]> = {
  horizontal: ["horizontal", "square", "icon"],
  square: ["square", "icon", "horizontal"],
  icon: ["icon", "square", "horizontal"],
};

function resolveArtwork(
  sources: LogoSources,
  lockup: LogoLockup,
  mode: LogoMode,
  mono: boolean,
): React.ReactNode | null {
  for (const lk of LOCKUP_FALLBACK[lockup]) {
    const variant = sources[lk];
    if (!variant) continue;
    const colour =
      mode === "dark"
        ? variant.dark ?? variant.light
        : variant.light ?? variant.dark;
    const node = mono ? variant.mono ?? colour : colour ?? variant.mono;
    if (node != null) return node;
  }
  return null;
}

export const Logo = React.forwardRef<HTMLElement, LogoProps>(function Logo(
  {
    sources,
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

  const a11y = decorative
    ? { "aria-hidden": true as const }
    : label
      ? href
        ? {}
        : { role: "img", "aria-label": label }
      : {};

  const body = artwork ?? <LogoPlaceholder label={label} mono={mono} />;

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
