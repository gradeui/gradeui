"use client";

// Promoted from Studio screen "US Onboarding — 6 Certification"
// (design dmskh0ixi1gdj, version 1786358341154). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.

import {
  Button,
  Input,
  Checkbox,
  Field,
  FieldLabel,
  FieldDescription,
  FieldSet,
  FieldLegend,
  Callout,
  CalloutTitle,
  CalloutDescription,
  Separator,
  Stack,
  Grid,
} from "@gradeui/ui";
import { BadgeCheck } from "lucide-react";
import { OnboardingLayout } from "@/components/layouts/onboarding";
import { FlowStore } from "@/lib/flow-store";

// Glint US onboarding — Step 6: certification and attestations. Moved
// here from Step 3b (CCO, 05 Aug) so ONE certification covers every
// path and is a distinct, auditable event at the end of data entry.
//  - BO certification: the digital equivalent of FinCEN's Appendix A
//    form (FIN-2016-G003 Q19). Certifier = the individual opening the
//    account; we capture their name and role.
//  - Accuracy attestation: all paths; includes the undertaking to
//    notify Glint of changes (feeds event-driven review triggers).
//  - Signature: typed-name capture. Checkbox + typed name vs full
//    e-sign is pending Sutton Bank legal sign-off; either way we store
//    signer name, timestamp, application snapshot hash and document
//    versions.
//
// FLOW STATE (FlowStore): checkboxes and text store; the certifier
// name and role seed from the owner details entered earlier (one
// PERSON record, many roles).
const useFlowField = FlowStore.useField;

export default function CertificationPage() {
  const seededName =
    [FlowStore.get("o1First", ""), FlowStore.get("o1Last", "")]
      .filter(Boolean)
      .join(" ") || "";
  const [boCertified, setBoCertified] = useFlowField("boCertified", false);
  const [certName, setCertName] = useFlowField("certName", seededName);
  const [certRole, setCertRole] = useFlowField(
    "certRole",
    FlowStore.get("cpTitle", ""),
  );
  const [accuracy, setAccuracy] = useFlowField("accuracyConfirmed", false);
  const [signature, setSignature] = useFlowField("signature", "");

  return (
    <>
      <h1 className="text-3xl font-medium text-foreground">
        Certify &amp; sign
      </h1>
      <p className="text-muted-foreground">
        One signature covers your whole application. This is the legal
        record that what you&rsquo;ve told us is true.
      </p>

      <FieldSet>
        <FieldLegend>Beneficial ownership certification</FieldLegend>
        <Stack gap="md">
          <Field orientation="horizontal">
            <Checkbox
              checked={boCertified}
              onCheckedChange={(v) => setBoCertified(v === true)}
            />
            <FieldLabel className="font-normal leading-relaxed">
              I certify, to the best of my knowledge, that the information
              provided about the business&rsquo;s beneficial owners and
              control person is complete and correct
            </FieldLabel>
          </Field>
          <Grid cols="2" gap="md">
            <Field>
              <FieldLabel>Your full legal name</FieldLabel>
              <Input
                autoComplete="name"
                placeholder="Full legal name"
                value={certName}
                onChange={(e) => setCertName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Your role</FieldLabel>
              <Input
                placeholder="e.g. CEO"
                value={certRole}
                onChange={(e) => setCertRole(e.target.value)}
              />
            </Field>
          </Grid>
        </Stack>
      </FieldSet>

      <Separator className="my-4" />

      <FieldSet>
        <FieldLegend>Application accuracy</FieldLegend>
        <Field orientation="horizontal">
          <Checkbox
            checked={accuracy}
            onCheckedChange={(v) => setAccuracy(v === true)}
          />
          <FieldLabel className="font-normal leading-relaxed">
            I confirm the information in this application is complete and
            accurate, and I&rsquo;ll tell Glint if any of it changes,
            including changes of ownership or control
          </FieldLabel>
        </Field>
      </FieldSet>

      <Separator className="my-4" />

      <FieldSet>
        <FieldLegend>Signature</FieldLegend>
        <Stack gap="md">
          <Field>
            <FieldLabel>Type your full legal name to sign</FieldLabel>
            <Input
              placeholder={seededName || "Your full legal name"}
              className="h-14 text-lg italic"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
            />
            <FieldDescription className="text-xs">
              Typing your name acts as your electronic signature. We record
              your name, a timestamp and a snapshot of your application.
            </FieldDescription>
          </Field>
        </Stack>
      </FieldSet>

      <Callout variant="success">
        <BadgeCheck />
        <CalloutTitle>Why we ask</CalloutTitle>
        <CalloutDescription>
          Federal rules require an explicit certification of beneficial
          ownership. Signing here is the digital equivalent of the paper
          certification form. Nothing to print.
        </CalloutDescription>
      </Callout>

      <OnboardingLayout.Actions>
        <Button
          className="rounded-full"
          size="lg"
          data-grade-goto="US Onboarding — 7 Review & submit"
        >
          Continue to review
        </Button>
      </OnboardingLayout.Actions>
    </>
  );
}
