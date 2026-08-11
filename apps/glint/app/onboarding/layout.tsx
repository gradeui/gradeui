"use client";

/**
 * Route layout for every /onboarding/* step: mounts the wizard chrome
 * ONCE so the header, progress bar and step rail persist across step
 * navigations (the Studio prototype remounted everything per hop).
 * The current step derives from the pathname via the screen registry;
 * pages carry only their form column, exactly the children contract
 * the Studio OnboardingLayout had.
 */

import { usePathname } from "next/navigation";
import {
  Building2,
  Files,
  LineChart,
  ListChecks,
  PenLine,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  OnboardingLayout,
  type WizardStep,
} from "@/components/layouts/onboarding";
import { screenBySlug } from "@/lib/screens";
import { DEFAULT_PERSONA } from "@/lib/persona";

/* The step rail, identical across all nine step screens in Studio. */
const STEPS: WizardStep[] = [
  { label: "Before you apply", icon: ShieldCheck },
  { label: "Business type", icon: ListChecks },
  { label: "Business details", icon: Building2 },
  { label: "Owners & control", icon: Users },
  { label: "Expected activity", icon: LineChart },
  { label: "Documents", icon: Files },
  { label: "Certify & sign", icon: PenLine },
  { label: "Review & submit", icon: Send },
];

export default function OnboardingChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const current = screenBySlug(pathname)?.step ?? 1;
  return (
    <OnboardingLayout steps={STEPS} current={current} account={DEFAULT_PERSONA.account}>
      {children}
    </OnboardingLayout>
  );
}
