"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Swatch — a single colour chip.
 *
 * THE primitive for showing a colour: brand-pop strips, palette pickers,
 * theme previews, token galleries, "pick an accent" rows. A swatch reads a
 * value from one of two places, in priority order:
 *
 *   - `color`  — any raw CSS colour (`#1f6feb`, `oklch(...)`, `rgb(...)`,
 *                even `var(--whatever)`). Use for one-off / external colours.
 *   - `token`  — a Grade colour token NAME (no `--` and no `oklch()` wrap),
 *                resolved to `oklch(var(--<token>))`. This is the design-system
 *                path: `token="brand-3"`, `token="primary"`, `token="chart-2"`.
 *                Because it points at the live CSS variable, the swatch
 *                re-voices automatically when the theme changes.
 *
 * A transparency checkerboard sits behind the fill (shared with the rest of
 * the system via `--gds-media-checker-*`), so semi-transparent values read
 * honestly instead of compositing against an opaque tile.
 *
 * Pass `onSelect` to make it pickable — it renders a real <button> with
 * `aria-pressed`, a focus ring, and a hover lift. `selected` draws the
 * shared selection ring (`--selected`). Pass `label` to caption it (the
 * caption also becomes the accessible name / tooltip).
 *
 * Sizing is the t-shirt scale (xs → xl); reach for `size` over `h-*`/`w-*`
 * utilities so the scale stays on tokens. Shape is square / rounded (rides
 * `--radius`) / circle.
 */
const swatchVariants = cva(
  // The border is drawn as an overlay ABOVE the fill (see the component) —
  // an inset ring here would be painted over by an opaque fill and vanish.
  "relative inline-block shrink-0 overflow-hidden shadow-elevation-1",
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

/** Native `<input type="color">` only accepts #rgb / #rrggbb. */
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

type SwatchSize = NonNullable<VariantProps<typeof swatchVariants>["size"]>;
type SwatchShape = NonNullable<VariantProps<typeof swatchVariants>["shape"]>;

/** SwatchGroup hands `size` / `shape` down so a strip stays consistent
 *  without repeating the prop on every chip. */
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
  /** Makes the swatch an editable colour well: hosts a native
   *  `<input type="color">` (the OS picker) behind the chip and fires with
   *  the new `#rrggbb`. The presentation stays the DS chip; the interaction
   *  stays native. Takes precedence over `onSelect`. */
  onColorChange?: (value: string) => void;
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
    onColorChange,
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
  const editable = typeof onColorChange === "function";
  const interactive = !editable && typeof onSelect === "function";
  // Native colour input only accepts hex; fall back so it stays usable
  // even when the displayed fill is a token/oklch/rgba value.
  const hex = HEX_RE.test(color ?? "") ? (color as string) : "#000000";
  const name =
    (typeof label === "string" ? label : undefined) ??
    token ??
    color ??
    "colour swatch";

  // Shared transparency checkerboard — same tokens MediaSurface's image
  // well uses, so a translucent fill reads honestly in both modes.
  const checker: React.CSSProperties = {
    backgroundImage:
      "repeating-conic-gradient(var(--gds-media-checker-color) 0% 25%, transparent 0% 50%)",
    backgroundSize:
      "var(--gds-media-checker-size) var(--gds-media-checker-size)",
  };

  // editable → a <label> hosting the native picker; pickable → a <button>;
  // otherwise a static <div>.
  const Comp = (
    editable ? "label" : interactive ? "button" : "div"
  ) as React.ElementType;

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
        (interactive || editable) &&
          "cursor-pointer outline-none transition-transform hover:scale-[1.06] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // When captioned, the wrapper owns layout className; the tile keeps
        // its own variant classes only.
        !label && className
      )}
      style={{ ...checker, ...(label ? undefined : style) }}
      {...(label ? {} : props)}
    >
      <span className="absolute inset-0" style={{ background: fill }} />
      {/* Border drawn on TOP of the fill so it survives an opaque colour;
          foreground-based so it reads on any surface (light hairline on
          dark, dark on light). Clipped to the chip's radius by the parent's
          overflow-hidden. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-foreground/40"
      />
      {editable && (
        // Native OS colour picker, kept fully functional but visually
        // replaced by the chip above. Covers the tile so the whole chip
        // is the hit target.
        <input
          type="color"
          value={hex}
          onChange={(e) => onColorChange!(e.currentTarget.value)}
          aria-label={ariaLabel ?? name}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      )}
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

/* ──────────────────────────────────────────────────────────────────────
   SwatchGroup — arrange a set of <Swatch>es.

   `layout="row"` (default) spaces them out; `layout="stack"` overlaps them
   into a single coin-stack (the theme-picker / "key colours" treatment),
   where each chip's own ring reads as the separating edge. `size` / `shape`
   set here cascade to every child so a strip stays consistent without
   repeating the prop. The overlap tightens/loosens with `size`.
   ────────────────────────────────────────────────────────────────────── */

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
                  // Each chip's edge reads as the page colour so overlaps
                  // separate cleanly (higher specificity beats the base
                  // border ring).
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
