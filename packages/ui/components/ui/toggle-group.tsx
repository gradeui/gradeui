"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

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
    VariantProps<typeof toggleGroupItemVariants>

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(({ className, size, ...props }, ref) => {
  const inherited = React.useContext(ToggleGroupSizeContext)
  const resolved = size ?? inherited
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(toggleGroupItemVariants({ size: resolved }), className)}
      {...props}
    />
  )
})
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem, toggleGroupVariants, toggleGroupItemVariants }
