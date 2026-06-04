"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

/**
 * Menu density. Set `size` on `<SelectContent>` and every `<SelectItem>`
 * inside it picks up matching padding / text-size / check-indicator
 * sizing via context — so a compact trigger (`size="xs"`) can have an
 * equally compact dropdown without per-item overrides. React context
 * flows through the Radix portal (it follows the React tree, not the
 * DOM), so items styled this way work even though the menu is portaled.
 */
type SelectMenuSize = "default" | "sm" | "xs" | "2xs";
const SelectMenuSizeContext = React.createContext<SelectMenuSize>("default");

/**
 * Select trigger variants — `size` lets dense surfaces (the
 * Studio inspector, settings sheets) reach for a compact `sm`
 * trigger without hand-rolling className overrides. Default keeps
 * the existing h-10 / px-3 / text-sm so this is a no-op for every
 * existing call site.
 */
const selectTriggerVariants = cva(
  // data-[placeholder] (not placeholder:) — Radix renders the Select
  // placeholder as a span flagged with that attribute; the input-style
  // pseudo-element selector never matches, so ghost values rendered
  // through the placeholder were showing full-strength.
  "flex w-full items-center justify-between rounded-md border border-input bg-background ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
  {
    variants: {
      size: {
        default: "h-10 px-3 py-2 text-sm",
        sm: "h-8 px-2 py-1 text-sm",
        // Figma-density — tool panels (the Studio inspector, shader controls).
        xs: "h-7 px-2 py-0 text-xs",
        // rounded-lg (a step up from the base rounded-md) + tighter
        // leading edge — at h-6 the md radius reads boxy and the 8px
        // inset pushed the property glyph too far in.
        "2xs": "h-6 rounded-lg pl-1.5 pr-2 py-0 text-2xs",
      },
    },
    defaultVariants: { size: "default" },
  }
);

type SelectTriggerSize = NonNullable<
  VariantProps<typeof selectTriggerVariants>["size"]
>;

const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: SelectTriggerSize;
    /** Adornment rendered inside the trigger on the leading edge — a
     *  property glyph, a unit. Mirrors Input's startSlot. Grouped with
     *  the value in a div (NOT a bare span: the trigger's
     *  `[&>span]:line-clamp-1` would stack a span's children
     *  vertically). */
    startSlot?: React.ReactNode;
    /** Hide the dropdown chevron — Figma-style token fields keep the
     *  right edge for their own affordances (detach/attach). */
    chevron?: boolean;
  }
>(
  (
    { className, children, size = "default", startSlot, chevron = true, ...props },
    ref,
  ) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(selectTriggerVariants({ size }), className)}
    {...props}
  >
    {startSlot ? (
      <div className="flex min-w-0 flex-1 items-center gap-1.5 [&>span]:truncate">
        <span className="pointer-events-none flex shrink-0 items-center text-muted-foreground/70 [&_svg]:size-4">
          {startSlot}
        </span>
        {children}
      </div>
    ) : (
      children
    )}
    {chevron ? (
      <SelectPrimitive.Icon asChild>
        <ChevronDown
          className={cn(
            "opacity-50",
            size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
          )}
        />
      </SelectPrimitive.Icon>
    ) : null}
  </SelectPrimitive.Trigger>
  ),
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    size?: SelectMenuSize;
  }
>(({ className, children, position = "popper", size = "default", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          size === "default" ? "p-1" : "p-0.5",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        <SelectMenuSizeContext.Provider value={size}>
          {children}
        </SelectMenuSizeContext.Provider>
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const selectItemVariants = cva(
  "relative flex w-full cursor-default select-none items-center rounded-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  {
    variants: {
      size: {
        default: "py-1.5 pl-8 pr-2 text-sm",
        sm: "py-1 pl-7 pr-2 text-sm",
        xs: "py-1 pl-6 pr-2 text-xs",
        "2xs": "py-0.5 pl-6 pr-2 text-2xs",
      },
    },
    defaultVariants: { size: "default" },
  }
);

const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    /** Optional right-aligned secondary text (e.g. a token's resolved
     *  value). Rendered in the menu row only — NOT inside ItemText, so
     *  it never mirrors into the trigger via SelectValue. */
    hint?: React.ReactNode;
  }
>(({ className, children, hint, ...props }, ref) => {
  const size = React.useContext(SelectMenuSizeContext);
  const compact = size !== "default";
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn("group", selectItemVariants({ size }), className)}
      {...props}
    >
      <span
        className={cn(
          "absolute flex items-center justify-center",
          compact ? "left-1.5 h-3 w-3" : "left-2 h-3.5 w-3.5",
        )}
      >
        <SelectPrimitive.ItemIndicator>
          <Check className={compact ? "h-3 w-3" : "h-4 w-4"} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      {hint != null ? (
        // Brightens on the highlighted row — muted-on-accent was
        // unreadable under the hover/focus background.
        <span className="ml-auto pl-3 tabular-nums text-muted-foreground/60 group-focus:text-accent-foreground/80 group-data-[highlighted]:text-accent-foreground/80">
          {hint}
        </span>
      ) : null}
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
