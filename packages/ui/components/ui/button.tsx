import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button — primary action primitive.
 *
 * Sizes (t-shirt scale) align EXACTLY to Tabs / ToggleGroup outer
 * heights so a button placed next to a tab strip lines up without
 * any per-call className overrides:
 *
 *   2xs: h-5 (20px)  — densest tool-panel size; matches Figma Button size=2xs
 *   xs:  h-6 (24px)  — tool-panel density; matches Figma Button size=xs
 *   sm:  h-7 (28px)  — matches `<TabsList size="sm">` height
 *   md:  h-8 (32px)  — matches `<TabsList size="md">` height (default)
 *   lg:  h-10 (40px) — matches `<TabsList size="lg">` height
 *
 * `default` is preserved as an alias for `md` so existing call sites
 * keep working through the rename.
 *
 * `iconOnly` squares the button at WHATEVER `size` it has (2xs=20, sm=28,
 * md=32, lg=40) by dropping horizontal padding and matching width to
 * height. It's a boolean modifier on top of the height ramp — there is no
 * separate icon size value — and the icon you pass as the child is centered.
 *
 * Type and icon sizes also follow the Tabs scale (text-xs + size-3.5
 * at sm/md, text-sm + size-4 at lg) so the visual rhythm reads
 * consistent across primitives.
 */

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Tactile "physical key" treatment — inner bevel + outer drop +
        // ambient hover glow keyed off `--btn-glow` (defaults to the
        // --selected-glow blue). Drive the tone per-button with a style
        // override, e.g. `style={{ '--btn-glow': 'var(--warning)' }}`,
        // or with `data-state="on"` / `aria-pressed="true"` for a held
        // selected look. Heavy lift lives in .gds-button-raised so the
        // multi-stop shadow stack stays readable.
        raised: "gds-button-raised gds-button-raised-surface",
      },
      size: {
        // 2xs: h-5 (20px) — densest tool-panel button (the Studio inspector); matches Figma Button size=2xs.
        "2xs": "h-5 gap-1 px-1.5 text-2xs [&_svg]:size-3",
        // xs: h-6 (24px) — Figma-density for tool panels; matches Figma Button size=xs.
        xs: "h-6 gap-1 px-2 text-xs [&_svg]:size-3",
        sm: "h-7 gap-1.5 px-2.5 text-sm [&_svg]:size-3.5",
        md: "h-8 gap-1.5 px-3 text-base [&_svg]:size-4",
        // Alias for md — back-compat with usages that predate the
        // t-shirt rename. Same classes as md verbatim.
        default: "h-8 gap-1.5 px-3 text-base [&_svg]:size-4",
        lg: "h-10 gap-2 px-4 text-lg [&_svg]:size-5",
      },
      // Squares the button at the current `size` height for icon-only use.
      // px-0 here drops the text padding; the per-size width that makes it
      // square (w = h) lives in compoundVariants below.
      iconOnly: {
        true: "px-0",
        false: "",
      },
    },
    compoundVariants: [
      // width = height per size → a true square at every density.
      { size: "2xs", iconOnly: true, class: "w-5" },
      { size: "xs", iconOnly: true, class: "w-6" },
      { size: "sm", iconOnly: true, class: "w-7" },
      { size: "md", iconOnly: true, class: "w-8" },
      { size: "default", iconOnly: true, class: "w-8" },
      { size: "lg", iconOnly: true, class: "w-10" },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Presence TRAIT: tactile elevation (bevel + drop + hover glow +
   *  pressed sink) layered onto WHATEVER variant the button wears —
   *  a raised primary, raised outline, etc. Glow tone reads
   *  --btn-glow → --accent-glow → --selected-glow; override
   *  per-button via style={{ "--btn-glow": "var(--warning)" }}.
   *  variant="raised" remains the neutral-key alias (trait +
   *  secondary surface). */
  raised?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, iconOnly, asChild = false, raised = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        // `data-gds-part="button"` is the identity attribute Studio's
        // selection agent looks for to map a click to a DS component.
        // Without it, clicking a Button (or anything inside it — the
        // common case is a Lucide icon child) ends up selecting the
        // inner SVG instead, and the inspector can't load the Button
        // contract because there's no componentName to look up.
        data-gds-part="button"
        className={cn("gds-button", buttonVariants({ variant, size, iconOnly }), raised && "gds-button-raised", className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
