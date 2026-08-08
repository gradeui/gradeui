import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Callout — apps/docs parallel copy of @gradeui/ui's Callout.
 * See packages/ui/components/ui/callout.tsx for the canonical version.
 * These must stay in sync until the docs site migrates to importing
 * the component from `@gradeui/ui` directly (see gradeui/CLAUDE.md
 * "Docs-site work" note).
 *
 * Renamed from `Alert` (May 2026). The `Alert` name is reserved for
 * a future genuinely-interruptive primitive; current modal-alert
 * semantics live in <Dialog>.
 */
const calloutVariants = cva(
  // The icon slot must be sized here: bare lucide icons default to 24px,
  // which fills the 28px (pl-7) text inset and leaves no icon→title gap.
  // 16px (h-4 w-4) restores the 12px breathing room the inset assumes.
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-4 [&>svg]:w-4",
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
