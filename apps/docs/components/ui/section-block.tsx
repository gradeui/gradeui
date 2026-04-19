import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button, type buttonVariants } from "@/components/ui/button";

const sectionBlockVariants = cva("relative w-full", {
  variants: {
    padding: {
      none: "py-0",
      sm: "py-8 md:py-12",
      md: "py-12 md:py-16",
      lg: "py-16 md:py-24",
      xl: "py-20 md:py-32",
    },
    background: {
      transparent: "bg-transparent",
      muted: "bg-muted",
      card: "bg-card border-y",
      primary: "bg-primary text-primary-foreground",
      gradient: "bg-gradient-to-br from-primary/10 via-accent/5 to-background",
    },
    fullBleed: {
      true: "w-full",
      false: "",
    },
  },
  defaultVariants: {
    padding: "lg",
    background: "transparent",
    fullBleed: false,
  },
});

const containerVariants = cva("mx-auto px-4 md:px-6 lg:px-8", {
  variants: {
    container: {
      default: "max-w-7xl",
      wide: "max-w-[1536px]",
      narrow: "max-w-4xl",
      full: "max-w-none",
    },
  },
  defaultVariants: {
    container: "default",
  },
});

const headerVariants = cva("space-y-3 md:space-y-4", {
  variants: {
    alignment: {
      left: "text-left",
      center: "text-center mx-auto max-w-3xl",
      right: "text-right ml-auto max-w-3xl",
    },
  },
  defaultVariants: {
    alignment: "left",
  },
});

const titleVariants = cva("font-bold tracking-tight", {
  variants: {
    titleSize: {
      sm: "text-2xl md:text-3xl",
      md: "text-3xl md:text-4xl",
      lg: "text-4xl md:text-5xl",
      xl: "text-5xl md:text-6xl lg:text-7xl",
    },
  },
  defaultVariants: {
    titleSize: "lg",
  },
});

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

interface CTAConfig {
  text: string;
  variant?: ButtonVariant;
  href?: string;
  onClick?: () => void;
}

export interface SectionBlockProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionBlockVariants>,
    VariantProps<typeof containerVariants>,
    VariantProps<typeof headerVariants>,
    VariantProps<typeof titleVariants> {
  // Header content
  title?: string;
  subtitle?: string;

  // CTAs
  cta1?: string | CTAConfig;
  cta2?: string | CTAConfig;

  // Visual styling
  backgroundImage?: string;

  // Content slot
  children?: React.ReactNode;

  // Accessibility
  as?: "section" | "div" | "article";
}

const SectionBlock = React.forwardRef<HTMLElement, SectionBlockProps>(
  (
    {
      className,
      padding,
      background,
      fullBleed,
      container,
      alignment,
      title,
      titleSize,
      subtitle,
      cta1,
      cta2,
      backgroundImage,
      children,
      as: Comp = "section",
      ...props
    },
    ref
  ) => {
    // Helper to normalize CTA config
    const normalizeCTA = (cta: string | CTAConfig): CTAConfig | null => {
      if (!cta) return null;
      if (typeof cta === "string") {
        return { text: cta };
      }
      return cta;
    };

    const cta1Config = normalizeCTA(cta1 as string | CTAConfig);
    const cta2Config = normalizeCTA(cta2 as string | CTAConfig);

    return (
      <Comp
        ref={ref as any}
        className={cn(
          sectionBlockVariants({ padding, background, fullBleed }),
          className
        )}
        style={
          backgroundImage
            ? {
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
        {...props}
      >
        <div className={containerVariants({ container })}>
          {/* Header */}
          {(title || subtitle) && (
            <div className={headerVariants({ alignment })}>
              {title && (
                <h2
                  className={titleVariants({ titleSize })}
                  style={{ fontFamily: "var(--font-heading, var(--font-sans))" }}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p
                  className="text-lg md:text-xl text-muted-foreground"
                  style={{ fontFamily: "var(--font-body, var(--font-sans))" }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* CTAs */}
          {(cta1Config || cta2Config) && (
            <div
              className={cn(
                "flex flex-wrap gap-3 md:gap-4 mt-6 md:mt-8",
                alignment === "center" && "justify-center",
                alignment === "right" && "justify-end"
              )}
            >
              {cta1Config && (
                <Button
                  variant={cta1Config.variant || "default"}
                  size="lg"
                  onClick={cta1Config.onClick}
                  asChild={!!cta1Config.href}
                >
                  {cta1Config.href ? (
                    <a href={cta1Config.href}>{cta1Config.text}</a>
                  ) : (
                    cta1Config.text
                  )}
                </Button>
              )}
              {cta2Config && (
                <Button
                  variant={cta2Config.variant || "outline"}
                  size="lg"
                  onClick={cta2Config.onClick}
                  asChild={!!cta2Config.href}
                >
                  {cta2Config.href ? (
                    <a href={cta2Config.href}>{cta2Config.text}</a>
                  ) : (
                    cta2Config.text
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Content Slot */}
          {children && (
            <div
              className={cn(
                "mt-8 md:mt-12",
                alignment === "center" && "mx-auto"
              )}
            >
              {children}
            </div>
          )}
        </div>
      </Comp>
    );
  }
);

SectionBlock.displayName = "SectionBlock";

export { SectionBlock, sectionBlockVariants };
