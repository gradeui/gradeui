/**
 * gradeui.com homepage — marketing surface, dark-first.
 *
 * Composition only: every block below is a reusable section from
 * components/marketing/sections.tsx (the seed for a future
 * @gradeui/sections package). Copy lives HERE, structure lives THERE.
 *
 * Positioning: Grade is a design system FOR DESIGNERS — themes, Studio,
 * and screens you shape directly. No install commands, no API talk on
 * this page; that's what /docs is for.
 */

import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { MarketingBackground } from "@/components/marketing/marketing-background";
import { GradeWordmarkPen } from "@/components/marketing/grade-wordmark-pen";
import { LiveEmbed } from "@/components/marketing/live-embed";
import { BackgroundTweaker } from "@/components/marketing/background-tweaker";
import {
  MarketingHero,
  ProductShowcase,
  FeatureGrid,
  FeatureColumns,
  MarketingFAQ,
  ClosingCta,
} from "@/components/marketing/sections";

export default function Home() {
  return (
    <MarketingLayout headerMode="after-scroll">
      {/* Live shader knobs — deliberately public. Everything is a knob;
          that's the pitch. */}
      <BackgroundTweaker />

      <MarketingHero
        title={
          <GradeWordmarkPen
            title="Grade"
            animated
            className="w-[70vw] max-w-3xl h-auto mx-auto"
          />
        }
        subtitle="Use the agent you prefer. In browser or MCP. Tweak, edit, all on your subscription. No more lock in. Free yourself."
        primaryCta={{ label: "Join the waitlist", href: "/waitlist" }}
        background={<MarketingBackground />}
      >
        {/* Above-the-fold maker line — backs up the JSON-LD Person node
            in the root layout and shows in any first-screen capture. */}
        <p className="pt-6 text-sm text-muted-foreground">
          Built by{" "}
          <a
            href="https://alastairdriver.com"
            rel="author noopener"
            target="_blank"
            className="font-medium text-foreground hover:underline"
          >
            Alastair Driver
          </a>
        </p>
      </MarketingHero>

      <ProductShowcase label="Grade Studio, the screen generation and theming workspace">
        {/* Live render of the "Studio Showcase" screen (project: Grade
            Homepage) via the public embed route. Relative URL, so it
            resolves on localhost and gradeui.com alike. */}
        {/* Eager on purpose: lazy-loading made the embed boot (page +
            nested sandbox + compile) exactly as it scrolled into view,
            which read as scroll jank. Paying that cost at page load is
            invisible; paying it mid-scroll is not. */}
        {/* Click-to-interact: the shield keeps wheel events on the page
            (no Lenis dead zone over the frame); clicking hands control
            to the live render, mousing away re-arms the shield. */}
        <LiveEmbed
          src="/e/998ad8b7-c056-40af-b328-ba46b4cba557?w=1280&h=720&mode=dark&motion=on"
          title="Grade Studio live render"
          frameClassName="aspect-[16/9]"
        />
      </ProductShowcase>

      <FeatureGrid
        heading={
          <>
            Theme · Generate · <em>Refine</em>
          </>
        }
        subheading="Everything in Grade points at one idea: the design system should do what the designer says."
        items={[
          {
            title: "Studio, driven by conversation",
            description:
              "Describe the screen you need and watch it assemble from real Grade components, then click into anything and change it.",
          },
          {
            title: "Theming at will",
            description:
              "Three hues become a complete OKLCH design language. Drag hue, type scale, or density and the whole screen re-themes live, retroactively.",
          },
          {
            title: "Themes that travel",
            description:
              "A Grade theme is a small, portable object. Save it, share it, remix someone else's. Your look is never locked to one project.",
          },
          {
            title: "Share live, not flat",
            description:
              "Send a working screen as a link or embed it anywhere on the web. What you made, running, not a screenshot of it.",
          },
        ]}
      />

      <FeatureColumns
        heading={
          <>
            …and so <em>much more</em>
          </>
        }
        items={[
          {
            title: "Templates",
            description:
              "Full screens and flows to start from, every one of them re-themeable to your taste in seconds.",
          },
          {
            title: "Playground",
            description:
              "A sketchbook for ideas. Drop in a reference and riff on it inside your design language.",
          },
          {
            title: "Revisions",
            description:
              "Every change is kept. Step back through a screen's history and branch from any point.",
          },
          {
            title: "Your assets",
            description:
              "Bring your own images and media — prototypes that look like your product, not stock.",
          },
          {
            title: "Brand pops",
            description:
              "Eight loud accent slots per theme for the moments a design needs to shout.",
          },
          {
            title: "Demos",
            description:
              "Turn a live screen into a directed walkthrough: camera moves, captions, focus.",
          },
        ]}
      />

      <MarketingFAQ
        items={[
          {
            question: "What is Grade?",
            answer:
              "Grade is a design system and AI studio built for designers. You work with real components and a live theme engine, describing, dragging, and refining. The result is a working product surface, not a picture of one.",
          },
          {
            question: "Do I need to write code?",
            answer:
              "No. Studio is conversation- and control-driven. Code stays underneath for the people on your team who want it — everything you make is built from real components.",
          },
          {
            question: "What makes Grade themes different?",
            answer:
              "A theme is a tiny, deterministic object: three hues, type choices, spacing density. It generates a complete OKLCH design language. Change it any time and every screen you've made follows.",
          },
          {
            question: "What's in early access?",
            answer:
              "Studio, the theme engine, templates, and live sharing. Early access shapes what comes next. That's why the waitlist asks what you'd make.",
          },
          {
            question: "Who's behind Grade?",
            answer:
              "Grade is designed and built by Alastair Driver, a design systems engineer. The site, the system, and Studio are the portfolio.",
          },
        ]}
      />

      <ClosingCta
        title={
          <>
            Make it <em>yours</em>
          </>
        }
        cta={{ label: "Join the waitlist", href: "/waitlist" }}
      />
    </MarketingLayout>
  );
}
