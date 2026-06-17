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
import { ShaderCapture } from "@/components/marketing/shader-capture";
import { StudioChatDemo } from "@/components/marketing/studio-chat-demo";
import {
  MarketingHero,
  ProductShowcase,
  SplitSection,
  CodeFeature,
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
        {/* Immediately interactive: no shield here (the specimen doesn't
            scroll), and the embed forwards unconsumed wheel deltas which
            LiveEmbed replays as page scroll. Hosts that want the
            click-to-interact guard add ?shield=1 to the embed URL. */}
        <LiveEmbed
          src="/e/998ad8b7-c056-40af-b328-ba46b4cba557?w=1280&h=720&mode=dark&motion=on&tweak=1&themes=calm,neon-brutalist,candy-pop,forest-terminal&tweakopen=1"
          title="Grade Studio live render"
          frameClassName="aspect-[16/9]"
        />
      </ProductShowcase>

      {/* Vibe-coding pitch — a scripted Composer typing a request, media on
          the LEFT so it alternates with the code feature below. Just the
          generic SplitSection with a <Composer> in the slot. */}
      <SplitSection
        mediaSide="left"
        title={
          <>
            Just say what you <em>want</em>
          </>
        }
        subtitle="Studio is a conversation. Ask for a screen, a section, or a change, and it assembles from real Grade components, live."
        bullets={[
          "Type a request like “add in a pricing section” and watch it appear.",
          "Every generation is real, themeable components, never throwaway markup.",
          "Keep chatting to refine: move it, restyle it, swap the copy.",
        ]}
      >
        <StudioChatDemo />
      </SplitSection>

      {/* Code feature — the line-by-line reveal IS the show. Topical: the
          Swatch / brand-pops API we just shipped. Code window on the right,
          value props on the left. */}
      <CodeFeature
        title={
          <>
            Real code <em>underneath</em>
          </>
        }
        subtitle="Every screen is real React, built from Grade components, nothing to reverse-engineer when you ship."
        bullets={[
          "Colours bind to live theme tokens, so changing the theme never touches the code.",
          "Copy it straight into your app. No runtime, no lock-in.",
          "The same components power Studio, the docs, and this page.",
        ]}
        code={{
          filename: "brand-pops.tsx",
          language: "tsx",
          highlight: [6],
          source: `import { SwatchGroup, Swatch } from "@gradeui/ui";

export function BrandPops() {
  return (
    <SwatchGroup size="lg">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
        <Swatch key={n} token={\`brand-\${n}\`} />
      ))}
    </SwatchGroup>
  );
}`,
        }}
      />

      {/* Share and embed — a live Pocket Films render via the public embed
          route. shield=1 adds the click-to-interact guard so scrolling past
          the embed doesn't get trapped by the map. */}
      <ProductShowcase
        title={
          <>
            Share and <em>embed</em>
          </>
        }
        subtitle="Send a working screen as a link, or drop it into any site. It's the real thing running, not a screenshot."
        label="Pocket Films, live embedded from Grade"
      >
        <LiveEmbed
          src="/e/dc108b3d-2023-47b5-898d-f21933fb42e6?w=1280&h=720&mode=light&motion=on&shield=1"
          title="Pocket Films live render"
          colorScheme="light"
          frameClassName="aspect-[16/9]"
        />
      </ProductShowcase>

      <FeatureColumns
        title={
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
              "Bring your own images and media, so prototypes look like your product, not stock.",
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

      {/* Shaders, composable. The captured frame is an image base; Grade's
          effect layers (gradient map, dots/halftone, dither) treat it live.
          An evolving showcase that grows as the layer system lands. */}
      <ProductShowcase label="Shaders, composable layers on anything, even your own snapshot">
        <ShaderCapture />
      </ProductShowcase>

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
              "No. Studio is conversation- and control-driven. Code stays underneath for the people on your team who want it. Everything you make is built from real components.",
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
