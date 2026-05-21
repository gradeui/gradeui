import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Toolbar — slot-based chrome bar for the leading/center/trailing
 * pattern Apple HIG describes as a "Toolbar."
 *
 *   ┌─────────────────────────────────────────────────┐
 *   │  [leading]          [center]         [trailing] │
 *   └─────────────────────────────────────────────────┘
 *
 * The three-region top nav is everywhere — Reddit, Twitter, GitHub,
 * Linear's top bar, every desktop app's window chrome — and most
 * scaffolds end up rebuilding it from raw `<Row justify="between">`
 * with a manual flex-1 on the center. This primitive collapses that
 * into:
 *
 *   <Toolbar leading={<Logo/>} center={<Search/>} trailing={<Avatar/>} />
 *
 * The grid template is `auto 1fr auto`, so the center slot absorbs
 * available width and stays visually centered relative to the bar
 * (not relative to the gap between leading and trailing). If any
 * slot is omitted, the grid column collapses cleanly.
 *
 * Accessibility — role="toolbar" by default, with aria-label expected
 * via props. WAI-ARIA toolbar pattern: children should be keyboard-
 * navigable via arrow keys if they're a tight set of related actions.
 * For an app chrome bar (logo + nav + actions) the standard tab
 * sequence is usually fine and a single aria-label is enough; for an
 * editor-style toolbar (B / I / S / link), pair with a roving
 * tabindex implementation. (Roving tabindex is out of scope for v1 —
 * if you need it, compose with @radix-ui/react-toolbar's primitives
 * inside the slots.)
 *
 * Anatomy:
 *   Toolbar         — <div role="toolbar"> by default; sets the grid
 *   Toolbar.Slot    — exported for symmetry but rarely needed; the
 *                     leading/center/trailing props are the canonical
 *                     API
 *
 * Variants:
 *   position   — "top" | "bottom" | "inline"   (border placement)
 *   variant    — "default" | "subtle" | "transparent"
 *   size       — "sm" | "md" | "lg"            (height + padding)
 *   sticky     — boolean                       (sticky to top/bottom)
 *
 * Used for: app window chrome (AppShellHeader), section toolbars
 * inside a card or panel, action bars at the bottom of a list,
 * persistent footer toolbars on mobile-style layouts.
 */
const toolbarVariants = cva(
  // Grid columns: auto 1fr auto — center stretches and visually
  // centers within the bar, regardless of leading/trailing widths.
  // gap-3 between columns by default; consumers can override.
  "grid items-center w-full gap-3 [grid-template-columns:auto_1fr_auto]",
  {
    variants: {
      position: {
        top: "border-b border-border",
        bottom: "border-t border-border",
        inline: "",
      },
      variant: {
        default: "bg-background",
        subtle: "bg-muted/30",
        transparent: "bg-transparent",
      },
      size: {
        sm: "min-h-10 px-3",
        md: "min-h-12 px-4",
        lg: "min-h-14 px-6",
      },
      sticky: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      // Sticky behaviour depends on which edge the toolbar lives on.
      // top → stick to top:0; bottom → stick to bottom:0. Inline
      // toolbars don't make sense to stick — left as-is.
      { sticky: true, position: "top", className: "sticky top-0 z-20" },
      { sticky: true, position: "bottom", className: "sticky bottom-0 z-20" },
    ],
    defaultVariants: {
      position: "top",
      variant: "default",
      size: "md",
      sticky: false,
    },
  }
);

export interface ToolbarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof toolbarVariants> {
  /** Left-aligned content. Usually a logo + primary nav links. */
  leading?: React.ReactNode;
  /** Center-aligned content. Usually a search input, a page title,
   *  or a segmented control. The center column stretches via `1fr`
   *  so it stays visually centered relative to the bar. */
  center?: React.ReactNode;
  /** Right-aligned content. Usually action icons + user avatar. */
  trailing?: React.ReactNode;
  /** When using `children` directly (advanced custom layout), the
   *  slot props are ignored. Most callers should prefer the slot
   *  props — they give the canonical grid layout for free. */
  children?: React.ReactNode;
  /** Required by WAI-ARIA toolbar pattern. Falls back to "Toolbar". */
  "aria-label"?: string;
}

const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  (
    {
      className,
      position,
      variant,
      size,
      sticky,
      leading,
      center,
      trailing,
      children,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    // When `children` is provided, escape into raw mode so the consumer
    // owns the inner layout. The grid template still applies, so the
    // children should fit into 3 columns (or use grid-column spans).
    const usingSlots = children == null;
    return (
      <div
        ref={ref}
        role="toolbar"
        aria-label={ariaLabel ?? "Toolbar"}
        data-gds-part="toolbar"
        data-position={position ?? "top"}
        className={cn(toolbarVariants({ position, variant, size, sticky }), className)}
        {...props}
      >
        {usingSlots ? (
          <>
            <div data-gds-part="toolbar-leading" className="flex items-center min-w-0">
              {leading}
            </div>
            <div data-gds-part="toolbar-center" className="flex items-center min-w-0 justify-center">
              {center}
            </div>
            <div data-gds-part="toolbar-trailing" className="flex items-center min-w-0 justify-end">
              {trailing}
            </div>
          </>
        ) : (
          children
        )}
      </div>
    );
  }
);
Toolbar.displayName = "Toolbar";

/**
 * ToolbarSlot — escape-hatch piece for the rare case a consumer
 * wants to compose a custom inner layout with children but still
 * get the slot styling. Use the slot props on Toolbar where you can.
 */
export interface ToolbarSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "leading" | "center" | "trailing";
}

const ToolbarSlot = React.forwardRef<HTMLDivElement, ToolbarSlotProps>(
  ({ className, align = "leading", ...props }, ref) => (
    <div
      ref={ref}
      data-gds-part={`toolbar-${align}`}
      className={cn(
        "flex items-center min-w-0",
        align === "center" && "justify-center",
        align === "trailing" && "justify-end",
        className
      )}
      {...props}
    />
  )
);
ToolbarSlot.displayName = "ToolbarSlot";

export { Toolbar, ToolbarSlot };
