"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

/**
 * Breadcrumb — composable navigation primitive.
 *
 * Pure surface-less component (no background, no border, no sticky
 * positioning). Density matches `TabsTrigger` so a breadcrumb row
 * placed above a tab strip — or alongside one — reads at the same
 * scale.
 *
 * Composition is shadcn-flavoured:
 *
 *   <Breadcrumb>
 *     <BreadcrumbList>
 *       <BreadcrumbItem>
 *         <BreadcrumbLink onClick={onBack}>All screens</BreadcrumbLink>
 *       </BreadcrumbItem>
 *       <BreadcrumbSeparator />
 *       <BreadcrumbItem>
 *         <BreadcrumbPage>Pricing</BreadcrumbPage>
 *       </BreadcrumbItem>
 *     </BreadcrumbList>
 *   </Breadcrumb>
 *
 * Note: the `TopMenu` component in this package wraps the same
 * breadcrumb idea in an app-bar surface (sticky, bordered, padded).
 * Use TopMenu when you want the full app-shell chrome; use
 * Breadcrumb on its own when you want navigation embedded inside an
 * existing surface (e.g. inside the Studio canvas).
 */

// Separator inheritance context. Set on the Breadcrumb root via the
// `separator` prop; every <BreadcrumbSeparator/> below it that doesn't
// pass its own children reads from here. Per-instance children still
// win — useful for "different separator just before the current page"
// designs.
const BreadcrumbSeparatorContext = React.createContext<React.ReactNode>(
  <ChevronRight />,
)

export interface BreadcrumbProps extends React.ComponentPropsWithoutRef<"nav"> {
  /** Default separator node for every <BreadcrumbSeparator/> inside this
   *  tree. Pass a string ("/", "›", "•"), a lucide icon (<Slash />,
   *  <ChevronRight />), or any ReactNode. Default: <ChevronRight />.
   *  Per-instance `<BreadcrumbSeparator>children</BreadcrumbSeparator>`
   *  still overrides. */
  separator?: React.ReactNode
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ separator, children, ...props }, ref) => (
    <BreadcrumbSeparatorContext.Provider value={separator ?? <ChevronRight />}>
      <nav ref={ref} aria-label="breadcrumb" {...props}>
        {children}
      </nav>
    </BreadcrumbSeparatorContext.Provider>
  ),
)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-xs text-muted-foreground",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

// Shared link/button classes — the visual is identical regardless of
// whether the underlying element is an <a> (has href) or a <button>
// (in-app navigation via onClick).
const breadcrumbLinkClasses = cn(
  "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs",
  "transition-colors hover:text-foreground hover:bg-muted/60",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
)

interface BreadcrumbLinkProps extends React.HTMLAttributes<HTMLElement> {
  /** Anchor href. When set, renders an <a>; otherwise renders a <button>. */
  href?: string
  /** Use a <span> instead of <a>/<button> — useful when wrapping in a
   *  framework-specific Link component yourself. */
  asChild?: boolean
}

// Split into three forwardRefs (one per element) so TypeScript can
// type the ref correctly. A polymorphic forwardRef would need a
// generic ref type — more ceremony than the API needs.
const BreadcrumbLink = React.forwardRef<HTMLElement, BreadcrumbLinkProps>(
  ({ asChild, className, href, ...props }, ref) => {
    if (asChild) {
      return (
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          className={cn(breadcrumbLinkClasses, className)}
          {...props}
        />
      )
    }
    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={cn(breadcrumbLinkClasses, className)}
          {...props}
        />
      )
    }
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={cn(breadcrumbLinkClasses, className)}
        {...props}
      />
    )
  }
)
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn(
      "inline-flex items-center gap-1.5 px-0.5 text-xs font-medium text-foreground",
      "[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
      className
    )}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => {
  // Per-instance `children` always wins (so designs that want a
  // different glyph just before the current page can opt-out). When
  // no children, read the tree-wide default from context — set by
  // the Breadcrumb root's `separator` prop. If neither is set,
  // ChevronRight is the fallback so a bare <BreadcrumbSeparator/>
  // outside a Breadcrumb root still renders something.
  const fromContext = React.useContext(BreadcrumbSeparatorContext)
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn(
        "[&_svg]:size-3 [&_svg]:shrink-0 text-muted-foreground/60",
        className
      )}
      {...props}
    >
      {children ?? fromContext}
    </li>
  )
}
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-5 w-5 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-3.5 w-3.5" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

// ─────────────────────────────────────────────────────────────────────
// Menu variant — each segment is a dropdown of peer/child items
// ─────────────────────────────────────────────────────────────────────
//
// A column-view-style Breadcrumb. Each segment can carry its own
// `items` array, and clicking the segment opens a popover listing
// them — usually the segment's children or peers, surfaced for
// fast horizontal navigation without a sidebar tree.
//
// Each item supports a primary `label` and an optional 3-5 word
// `summary` so the popover reads more like a content menu than a
// raw node list. The Studio canvas path bar uses this with AI-
// generated summaries (`data-gds-summary`) to let designers walk
// the rendered tree at speed; the same primitive can drive a
// docs sidebar, a Finder-style file picker, etc.
//
// Backward compatible — none of the existing Breadcrumb subparts
// change. `BreadcrumbMenuTrigger` is purely additive; reach for it
// only when you want the dropdown behavior.

/** One row inside a BreadcrumbMenuTrigger's popover. The dropdown
 *  renders the label as the main text and (optionally) a small
 *  muted summary line below. `active` is the visual cue for "this
 *  is the current trail node" so users can tell which entry maps
 *  to their current path. `hasChildren` adds a `›` so the user
 *  knows this entry has its own sub-menu when they pick it. */
export interface BreadcrumbMenuItem {
  id: string
  label: string
  summary?: string
  active?: boolean
  hasChildren?: boolean
}

export interface BreadcrumbMenuTriggerProps {
  /** The label that appears in the breadcrumb itself (e.g. "Stack",
   *  "AppShellMain"). Distinct from the items: this is the segment
   *  the user is hovering, not its children. */
  label: string
  /** Items to render in the popover when the segment is opened.
   *  Typically the children of the node this segment represents. */
  items: BreadcrumbMenuItem[]
  /** Called with the picked item's id when the user makes a
   *  selection. The popover auto-closes on select. */
  onSelect: (id: string) => void
  /** Optional click handler for the segment label itself (not the
   *  dropdown). Useful when the host wants clicking the label to
   *  also select that node directly. When omitted, the label is
   *  purely a popover trigger. */
  onSelectLabel?: () => void
  /** When true, mark the trigger as the current trail position.
   *  Visually heavier (matches BreadcrumbPage's weight) and the
   *  chevron rotates down to signal "you are here." */
  current?: boolean
  className?: string
}

/**
 * Segment that opens a popover of children/peers. Composes inside
 * a `<BreadcrumbItem>` exactly where you'd otherwise put a
 * `<BreadcrumbLink>` — same density, same focus ring.
 *
 *   <BreadcrumbItem>
 *     <BreadcrumbMenuTrigger
 *       label="Stack"
 *       items={children}
 *       onSelect={selectById}
 *     />
 *   </BreadcrumbItem>
 */
const BreadcrumbMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  BreadcrumbMenuTriggerProps
>(({ label, items, onSelect, onSelectLabel, current, className }, ref) => {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={ref}
          type="button"
          className={cn(
            breadcrumbLinkClasses,
            current && "font-medium text-foreground",
            className,
          )}
          onClick={() => {
            // When the host wants label-clicks to ALSO select that
            // node (the common case for Studio's path bar — click
            // the label to land on the current segment), invoke the
            // handler and skip opening the popover. The user can
            // still pop the dropdown by clicking the chevron.
            if (onSelectLabel) {
              onSelectLabel()
            } else {
              setOpen((v) => !v)
            }
          }}
        >
          <span>{label}</span>
          <ChevronDown
            className={cn(
              "h-3 w-3 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
            // The chevron is the dedicated popover handle — clicking
            // it always opens, regardless of whether `onSelectLabel`
            // is wired. Stop propagation so the label's onClick
            // doesn't also fire.
            onClick={(e) => {
              e.stopPropagation()
              setOpen((v) => !v)
            }}
            role="button"
            aria-label={`Show ${label} children`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 p-1 max-h-80 overflow-y-auto"
      >
        {items.length === 0 ? (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            No items here yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(item.id)
                    setOpen(false)
                  }}
                  className={cn(
                    "w-full text-left rounded-md px-2 py-1.5",
                    "flex items-start gap-2",
                    "hover:bg-muted transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    item.active && "bg-muted/60",
                  )}
                >
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-foreground truncate">
                        {item.label}
                      </span>
                      {item.active && (
                        <Check className="h-3 w-3 text-primary shrink-0" />
                      )}
                    </span>
                    {item.summary && (
                      <span className="block text-[10px] text-muted-foreground leading-snug truncate">
                        {item.summary}
                      </span>
                    )}
                  </span>
                  {item.hasChildren && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground/70 shrink-0 mt-0.5" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
})
BreadcrumbMenuTrigger.displayName = "BreadcrumbMenuTrigger"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  BreadcrumbMenuTrigger,
}
