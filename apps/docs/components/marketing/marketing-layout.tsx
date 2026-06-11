"use client";

/**
 * MarketingLayout — the layout template for gradeui.com's marketing
 * surfaces (homepage, /waitlist, future landing pages).
 *
 * Header + footer + central content slot, wrapped in a *scoped*
 * "Grade Marketing" theme (see `gradeMarketingInput` in
 * lib/themes/inputs.ts):
 *
 *   <MarketingLayout>
 *     <YourPageContent />
 *   </MarketingLayout>
 *
 * Design decisions (June 2026 reposition — one-pager, DS for designers):
 *
 *  - DARK ONLY. Marketing is permanently dark — no mode toggle, no
 *    stored preference. (Docs/Studio keep their own theme machinery;
 *    this wrapper never touches :root.)
 *  - SCOPED THEME. Grade Marketing theme vars render inline on the
 *    wrapper (same pattern as ThemeBuilderScope), server-side too, so
 *    first paint is themed + dark with no FOUC.
 *  - LOZENGE HEADER. The header is a floating glass toolbar — the
 *    Toolbar primitive in a pill, fixed top-center. No nav links, no
 *    search, no switchers: wordmark + one CTA. We're a one-pager that
 *    funnels to /waitlist.
 */

import * as React from "react";
import Link from "next/link";
import { builtInThemes, themeToCSSVars } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Toolbar } from "@/components/ui/toolbar";
import { GradeWordmarkPen } from "@/components/marketing/grade-wordmark-pen";

const MARKETING_THEME_ID = "grade-marketing";

/* ─────────────────────────── Header ─────────────────────────── */

function MarketingHeader() {
  return (
    <header className="fixed top-4 md:top-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <Toolbar
        position="inline"
        variant="transparent"
        size="md"
        aria-label="Site"
        className="pointer-events-auto w-full max-w-md rounded-full border border-border/60 bg-background/60 backdrop-blur-xl shadow-[var(--gds-shadow-lg)] pl-5 pr-2 py-1.5"
        leading={
          <Link href="/" aria-label="Grade — home" className="flex items-center">
            <GradeWordmarkPen className="h-4 w-auto" />
          </Link>
        }
        trailing={
          <Button asChild size="sm" className="rounded-full">
            <Link href="/waitlist">Join the waitlist</Link>
          </Button>
        }
      />
    </header>
  );
}

/* ─────────────────────────── Footer ─────────────────────────── */

function MarketingSiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <GradeWordmarkPen className="h-3.5 w-auto text-muted-foreground" title="" />

        {/*
          Authorship — the rel="author" link backs up the JSON-LD Person
          node in the root layout. This site is the showcase, so the
          byline stays visible on every marketing page.
        */}
        <p
          className="text-sm text-muted-foreground"
          itemScope
          itemType="https://schema.org/Person"
        >
          © {new Date().getFullYear()} Grade · Designed and built by{" "}
          <a
            href="https://alastairdriver.com"
            rel="author noopener"
            target="_blank"
            itemProp="url"
            className="font-medium text-foreground hover:underline"
          >
            <span itemProp="name">Alastair Driver</span>
          </a>
        </p>
      </div>
    </footer>
  );
}

/* ─────────────────────────── Layout ─────────────────────────── */

export interface MarketingLayoutProps {
  children: React.ReactNode;
  /** Extra classes for the central content slot (<main>). */
  className?: string;
}

export function MarketingLayout({ children, className }: MarketingLayoutProps) {
  const theme = builtInThemes[MARKETING_THEME_ID];
  // themeToCSSVars returns the exact { "--background": "…" } map React
  // needs; rendered inline (server included) so the subtree is themed
  // and dark from the very first byte of HTML.
  const vars = themeToCSSVars(theme, "dark") as React.CSSProperties;

  return (
    <div
      className={cn(
        "dark flex min-h-screen flex-col bg-background text-foreground font-sans antialiased"
      )}
      style={vars}
      data-grade-theme={theme.id}
      data-mode="dark"
      data-button-shape={theme.components.buttonShape ?? "default"}
      data-input-style={theme.components.inputStyle ?? "outlined"}
      data-card-style={theme.components.cardStyle ?? "flat"}
    >
      <MarketingHeader />
      <main className={cn("flex-1 flex flex-col", className)}>{children}</main>
      <MarketingSiteFooter />
    </div>
  );
}
