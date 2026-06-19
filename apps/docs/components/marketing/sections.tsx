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
 * Heading vocabulary is consistent EVERYWHERE — `eyebrow?` / `title` /
 * `subtitle?`, all funnelled through <SectionHeader>. Two-column sections
 * take a `children` media slot and a `mediaSide` so the same block flips
 * left↔right. That uniformity is deliberate: it keeps the kit small enough
 * for a human (or an AI agent) to compose pages from a handful of generic,
 * configurable blocks rather than a long tail of bespoke ones.
 *
 * Shared:
 *   SectionHeader  — eyebrow / title / subtitle stack; every section uses it
 *
 * Sections (top-to-bottom of a typical landing page):
 *   MarketingHero  — title / subtitle / CTAs over an optional background slot
 *   ProductShowcase— framed product visual (image, video, embed, placeholder)
 *   SplitSection   — GENERIC two-column block: copy + an arbitrary media slot,
 *                    reversible via `mediaSide`. The workhorse.
 *   CodeFeature    — a SplitSection preset with a <Code> window in the slot
 *   FeatureGrid    — alternating feature cards, 2-col rhythm
 *   FeatureColumns — compact "…and more" 3-col feature list
 *   LogoStrip      — row of logos / social proof
 *   StatBand       — a row of big-number stats
 *   MarketingFAQ   — accordion Q&A
 *   ClosingCta     — full-bleed final call-to-action
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Code } from "@/components/ui/code";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ─────────────────────── Section header ─────────────────────── */

export interface SectionHeaderProps {
  /** Small uppercase label above the title. */
  eyebrow?: React.ReactNode;
  /** The heading. Use <em> inside for the display-italic accent. */
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Horizontal alignment of the stack. Default "left". */
  align?: "left" | "center" | "right";
  /** Type scale: "section" (h2, default), "hero" (h1, large), "closing"
   *  (h2, large). */
  size?: "section" | "hero" | "closing";
  className?: string;
}

const HEADER_TITLE_SIZE: Record<NonNullable<SectionHeaderProps["size"]>, string> = {
  section: "text-3xl md:text-4xl",
  hero: "text-4xl sm:text-5xl md:text-6xl",
  closing: "text-4xl md:text-5xl",
};

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  size = "section",
  className,
}: SectionHeaderProps) {
  const Tag = size === "hero" ? "h1" : "h2";
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        align === "right" && "items-end text-right",
        className,
      )}
    >
      {eyebrow && (
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
      )}
      {title && (
        <Tag
          className={cn(
            // Title accent: <em> renders in the ACCENT colour, NOT italic
            // (italics read dated). Keeps the heading weight so it stays
            // strong, just a colour shift. One rule, every section.
            "font-display font-[var(--font-heading-weight)] tracking-[var(--font-heading-tracking)] text-balance [&_em]:not-italic [&_em]:text-accent",
            HEADER_TITLE_SIZE[size],
          )}
        >
          {title}
        </Tag>
      )}
      {subtitle && (
        <p
          className={cn(
            "text-balance",
            size === "hero"
              ? "max-w-2xl text-lg md:text-xl text-foreground"
              : "text-lg text-muted-foreground",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** Shared value-prop list with a check marker. */
function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((b) => (
        <li key={b} className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary [&>svg]:h-3 [&>svg]:w-3">
            <Check />
          </span>
          <span className="text-muted-foreground">{b}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────── Hero ─────────────────────────── */

export interface MarketingHeroProps {
  /** Small uppercase eyebrow above the headline (optional). */
  eyebrow?: React.ReactNode;
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
  eyebrow,
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

      <div className="relative max-w-4xl mx-auto flex flex-col items-center text-center gap-8 px-4 md:px-8 pt-28 pb-24 md:pt-40 md:pb-32">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          size="hero"
          align="center"
        />

        {(primaryCta || secondaryCta) && (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {primaryCta && (
              <Button size="lg" asChild raised className="gds-icon-nudge">
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
  /** Optional header above the frame (eyebrow / title / subtitle). */
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** The visual: an <img>, <video>, iframe, or any node. When omitted,
   *  a quiet placeholder frame renders (useful pre-screenshot). */
  children?: React.ReactNode;
  /** Accessible label for the frame. */
  label?: string;
  className?: string;
}

export function ProductShowcase({
  eyebrow,
  title,
  subtitle,
  children,
  label,
  className,
}: ProductShowcaseProps) {
  return (
    <section className={cn("px-4 md:px-8 pb-12 md:pb-16", className)}>
      <div className="max-w-6xl mx-auto">
        {(eyebrow || title || subtitle) && (
          <SectionHeader
            eyebrow={eyebrow}
            title={title}
            subtitle={subtitle}
            className="max-w-2xl mb-8"
          />
        )}
        <div
          className="rounded-[var(--gds-radius-xl)] border border-border/70 bg-card/40 shadow-[var(--gds-shadow-xl)] overflow-hidden"
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
      </div>
    </section>
  );
}

/* ──────────────────────── Split section ──────────────────────── */

export interface SplitSectionProps {
  eyebrow?: React.ReactNode;
  /** Use <em> inside for the display-italic accent. */
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Short value-prop lines, rendered with a check marker. */
  bullets?: string[];
  /** The media column — image, video, embed, code, swatches, anything. */
  children?: React.ReactNode;
  /** Which side the media (children) sits on at lg+. Default "right". */
  mediaSide?: "left" | "right";
  /** Vertical alignment of the two columns. Default "center". */
  align?: "start" | "center";
  className?: string;
}

/**
 * The workhorse: a two-column block of copy + an arbitrary media slot.
 * Reverse it with `mediaSide`. Everything fancier (CodeFeature, an image
 * feature, a swatch feature) is just this with different children.
 */
export function SplitSection({
  eyebrow,
  title,
  subtitle,
  bullets,
  children,
  mediaSide = "right",
  align = "center",
  className,
}: SplitSectionProps) {
  const mediaLeft = mediaSide === "left";
  return (
    <section className={cn("border-t border-border/60 py-16 md:py-24", className)}>
      <div
        className={cn(
          "max-w-6xl mx-auto px-4 md:px-8 grid lg:grid-cols-2 gap-10 lg:gap-16",
          align === "center" ? "items-center" : "items-start",
        )}
      >
        {/* Copy */}
        <div className={cn(mediaLeft && "lg:order-2")}>
          <SectionHeader
            eyebrow={eyebrow}
            title={title}
            subtitle={subtitle}
            className={cn(bullets && bullets.length > 0 && "mb-6")}
          />
          {bullets && bullets.length > 0 && <Bullets items={bullets} />}
        </div>

        {/* Media — min-w-0 lets the grid item shrink below its content
            width so a wide child (e.g. CodeFeature's horizontally
            scrolling <pre>) scrolls internally instead of overflowing
            the viewport on mobile. */}
        {children != null && (
          <div className={cn("min-w-0", mediaLeft && "lg:order-1")}>{children}</div>
        )}
      </div>
    </section>
  );
}

/* ──────────────────────── Code feature ──────────────────────── */

export interface CodeFeatureProps extends Omit<SplitSectionProps, "children"> {
  /** The code window. `highlight` emphasises lines; the line-number gutter
   *  reads as the "sidebar"; it reveals line-by-line on scroll. */
  code: {
    source: string;
    language?: React.ComponentProps<typeof Code>["language"];
    filename?: string;
    highlight?: React.ComponentProps<typeof Code>["highlight"];
  };
}

/** A SplitSection preset: a framed, glowing code window in the media slot. */
export function CodeFeature({ code, ...split }: CodeFeatureProps) {
  return (
    <SplitSection {...split}>
      <div className="relative">
        <div
          className="absolute -inset-px rounded-[var(--gds-radius-xl)] bg-[radial-gradient(60%_60%_at_50%_0%,oklch(var(--primary)/0.18),transparent)] blur-xl"
          aria-hidden="true"
        />
        <div className="relative rounded-[var(--gds-radius-xl)] border border-border/70 bg-card/60 shadow-[var(--gds-shadow-xl)] overflow-hidden">
          <Code
            language={code.language ?? "tsx"}
            filename={code.filename}
            source={code.source}
            highlight={code.highlight}
            showLineNumbers
            reveal="lines"
            trigger="inView"
            speed="normal"
            size="sm"
          />
        </div>
      </div>
    </SplitSection>
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
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  items: FeatureItem[];
  className?: string;
}

export function FeatureGrid({ eyebrow, title, subtitle, items, className }: FeatureGridProps) {
  return (
    <section className={cn("border-t border-border/60 py-16 md:py-24", className)}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {(eyebrow || title || subtitle) && (
          <SectionHeader
            eyebrow={eyebrow}
            title={title}
            subtitle={subtitle}
            className="max-w-2xl mb-10"
          />
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
  eyebrow?: React.ReactNode;
  /** Big lead-in line, e.g. "…and so much more". */
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  items: Array<{ title: string; description: string }>;
  className?: string;
}

export function FeatureColumns({ eyebrow, title, subtitle, items, className }: FeatureColumnsProps) {
  return (
    <section className={cn("border-t border-border/60 py-24 md:py-32", className)}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {(eyebrow || title || subtitle) && (
          <SectionHeader
            eyebrow={eyebrow}
            title={title}
            subtitle={subtitle}
            align="right"
            className="mb-16"
          />
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

/* ─────────────────────────── Logo strip ─────────────────────────── */

export interface LogoStripProps {
  /** Small lead line, e.g. "Trusted by teams at". */
  title?: React.ReactNode;
  /** Logo nodes — <img>, inline <svg>, or any element. Sized to ~h-7. */
  logos: React.ReactNode[];
  className?: string;
}

export function LogoStrip({ title, logos, className }: LogoStripProps) {
  return (
    <section className={cn("border-t border-border/60 py-12 md:py-16", className)}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col items-center gap-8 text-center">
        {title && <p className="text-sm text-muted-foreground">{title}</p>}
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-70 [&_img]:h-7 [&_img]:w-auto [&_svg]:h-7">
          {logos.map((logo, i) => (
            <div key={i} className="flex items-center">
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Stat band ─────────────────────────── */

export interface StatBandProps {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  items: Array<{ value: string; label: string }>;
  className?: string;
}

export function StatBand({ eyebrow, title, subtitle, items, className }: StatBandProps) {
  return (
    <section className={cn("border-t border-border/60 py-16 md:py-24", className)}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {(eyebrow || title || subtitle) && (
          <SectionHeader
            eyebrow={eyebrow}
            title={title}
            subtitle={subtitle}
            className="max-w-2xl mb-12"
          />
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((s) => (
            <div key={s.label}>
              <div className="font-display text-4xl md:text-5xl font-[var(--font-heading-weight)] tracking-[var(--font-heading-tracking)]">
                {s.value}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── FAQ ─────────────────────────── */

export interface MarketingFAQProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  items: Array<{ question: string; answer: React.ReactNode }>;
  className?: string;
}

export function MarketingFAQ({ title, subtitle, items, className }: MarketingFAQProps) {
  return (
    <section className={cn("border-t border-border/60 py-24 md:py-32", className)}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid lg:grid-cols-[1fr_1.5fr] gap-12">
        <SectionHeader title={title ?? "Frequently asked questions"} subtitle={subtitle} />
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
  subtitle?: React.ReactNode;
  cta: { label: string; href: string };
  className?: string;
}

export function ClosingCta({ title, subtitle, cta, className }: ClosingCtaProps) {
  return (
    <section className={cn("border-t border-border/60 py-28 md:py-40", className)}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        <SectionHeader title={title} subtitle={subtitle} size="closing" />
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
