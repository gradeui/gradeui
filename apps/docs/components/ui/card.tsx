import * as React from "react"

import { cn } from "@/lib/utils"
import { SURFACE_CLASS, surfaceBg, type Surface } from "@/lib/surface"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
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
  ({ className, surface = "solid", ...props }, ref) => (
    <div
      ref={ref}
      data-gds-part="card"
      data-surface={surface}
      className={cn(
        "gds-card rounded-xl border text-card-foreground shadow",
        surfaceBg(surface, "bg-card"),
        SURFACE_CLASS[surface],
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
