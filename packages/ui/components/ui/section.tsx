import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Section + Container — the page scaffold (STUDIO-SECTIONS.md).
 *
 * A page is an ordered stack of Sections. `Section` is the FULL-WIDTH band: it
 * owns a colour `scope` (subtheme) + vertical `pad` rhythm, and nothing else —
 * it never constrains width. `Container` is the measure: a centred max-width +
 * gutters you drop INSIDE a section to contain content; omit it for a full-bleed
 * band. The content is FREE; Section never bakes a title/CTA (that's
 * `SectionBlock`'s opinionated job). The known composable parts (Eyebrow /
 * Title / Subtitle / Description / Actions / Media) give the common shape
 * design intent without constraining it.
 */

export type SectionScope =
  | "default"
  | "inverse"
  | "brand"
  | "accent"
  | "muted"
  | "card";
export type ContainerMaxW = "sm" | "md" | "lg" | "xl" | "prose" | "full";

// ── Section: the full-width band ────────────────────────────────────
// Carries the scope paint + vertical rhythm. Always full bleed — wrap
// content in <Container> when you want a measure.
const bandVariants = cva("w-full", {
  variants: {
    pad: {
      none: "py-0",
      sm: "py-8 md:py-12",
      md: "py-12 md:py-16",
      lg: "py-16 md:py-24",
      xl: "py-20 md:py-32",
    },
  },
  defaultVariants: { pad: "lg" },
});

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof bandVariants> {
  /** Colour subtheme — applies the `scope-*` class (STUDIO-COLOR.md). Unset =
   *  the page surface (transparent). */
  scope?: SectionScope;
  /** Semantic element. */
  as?: "section" | "header" | "footer" | "div";
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, scope, pad, as: Comp = "section", ...props }, ref) => (
    <Comp
      ref={ref as never}
      data-gds-part="section"
      data-scope={scope}
      // The scope class paints the band (background-color + color) AND
      // re-points the surface tokens for the subtree. No scope = page bg.
      className={cn(bandVariants({ pad }), scope && `scope-${scope}`, className)}
      {...props}
    />
  ),
);
Section.displayName = "Section";

// ── Container: the measure ──────────────────────────────────────────
// Centred max-width + gutters. Drop inside a Section (or anywhere) to
// constrain content; omit it for full-bleed. `grid` snaps children to a
// 12-column grid.
const containerVariants = cva("mx-auto w-full px-4 md:px-6 lg:px-8", {
  variants: {
    maxW: {
      sm: "max-w-3xl",
      md: "max-w-5xl",
      lg: "max-w-7xl",
      xl: "max-w-[96rem]",
      prose: "max-w-prose",
      full: "max-w-none",
    },
    grid: { true: "grid grid-cols-12 gap-6", false: "" },
  },
  defaultVariants: { maxW: "lg", grid: false },
});

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  as?: "div" | "section";
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, maxW, grid, as: Comp = "div", ...props }, ref) => (
    <Comp
      ref={ref as never}
      data-gds-part="container"
      className={cn(containerVariants({ maxW, grid }), className)}
      {...props}
    />
  ),
);
Container.displayName = "Container";

/* ── Section parts ──────────────────────────────────────────────────
 * The known, styled, composable vocabulary (STUDIO-SECTIONS.md). Offered,
 * never required — drop raw JSX for anything the vocabulary doesn't cover.
 * Each carries a `data-gds-part` so Studio can select it. */

const SectionEyebrow = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    data-gds-part="section-eyebrow"
    className={cn(
      "inline-block text-xs font-medium uppercase tracking-wider text-muted-foreground",
      className,
    )}
    {...props}
  />
));
SectionEyebrow.displayName = "SectionEyebrow";

const SectionTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    data-gds-part="section-title"
    className={cn(
      "text-balance text-3xl font-semibold tracking-tight md:text-4xl",
      className,
    )}
    style={{ fontFamily: "var(--font-heading, var(--font-sans))" }}
    {...props}
  />
));
SectionTitle.displayName = "SectionTitle";

const SectionSubtitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-gds-part="section-subtitle"
    className={cn("text-lg text-muted-foreground md:text-xl", className)}
    {...props}
  />
));
SectionSubtitle.displayName = "SectionSubtitle";

const SectionDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-gds-part="section-description"
    className={cn("leading-relaxed text-muted-foreground", className)}
    {...props}
  />
));
SectionDescription.displayName = "SectionDescription";

const SectionActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-gds-part="section-actions"
    className={cn("flex flex-wrap items-center gap-3", className)}
    {...props}
  />
));
SectionActions.displayName = "SectionActions";

/** SectionMedia — a SLOT. Holds any media: a single image (MediaSurface),
 *  a Carousel, a VideoPlayer, an embed, or a whole app UI. The section
 *  doesn't care what's inside; the media frames itself. */
const SectionMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-gds-part="section-media"
    className={cn("w-full", className)}
    {...props}
  />
));
SectionMedia.displayName = "SectionMedia";

export {
  Section,
  Container,
  SectionEyebrow,
  SectionTitle,
  SectionSubtitle,
  SectionDescription,
  SectionActions,
  SectionMedia,
  bandVariants as sectionBandVariants,
  containerVariants,
};
