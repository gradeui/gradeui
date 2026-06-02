"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Selection cards — RadioCard / CheckboxCard / SwitchCard.
 *
 * The whole card IS the control. RadioCard renders as a
 * `RadioGroupPrimitive.Item`, CheckboxCard as a `CheckboxPrimitive.Root`,
 * SwitchCard as a `SwitchPrimitives.Root` — so focus, hover, and the
 * checked state all live on the parent surface, and the entire card is the
 * hit target. The small glyph (dot / check / switch) is just a visual
 * indicator; it differs by type on purpose, because that's how someone
 * reads single-select vs multi-select vs toggle at a glance.
 *
 * All three share ONE surface (`.gds-selection-card`) so they look identical
 * sitting together. Every visual is token-driven (`--gds-selection-card-*`
 * with semantic fallbacks), so a project can re-skin the cards through the
 * per-project override layer without forking the component.
 *
 *   <RadioGroup defaultValue="standard" className="grid gap-3">
 *     <RadioCard value="standard" label="Standard" description="4–10 business days" />
 *     <RadioCard value="fast"     label="Fast"     description="2–5 business days" />
 *     <RadioCard value="next-day" label="Next day" description="1 business day" />
 *   </RadioGroup>
 *
 * IMPORTANT — interactive content. Because the card is itself a control
 * (a `role=radio`/`checkbox`/`switch` button), you must NOT nest other
 * interactive elements (Slider, Input, Button, links) inside it. Put only
 * static content here (text, images, badges). If a card needs its own
 * controls, use a plain `Card` containing a `Field` row + the control as
 * siblings instead.
 */

type IndicatorPosition = "leading" | "trailing";

interface SelectionCardOwnProps {
  /** Title line. Omit and pass `children` for fully custom content. */
  label?: React.ReactNode;
  /** Secondary line under the label. */
  description?: React.ReactNode;
  /** Optional slot rendered between the content and the indicator
   *  (a Badge, price, kbd hint, …). */
  aside?: React.ReactNode;
  /** Hide the dot/check/switch glyph — selection is then conveyed purely by
   *  the card's selected border + background. Semantics stay intact. */
  hideIndicator?: boolean;
  /** Which side the indicator sits on. Default `trailing`. */
  indicatorPosition?: IndicatorPosition;
}

/** Shared body: arbitrary children win; otherwise a label/description block.
 *  Lays out [content][aside][indicator], or indicator-first when leading. */
function SelectionCardBody({
  label,
  description,
  aside,
  hideIndicator,
  indicatorPosition = "trailing",
  titleId,
  descriptionId,
  indicator,
  children,
}: SelectionCardOwnProps & {
  titleId?: string;
  descriptionId?: string;
  indicator: React.ReactNode;
  children?: React.ReactNode;
}) {
  const content =
    children != null ? (
      <div className="gds-selection-card__slot">{children}</div>
    ) : (
      <div className="gds-selection-card__content">
        {label != null && (
          <span id={titleId} className="gds-selection-card__title">
            {label}
          </span>
        )}
        {description != null && (
          <span id={descriptionId} className="gds-selection-card__desc">
            {description}
          </span>
        )}
      </div>
    );

  const ind = hideIndicator ? null : indicator;

  return indicatorPosition === "leading" ? (
    <>
      {ind}
      {content}
      {aside}
    </>
  ) : (
    <>
      {content}
      {aside}
      {ind}
    </>
  );
}

const radioIndicator = (
  <span className="gds-selection-indicator gds-selection-indicator--radio" aria-hidden>
    <RadioGroupPrimitive.Indicator className="gds-selection-indicator__dot" />
  </span>
);

const checkboxIndicator = (
  <span
    className="gds-selection-indicator gds-selection-indicator--checkbox"
    aria-hidden
  >
    <CheckboxPrimitive.Indicator className="gds-selection-indicator__check">
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </span>
);

const switchIndicator = (
  <span
    className="gds-selection-indicator gds-selection-indicator--switch"
    aria-hidden
  >
    <SwitchPrimitives.Thumb className="gds-selection-indicator__thumb" />
  </span>
);

/* ── RadioCard ─────────────────────────────────────────────────────────── */

export interface RadioCardProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
      "children"
    >,
    SelectionCardOwnProps {
  children?: React.ReactNode;
}

const RadioCard = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  RadioCardProps
>(
  (
    {
      className,
      label,
      description,
      aside,
      hideIndicator,
      indicatorPosition = "trailing",
      children,
      ...props
    },
    ref
  ) => {
    const autoId = React.useId();
    const titleId = label != null ? `${autoId}-t` : undefined;
    const descriptionId = description != null ? `${autoId}-d` : undefined;
    return (
      <RadioGroupPrimitive.Item
        ref={ref}
        data-gds-part="radio-card"
        data-indicator={indicatorPosition}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn("gds-selection-card", className)}
        {...props}
      >
        <SelectionCardBody
          label={label}
          description={description}
          aside={aside}
          hideIndicator={hideIndicator}
          indicatorPosition={indicatorPosition}
          titleId={titleId}
          descriptionId={descriptionId}
          indicator={radioIndicator}
        >
          {children}
        </SelectionCardBody>
      </RadioGroupPrimitive.Item>
    );
  }
);
RadioCard.displayName = "RadioCard";

/* ── CheckboxCard ──────────────────────────────────────────────────────── */

export interface CheckboxCardProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
      "children"
    >,
    SelectionCardOwnProps {
  children?: React.ReactNode;
}

const CheckboxCard = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxCardProps
>(
  (
    {
      className,
      label,
      description,
      aside,
      hideIndicator,
      indicatorPosition = "trailing",
      children,
      ...props
    },
    ref
  ) => {
    const autoId = React.useId();
    const titleId = label != null ? `${autoId}-t` : undefined;
    const descriptionId = description != null ? `${autoId}-d` : undefined;
    return (
      <CheckboxPrimitive.Root
        ref={ref}
        data-gds-part="checkbox-card"
        data-indicator={indicatorPosition}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn("gds-selection-card", className)}
        {...props}
      >
        <SelectionCardBody
          label={label}
          description={description}
          aside={aside}
          hideIndicator={hideIndicator}
          indicatorPosition={indicatorPosition}
          titleId={titleId}
          descriptionId={descriptionId}
          indicator={checkboxIndicator}
        >
          {children}
        </SelectionCardBody>
      </CheckboxPrimitive.Root>
    );
  }
);
CheckboxCard.displayName = "CheckboxCard";

/* ── SwitchCard ────────────────────────────────────────────────────────── */

export interface SwitchCardProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
      "children"
    >,
    SelectionCardOwnProps {
  children?: React.ReactNode;
}

const SwitchCard = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitives.Root>,
  SwitchCardProps
>(
  (
    {
      className,
      label,
      description,
      aside,
      hideIndicator,
      indicatorPosition = "trailing",
      children,
      ...props
    },
    ref
  ) => {
    const autoId = React.useId();
    const titleId = label != null ? `${autoId}-t` : undefined;
    const descriptionId = description != null ? `${autoId}-d` : undefined;
    return (
      <SwitchPrimitives.Root
        ref={ref}
        data-gds-part="switch-card"
        data-indicator={indicatorPosition}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn("gds-selection-card", className)}
        {...props}
      >
        <SelectionCardBody
          label={label}
          description={description}
          aside={aside}
          hideIndicator={hideIndicator}
          indicatorPosition={indicatorPosition}
          titleId={titleId}
          descriptionId={descriptionId}
          indicator={switchIndicator}
        >
          {children}
        </SelectionCardBody>
      </SwitchPrimitives.Root>
    );
  }
);
SwitchCard.displayName = "SwitchCard";

export { RadioCard, CheckboxCard, SwitchCard };
