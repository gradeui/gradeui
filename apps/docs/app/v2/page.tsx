import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { ArrowRight } from "lucide-react";

/*
 * /v2 draft homepage.
 *
 * Not linked from the nav. Marked noindex so search engines skip it. Use
 * this as a scratch surface for iterating on the homepage strategy without
 * touching the live homepage at /[locale].
 *
 * When the draft is ready, copy this file's <main> contents into
 * apps/docs/app/[locale]/page.tsx so the live homepage flips to the new
 * layout. After the swap, delete this file and remove `v2` from the
 * middleware matcher exclusions so the URL goes back to a clean 404.
 *
 * Placeholders are in square brackets: [ Headline ], [ Sub copy ], etc.
 * Drop your own copy in over them.
 */

export const metadata: Metadata = {
  title: "Draft homepage (v2)",
  description: "Draft homepage scratch surface. Not for indexing.",
  // Hard noindex / nofollow so Google, Bing, and AI crawlers all skip this
  // page even if someone shares the URL. The X-Robots-Tag header would be
  // belt-and-braces; Next emits the appropriate meta tag from this setting.
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function HomeV2() {
  return (
    <div className="flex min-h-screen flex-col">
      {/*
        Draft banner. Visible from the first paint so anyone hitting the
        URL knows immediately that it is not the real homepage.
      */}
      <div className="bg-amber-400 text-amber-950 text-center text-sm font-medium py-2 px-4">
        Draft homepage at /v2. Not linked, not indexed. Iterate here freely.
      </div>

      <MarketingNav />

      <main className="flex-1 pt-16">
        {/* ─── Hero ───────────────────────────────────────────────────── */}
        <section className="border-b">
          <div className="max-w-7xl mx-auto py-24 md:py-32 px-4 md:px-8 text-center">
            <Badge variant="outline" className="mb-6">
              Visual builder · AI · Design systems
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto text-balance">
              [ Headline goes here ]
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
              [ Supporting line. One or two sentences telling visitors what
              GradeUI is and why they should care. ]
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg">
                Open the Studio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Browse templates
              </Button>
            </div>
          </div>
        </section>

        {/* ─── Three ways in ──────────────────────────────────────────── */}
        <section className="border-b bg-muted/30">
          <div className="max-w-7xl mx-auto py-16 md:py-24 px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                [ Three ways in ]
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                [ Templates, prompts, components. Pick the starting point that
                fits the work. ]
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                "Start from a template",
                "Start from a prompt",
                "Start from a component",
              ].map((label) => (
                <Card key={label}>
                  <CardHeader>
                    <CardTitle>{label}</CardTitle>
                    <CardDescription>
                      [ One or two lines of supporting copy. ]
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground">
                      [ Screenshot or short clip ]
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── The Canvas ─────────────────────────────────────────────── */}
        <section className="border-b">
          <div className="max-w-7xl mx-auto py-16 md:py-24 px-4 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              [ The canvas ]
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
              [ Direct manipulation. Token aware. AI when you want it,
              keyboard when you do not. ]
            </p>
            <div className="aspect-video bg-muted rounded-md max-w-5xl mx-auto flex items-center justify-center text-sm text-muted-foreground">
              [ Big Studio screenshot or animated demo ]
            </div>
          </div>
        </section>

        {/* ─── Design system foundation ───────────────────────────────── */}
        <section className="border-b bg-muted/30">
          <div className="max-w-7xl mx-auto py-16 md:py-24 px-4 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              [ A real design system, underneath ]
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              [ Tokens, themes, layout primitives, contracts. Output that ships
              as @gradeui/ui, not as a screenshot. ]
            </p>
          </div>
        </section>

        {/* ─── Positioning vs alternatives ────────────────────────────── */}
        <section className="border-b">
          <div className="max-w-7xl mx-auto py-16 md:py-24 px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                [ How GradeUI is different ]
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                [ Quick row of comparisons vs v0, Lovable, Bolt, Claude Design,
                shadcn. BYOK, ownership, design systems first. ]
              </p>
            </div>
            <div className="grid md:grid-cols-5 gap-4 text-sm">
              {["v0", "Lovable", "Bolt", "Claude Design", "shadcn"].map(
                (name) => (
                  <Card key={name}>
                    <CardHeader>
                      <CardTitle className="text-base">{name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        [ One line on the difference. ]
                      </p>
                    </CardContent>
                  </Card>
                ),
              )}
            </div>
          </div>
        </section>

        {/* ─── For designers, specifically ────────────────────────────── */}
        <section className="border-b bg-muted/30">
          <div className="max-w-7xl mx-auto py-16 md:py-24 px-4 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              [ For designers, specifically ]
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              [ Theme builder. Layout primitives. Components named in
              designer vocabulary, not framework jargon. ]
            </p>
          </div>
        </section>

        {/* ─── Trust + maker line ─────────────────────────────────────── */}
        <section className="border-b">
          <div className="max-w-7xl mx-auto py-12 md:py-16 px-4 md:px-8 text-center">
            <p className="text-sm text-muted-foreground">
              Open source. MIT licensed. Built by{" "}
              <a
                href="https://alastairdriver.com"
                rel="author noopener"
                target="_blank"
                className="font-medium text-foreground hover:underline"
              >
                Alastair Driver
              </a>
              .
            </p>
          </div>
        </section>

        {/* ─── Closing CTA ────────────────────────────────────────────── */}
        <section>
          <div className="max-w-7xl mx-auto py-16 md:py-24 px-4 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
              [ Closing CTA ]
            </h2>
            <Button size="lg">
              Open the Studio
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
