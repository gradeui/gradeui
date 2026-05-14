import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Use explicit pl-3 + pr-3 (not the shorthand px-3) so a
          // consumer-supplied `pl-*` (search input with leading icon) can
          // override the left padding via twMerge. twMerge treats `px-*`
          // and `pl-*` as separate conflict groups and won't dedup them;
          // pl-3 vs pl-* IS a recognised conflict and gets merged
          // correctly. Same visual default, no override surprises.
          "flex h-9 w-full rounded-md border border-input bg-transparent pl-3 pr-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
