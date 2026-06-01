"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"
import { SURFACE_CLASS, surfaceBg, type Surface } from "@/lib/surface"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

/**
 * Menu density. Set `size` on `<DropdownMenuContent>` (or
 * `<DropdownMenuSubContent>`) and every item inside — Item, Checkbox,
 * Radio, SubTrigger, Label — picks up matching padding / text-size via
 * context (which flows through the Radix portal). Mirrors Select so a
 * compact trigger can have an equally compact menu. `xs` is the
 * tool-panel density (the Studio inspector).
 */
type DropdownMenuSize = "default" | "sm" | "xs"
const DropdownMenuSizeContext = React.createContext<DropdownMenuSize>("default")
const ddItemBase = (size: DropdownMenuSize) =>
  size === "default" ? "px-2 py-1.5 text-sm" : "px-2 py-1 text-xs"

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => {
  const size = React.useContext(DropdownMenuSizeContext)
  return (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:shrink-0",
      ddItemBase(size),
      size === "default" ? "[&_svg]:size-4" : "[&_svg]:size-3.5",
      inset && (size === "default" ? "pl-8" : "pl-7"),
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
  )
})
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

export interface DropdownMenuSubContentProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> {
  /** What the submenu surface is *made of*. See dropdown-menu.md. */
  surface?: Surface
  /** Menu density — cascades to items via context. */
  size?: DropdownMenuSize
}

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  DropdownMenuSubContentProps
>(({ className, surface = "solid", size = "default", children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    data-surface={surface}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      size === "default" ? "p-1" : "p-0.5",
      surfaceBg(surface, "bg-popover"),
      SURFACE_CLASS[surface],
      className
    )}
    {...props}
  >
    <DropdownMenuSizeContext.Provider value={size}>
      {children}
    </DropdownMenuSizeContext.Provider>
  </DropdownMenuPrimitive.SubContent>
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

export interface DropdownMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> {
  /**
   * What the menu surface is *made of*. `solid` (default) is `bg-popover`.
   * `translucent` matches Apple HIG / iOS menu sheets. `glass` for menus
   * floating over rich canvases. See dropdown-menu.md.
   */
  surface?: Surface
  /** Menu density — cascades to items via context. */
  size?: DropdownMenuSize
}

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(({ className, sideOffset = 4, surface = "solid", size = "default", children, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      data-surface={surface}
      className={cn(
        "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border text-popover-foreground shadow-md",
        size === "default" ? "p-1" : "p-0.5",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
        surfaceBg(surface, "bg-popover"),
        SURFACE_CLASS[surface],
        className
      )}
      {...props}
    >
      <DropdownMenuSizeContext.Provider value={size}>
        {children}
      </DropdownMenuSizeContext.Provider>
    </DropdownMenuPrimitive.Content>
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => {
  const size = React.useContext(DropdownMenuSizeContext)
  return (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:shrink-0",
      ddItemBase(size),
      size === "default" ? "[&>svg]:size-4" : "[&>svg]:size-3.5",
      inset && (size === "default" ? "pl-8" : "pl-7"),
      className
    )}
    {...props}
  />
  )
})
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => {
  const size = React.useContext(DropdownMenuSizeContext)
  const compact = size !== "default"
  return (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm pr-2 outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      compact ? "py-1 pl-7 text-xs" : "py-1.5 pl-8 text-sm",
      className
    )}
    checked={checked}
    {...props}
  >
    <span
      className={cn(
        "absolute flex items-center justify-center",
        compact ? "left-1.5 h-3 w-3" : "left-2 h-3.5 w-3.5",
      )}
    >
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className={compact ? "h-3 w-3" : "h-4 w-4"} />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
  )
})
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => {
  const size = React.useContext(DropdownMenuSizeContext)
  const compact = size !== "default"
  return (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm pr-2 outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      compact ? "py-1 pl-7 text-xs" : "py-1.5 pl-8 text-sm",
      className
    )}
    {...props}
  >
    <span
      className={cn(
        "absolute flex items-center justify-center",
        compact ? "left-1.5 h-3 w-3" : "left-2 h-3.5 w-3.5",
      )}
    >
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
  )
})
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => {
  const size = React.useContext(DropdownMenuSizeContext)
  return (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "font-semibold",
      size === "default" ? "px-2 py-1.5 text-sm" : "px-2 py-1 text-xs",
      inset && (size === "default" ? "pl-8" : "pl-7"),
      className
    )}
    {...props}
  />
  )
})
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
