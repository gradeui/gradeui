"use client";

// Promoted from Studio screen "US Onboarding — 1 Business type"
// (design dmskgweh31a0m, version 1786356816160). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.

import {
  Button,
  RadioGroup,
  RadioCard,
  Callout,
  CalloutTitle,
  CalloutDescription,
} from "@gradeui/ui";
import { Info } from "lucide-react";
// useFlowField imports by NAME: shared components' named exports are
// first-class across all three renderer kernels (8 Aug).
import { OnboardingLayout } from "@/components/onboarding-layout";
import { useFlowField } from "@/lib/flow-store";

// Glint US onboarding — Step 1: business type selector. This choice
// drives all conditional logic downstream (3a vs 3b). The selection is
// STORED via FlowStore (useFlowField), so it survives navigating away
// and back, and Business details' Continue branches on it. Sole
// proprietors are diverted to the Retail application per the spec.
// Trusts and retirement plans (Step 3c) are out of scope for this
// build, so no trust option is offered here.

export default function BusinessTypePage() {
  const [businessType, setBusinessType] = useFlowField(
    "businessType",
    "smllc",
  );
  return (
    <>
      <h1 className="text-3xl font-medium text-foreground">
        What kind of business is this?
      </h1>
      <p className="text-muted-foreground">
        Your business type decides exactly what we need to ask next, so
        you won&rsquo;t see questions that don&rsquo;t apply to you.
      </p>

      <RadioGroup
        value={businessType}
        onValueChange={setBusinessType}
        className="grid gap-3"
      >
        <RadioCard
          value="smllc"
          label="Single-member LLC"
          description="One owner holds 100% of the company. We'll verify just you."
        />
        <RadioCard
          value="mmllc"
          label="Multi-member LLC"
          description="Two or more members. We'll ask about owners holding 25% or more."
        />
        <RadioCard
          value="partnership"
          label="Partnership"
          description="General or limited partnership, including LLPs."
        />
        <RadioCard
          value="corporation"
          label="Corporation"
          description="C-corp or S-corp, incorporated in any U.S. state."
        />
      </RadioGroup>

      {/* Sole proprietorship divert — not a "legal entity customer" under
          the CDD Rule; handled under individual CIP in Retail. */}
      <Callout variant="info">
        <Info />
        <CalloutTitle>Sole proprietor?</CalloutTitle>
        <CalloutDescription>
          Sole proprietorships open a personal Glint account instead.
          You&rsquo;ll be done faster there.{" "}
          <a href="#" className="underline underline-offset-2 hover:text-foreground">
            Go to the Retail application
          </a>
        </CalloutDescription>
      </Callout>

      <OnboardingLayout.Actions>
        <Button
          className="rounded-full"
          size="lg"
          data-grade-goto="US Onboarding — 2 Business details"
        >
          Continue
        </Button>
      </OnboardingLayout.Actions>
    </>
  );
}
