// HubHeroCard — Full-width hero card: title, description, and CTA row on the left, media slot on the right — the lead-in banner for hub and dashboard pages.
// keywords: hero card, hero banner, feature card, promo card, media card, hub hero, dashboard hero, split card, cta card, onboarding card
// components: card, button, typography
// Hand-authored (July 2026, sidebar/layout explorations) — NOT
// harvested; the recipe harvester does not touch custom-named files.
//
// Same composition rules as HubStatCard: in-file user-land component,
// copy into the screen, slots as props. ELEVATION IS NOT SET HERE —
// the raised page layer paints every [data-slot="card"] globally.
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
  dataHook,
}) {
  return (
    <Card density="condensed" className="max-w-none" dataHook={dataHook}>
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
          {/* Media column — hidden below md */}
          <div className="hidden w-2/5 shrink-0 self-stretch md:block">
            {media ?? (
              <div className="flex h-full min-h-40 items-center justify-center rounded-lg border border-[var(--ds-tailwind-colors-neutral-100)] bg-[var(--ds-tailwind-colors-neutral-50)]">
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
