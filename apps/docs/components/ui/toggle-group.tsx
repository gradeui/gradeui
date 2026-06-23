"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn(
      "flex items-center justify-center gap-1",
      // segmented — the items sit in a single muted track, no gaps, so it
      // reads as one control rather than separate toggle buttons.
      variant === "segmented" && "inline-flex gap-0 rounded-lg bg-muted p-0.5",
      className,
    )}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

// Mirror of the canonical packages/ui props — see
// packages/ui/components/ui/toggle-group.tsx for the source of truth.
// `tooltip` wraps the item in a Tooltip so icon-only toggles keep
// an accessible label without crowding the chrome with text.
type ToggleGroupItemProps =
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants> & {
      tooltip?: React.ReactNode
      tooltipSide?: React.ComponentPropsWithoutRef<typeof TooltipContent>["side"]
      tooltipDelay?: number
    }

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(
  (
    {
      className,
      children,
      variant,
      size,
      tooltip,
      tooltipSide = "top",
      tooltipDelay,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const context = React.useContext(ToggleGroupContext)
    const resolvedAriaLabel =
      ariaLabel ?? (typeof tooltip === "string" ? tooltip : undefined)
    const item = (
      <ToggleGroupPrimitive.Item
        ref={ref}
        className={cn(
          toggleVariants({
            variant: context.variant || variant,
            size: context.size || size,
          }),
          className
        )}
        aria-label={resolvedAriaLabel}
        {...props}
      >
        {children}
      </ToggleGroupPrimitive.Item>
    )
    if (tooltip == null) return item
    // Wrap in a span so the trigger's `data-state="closed"` lands on
    // the span, not on the toggle button. Without this, the trigger
    // attribute clobbers the toggle's own `data-state="on"` and the
    // active-state styling disappears. See the packages/ui mirror for
    // the full explanation.
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

export { ToggleGroup, ToggleGroupItem }
