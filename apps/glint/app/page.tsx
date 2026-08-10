"use client";

// Promoted from Studio screen "US Demo Landing"
// (design dmskhheytm163, version 1786361077708). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.

import {
  Section,
  Container,
  Stack,
  Row,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Separator,
} from "@gradeui/ui";
import { Building2, ArrowRight } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { FlowStore } from "@/lib/flow-store";

// Glint US prototype demo landing, the jump-off hub for walking the
// prototype. One card: the CCO onboarding flow (section:OnboardingCCO)
// as a whole-card goto plus quick-jump pills per screen. The logged-in
// account card was removed at Ali's request (8 Aug, that area is still
// in progress); restore it from this screen's revision history when the
// logged-in area is ready. The "Built from the CCO data-capture spec"
// badge, the footer note about section tags and the "Jump to a step"
// label were also removed at Ali's request (10 Aug). Keep goto targets
// in sync with screen names (matched case-insensitively on the trimmed
// name). Copy convention: no em or en dashes anywhere on this screen.
//
// "Start the flow" RESETS the FlowStore state so every demo run starts
// fresh; the jump pills and the card surface keep existing state so a
// mid-flow hop resumes where you left off.

const ONBOARDING_JUMPS = [
  { label: "0 · Start", target: "US Onboarding — 0 Before you apply" },
  { label: "1 · Type", target: "US Onboarding — 1 Business type" },
  { label: "2 · Details", target: "US Onboarding — 2 Business details" },
  { label: "3a · Owner", target: "US Onboarding — 3a Owner identity" },
  { label: "3b · Owners", target: "US Onboarding — 3b Owners & control" },
  { label: "4 · Activity", target: "US Onboarding — 4 Expected activity" },
  { label: "5 · Docs", target: "US Onboarding — 5 Documents" },
  { label: "6 · Certify", target: "US Onboarding — 6 Certification" },
  { label: "7 · Review", target: "US Onboarding — 7 Review & submit" },
  { label: "Status", target: "US Onboarding — Application status" },
];

export default function DemoLandingPage() {
  return (
    <Section pad="xl" className="min-h-screen">
      <Container maxW="md">
        <Stack gap="xl">
          <Stack gap="md" align="center" className="pt-10 text-center">
            <Wordmark cut="metal" className="h-8" />
            <Stack gap="xs" align="center">
              <h1 className="text-3xl font-medium text-foreground">US Business Accounts Demo</h1>
              <p className="max-w-xl text-muted-foreground">A walkable demo of the Glint US business account experience. </p>
            </Stack>
          </Stack>

          <Card
            data-grade-goto="US Onboarding — 0 Before you apply"
            className="cursor-pointer transition-colors hover:border-primary/40"
          >
            <CardHeader>
              <Row gap="md" align="center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <Stack gap="none">
                  <CardTitle>Open a business account</CardTitle>
                  <CardDescription>The onboarding application</CardDescription>
                </Stack>
              </Row>
            </CardHeader>
            <CardContent>
              <Stack gap="md" className="gap-4">
                <p className="text-sm text-muted-foreground">
                  The eight-step KYB journey: PATRIOT Act notice, business
                  type, ownership, expected activity, documents,
                  certification and submission.
                </p>
                <Separator />
                <Row gap="xs" wrap>
                  {ONBOARDING_JUMPS.map((j) => (
                    <Button
                      key={j.label}
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      data-grade-goto={j.target}
                    >
                      {j.label}
                    </Button>
                  ))}
                </Row>
                <Row justify="end" className="flex flex-row justify-start items-center">
                  <Button
                    className="rounded-full"
                    data-grade-goto="US Onboarding — 0 Before you apply"
                    onPointerDown={() => FlowStore.reset()}
                  size="lg">
                    Start the flow
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Row>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Section>
  );
}
