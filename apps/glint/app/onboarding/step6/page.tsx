"use client";

// Promoted from Studio screen "US Onboarding — 6 Certification"
// (design dmskh0ixi1gdj, version 1786468880697). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 9546c5104b52
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

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
import { Persona } from "@/lib/persona";

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

/* The human applying, the same alias step 7 uses. A PREFILL IS A
   FALLBACK: every persona value below sits in the fallback position of a
   FlowStore read, so the store is consulted FIRST and a value the
   applicant typed on an earlier step always wins. The persona already
   stores each value in the exact format its field expects (a title is
   the free text this input holds, a name is the parts this screen
   joins), so nothing here reformats anything. It also stops the browser
   filling an empty field with whoever is sitting at the keyboard, which
   was the actual bug: the demo signer was being replaced by the
   reviewer. */
const A = Persona.DEFAULT.applicant;

export default function CertificationPage() {
  /* The signer's name, from the owner details step 3 wrote, falling back
     to the persona applicant so an unvisited walkthrough still certifies
     as Wade Jones. */
  const seededName = [
    FlowStore.get("o1First", A.first),
    FlowStore.get("o1Last", A.last),
  ]
    .filter(Boolean)
    .join(" ");

  /* WHAT IS DELIBERATELY NOT PREFILLED, and why it is a decision rather
     than a gap: boCertified, accuracyConfirmed and signature stay empty.
     Those three are the applicant's OWN ACT. Pre-ticking a certification
     or typing a name into the signature field would put consent on the
     record that nobody gave, and this screen exists precisely to be the
     auditable moment that consent happened. Name and title prefill
     because they are facts ABOUT the signer; the assent is not a fact,
     it is an act, and only the applicant can perform it. */
  const [boCertified, setBoCertified] = useFlowField("boCertified", false);
  const [certName, setCertName] = useFlowField("certName", seededName);
  const [certRole, setCertRole] = useFlowField(
    "certRole",
    FlowStore.get("cpTitle", A.title),
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
            {/* The seeded name is the PLACEHOLDER here and never the
                value: it tells the applicant what to type without typing
                it for them. autoComplete is off because this is the one
                field the browser must not fill, for the same reason we
                do not prefill it ourselves. */}
            <Input
              autoComplete="off"
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
