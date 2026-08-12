"use client";

// Promoted from Studio screen "US Onboarding — 7 Certification"
// (design dmskh0ixi1gdj, version 1786541633461). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: d53d2f570700
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
import { Info } from "lucide-react";
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

export default function CertifyPage() {
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

      {/* WHO IS SIGNING FIRST, THEN WHAT THEY ARE ATTESTING TO (Ali, 12
          Aug: "let's move the name and role to the top, and put both
          checkboxes together under application accuracy"). The two
          attestations used to be separated by the name/role pair, which
          put a data-entry job in the middle of a consent decision and read
          as two unrelated screens stitched together. Identify yourself,
          then tick what you are certifying, then sign: that is also the
          order the record is written in.

          THE MERGE IS PRESENTATIONAL ONLY. boCertified and
          accuracyConfirmed are still two separate stored answers, because
          they are two different legal statements (FinCEN beneficial
          ownership vs. the accuracy-and-notify undertaking) and step 8
          reports them separately. Nothing about the record changed; only
          where the boxes sit. */}
      <FieldSet>
        <FieldLegend>Signatory</FieldLegend>
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
      </FieldSet>

      <Separator className="my-4" />

      <FieldSet>
        <FieldLegend>Application accuracy</FieldLegend>
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
        </Stack>
      </FieldSet>

      <Separator className="my-4" />

      <FieldSet>
        <FieldLegend>Signature</FieldLegend>
        <Stack gap="md">
          <Field>
            <FieldLabel>Type your full legal name to sign</FieldLabel>
            {/* NO NAME IN THE PLACEHOLDER (Ali, 12 Aug: "I'd also suggest
                that we don't prefill Wade Jones - or if we do, we need a
                more handwrity font"). It was a placeholder rather than a
                value, but a greyed name sitting in a signature box reads
                as already-signed either way. Ali then went further ("you
                can remove the placeholder from the signature input
                entirely"), so the box is EMPTY: the label above already
                says "type your full legal name to sign", and a hint
                repeating it inside a field that must look untouched is
                just more grey text in a signature box. seededName still
                drives the printed name field above, which is a fact about
                the signer rather than his assent.

                THE TYPED VALUE IS HANDWRITING, via the `font-signature`
                role now in @gradeui/ui rather than a font-family pinned
                to this screen (Ali, 12 Aug: "we might have to add a
                cursive font to Grade ... or specifically a Signature
                font. This makes it as real as possible"). The role binds
                to Caveat, self-hosted by next/font in both this app and
                the docs app, which is what makes it resolve inside Fast
                Frame and the MCP panel: those are the docs app, and
                neither can reach the network.

                md:text-4xl AS WELL AS text-4xl, which is not belt and
                braces: Input carries `md:text-sm` as its own default, and
                a media-query rule beats an unprefixed one at the same
                specificity however the classes merge, so a plain
                `text-4xl` was silently rendering at 14px above 768px.
                That is why the first attempt came back as "its tiny". */}
            {/* AUTOFILL IS THE ENEMY HERE (Ali, 12 Aug: "hold on - dont
                prefill in with my name!!! The Signature!!!"). Nothing in
                this code prefills it: Chrome saw an empty box under a
                label reading "type your full legal name" and filled it
                with whoever is signed in on the machine, which on a demo
                laptop is the person giving the demo. autoComplete="off"
                alone does not stop that, so the field also carries a name
                Chrome's heuristics cannot map to a person, and the ignore
                attributes the three common password managers look for.
                A signature box that fills itself is worse than useless:
                it puts a name on a legal record that nobody typed. */}
            <Input
              autoComplete="off"
              name="glint-signature-mark"
              data-1p-ignore
              data-lpignore="true"
              data-bwignore
              data-form-type="other"
              spellCheck={false}
              autoCapitalize="words"
              className="h-16 font-signature text-4xl md:text-4xl"
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

      {/* info, NOT success (Ali, 12 Aug: "let's not have this massive
          callout in green - knock back to our standard info color").
          Every other "Why we ask" in the wizard is info; success was
          reading as "you have signed" on a screen where nothing has been
          signed yet, which is the opposite of what it meant. */}
      <Callout variant="info">
        <Info />
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
          data-grade-goto="US Onboarding — 8 Review & submit"
        >
          Continue to review
        </Button>
      </OnboardingLayout.Actions>
    </>
  );
}
