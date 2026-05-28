"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { SURFACE_CLASS, surfaceBg, type Surface } from "@/lib/surface";

/**
 * Banner — full-width horizontal strip surfacing system-level state or
 * announcements that should stay visible until acknowledged.
 *
 * The shape is the difference from Callout:
 *
 *   Callout = inline boxed message in the layout flow (rounded box,
 *             body-paragraph width, lives inside a Card/Section).
 *   Banner  = full-bleed horizontal strip across a page / panel /
 *             AppShellHeader top. Single-line by default.
 *
 * Use cases that should be Banner, not Callout, not Dialog:
 *   - "You're previewing this from main — switch to your branch"
 *   - "We're investigating an incident affecting search"
 *   - "Send your design to Figma — get the Grade plugin"
 *   - "New: scaffold-playground tab"
 *
 * Three Presence axes apply: variant (intent colour), surface
 * (material), shadow utilities for elevation. The default is
 * `variant="default" surface="solid"`, which yields a calm announcement
 * strip in the active theme. Status variants pick up the soft / deep
 * token pairs (`--info-soft` + `--info-deep`, etc.), same pattern as
 * Callout.
 *
 * AUTHORING ORIGIN: this primitive was extracted out of
 * `apps/docs/components/studio/figma-intro-banner.tsx` after the user
 * flagged that ad-hoc banner as invisible — it was reaching for
 * `--gds-primary` / `--gds-border` / `--gds-foreground` tokens that
 * don't exist (our tokens are unprefixed). The inline-style fallbacks
 * kicked in and the chrome washed out completely. Banner exists so the
 * "I need a one-line announcement strip" need lands in a primitive that
 * cannot get the token names wrong.
 */

const bannerVariants = cva(
  "relative flex items-center gap-3 px-4 py-2.5 text-sm leading-relaxed border-b",
  {
    variants: {
      variant: {
        default:
          "bg-muted text-foreground border-border [&>svg]:text-muted-foreground",
        info:
          "bg-info-soft text-info-deep border-info/30 [&>svg]:text-info-deep",
        success:
          "bg-success-soft text-success-deep border-success/30 [&>svg]:text-success-deep",
        warning:
          "bg-warning-soft text-warning-deep border-warning/30 [&>svg]:text-warning-deep",
        destructive:
          "bg-destructive-soft text-destructive-deep border-destructive/30 [&>svg]:text-destructive-deep",
        announcement:
          // Promo / "new feature" tone — picks up the primary brand
          // colour at a low alpha so it stays calm.
          "bg-[oklch(var(--primary)_/_0.06)] text-foreground border-[oklch(var(--primary)_/_0.18)] [&>svg]:text-primary",
      },
      align: {
        start: "justify-start",
        center: "justify-center",
        between: "justify-between",
      },
      sticky: {
        true: "sticky top-0 z-30",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      align: "between",
      sticky: false,
    },
  }
);

/**
 * Role mapping: status colours that imply something is wrong get
 * `role="alert"` so screen readers interrupt. Calm / informational
 * variants get `role="status"` (polite). Matches the Callout rule.
 */
const ROLE_BY_VARIANT: Record<NonNullable<VariantProps<typeof bannerVariants>["variant"]>, "alert" | "status"> = {
  destructive: "alert",
  warning: "alert",
  info: "status",
  success: "status",
  default: "status",
  announcement: "status",
};

export interface BannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof bannerVariants> {
  /**
   * Material the banner is *made of*. Defaults to `solid` (the
   * variant's tinted bg). `glass` is useful when the banner sits over
   * a hero image / generative backdrop and the imagery underneath
   * should remain visible.
   */
  surface?: Surface;
  /**
   * Show a close button at the trailing end. The button calls
   * `onDismiss` if provided; otherwise the consumer controls
   * visibility via standard React state on the parent.
   */
  dismissible?: boolean;
  /**
   * Callback when the user clicks the trailing close button. Required
   * when `dismissible` is set if you want the banner to actually
   * disappear (the primitive itself stays controlled).
   */
  onDismiss?: () => void;
  /**
   * Leading slot — typically a single Lucide icon. The status icon
   * is NOT inferred from variant; pass the one that fits your message.
   */
  icon?: React.ReactNode;
  /**
   * Optional trailing action — usually a Button or anchor. Sits to the
   * left of the dismiss button.
   */
  action?: React.ReactNode;
}

const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  (
    {
      className,
      variant = "default",
      align,
      sticky,
      surface = "solid",
      dismissible,
      onDismiss,
      icon,
      action,
      role,
      children,
      ...props
    },
    ref
  ) => {
    const resolvedVariant = (variant ?? "default") as NonNullable<
      VariantProps<typeof bannerVariants>["variant"]
    >;
    const resolvedRole = role ?? ROLE_BY_VARIANT[resolvedVariant];

    return (
      <div
        ref={ref}
        role={resolvedRole}
        data-gds-part="banner"
        data-variant={resolvedVariant}
        data-surface={surface}
        className={cn(
          bannerVariants({ variant, align, sticky }),
          // Surface composes on top of the variant tint. When surface
          // is set to anything other than solid, the bg-* class from
          // the variant still applies — the gds-surface-* class layers
          // backdrop blur + edge highlight over it. `surfaceBg()`
          // returns "" when surface !== "solid" but we keep the
          // variant background classes intact (they're tonal, not the
          // base `bg-card`/`bg-popover` the helper is designed to
          // strip), so the helper isn't strictly needed here. Glass
          // utilities still combine cleanly.
          SURFACE_CLASS[surface],
          className
        )}
        {...props}
      >
        {icon ? (
          <span data-gds-part="banner-icon" aria-hidden className="shrink-0">
            {icon}
          </span>
        ) : null}

        <div
          data-gds-part="banner-content"
          className="flex-1 min-w-0"
        >
          {children}
        </div>

        {action ? (
          <span data-gds-part="banner-action" className="shrink-0">
            {action}
          </span>
        ) : null}

        {dismissible ? (
          <button
            type="button"
            data-gds-part="banner-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md opacity-70 hover:opacity-100 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    );
  }
);
Banner.displayName = "Banner";

export { Banner, bannerVariants };
