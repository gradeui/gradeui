"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Separator } from "./separator";

/**
 * Field — a 1:1 port of shadcn's Field family (same components, data-slots,
 * classes, and orientation variants) so a Figma frame named with these slots
 * maps straight onto the code.
 *
 * Grade addition (invisible): Field auto-wires accessibility — it generates an
 * id, hands it to the control, points Field.Label's `htmlFor` at it, and links
 * Field.Description via `aria-describedby`. Children still render in DOM order
 * exactly as shadcn, so the structure is identical; pass an explicit `id` /
 * `htmlFor` to opt out.
 *
 * Anatomy (matches https://ui.shadcn.com/docs/components/radix/field):
 *   Field.Set → Field.Legend + Field.Group
 *   Field.Group → many Field
 *   Field (orientation: vertical | horizontal | responsive)
 *     → Field.Label / Field.Title, control, Field.Content, Field.Description,
 *       Field.Error, Field.Separator
 *   A selectable card = Field.Label wrapping a Field.
 *
 * Sizing lives on the leaf components (Label / Description / Input / Switch),
 * which keep Grade's dense `2xs` sizes on top of shadcn parity.
 */

const FieldContext = React.createContext<{
  controlId?: string;
  descriptionId?: string;
} | null>(null);

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-6",
        "has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className
      )}
      {...props}
    />
  );
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-3 font-medium",
        "data-[variant=legend]:text-base",
        "data-[variant=label]:text-sm",
        className
      )}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4",
        className
      )}
      {...props}
    />
  );
}

const fieldVariants = cva(
  // Gap is per-orientation: vertical tightened to gap-2 (8 Aug 2026,
  // label-to-control rhythm read too loose on real forms); horizontal
  // keeps the roomier gap-3 for control-beside-label rows.
  "group/field flex w-full data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: ["flex-col gap-2 [&>*]:w-full [&>.sr-only]:w-auto"],
        horizontal: [
          "flex-row items-center gap-3",
          "[&>[data-slot=field-label]]:flex-auto",
          "has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        ],
        responsive: [
          "flex-col gap-2 [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:gap-3 @md/field-group:[&>*]:w-auto",
          "@md/field-group:[&>[data-slot=field-label]]:flex-auto",
          "@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        ],
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
);

// The field-family components — used to tell a "control" child apart from the
// text/structure slots when auto-wiring.
const FIELD_FAMILY = new Set<React.ElementType>();

export interface FieldProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof fieldVariants> {
  /** @deprecated use `orientation`. Maps option/setting → horizontal. */
  layout?: "option" | "setting";
}

function Field({
  className,
  orientation,
  layout,
  children,
  ...props
}: FieldProps) {
  const autoId = React.useId();
  const resolved: NonNullable<FieldProps["orientation"]> =
    orientation ?? (layout ? "horizontal" : "vertical");

  // Auto-wire: find the control child + whether a description is present,
  // without reordering anything (DOM order stays identical to shadcn).
  const top = React.Children.toArray(children);
  let controlIndex = -1;
  let hasDescription = false;

  top.forEach((child, i) => {
    if (!React.isValidElement(child)) return;
    const type = child.type as React.ElementType;
    if (type === FieldDescription) {
      hasDescription = true;
    } else if (type === FieldContent) {
      React.Children.forEach(
        (child.props as { children?: React.ReactNode }).children,
        (gc) => {
          if (React.isValidElement(gc) && gc.type === FieldDescription)
            hasDescription = true;
        }
      );
    } else if (!FIELD_FAMILY.has(type) && controlIndex === -1) {
      controlIndex = i;
    }
  });

  const controlEl =
    controlIndex >= 0
      ? (top[controlIndex] as React.ReactElement<Record<string, unknown>>)
      : null;
  const controlId =
    (controlEl?.props.id as string | undefined) ??
    (controlEl ? `${autoId}-control` : undefined);
  const descriptionId = hasDescription ? `${autoId}-description` : undefined;
  const describedBy = controlEl
    ? [controlEl.props["aria-describedby"] as string | undefined, descriptionId]
        .filter(Boolean)
        .join(" ") || undefined
    : undefined;

  const wired =
    controlIndex >= 0 && controlEl
      ? top.map((child, i) =>
          i === controlIndex
            ? React.cloneElement(controlEl, {
                id: controlId,
                "aria-describedby": describedBy,
              } as Partial<Record<string, unknown>> & React.Attributes)
            : child
        )
      : children;

  return (
    <FieldContext.Provider value={{ controlId, descriptionId }}>
      <div
        role="group"
        data-slot="field"
        data-orientation={resolved}
        className={cn(fieldVariants({ orientation: resolved }), className)}
        {...props}
      >
        {wired}
      </div>
    </FieldContext.Provider>
  );
}

/**
 * Field.Trailing — Grade extension (not in shadcn): a slot pinned to the end
 * of the row for a Badge / price / kbd hint.
 */
function FieldTrailing({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-trailing"
      className={cn("flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  );
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        "group/field-content flex flex-1 flex-col gap-1.5 leading-snug",
        className
      )}
      {...props}
    />
  );
}

function FieldLabel({
  className,
  htmlFor,
  ...props
}: React.ComponentProps<typeof Label>) {
  const ctx = React.useContext(FieldContext);
  return (
    <Label
      data-slot="field-label"
      htmlFor={htmlFor ?? ctx?.controlId}
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4",
        "has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 dark:has-data-[state=checked]:bg-primary/10",
        className
      )}
      {...props}
    />
  );
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50",
        className
      )}
      {...props}
    />
  );
}

function FieldDescription({
  className,
  id,
  ...props
}: React.ComponentProps<"p">) {
  const ctx = React.useContext(FieldContext);
  return (
    <p
      data-slot="field-description"
      id={id ?? ctx?.descriptionId}
      className={cn(
        "text-sm leading-normal font-normal text-muted-foreground group-has-[[data-orientation=horizontal]]/field:text-balance",
        "last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      {...props}
    />
  );
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
        className
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="bg-background text-muted-foreground relative mx-auto block w-fit px-2"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  );
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>;
}) {
  const content = React.useMemo(() => {
    if (children) return children;
    if (!errors?.length) return null;

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ];

    if (uniqueErrors.length === 1) return uniqueErrors[0]?.message;

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>
        )}
      </ul>
    );
  }, [children, errors]);

  if (!content) return null;

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-destructive text-sm font-normal", className)}
      {...props}
    >
      {content}
    </div>
  );
}

// Register the family now that all components are declared.
[
  FieldLabel,
  FieldTitle,
  FieldDescription,
  FieldContent,
  FieldTrailing,
  FieldError,
  FieldSeparator,
  FieldLegend,
  FieldSet,
  FieldGroup,
].forEach((c) => FIELD_FAMILY.add(c));

// Compound dot-access (Field.Label, Field.Content, …) alongside named exports.
const FieldRoot = Object.assign(Field, {
  Label: FieldLabel,
  Title: FieldTitle,
  Description: FieldDescription,
  Content: FieldContent,
  Trailing: FieldTrailing,
  Group: FieldGroup,
  Set: FieldSet,
  Legend: FieldLegend,
  Separator: FieldSeparator,
  Error: FieldError,
});

export {
  FieldRoot as Field,
  FieldLabel,
  FieldTitle,
  FieldDescription,
  FieldContent,
  FieldTrailing,
  FieldGroup,
  FieldSet,
  FieldLegend,
  FieldSeparator,
  FieldError,
};
