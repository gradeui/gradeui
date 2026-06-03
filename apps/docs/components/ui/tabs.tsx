"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * Tabs — accessible tab strip + content switcher built on Radix.
 *
 * Sizing is a t-shirt scale: `sm` / `md` / `lg`. Set on `TabsList`;
 * cascades to every `TabsTrigger` inside via a small context.
 *
 * Icons: pass an `<svg>` (lucide etc.) as a sibling of the label inside
 * `TabsTrigger`. The variant rules apply `[&_svg]:size-*` to auto-size
 * any child icon, plus `gap-*` between icon and label.
 */

export type TabsSize = "sm" | "md" | "lg"

const TabsSizeContext = React.createContext<TabsSize>("md")

const Tabs = TabsPrimitive.Root

const tabsListVariants = cva(
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

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground",
  {
    variants: {
      size: {
        sm: "h-6 px-1.5 text-2xs gap-1 [&_svg]:size-3",
        md: "h-7 px-2 text-xs gap-1.5 [&_svg]:size-3.5",
        lg: "h-8 px-2.5 text-sm gap-2 [&_svg]:size-4",
      },
    },
    defaultVariants: { size: "md" },
  }
)

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, size = "md", children, ...props }, ref) => (
  <TabsSizeContext.Provider value={size ?? "md"}>
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsListVariants({ size }), className)}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  </TabsSizeContext.Provider>
))
TabsList.displayName = TabsPrimitive.List.displayName

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {
  /**
   * Tooltip text shown on hover / focus. Designed for icon-only
   * triggers: pass `<TabsTrigger value="preview" tooltip="Preview">`
   * with an icon child, and the component handles the rest. If
   * `aria-label` is not set explicitly, the tooltip string is also
   * applied as `aria-label` so screen readers can name the choice.
   *
   * Requires a `<TooltipProvider>` somewhere above the tabs.
   */
  tooltip?: React.ReactNode
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, size, tooltip, ...props }, ref) => {
  const inheritedSize = React.useContext(TabsSizeContext)
  const resolvedSize = size ?? inheritedSize

  const ariaLabel =
    props["aria-label"] ??
    (typeof tooltip === "string" ? tooltip : undefined)

  const trigger = (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(tabsTriggerVariants({ size: resolvedSize }), className)}
      aria-label={ariaLabel}
      {...props}
    />
  )

  if (!tooltip) return trigger

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  tabsTriggerVariants,
}
