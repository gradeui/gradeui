"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

/**
 * ToggleGroup — segmented control / mutually-exclusive picker.
 *
 * Visually identical to `Tabs` (same pill chrome, same active-state
 * treatment, same density). Use ToggleGroup when the value is a
 * picked option (no per-tab content panel); use Tabs when each
 * option owns a content region.
 *
 * Sized via the t-shirt scale (sm / md / lg) — cascades from the
 * group to every item through context, matching the Tabs pattern.
 *
 * Self-contained: does NOT compose `toggleVariants` from `Toggle`.
 * The standalone Toggle and the in-group ToggleGroupItem have
 * different intents (single on/off vs picker item) and shouldn't
 * share styling — keeping each component's variants in one place
 * avoids the "two layers of classes fighting each other" trap.
 */

export type ToggleGroupSize = "sm" | "md" | "lg"

const ToggleGroupSizeContext = React.createContext<ToggleGroupSize>("md")

const toggleGroupVariants = cva(
  "inline-flex items-center justify-center rounded-lg bg-muted text-muted-foreground",
  {
    variants: {
      size: {
        sm: "h-7 p-0.5",
        md: "h-8 p-0.5",
        lg: "h-10 p-1",
      },
    },
    defaultVariants: { size: "md" },
  }
)

const toggleGroupItemVariants = cva(
  // Same base shape as TabsTrigger so a placed ToggleGroup reads
  // as the same primitive in the chrome regardless of which one
  // a designer reached for.
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 data-[state=on]:bg-background data-[state=on]:text-foreground",
  {
    variants: {
      size: {
        sm: "h-6 px-1.5 text-[11px] gap-1 [&_svg]:size-3",
        md: "h-7 px-2 text-xs gap-1.5 [&_svg]:size-3.5",
        lg: "h-8 px-2.5 text-sm gap-2 [&_svg]:size-4",
      },
    },
    defaultVariants: { size: "md" },
  }
)

// `ToggleGroupPrimitive.Root`'s props are a discriminated union
// (`type="single"` vs `type="multiple"`) so we use `type` + `&`
// rather than `interface ... extends` — TypeScript won't allow
// extending a union via interface, but intersecting is fine.
export type ToggleGroupProps =
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleGroupVariants>

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(({ className, size = "md", children, ...props }, ref) => (
  <ToggleGroupSizeContext.Provider value={size ?? "md"}>
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn(toggleGroupVariants({ size }), className)}
      {...(props as React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>)}
    >
      {children}
    </ToggleGroupPrimitive.Root>
  </ToggleGroupSizeContext.Provider>
))
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

export type ToggleGroupItemProps =
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleGroupItemVariants> & {
      /** Tooltip content. When set, the item is wrapped in a Tooltip
       *  so icon-only items keep an accessible label without bloating
       *  the chrome with text. Pass a string for the common case;
       *  pass a node for richer content (key hint, badge, etc.).
       *
       *  Assumes a `TooltipProvider` exists somewhere upstream — in
       *  apps/docs the root layout already mounts one, which is the
       *  pattern most consumers should follow. If no provider is
       *  present, the tooltip is silently ignored at runtime (Radix
       *  no-ops) — pass `tooltip={undefined}` to be sure of plain
       *  behavior. */
      tooltip?: React.ReactNode
      /** Which side of the item the tooltip renders on. Defaults to
       *  "top" — matches the Tabs primitive's convention. */
      tooltipSide?: React.ComponentPropsWithoutRef<typeof TooltipContent>["side"]
      /** Tooltip delay override. The provider's `delayDuration` is
       *  the default; pass a per-item value if a specific control
       *  needs a snappier or quieter feel. */
      tooltipDelay?: number
    }

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(
  (
    {
      className,
      size,
      tooltip,
      tooltipSide = "top",
      tooltipDelay,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const inherited = React.useContext(ToggleGroupSizeContext)
    const resolved = size ?? inherited
    // When tooltip is a plain string and the consumer didn't supply
    // an aria-label, mirror the tooltip text onto aria-label so the
    // item still has an accessible name for screen readers (icon-only
    // buttons would otherwise be unannounced). If the consumer passed
    // their own aria-label, respect it.
    const resolvedAriaLabel =
      ariaLabel ?? (typeof tooltip === "string" ? tooltip : undefined)
    const item = (
      <ToggleGroupPrimitive.Item
        ref={ref}
        className={cn(toggleGroupItemVariants({ size: resolved }), className)}
        aria-label={resolvedAriaLabel}
        {...props}
      />
    )
    if (tooltip == null) return item
    // Why the span wrapper:
    // `TooltipTrigger asChild` uses Radix's Slot to merge its own
    // `data-state="closed" | "delayed-open" | "instant-open"` into
    // the child. If that child is the toggle button directly, those
    // values land in `{...buttonProps}` and — because Toggle's
    // Primitive.button spreads props AFTER its own explicit
    // `data-state={pressed ? "on" : "off"}` — they clobber the
    // active-state attribute the variant CSS hooks (`data-[state=on]:…`).
    // Wrapping the item in a non-focusable span keeps the trigger's
    // data-state on the span and the toggle's data-state on the
    // button, so selected-state styling stays intact. The span is
    // inline-flex so it doesn't disturb the parent's flex layout;
    // pointer / focus events bubble through to the inner button
    // (Radix Tooltip listens for both).
    return (
      <Tooltip delayDuration={tooltipDelay}>
        <TooltipTrigger asChild>
          <span className="inline-flex">{item}</span>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>{tooltip}</TooltipContent>
      </Tooltip>
    )
  }
)
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem, toggleGroupVariants, toggleGroupItemVariants }
