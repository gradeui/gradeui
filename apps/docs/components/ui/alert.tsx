import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
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
        highlight:
          // Highlight is yellow — direct yellow text is unreadable, so text
          // stays on `--foreground`; the icon picks up the deepened shade.
          "border-highlight/30 bg-highlight-soft text-foreground [&>svg]:text-highlight-deep",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
