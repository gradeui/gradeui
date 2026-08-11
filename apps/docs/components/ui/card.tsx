import * as React from "react"

import { cn } from "@/lib/utils"
import { SURFACE_CLASS, surfaceBg, type Surface } from "@/lib/surface"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The whole card is the click target — a wallet tile, a project row,
   * anything that opens something. Adds the pointer, a hover/focus
   * treatment, and keyboard focusability, and makes any trailing
   * `Button` inside show its hover state at the same time, so the card
   * and its chevron read as ONE affordance rather than two.
   *
   * On dark surfaces a drop shadow barely registers, so the hover
   * treatment leads with a surface lift (one ramp step) plus a brighter
   * border, and carries the shadow as a secondary cue. See the
   * `.gds-card[data-interactive]` rules in styles/globals.css.
   *
   * Put the click handler on the card. The trailing chevron should then
   * be a `Button asChild` wrapping a span — visually identical, but not
   * a nested interactive control inside a clickable region.
   */
  interactive?: boolean;
  /**
   * What the card surface is *made of*. Composes with `shadow-elevation-*`
   * (depth) and `gds-aura-*` (state signal) — see PRESENCE.md.
   *
   * - `solid` (default): opaque `bg-card`.
   * - `translucent`: ~82% opacity, no blur. Menu sheets, popovers.
   * - `glass`: ~58% opacity + 14px blur + edge highlight. Floating panels.
   * - `glass-strong`: ~42% opacity + 24px blur. Full-page overlays.
   *
   * When `surface` is set to anything other than `solid`, the base
   * `bg-card` is dropped so the glass alpha can pass through.
   */
  surface?: Surface;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, surface = "solid", interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      data-gds-part="card"
      data-surface={surface}
      data-interactive={interactive || undefined}
      tabIndex={interactive ? 0 : undefined}
      className={cn(
        "gds-card rounded-xl border text-card-foreground shadow",
        surfaceBg(surface, "bg-card"),
        SURFACE_CLASS[surface],
        interactive &&
          "cursor-pointer transition-[background-color,border-color,box-shadow,transform] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-gds-part="card-header"
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-gds-part="card-title"
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-gds-part="card-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-gds-part="card-content"
    className={cn("p-6 pt-0", className)}
    {...props}
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-gds-part="card-footer"
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
