"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Field — the inline composition primitive for a control + its caption.
 *
 * Pairs a bare control (Checkbox / RadioGroupItem / Switch) with a label,
 * an optional description, and an optional trailing slot — and wires the
 * accessibility plumbing for you:
 *
 *   - generates one id, hands it to the control, and points the label's
 *     `htmlFor` at it (click-the-label-to-toggle for free)
 *   - if a <Field.Description> is present, links it via `aria-describedby`
 *
 * The control stays a bare primitive — Field clones it to inject the id +
 * aria wiring, so Checkbox/Radio/Switch never grow a `description` prop.
 *
 *   <Field>
 *     <Checkbox value="terms" />
 *     <Field.Label>Accept terms</Field.Label>
 *     <Field.Description>You agree to the privacy policy.</Field.Description>
 *     <Field.Trailing><Badge>New</Badge></Field.Trailing>
 *   </Field>
 *
 * Two layouts:
 *   - `option`  (default) — control leads, text stacks beside it. The
 *                checkbox/radio-with-label case. Top-aligned for two lines.
 *   - `setting` — text leads, control pinned trailing. The classic
 *                settings row (label + description on the left, Switch right).
 *
 * For a selectable *card* (the whole surface is the control), reach for
 * RadioCard / CheckboxCard / SwitchCard instead — see `selection-card.tsx`.
 */

type FieldLayout = "option" | "setting";

interface FieldContextValue {
  controlId: string;
  descriptionId?: string;
}

const FieldContext = React.createContext<FieldContextValue | null>(null);

const FieldLabel = React.forwardRef<
  HTMLLabelElement,
  React.ComponentPropsWithoutRef<"label">
>(({ className, ...props }, ref) => {
  const ctx = React.useContext(FieldContext);
  return (
    <label
      ref={ref}
      htmlFor={ctx?.controlId}
      className={cn(
        "text-sm font-medium leading-none text-foreground cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
});
FieldLabel.displayName = "Field.Label";

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<"p">
>(({ className, ...props }, ref) => {
  const ctx = React.useContext(FieldContext);
  return (
    <p
      ref={ref}
      id={ctx?.descriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
FieldDescription.displayName = "Field.Description";

const FieldTrailing = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex shrink-0 items-center gap-2", className)}
    {...props}
  />
));
FieldTrailing.displayName = "Field.Trailing";

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `option` (control leads) or `setting` (text leads, control trailing). */
  layout?: FieldLayout;
}

const FieldRoot = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ layout = "option", className, children, ...props }, ref) => {
    const autoId = React.useId();

    // Partition children into the named slots; everything else is the
    // control (expected: exactly one).
    let label: React.ReactNode = null;
    let description: React.ReactNode = null;
    let trailing: React.ReactNode = null;
    let control: React.ReactElement | null = null;

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      if (child.type === FieldLabel) label = child;
      else if (child.type === FieldDescription) description = child;
      else if (child.type === FieldTrailing) trailing = child;
      else if (!control) control = child;
    });

    // `control` is reassigned inside the forEach callback, which TS's
    // control-flow analysis can't follow — alias through an explicit type
    // so `.props` / cloneElement stay typed.
    const ctrl = control as React.ReactElement<
      Record<string, unknown>
    > | null;
    const controlProps = (ctrl?.props ?? {}) as Record<string, unknown>;
    const controlId =
      (controlProps.id as string | undefined) ?? `${autoId}-control`;
    const descriptionId = description ? `${autoId}-description` : undefined;

    const describedBy =
      [controlProps["aria-describedby"] as string | undefined, descriptionId]
        .filter(Boolean)
        .join(" ") || undefined;

    const wiredControl = ctrl
      ? React.cloneElement(ctrl, {
          id: controlId,
          "aria-describedby": describedBy,
        } as Partial<Record<string, unknown>> & React.Attributes)
      : null;

    const text = (
      <div className="flex min-w-0 flex-col gap-0.5">
        {label}
        {description}
      </div>
    );

    return (
      <FieldContext.Provider value={{ controlId, descriptionId }}>
        <div
          ref={ref}
          data-gds-part="field"
          data-layout={layout}
          className={cn(
            "flex gap-3",
            layout === "setting"
              ? "items-center justify-between"
              : "items-start",
            className
          )}
          {...props}
        >
          {layout === "setting" ? (
            <>
              {text}
              <div className="flex shrink-0 items-center gap-2">
                {trailing}
                {wiredControl}
              </div>
            </>
          ) : (
            <>
              <div className="mt-0.5 shrink-0">{wiredControl}</div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                {label}
                {description}
              </div>
              {trailing}
            </>
          )}
        </div>
      </FieldContext.Provider>
    );
  }
);
FieldRoot.displayName = "Field";

const Field = Object.assign(FieldRoot, {
  Label: FieldLabel,
  Description: FieldDescription,
  Trailing: FieldTrailing,
});

export { Field, FieldLabel, FieldDescription, FieldTrailing };
