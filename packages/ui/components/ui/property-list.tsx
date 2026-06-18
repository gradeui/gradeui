"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * PropertyList — the read-only "one record, stacked" display primitive.
 *
 * A property list is a table row transposed: where a Table runs the schema
 * horizontally (columns) across many records, a PropertyList takes ONE
 * record and stacks its fields vertically as label / value pairs. Reach for
 * it for detail panels, inspectors, "about this item" cards, order summaries
 * — anywhere you're showing the properties of a single thing.
 *
 *   <PropertyList>
 *     <PropertyList.Row label="Status" icon={<Activity />}>
 *       <Badge variant="warning-soft">Low</Badge>
 *     </PropertyList.Row>
 *     <PropertyList.Row label="Owner">
 *       <Avatar className="h-5 w-5"><AvatarFallback>EO</AvatarFallback></Avatar>
 *     </PropertyList.Row>
 *   </PropertyList>
 *
 * The value side is deliberately polymorphic — it's a slot (`children`, or
 * the `value` prop), not a string. A row can hold plain text, a date, a
 * single Badge, a tag group, an avatar stack, a link, anything. That's the
 * whole point: the same value renderers that fill a Table cell drop straight
 * into a PropertyList row, so the two surfaces never drift.
 *
 * Semantics: renders a real `<dl>` with `<dt>` / `<dd>` pairs (each pair
 * wrapped in a `<div>`, which the HTML spec allows), so it's announced as a
 * description list by assistive tech for free.
 *
 * Layout + density are token-driven (`--gds-property-list-*`) so a narrow
 * inspector and a wide settings page can retune the label column and rhythm
 * without prop-drilling. `layout="stack"` drops the label above the value
 * for tight columns.
 *
 * This is a DISPLAY primitive. For an editable field (label + control), use
 * `Field`; a detail panel that flips between read and edit typically swaps a
 * PropertyList for a stack of Fields.
 */

type PropertyListLayout = "row" | "stack";
type PropertyListDensity = "compact" | "default" | "relaxed";
type PropertyListAlign = "start" | "center";

interface PropertyListContextValue {
  layout: PropertyListLayout;
  align: PropertyListAlign;
  divider: boolean;
}

const PropertyListContext = React.createContext<PropertyListContextValue>({
  layout: "row",
  align: "center",
  divider: false,
});

const ROW_GAP: Record<PropertyListDensity, string> = {
  compact: "var(--gds-property-list-row-gap-compact, 0.375rem)",
  default: "var(--gds-property-list-row-gap, 0.625rem)",
  relaxed: "var(--gds-property-list-row-gap-relaxed, 1rem)",
};

export interface PropertyListProps
  extends React.HTMLAttributes<HTMLDListElement> {
  /** `row` (default): label column beside value. `stack`: label above value (narrow panels). */
  layout?: PropertyListLayout;
  /** Row rhythm. `compact` for dense inspectors, `relaxed` for airy settings pages. */
  density?: PropertyListDensity;
  /** Default vertical alignment of label vs value. `center` for single-line values, `start` when values wrap (tag groups, multi-line). */
  align?: PropertyListAlign;
  /** Hairline rule between rows. */
  divider?: boolean;
  /** Override the label column width (any CSS length). Sets `--gds-property-list-label-width` for all rows. */
  labelWidth?: string;
}

const PropertyListRoot = React.forwardRef<HTMLDListElement, PropertyListProps>(
  (
    {
      layout = "row",
      density = "default",
      align = "center",
      divider = false,
      labelWidth,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <PropertyListContext.Provider value={{ layout, align, divider }}>
        <dl
          ref={ref}
          data-gds-part="property-list"
          data-layout={layout}
          data-density={density}
          className={cn("flex min-w-0 flex-col", className)}
          style={{
            rowGap: ROW_GAP[density],
            ...(labelWidth
              ? ({
                  ["--gds-property-list-label-width" as string]: labelWidth,
                } as React.CSSProperties)
              : {}),
            ...style,
          }}
          {...props}
        >
          {children}
        </dl>
      </PropertyListContext.Provider>
    );
  }
);
PropertyListRoot.displayName = "PropertyList";

export interface PropertyListRowProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The property name (the `<dt>`). */
  label: React.ReactNode;
  /** Optional leading glyph, rendered muted at `--gds-property-list-icon-size`. */
  icon?: React.ReactNode;
  /** The value. Provide via `value` or as `children` — accepts any node (text, Badge, tag group, Avatar stack, link…). */
  value?: React.ReactNode;
  /** Per-row override of the list's vertical alignment. */
  align?: PropertyListAlign;
  children?: React.ReactNode;
}

const PropertyListRow = React.forwardRef<HTMLDivElement, PropertyListRowProps>(
  (
    { label, icon, value, align: alignProp, className, children, ...props },
    ref
  ) => {
    const { layout, align: ctxAlign, divider } = React.useContext(
      PropertyListContext
    );
    const align = alignProp ?? ctxAlign;
    const content = value ?? children;

    return (
      <div
        ref={ref}
        data-gds-part="property"
        className={cn(
          "grid",
          divider &&
            "border-t border-[color:var(--gds-property-list-divider-color,oklch(var(--border)))] pt-[var(--gds-property-list-row-gap,0.625rem)] first:border-t-0 first:pt-0",
          className
        )}
        style={{
          gridTemplateColumns:
            layout === "stack"
              ? "minmax(0, 1fr)"
              : "var(--gds-property-list-label-width, 8.5rem) minmax(0, 1fr)",
          columnGap: "var(--gds-property-list-col-gap, 1rem)",
          rowGap: layout === "stack" ? "0.25rem" : undefined,
          alignItems: align === "start" ? "start" : "center",
        }}
        {...props}
      >
        <dt
          data-gds-part="property-label"
          className={cn(
            "flex min-w-0 items-center gap-1.5 text-sm text-[color:var(--gds-property-list-label-color,oklch(var(--muted-foreground)))]",
            align === "start" && "pt-px"
          )}
        >
          {icon ? (
            <span
              data-gds-part="property-icon"
              aria-hidden
              className="flex shrink-0 items-center justify-center text-current [&_svg]:h-[var(--gds-property-list-icon-size,0.875rem)] [&_svg]:w-[var(--gds-property-list-icon-size,0.875rem)]"
            >
              {icon}
            </span>
          ) : null}
          <span className="truncate">{label}</span>
        </dt>
        <dd
          data-gds-part="property-value"
          className="m-0 min-w-0 text-sm text-foreground"
        >
          {content}
        </dd>
      </div>
    );
  }
);
PropertyListRow.displayName = "PropertyList.Row";

const PropertyList = Object.assign(PropertyListRoot, {
  Row: PropertyListRow,
});

export { PropertyList, PropertyListRow };
