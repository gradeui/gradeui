"use client"

import * as React from "react"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

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
}: React.ComponentProps<"span">) => {
  // Per-instance `children` always wins (so designs that want a
  // different glyph just before the current page can opt-out). When
  // no children, read the tree-wide default from context — set by
  // the Breadcrumb root's `separator` prop. If neither is set,
  // ChevronRight is the fallback so a bare <BreadcrumbSeparator/>
  // outside a Breadcrumb root still renders something.
  //
  // <span>, NOT <li> (where shadcn puts it): the model routinely
  // composes the separator INSIDE <BreadcrumbItem> rather than as a
  // sibling, and li-in-li is invalid HTML — React 19 throws a
  // hydration error and the whole screen re-renders client-side. A
  // span is valid in both positions (browsers tolerate it as an <ol>
  // child; it's aria-hidden presentation either way), so the
  // component absorbs both compositions instead of failing one.
  const fromContext = React.useContext(BreadcrumbSeparatorContext)
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn(
        "inline-flex items-center [&_svg]:size-3 [&_svg]:shrink-0 text-muted-foreground/60",
        className
      )}
      {...props}
    >
      {children ?? fromContext}
    </span>
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

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
