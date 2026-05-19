import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Callout — inline, ambient, non-blocking status/feedback surface.
 *
 * Renamed from `Alert` (May 2026). The old name collided with
 * Apple HIG `Alert` (a modal) and with `role="alert"` ARIA semantics,
 * both of which imply interruptive/assertive behaviour the component
 * does not have. "Callout" is honest about what it is: an inline
 * attention-grabber that sits in the layout flow. The `Alert` name is
 * deliberately left vacant in the barrel so a future genuinely-
 * interruptive primitive can claim it without further renames — until
 * then, reach for `<Dialog>` for modal alerts.
 *
 * Variants intentionally preserved as-is in this pass (`default |
 * destructive | success | warning | info`) — splitting `variant` onto
 * orthogonal `intent × emphasis` axes is a planned follow-up across
 * the whole library, not a one-component change. The `highlight`
 * variant (yellow) was dropped in this rename: in practice it
 * overlapped `warning` (amber) and added one more variant without a
 * unique semantic. Consumers needing "notable but not alarming" use
 * `variant="warning"` or `variant="info"` depending on temperature.
 */
const calloutVariants = cva(
  // Each variant uses the theme's semantic tokens instead of hard-coded
  // rds-* classes. Status variants reference dedicated `*-soft` (surface)
  // and `*-deep` (text + icon) tokens — those are generated from the status
  // colour by the theme pipeline, so tweaking the brand feel only requires
  // changing the mapping in one place (lib/themes/oklch.ts).
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground [&>svg]:text-foreground",
        destructive:
          "border-destructive/30 bg-destructive-soft text-destructive-deep [&>svg]:text-destructive-deep",
        success:
          "border-success/30 bg-success-soft text-success-deep [&>svg]:text-success-deep",
        warning:
          "border-warning/30 bg-warning-soft text-warning-deep [&>svg]:text-warning-deep",
        info:
          "border-info/30 bg-info-soft text-info-deep [&>svg]:text-info-deep",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type CalloutVariant = NonNullable<VariantProps<typeof calloutVariants>["variant"]>;

/**
 * ARIA role mapping. Screen readers treat `alert` as assertive — it
 * interrupts whatever the user is hearing to announce the message.
 * That's correct for genuinely-time-critical content (a save failure,
 * a destructive confirmation) but wrong for ambient confirmations
 * ("Profile updated"). The conditional below routes:
 *
 *   warning / destructive → role="alert"  (assertive — interrupts)
 *   info / success / default → role="status" (polite — announces after current speech)
 *
 * Consumers can still override via `role={…}` on the underlying div.
 */
const ROLE_BY_VARIANT: Record<CalloutVariant, "alert" | "status"> = {
  destructive: "alert",
  warning: "alert",
  info: "status",
  success: "status",
  default: "status",
};

const Callout = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof calloutVariants>
>(({ className, variant, role, ...props }, ref) => {
  const resolvedVariant = (variant ?? "default") as CalloutVariant;
  return (
    <div
      ref={ref}
      role={role ?? ROLE_BY_VARIANT[resolvedVariant]}
      data-gds-part="callout"
      className={cn(calloutVariants({ variant }), className)}
      {...props}
    />
  );
});
Callout.displayName = "Callout";

const CalloutTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    data-gds-part="callout-title"
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
CalloutTitle.displayName = "CalloutTitle";

const CalloutDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-gds-part="callout-description"
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
CalloutDescription.displayName = "CalloutDescription";

export { Callout, CalloutTitle, CalloutDescription, calloutVariants };
