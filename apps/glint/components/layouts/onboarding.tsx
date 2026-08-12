"use client";

/**
 * Glint onboarding chrome, ported from the Studio shared component
 * "OnboardingLayout" (cmskbtlg4lf5kd, version 1786356919069): the
 * Mercury-pattern wizard shell shared by every step screen. Sticky
 * header (Wordmark + account chip) with the fill-only progress bar,
 * desktop step rail (hidden below md, replaced by the compact step
 * strip), the 12-col content grid, and the floating help button.
 * Screens supply only the form column as children; the route layout at
 * app/onboarding/layout.tsx mounts this once for all step routes.
 *
 * DEMO NAVIGATION:
 *  - every rail step is a goto link (resolved by GotoBridge) so viewers
 *    move between sections independently; targets come from the label
 *    map (a step's own `target` prop wins), and Owners & control
 *    BRANCHES on the stored business type (3a for SMLLC, else 3b).
 *    The active step renders without a goto.
 *  - the header logo gotos the US Demo Landing hub (the Wordmark
 *    component does not spread rest props, so the goto rides a
 *    wrapping button).
 *  - Actions renders an automatic Back button: the layout shares
 *    steps + current + businessType through context, so Back computes
 *    the previous step's target through the same branching map. Step
 *    one's Back returns to the demo landing.
 *
 * Next.js port note: the Studio original resolved the Owners branch by
 * reading FlowStore synchronously during render, which is fine in a
 * client-only iframe but a hydration hazard under SSR. Here the stored
 * business type comes through the hydration-safe useFlowField hook and
 * flows to both the rail and the Back button via context.
 */

import * as React from "react";
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  Section,
  Container,
  Stack,
  Row,
  Button,
  Progress,
  Avatar,
  AvatarFallback,
} from "@gradeui/ui";
import { ChevronDown, ChevronLeft, HelpCircle } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { useFlowField } from "@/lib/flow-store";

const LANDING = "US Demo Landing";

export interface WizardStep {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  target?: string;
}

const STEP_TARGETS: Record<string, string> = {
  "Before you apply": "US Onboarding — 1 Before you apply",
  "Business type": "US Onboarding — 2 Business type",
  "Business details": "US Onboarding — 3 Business details",
  "Expected activity": "US Onboarding — 5 Expected activity",
  Documents: "US Onboarding — 6 Documents",
  "Certify & sign": "US Onboarding — 7 Certification",
  "Review & submit": "US Onboarding — 8 Review & submit",
};

function stepTarget(
  step: WizardStep | undefined,
  businessType: string,
): string | undefined {
  if (!step) return undefined;
  if (step.target) return step.target;
  if (step.label === "Owners & control") {
    return businessType === "smllc"
      ? "US Onboarding — 4a Owner identity"
      : "US Onboarding — 4b Owners & control";
  }
  return STEP_TARGETS[step.label];
}

/** Layout to Actions channel so the Back button can compute the
 *  previous step without every screen passing it. */
const RailContext = React.createContext<{
  steps: WizardStep[];
  current: number;
  businessType: string;
} | null>(null);

/** The step rail (desktop). Inactive rows quiet grey; only the active
 *  pill and the count carry colour. Every inactive step with a known
 *  target is a goto link. */
function StepRail({
  steps,
  current,
  businessType,
}: {
  steps: WizardStep[];
  current: number;
  businessType: string;
}) {
  return (
    <Stack gap="lg">
      <div className="text-4xl font-medium">
        <span className="text-accent">{current}</span>
        <span className="text-foreground/40"> / {steps.length}</span>
      </div>
      <Stack gap="xs">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const active = i === current - 1;
          const target = active ? undefined : stepTarget(s, businessType);
          return (
            <button
              key={s.label}
              type="button"
              aria-current={active ? "step" : undefined}
              data-grade-goto={target}
              className={
                active
                  ? "flex w-full items-center gap-3 rounded-lg bg-muted px-4 py-3 text-left text-sm font-medium text-foreground"
                  : "flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-foreground/60 hover:bg-muted/50 hover:text-foreground/80"
              }
            >
              {Icon ? <Icon className={active ? "h-4 w-4 text-primary" : "h-4 w-4"} /> : null}
              {s.label}
            </button>
          );
        })}
      </Stack>
    </Stack>
  );
}

export function OnboardingLayout({
  steps,
  current = 1,
  account = "AD",
  children,
}: {
  steps: WizardStep[];
  current?: number;
  account?: string;
  children: React.ReactNode;
}) {
  const [businessType] = useFlowField("businessType", "smllc");
  const progress = Math.round((current / Math.max(steps.length, 1)) * 100);
  const active = steps[current - 1];
  return (
    <RailContext.Provider value={{ steps, current, businessType }}>
      <AppShell nav="top" className="min-h-screen bg-background">
        <AppShellHeader className="sticky top-0 z-30 border-b border-border/60 bg-background">
          <Section as="header" pad="none">
            <Container maxW="full" className="py-4">
              <Row justify="between" align="center">
                {/* Logo gotos the demo hub, the walkthrough's home. */}
                <button
                  type="button"
                  data-grade-goto={LANDING}
                  aria-label="Back to the demo landing"
                  className="cursor-pointer"
                >
                  <Wordmark cut="metal" className="h-5" />
                </button>
                <Row gap="sm" align="center" className="rounded-full bg-muted/60 py-1 pl-1 pr-2">
                  <Avatar size="sm">
                    <AvatarFallback tone="primary">{account}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-foreground/50" />
                </Row>
              </Row>
            </Container>
          </Section>
          {/* Fill-only progress riding the header's border-b hairline. */}
          {/* ACCENT, NOT PRIMARY (Ali, 11 Aug: "the progress bar is too
              strong"). Full-bleed across the header it is a large area of
              colour, and at that size the action blue competes with the
              page's actual actions instead of reading as progress. A real
              Progress prop, not a [&>*]:bg-accent reach-through. */}
          <Progress
            value={progress}
            tone="accent"
            className="absolute inset-x-0 -bottom-px h-1 rounded-none bg-transparent"
          />
        </AppShellHeader>

        <AppShellMain>
          <Section pad="none" className="py-8 md:py-16">
            <Container maxW="xl" grid className="gap-12">
              <div className="hidden md:col-span-4 md:block lg:col-span-3">
                <div className="md:sticky md:top-24">
                  <StepRail steps={steps} current={current} businessType={businessType} />
                </div>
              </div>
              <div className="col-span-12 md:col-span-8 lg:col-span-6">
                <Stack gap="lg">
                  {/* Mobile step strip, replaces the rail below md */}
                  <Row gap="sm" align="center" className="md:hidden">
                    <span className="text-sm font-medium">
                      <span className="text-accent">{current}</span>
                      <span className="text-foreground/40"> / {steps.length}</span>
                    </span>
                    <span className="text-sm text-foreground/60">·</span>
                    <span className="text-sm text-foreground/80">{active?.label}</span>
                  </Row>
                  {children}
                </Stack>
              </div>
            </Container>
          </Section>

          <Button
            variant="outline"
            size="sm"
            iconOnly
            aria-label="Help"
            className="fixed bottom-6 right-6 rounded-full shadow-elevation-2"
          >
            <HelpCircle />
          </Button>
        </AppShellMain>
      </AppShell>
    </RailContext.Provider>
  );
}

/** Compound part: the footer action row. Renders an automatic Back
 *  button (previous step through the branching map; the demo landing
 *  from step one) beside whatever the screen supplies (Continue). */
OnboardingLayout.Actions = function OnboardingLayoutActions({
  children,
}: {
  children?: React.ReactNode;
}) {
  const ctx = React.useContext(RailContext);
  const backTarget =
    ctx && ctx.current > 1
      ? (stepTarget(ctx.steps[ctx.current - 2], ctx.businessType) ?? LANDING)
      : LANDING;
  return (
    <Row justify="between" align="center" className="pb-16 pt-2">
      <Button
        variant="ghost"
        size="lg"
        className="rounded-full text-muted-foreground hover:text-foreground"
        data-grade-goto={backTarget}
      >
        {/* CHEVRON, NOT AN ARROW (Ali, 11 Aug). The wizard Back moves one
            step within a sequence, which is what a chevron says; an arrow
            reads as leaving for somewhere else. The product screens keep
            their arrow precisely because their Back DOES leave, out of a
            wallet detail and back to Wallets. */}
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>
      <Row justify="end">{children}</Row>
    </Row>
  );
};
