"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { SURFACE_CLASS, surfaceBg, type Surface } from "@/lib/surface"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /**
   * What the dialog surface is *made of*. Composes with the overlay
   * scrim — see PRESENCE.md and dialog.md for scenarios.
   *
   * - `solid` (default): opaque `bg-background`.
   * - `translucent`: ~82% opacity, no blur — "presence without drama".
   * - `glass`: 58% opacity + 14px blur + edge highlight. The page
   *   underneath shows through softly.
   * - `glass-strong`: 42% opacity + 24px blur. For dialogs that should
   *   feel like an overlay rather than a panel.
   */
  surface?: Surface
  /**
   * How the panel is shaped on small screens.
   *
   * - `sheet` (default): a full-screen sheet below `sm`, its padding
   *   clearing the device safe areas, content scrolling. The right
   *   shape for forms and flows — there is more to do than read.
   * - `center`: the centred card at every width. Use for short
   *   confirmations and for anything the user cannot dismiss (a
   *   full-screen non-dismissable sheet is a trap on a phone).
   *
   * From `sm` up the two are identical.
   */
  layout?: "sheet" | "center"
  /** Render the built-in close button. Set false when the dialog owns
   *  its own dismissal (or deliberately has none). */
  showClose?: boolean
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(
  (
    {
      className,
      children,
      surface = "solid",
      layout = "sheet",
      showClose = true,
      ...props
    },
    ref
  ) => (
    <DialogPortal>
      <DialogOverlay />
      {/* Below sm the panel is a full-screen sheet whose padding clears
          the device safe areas; from sm up it is the centred card. It
          enters in place (fade + scale from its own centre) — it used
          to slide in from the top-left on top of the centring
          transform, which read as flying in from the corner. Keep the
          base classes as ONE string: the contract generator extracts
          styleDefaults from a single literal. */}
      <DialogPrimitive.Content
        ref={ref}
        data-surface={surface}
        data-layout={layout}
        className={cn(
          "fixed inset-0 z-50 grid content-start gap-4 overflow-y-auto border p-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-lg duration-200 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[85dvh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:p-8 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          layout === "center" &&
            "inset-auto left-1/2 top-1/2 h-auto max-h-[85dvh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl",
          surfaceBg(surface, "bg-background"),
          SURFACE_CLASS[surface],
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full text-muted-foreground opacity-80 transition-colors hover:bg-muted hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:pointer-events-none sm:right-6 sm:top-6">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
)
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
