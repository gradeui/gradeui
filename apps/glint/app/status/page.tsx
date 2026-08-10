"use client";

// Promoted from Studio screen "US Onboarding — Application status"
// (design dmskh1lole59j, version 1786357121180). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.

import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  Section,
  Container,
  Stack,
  Row,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  Callout,
  CalloutTitle,
  CalloutDescription,
  Card,
  CardContent,
} from "@gradeui/ui";
import {
  ChevronDown,
  CheckCircle2,
  Search,
  MailQuestion,
  Flag,
  Clock,
} from "lucide-react";
import { Wordmark } from "@/components/wordmark";

// Glint US onboarding — post-submit application status. Customer-facing
// view of the spec's status model (DRAFT → SUBMITTED → IN_REVIEW →
// INFO_REQUESTED loop → APPROVED / DECLINED); internal states
// (ESCALATED_2LOD) are deliberately not surfaced. Sits OUTSIDE the
// wizard, so it reuses the OnboardingLayout header pattern (Wordmark +
// account chip) without the step rail. "Go to dashboard" gotos the
// project's existing Dashboard screen.

function TimelineItem({
  icon: Icon,
  title,
  meta,
  state = "todo",
  last = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  meta: React.ReactNode;
  state?: "done" | "current" | "todo";
  last?: boolean;
}) {
  const dot =
    state === "done"
      ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
      : state === "current"
        ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-primary"
        : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground";
  return (
    <Row gap="md" align="start">
      <Stack gap="none" align="center" className="self-stretch">
        <div className={dot}>
          <Icon className="h-4 w-4" />
        </div>
        {!last && <div className="w-px flex-1 bg-border" />}
      </Stack>
      <Stack gap="none" className={last ? "" : "pb-8"}>
        <span
          className={
            state === "todo"
              ? "text-sm font-medium text-muted-foreground"
              : "text-sm font-medium text-foreground"
          }
        >
          {title}
        </span>
        <span className="text-sm text-muted-foreground">{meta}</span>
      </Stack>
    </Row>
  );
}

export default function ApplicationStatusPage() {
  return (
    <AppShell nav="top" className="min-h-screen bg-background">
      <AppShellHeader className="sticky top-0 z-30 border-b border-border/60 bg-background">
        <Section as="header" pad="none">
          <Container maxW="full" className="py-4">
            <Row justify="between" align="center">
              <Wordmark cut="metal" className="h-5" />
              <Row gap="sm" align="center" className="rounded-full bg-muted/60 py-1 pl-1 pr-2">
                <Avatar size="sm">
                  <AvatarFallback tone="primary">JA</AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-foreground/50" />
              </Row>
            </Row>
          </Container>
        </Section>
      </AppShellHeader>

      <AppShellMain>
        <Section pad="lg">
          <Container maxW="md">
            <Stack gap="lg">
              <Stack gap="sm" align="center" className="text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h1 className="text-3xl font-medium text-foreground">
                  Application submitted
                </h1>
                <p className="text-muted-foreground">
                  We received your application for{" "}
                  <span className="text-foreground">Aurora Bullion LLC</span> on
                  August 8, 2026 at 9:32 AM ET.
                </p>
                <Badge variant="secondary" rounded="full">
                  Reference GLT-2026-08341
                </Badge>
              </Stack>

              <Card>
                <CardContent>
                  <Stack gap="none" className="pt-6">
                    <TimelineItem
                      icon={CheckCircle2}
                      title="Submitted"
                      meta="Aug 8, 9:32 AM. Your application is locked and in the queue"
                      state="done"
                    />
                    <TimelineItem
                      icon={Search}
                      title="In review"
                      meta="Our team verifies the business and the people you've listed"
                      state="current"
                    />
                    <TimelineItem
                      icon={MailQuestion}
                      title="We may ask for more information"
                      meta="If anything's missing, we'll email you and pause the clock"
                    />
                    <TimelineItem
                      icon={Flag}
                      title="Decision"
                      meta="Approved applications open instantly; either way, we'll tell you"
                      last
                    />
                  </Stack>
                </CardContent>
              </Card>

              <Callout variant="info">
                <Clock />
                <CalloutTitle>Usually 2 business days</CalloutTitle>
                <CalloutDescription>
                  Most applications are reviewed within 2 business days. If we
                  ask for more information, review resumes as soon as you
                  reply. Nothing is lost.
                </CalloutDescription>
              </Callout>

              <Row justify="center" gap="sm">
                <Button
                  variant="outline"
                  className="rounded-full"
                  data-grade-goto="US Onboarding — 7 Review & submit"
                size="lg">
                  View my application
                </Button>
                <Button
                  className="rounded-full"
                  data-grade-goto="Dashboard — logged-in home"
                size="lg">
                  Go to dashboard
                </Button>
              </Row>
            </Stack>
          </Container>
        </Section>
      </AppShellMain>
    </AppShell>
  );
}
