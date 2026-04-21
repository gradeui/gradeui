"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Palette, Code, BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  const resources = [
    {
      icon: Palette,
      title: "Infinitely themeable",
      description: "Three hues become a complete OKLCH design language. Pick a color, get a system. Save it, share it, ship it.",
      href: "/docs/theming",
    },
    {
      icon: Code,
      title: "AI-native primitives",
      description: "Every component is built to be generated, composed, and modified by AI. Clear types, predictable props, zero magic.",
      href: "/components",
    },
    {
      icon: BookOpen,
      title: "Ship in minutes",
      description: "One npm install, one provider, one theme object. Your product looks designed from the first paint.",
      href: "/docs",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-pattern" />
          <div className="absolute inset-x-0 bottom-0 h-32 hero-gradient" />

          <div className="relative max-w-7xl mx-auto flex flex-col items-center justify-center gap-6 pb-16 pt-24 md:pt-32 md:pb-24 text-center px-4 md:px-8">
            <Badge variant="outline" className="border-primary/50">
              AI-native · Infinitely themeable
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl text-balance">
              The future is now.{" "}
              <span className="text-primary">Build it</span> with Grade.
            </h1>

            <p className="max-w-[42rem] text-lg text-muted-foreground sm:text-xl text-pretty">
              A design system built for the AI era. Pick three hues, get an entire
              OKLCH-based design language. Every component adapts — from solo
              prototypes to infinite themes, shipped by humans and agents alike.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Button size="lg" asChild>
                <Link href="/docs">
                  Start Building
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/docs/theming">
                  Explore Theming
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Resources */}
        <section className="border-t">
          <div className="max-w-7xl mx-auto py-16 md:py-24 px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Built for what comes next
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Every primitive is designed to be understood, composed, and extended —
                by your team, by your AI, by anyone shipping product in 2026.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {resources.map((resource) => {
                const Icon = resource.icon;
                return (
                  <Link key={resource.title} href={resource.href} className="block">
                    <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
                      <CardHeader>
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>{resource.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base">
                          {resource.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="border-t bg-muted/30">
          <div className="max-w-7xl mx-auto py-16 md:py-24 px-4 md:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  One install. Infinite skins.
                </h2>
                <p className="text-lg text-muted-foreground">
                  A single npm package, a single provider — and every component
                  re-skins when you swap your theme object.
                </p>
              </div>

              <div className="bg-background rounded-lg border p-6 font-mono text-sm">
                <div className="text-muted-foreground mb-4"># Install the package</div>
                <pre className="text-foreground overflow-x-auto mb-6">
{`npm install @gradeui/ui`}
                </pre>

                <div className="text-muted-foreground mb-4"># Import and use components</div>
                <pre className="text-foreground overflow-x-auto">
{`import { Button, Card, Input } from "@gradeui/ui"
import "@gradeui/ui/styles.css"

export default function App() {
  return (
    <Card>
      <Input placeholder="Enter your email" />
      <Button>Subscribe</Button>
    </Card>
  )
}`}
                </pre>
              </div>

              <div className="text-center mt-8">
                <Button asChild>
                  <Link href="/docs/installation">
                    View full installation guide
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center text-sm text-muted-foreground">
          <p>Grade Design System · Built with Radix UI and Tailwind CSS</p>
        </div>
      </footer>
    </div>
  );
}
