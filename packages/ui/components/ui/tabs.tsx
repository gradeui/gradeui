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
 * **Variant** (May 2026 — added during the SimpleTabs collapse):
 *   - `pill` (default) — shadcn-style chips on a `bg-muted` pill.
 *   - `underlined` — minimal underlined-tab look (text-primary on
 *     active + bottom border indicator). What used to live in
 *     SimpleTabs. Reach for this on marketing pages, docs nav,
 *     and any "browser-tab-like" treatment.
 *
 * Icons: pass an `<svg>` (lucide etc.) as a sibling of the label inside
 * `TabsTrigger`. The variant rules apply `[&_svg]:size-*` to auto-size
 * any child icon to the right scale, plus `gap-*` between icon and
 * label. No icon prop needed.
 *
 *   <Tabs defaultValue="preview">
 *     <TabsList size="md" variant="underlined">
 *       <TabsTrigger value="preview"><Eye /> Preview</TabsTrigger>
 *       <TabsTrigger value="code"><Code2 /> Code</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="preview">…</TabsContent>
 *     <TabsContent value="code">…</TabsContent>
 *   </Tabs>
 */

export type TabsSize = "sm" | "md" | "lg"
export type TabsVariant = "pill" | "underlined"

interface TabsContextValue {
  size: TabsSize
  variant: TabsVariant
}
const TabsStyleContext = React.createContext<TabsContextValue>({
  size: "md",
  variant: "pill",
})

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

const tabsListVariants = cva("inline-flex items-center text-muted-foreground", {
  variants: {
    variant: {
      pill: "justify-center rounded-lg bg-muted",
      // Underlined: row of text/icon triggers sitting on a single
      // bottom rule. The list owns the baseline border; the active
      // trigger paints over it via `border-primary` + `-mb-px`.
      underlined: "justify-start border-b border-border",
    },
    size: {
      sm: "",
      md: "",
      lg: "",
    },
  },
  compoundVariants: [
    // Pill: list owns the chip height + breathing-room padding.
    { variant: "pill", size: "sm", className: "h-7 p-0.5" },
    { variant: "pill", size: "md", className: "h-8 p-0.5" },
    { variant: "pill", size: "lg", className: "h-10 p-1" },
    // Underlined: list is content-sized; size only changes the gap
    // between triggers (their own padding handles vertical rhythm).
    { variant: "underlined", size: "sm", className: "gap-3" },
    { variant: "underlined", size: "md", className: "gap-4" },
    { variant: "underlined", size: "lg", className: "gap-6" },
  ],
  defaultVariants: { variant: "pill", size: "md" },
})

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        pill: "rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground",
        // Underlined: transparent surface, primary text + thicker
        // bottom border on active. `-mb-px` pulls the trigger down
        // one pixel so its border sits ON TOP of the list's border,
        // not below it (no double-line on active).
        underlined:
          "rounded-none bg-transparent border-b-2 border-transparent -mb-px hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary",
      },
      size: {
        sm: "text-[11px] gap-1 [&_svg]:size-3",
        md: "text-xs gap-1.5 [&_svg]:size-3.5",
        lg: "text-sm gap-2 [&_svg]:size-4",
      },
    },
    compoundVariants: [
      // Pill triggers fit inside the sized list — fixed heights.
      { variant: "pill", size: "sm", className: "h-6 px-1.5" },
      { variant: "pill", size: "md", className: "h-7 px-2" },
      { variant: "pill", size: "lg", className: "h-8 px-2.5" },
      // Underlined triggers own their own vertical space — taller
      // padding-block so the underline has room to sit below.
      { variant: "underlined", size: "sm", className: "pb-1.5 pt-1 px-1" },
      { variant: "underlined", size: "md", className: "pb-2 pt-1.5 px-1.5" },
      { variant: "underlined", size: "lg", className: "pb-2.5 pt-2 px-2" },
    ],
    defaultVariants: { variant: "pill", size: "md" },
  }
)

// ─── TabsList ───────────────────────────────────────────────────────────

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, size = "md", variant = "pill", children, ...props }, ref) => (
  // Provide the size + variant to every nested TabsTrigger so consumers
  // only set them once on the list. Individual triggers can still
  // override by passing their own `size` / `variant` props.
  <TabsStyleContext.Provider value={{ size: size ?? "md", variant: variant ?? "pill" }}>
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsListVariants({ size, variant }), className)}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  </TabsStyleContext.Provider>
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
>(({ className, size, variant, tooltip, ...props }, ref) => {
  const inherited = React.useContext(TabsStyleContext)
  const resolvedSize = size ?? inherited.size
  const resolvedVariant = variant ?? inherited.variant

  // Auto-apply aria-label from tooltip when it's a plain string and
  // the consumer didn't already set one. Icon-only triggers need an
  // accessible name; tooltip text is the natural source.
  const ariaLabel =
    props["aria-label"] ??
    (typeof tooltip === "string" ? tooltip : undefined)

  const trigger = (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        tabsTriggerVariants({ size: resolvedSize, variant: resolvedVariant }),
        className,
      )}
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
