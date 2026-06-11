"use client";

/**
 * Marketing sections — the building blocks of gradeui.com's marketing
 * pages (homepage first).
 *
 * Every section here is prop-driven and content-free by design: this
 * file is the seed for a future `@gradeui/sections` package (marketing
 * sections as a publishable tier alongside `@gradeui/ui`). Keep that in
 * mind when editing:
 *
 *   - no page-specific copy in this file — content arrives via props
 *   - no docs-app-only imports beyond @/components/ui primitives
 *   - every section themes itself purely from the semantic tokens
 *     (--background / --foreground / --border / --spacing …), so they
 *     render correctly under ANY Grade theme, not just Grade Marketing
 *
 * Sections (top-to-bottom of a typical landing page):
 *   MarketingHero      — headline / sub / CTAs over an optional background slot
 *   ProductShowcase    — framed product visual (image, video, or placeholder)
 *   FeatureGrid        — alternating feature cards, 2-col rhythm
 *   FeatureColumns     — compact "…and more" 3-col feature list
 *   MarketingFAQ       — accordion Q&A
 *   ClosingCta         — full-bleed final call-to-action
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ─────────────────────────── Hero ─────────────────────────── */

export interface MarketingHeroProps {
  /** Small kicker line above the headline (optional). */
  kicker?: string;
  /** Main headline. Use <em> inside for the display-italic accent. */
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /**
   * Background slot — rendered absolutely behind the hero content.
   * The homepage passes its three.js canvas mount here.
   */
  background?: React.ReactNode;
  /** Extra content under the CTAs (e.g. a byline). */
  children?: React.ReactNode;
  className?: string;
}

export function MarketingHero({
  kicker,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  background,
  children,
  className,
}: MarketingHeroProps) {
  return (
    <section className={cn("relative overflow-hidden", className)}>
      {background && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {background}
        </div>
      )}

      <div className="relative max-w-4xl mx-auto flex flex-col items-center text-center gap-6 px-4 md:px-8 pt-28 pb-24 md:pt-40 md:pb-32">
        {kicker && (
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
            {kicker}
          </p>
        )}

        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-[var(--font-heading-weight)] tracking-[var(--font-heading-tracking)] text-balance [&_em]:italic [&_em]:font-normal">
          {title}
        </h1>

        {subtitle && (
          <p className="max-w-2xl text-lg md:text-xl text-foreground text-balance">
            {subtitle}
          </p>
        )}

        {(primaryCta || secondaryCta) && (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {primaryCta && (
              <Button
                size="lg"
                asChild
                raised
                className="gds-icon-nudge"
              >
                <Link href={primaryCta.href}>
                  {primaryCta.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            {secondaryCta && (
              <Button size="lg" variant="outline" asChild>
                <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
              </Button>
            )}
          </div>
        )}

        {children}
      </div>
    </section>
  );
}

/* ──────────────────────── Product showcase ──────────────────────── */

export interface ProductShowcaseProps {
  /** The visual: an <img>, <video>, iframe, or any node. When omitted,
   *  a quiet placeholder frame renders (useful pre-screenshot). */
  children?: React.ReactNode;
  /** Accessible label for the frame. */
  label?: string;
  className?: string;
}

export function ProductShowcase({ children, label, className }: ProductShowcaseProps) {
  return (
    <section className={cn("px-4 md:px-8 pb-12 md:pb-16", className)}>
      <div
        className="max-w-6xl mx-auto rounded-[var(--gds-radius-xl)] border border-border/70 bg-card/40 shadow-[var(--gds-shadow-xl)] overflow-hidden"
        role="img"
        aria-label={label}
      >
        {children ?? (
          <div className="aspect-[16/9] flex items-center justify-center bg-gradient-to-b from-muted/20 to-muted/5">
            <p className="text-sm text-muted-foreground/60 font-mono">
              {label ?? "Product preview coming soon"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ───────────────────────── Feature grid ───────────────────────── */

export interface FeatureItem {
  /** Short label, e.g. "At-will theming". */
  title: string;
  description: string;
  /** Optional visual for the card. Falls back to a quiet surface. */
  visual?: React.ReactNode;
  icon?: React.ReactNode;
}

export interface FeatureGridProps {
  heading?: React.ReactNode;
  subheading?: React.ReactNode;
  items: FeatureItem[];
  className?: string;
}

export function FeatureGrid({ heading, subheading, items, className }: FeatureGridProps) {
  return (
    <section className={cn("border-t border-border/60 py-16 md:py-24", className)}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {(heading || subheading) && (
          <div className="max-w-2xl mb-10">
            {heading && (
              <h2 className="font-display text-3xl md:text-4xl tracking-[var(--font-heading-tracking)] mb-4 [&_em]:italic [&_em]:font-normal">
                {heading}
              </h2>
            )}
            {subheading && (
              <p className="text-lg text-muted-foreground">{subheading}</p>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-[var(--gds-radius-xl)] border border-border/70 bg-card/40 p-8 flex flex-col gap-4"
            >
              {item.visual && (
                <div className="rounded-[var(--gds-radius-lg)] overflow-hidden border border-border/50 mb-2">
                  {item.visual}
                </div>
              )}
              <div className="flex items-center gap-3">
                {item.icon && (
                  <span className="text-primary [&>svg]:h-5 [&>svg]:w-5">{item.icon}</span>
                )}
                <h3 className="text-lg font-medium">{item.title}</h3>
              </div>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────── Feature columns ──────────────────────── */

export interface FeatureColumnsProps {
  /** Big lead-in line, e.g. "…and so much more". */
  heading?: React.ReactNode;
  items: Array<{ title: string; description: string }>;
  className?: string;
}

export function FeatureColumns({ heading, items, className }: FeatureColumnsProps) {
  return (
    <section className={cn("border-t border-border/60 py-24 md:py-32", className)}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {heading && (
          <h2 className="font-display text-3xl md:text-4xl tracking-[var(--font-heading-tracking)] text-right mb-16 [&_em]:italic [&_em]:font-normal">
            {heading}
          </h2>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
          {items.map((item) => (
            <div key={item.title}>
              <h3 className="text-base font-medium mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── FAQ ─────────────────────────── */

export interface MarketingFAQProps {
  heading?: React.ReactNode;
  items: Array<{ question: string; answer: React.ReactNode }>;
  className?: string;
}

export function MarketingFAQ({ heading, items, className }: MarketingFAQProps) {
  return (
    <section className={cn("border-t border-border/60 py-24 md:py-32", className)}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid lg:grid-cols-[1fr_1.5fr] gap-12">
        <h2 className="font-display text-3xl md:text-4xl tracking-[var(--font-heading-tracking)]">
          {heading ?? "Frequently asked questions"}
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-base">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ─────────────────────────── Closing CTA ─────────────────────────── */

export interface ClosingCtaProps {
  title: React.ReactNode;
  cta: { label: string; href: string };
  className?: string;
}

export function ClosingCta({ title, cta, className }: ClosingCtaProps) {
  return (
    <section className={cn("border-t border-border/60 py-28 md:py-40", className)}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        <h2 className="font-display text-4xl md:text-5xl tracking-[var(--font-heading-tracking)] text-balance [&_em]:italic [&_em]:font-normal">
          {title}
        </h2>
        <Button size="lg" asChild raised className="shrink-0 gds-icon-nudge">
          <Link href={cta.href}>
            {cta.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
