// HubHeroCard — Full-width hero card: title, description, and CTA row on the left, media slot on the right — the lead-in banner for hub and dashboard pages.
// keywords: hero card, hero banner, feature card, promo card, media card, hub hero, dashboard hero, split card, cta card, onboarding card
// components: card, button, typography
// Hand-authored (July 2026, sidebar/layout explorations) — NOT
// harvested; the recipe harvester does not touch custom-named files.
//
// Same composition rules as HubStatCard: in-file user-land component,
// copy into the screen, slots as props. CARD TREATMENT IS NOT SET
// HERE — the raised page layer paints every [data-slot="card"]:
// white + hairline border, NO shadow (border-only per their Figma).
//
// `media` accepts any ReactNode — an <img>, a chart, an illustration.
// When omitted, a neutral-50 placeholder keeps the split so the layout
// reads correctly before real media lands. Media column hides below md
// (the copy is the message; the picture is the garnish).

import {
  Button,
  Card,
  CardContent,
} from "@brightlocal/ui-components";
import { TypographyH3 } from "@brightlocal/ui-components/typography";
import { Sparkles } from "@brightlocal/icons";

function HubHeroCard({
  title,
  description,
  primaryCta = "Get started",
  primaryHook,
  secondaryCta,
  secondaryHook,
  media,
  // Media proportion presets — Tailwind aspect utilities. "4/3" is the
  // default (video read too letterboxy at w-2/5); "square" for
  // illustration-led heroes.
  mediaAspect = "4/3", // "4/3" | "square" | "video"
  dataHook,
}) {
  const MEDIA_ASPECTS = {
    "4/3": "aspect-[4/3]",
    square: "aspect-square",
    video: "aspect-video",
  };
  const aspect = MEDIA_ASPECTS[mediaAspect] ?? MEDIA_ASPECTS["4/3"];
  // condensed density bakes px-3 on the card — too tight for a hero.
  // px-6 wins the merge (same utility group); vertical rhythm stays
  // condensed.
  return (
    <Card
      density="condensed"
      className="max-w-none px-6"
      dataHook={dataHook}
    >
      <CardContent>
        <div className="flex items-center gap-8">
          {/* Copy column */}
          <div className="flex min-w-0 flex-1 flex-col items-start gap-3 py-4">
            <TypographyH3>{title}</TypographyH3>
            <p className="text-muted-foreground max-w-prose text-sm">
              {description}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button dataHook={primaryHook}>{primaryCta}</Button>
              {secondaryCta ? (
                <Button variant="ghost" dataHook={secondaryHook}>
                  {secondaryCta}
                </Button>
              ) : null}
            </div>
          </div>
          {/* Media column — hidden below md; proportion owned by the
              aspect preset so real media and the placeholder agree. */}
          <div className={`hidden w-2/5 shrink-0 md:block ${aspect}`}>
            {media ?? (
              <div className="flex h-full w-full items-center justify-center rounded-lg border border-[var(--border)] bg-[light-dark(var(--ds-tailwind-colors-neutral-50),var(--ds-tailwind-colors-neutral-800))]">
                <Sparkles className="text-muted-foreground size-6" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Usage — leads the hub page, full width above the stat grid ─────
<HubHeroCard
  title="Get more from your local presence"
  description="AI Insights reviews your listings, rankings and reviews together and tells you the three things to fix first."
  primaryCta="Run AI Insights"
  primaryHook="hub-hero-primary"
  secondaryCta="See how it works"
  secondaryHook="hub-hero-secondary"
  dataHook="hub-hero-card"
/>
