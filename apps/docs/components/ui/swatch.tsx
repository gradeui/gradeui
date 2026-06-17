"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Swatch — a single colour chip. Vendored copy of the @gradeui/ui source;
 * keep in sync with packages/ui/components/ui/swatch.tsx until the docs
 * site imports straight from the published package.
 *
 * Reads a value from one of two places, in priority order:
 *   - `color`  — any raw CSS colour (`#1f6feb`, `oklch(...)`, `var(--x)`).
 *   - `token`  — a Grade colour token NAME (no `--`, no `oklch()` wrap),
 *                resolved to `oklch(var(--<token>))`; re-voices with the theme.
 *
 * A transparency checkerboard (`--gds-media-checker-*`) sits behind the fill.
 * `onSelect` makes it a pickable <button>; `selected` draws the shared
 * selection ring; `label` captions it. <SwatchGroup> arranges a set in a
 * row or an overlapping stack and cascades size/shape.
 */
const swatchVariants = cva(
  "relative inline-block shrink-0 overflow-hidden ring-1 ring-inset ring-border/60 shadow-elevation-1",
  {
    variants: {
      size: {
        xs: "size-5",
        sm: "size-6",
        md: "size-8",
        lg: "size-10",
        xl: "size-14",
      },
      shape: {
        square: "rounded-none",
        rounded: "rounded-[var(--radius)]",
        circle: "rounded-full",
      },
    },
    defaultVariants: {
      size: "md",
      shape: "rounded",
    },
  }
);

/** Resolve the displayed fill: raw `color` wins, else wrap a `token` name. */
function resolveFill(color?: string, token?: string): string {
  if (color) return color;
  if (token) return `oklch(var(--${token.replace(/^--/, "")}))`;
  return "transparent";
}

type SwatchSize = NonNullable<VariantProps<typeof swatchVariants>["size"]>;
type SwatchShape = NonNullable<VariantProps<typeof swatchVariants>["shape"]>;

/** SwatchGroup hands `size` / `shape` down so a strip stays consistent. */
const SwatchGroupContext = React.createContext<{
  size?: SwatchSize;
  shape?: SwatchShape;
}>({});

export interface SwatchProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof swatchVariants> {
  /** Any raw CSS colour. Takes precedence over `token`. */
  color?: string;
  /** A Grade colour token name (no `--`), resolved as `oklch(var(--<token>))`. */
  token?: string;
  /** Optional caption rendered beneath the chip; also the accessible name. */
  label?: React.ReactNode;
  /** Draws the shared selection ring (`--selected`). */
  selected?: boolean;
  /** Makes the swatch a pickable <button> and fires on activation. */
  onSelect?: () => void;
}

const Swatch = React.forwardRef<HTMLElement, SwatchProps>(function Swatch(
  {
    color,
    token,
    size,
    shape,
    label,
    selected,
    onSelect,
    className,
    style,
    title,
    "aria-label": ariaLabel,
    ...props
  },
  ref
) {
  const group = React.useContext(SwatchGroupContext);
  const resolvedSize = size ?? group.size;
  const resolvedShape = shape ?? group.shape;
  const fill = resolveFill(color, token);
  const interactive = typeof onSelect === "function";
  const name =
    (typeof label === "string" ? label : undefined) ??
    token ??
    color ??
    "colour swatch";

  const checker: React.CSSProperties = {
    backgroundImage:
      "repeating-conic-gradient(var(--gds-media-checker-color) 0% 25%, transparent 0% 50%)",
    backgroundSize:
      "var(--gds-media-checker-size) var(--gds-media-checker-size)",
  };

  const Comp = (interactive ? "button" : "div") as React.ElementType;

  const tile = (
    <Comp
      ref={ref as never}
      data-gds-part="swatch"
      data-selected={selected ? "" : undefined}
      title={title ?? name}
      aria-label={ariaLabel ?? (interactive ? name : undefined)}
      aria-pressed={interactive ? !!selected : undefined}
      type={interactive ? "button" : undefined}
      onClick={interactive ? onSelect : undefined}
      className={cn(
        swatchVariants({ size: resolvedSize, shape: resolvedShape }),
        selected &&
          "ring-2 ring-selected ring-offset-2 ring-offset-background",
        interactive &&
          "cursor-pointer outline-none transition-transform hover:scale-[1.06] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        !label && className
      )}
      style={{ ...checker, ...(label ? undefined : style) }}
      {...(label ? {} : props)}
    >
      <span className="absolute inset-0" style={{ background: fill }} />
    </Comp>
  );

  if (!label) return tile;

  return (
    <div
      className={cn("inline-flex flex-col items-start gap-1.5", className)}
      style={style}
      {...props}
    >
      {tile}
      <span className="text-xs leading-none text-muted-foreground">{label}</span>
    </div>
  );
});
Swatch.displayName = "Swatch";

const STACK_OVERLAP: Record<SwatchSize, string> = {
  xs: "-space-x-1.5",
  sm: "-space-x-2",
  md: "-space-x-2.5",
  lg: "-space-x-3",
  xl: "-space-x-4",
};

const GAP: Record<NonNullable<SwatchGroupProps["gap"]>, string> = {
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
};

export interface SwatchGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** `row` spaces them out; `stack` overlaps into a coin-stack. Default row. */
  layout?: "row" | "stack";
  /** Cascades to every child Swatch. */
  size?: SwatchSize;
  /** Cascades to every child Swatch. */
  shape?: SwatchShape;
  /** Spacing between chips in `row` layout. Default sm. */
  gap?: "xs" | "sm" | "md" | "lg";
}

const SwatchGroup = React.forwardRef<HTMLDivElement, SwatchGroupProps>(
  function SwatchGroup(
    { layout = "row", size, shape, gap = "sm", className, children, ...props },
    ref
  ) {
    const stacked = layout === "stack";
    return (
      <SwatchGroupContext.Provider value={{ size, shape }}>
        <div
          ref={ref}
          data-gds-part="swatch-group"
          data-layout={layout}
          className={cn(
            "inline-flex flex-wrap items-center",
            stacked
              ? cn(
                  STACK_OVERLAP[size ?? "md"],
                  "[&_[data-gds-part=swatch]]:ring-2 [&_[data-gds-part=swatch]]:ring-background"
                )
              : GAP[gap],
            className
          )}
          {...props}
        >
          {children}
        </div>
      </SwatchGroupContext.Provider>
    );
  }
);
SwatchGroup.displayName = "SwatchGroup";

export { Swatch, SwatchGroup, swatchVariants };
