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
 * cascades to every `TabsTrigger` inside via a small context. Triggers
 * may also opt out per-call with their own `size` prop if a row needs
 * a one-off override.
 *
 * Icons: pass an `<svg>` (lucide etc.) as a sibling of the label inside
 * `TabsTrigger`. The variant rules apply `[&_svg]:size-*` to auto-size
 * any child icon to the right scale, plus `gap-*` between icon and
 * label. No icon prop needed.
 *
 *   <Tabs defaultValue="preview">
 *     <TabsList size="md">
 *       <TabsTrigger value="preview"><Eye /> Preview</TabsTrigger>
 *       <TabsTrigger value="code"><Code2 /> Code</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="preview">…</TabsContent>
 *     <TabsContent value="code">…</TabsContent>
 *   </Tabs>
 */

export type TabsSize = "sm" | "md" | "lg"

const TabsSizeContext = React.createContext<TabsSize>("md")

const Tabs = TabsPrimitive.Root

// ─── Variants ───────────────────────────────────────────────────────────
//
// Sizing math (so the visible whitespace stays roughly symmetric on
// both axes — that was the v1 papercut):
//
//   sm: list h-7 p-0.5 → inner 24px. Trigger h-6 (24px) fits exactly.
//       Text 11px + size-3 icon (12px) ~ 12px content; vertical air
//       = (24-12)/2 = 6px. Horizontal px-1.5 = 6px. ≈ symmetric.
//   md: list h-8 p-0.5 → inner 28px. Trigger h-7 (28px). text-xs
//       (12px) + size-3.5 icon (14px) ~ 14px content; vertical air
//       = (28-14)/2 = 7px. Horizontal px-2 = 8px. Within 1px.
//   lg: list h-10 p-1 → inner 32px. Trigger h-8 (32px). text-sm
//       (14px) + size-4 icon (16px) ~ 16px content; vertical air
//       = (32-16)/2 = 8px. Horizontal px-2.5 = 10px. Within 2px.

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
        sm: "h-6 px-1.5 text-[11px] gap-1 [&_svg]:size-3",
        md: "h-7 px-2 text-xs gap-1.5 [&_svg]:size-3.5",
        lg: "h-8 px-2.5 text-sm gap-2 [&_svg]:size-4",
      },
    },
    defaultVariants: { size: "md" },
  }
)

// ─── TabsList ───────────────────────────────────────────────────────────

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, size = "md", children, ...props }, ref) => (
  // Provide the size to every nested TabsTrigger so consumers only
  // set it once on the list. Individual triggers can still override
  // by passing their own `size` prop.
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

// ─── TabsTrigger ────────────────────────────────────────────────────────

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
   * Requires a `<TooltipProvider>` somewhere above the tabs. The
   * design system's root layout mounts one app-wide.
   */
  tooltip?: React.ReactNode
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, size, tooltip, ...props }, ref) => {
  const inheritedSize = React.useContext(TabsSizeContext)
  const resolvedSize = size ?? inheritedSize

  // Auto-apply aria-label from tooltip when it's a plain string and
  // the consumer didn't already set one. Icon-only triggers need an
  // accessible name; tooltip text is the natural source.
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

// ─── TabsContent ────────────────────────────────────────────────────────

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
