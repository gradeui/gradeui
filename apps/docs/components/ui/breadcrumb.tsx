"use client"

import * as React from "react"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Breadcrumb — composable navigation primitive.
 *
 * Pure surface-less component. Density matches `TabsTrigger` so a
 * breadcrumb row placed above (or alongside) a tab strip reads at
 * the same scale.
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
 */

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
  }
>(({ ...props }, ref) => (
  <nav ref={ref} aria-label="breadcrumb" {...props} />
))
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

const breadcrumbLinkClasses = cn(
  "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs",
  "transition-colors hover:text-foreground hover:bg-muted/60",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
)

interface BreadcrumbLinkProps extends React.HTMLAttributes<HTMLElement> {
  href?: string
  asChild?: boolean
}

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
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn(
      "[&_svg]:size-3 [&_svg]:shrink-0 text-muted-foreground/60",
      className
    )}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
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
