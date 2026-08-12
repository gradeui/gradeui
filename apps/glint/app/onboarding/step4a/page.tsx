"use client";

// Promoted from Studio screen "US Onboarding — 4a Owner identity"
// (design dmskgxyctfxci, version 1786539106753). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 2949978560ae
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

import {
  Button,
  Input,
  Field,
  FieldLabel,
  FieldDescription,
  FieldSet,
  FieldLegend,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Separator,
  Stack,
  Grid,
  Row,
} from "@gradeui/ui";
import { Upload, Camera, FileText } from "lucide-react";
import { OnboardingLayout } from "@/components/layouts/onboarding";
import { FlowStore, US_STATES } from "@/lib/flow-store";
import { Persona } from "@/lib/persona";

// Glint US onboarding — Step 3a: single-member LLC owner identity.
// Shown when Business Type = SMLLC: the single owner holds 100% of the
// interest, so there is no repeating beneficial-owner group. One full
// CIP data set, captured once, including the per-individual identity
// verification items (photo ID + liveness + personal phone). Edge
// cases the spec routes to Compliance manually (APO/FPO addresses,
// non-US persons without a TIN) surface as helper copy.
//
// FLOW STATE (FlowStore): the o1* keys are SHARED with 3b's Owner 1,
// mirroring the spec's one-PERSON-many-roles model: swap business type
// later and the person you typed here is already Owner 1 there.
const useFlowField = FlowStore.useField;

/* Shorthand for the human applying. Every persona value below is a
   FALLBACK on the field hook, never a forced value: FlowStore is read
   first, so anything the user has typed wins and the persona only fills
   a key nobody has touched. The values are already stored in the exact
   format each field expects, the state code lowercase to match
   US_STATES, the date of birth as MM/DD/YYYY, the two selects as their
   option values, so nothing here reformats. Same idiom as step 7's
   C / A shorthands. */
const A = Persona.DEFAULT.applicant;

export default function OwnerIdentityPage() {
  const [first, setFirst] = useFlowField("o1First", A.first);
  /* A.middle is an empty string: this persona has no middle name on
     record, and the field is optional, so it prefills to blank. */
  const [middle, setMiddle] = useFlowField("o1Middle", A.middle);
  const [last, setLast] = useFlowField("o1Last", A.last);
  const [dob, setDob] = useFlowField("o1Dob", A.dob);
  const [citizenship, setCitizenship] = useFlowField("o1Citizenship", A.citizenship);
  const [street, setStreet] = useFlowField("o1Street", A.address.street);
  const [city, setCity] = useFlowField("o1City", A.address.city);
  const [state, setState] = useFlowField("o1State", A.address.state);
  const [zip, setZip] = useFlowField("o1Zip", A.address.zip);
  const [ssn, setSsn] = useFlowField("o1Ssn", A.ssn);
  /* "Personal phone" is the applicant's own mobile, so A.mobile, not
     the company's cell. */
  const [phone, setPhone] = useFlowField("o1Phone", A.mobile);
  const [taxResidence, setTaxResidence] = useFlowField("o1TaxResidence", A.taxResidence);

  return (
    <>
      <h1 className="text-3xl font-medium text-foreground">Your identity</h1>
      <p className="text-muted-foreground">
        As the single owner you hold 100% of the company, so you&rsquo;re the
        only person we need to verify.
      </p>

      <Grid cols="3" gap="md">
        <Field>
          <FieldLabel>First name</FieldLabel>
          <Input
            autoComplete="given-name"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Middle name(s)</FieldLabel>
          <Input
            placeholder="Optional"
            value={middle}
            onChange={(e) => setMiddle(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Last name</FieldLabel>
          <Input
            autoComplete="family-name"
            value={last}
            onChange={(e) => setLast(e.target.value)}
          />
        </Field>
      </Grid>

      <Grid cols="2" gap="md">
        <Field>
          <FieldLabel>Date of birth</FieldLabel>
          <Input
            placeholder="MM/DD/YYYY"
            inputMode="numeric"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
          <FieldDescription className="text-xs">You must be 18 or over to apply.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Citizenship / nationality</FieldLabel>
          <Select value={citizenship} onValueChange={setCitizenship}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="us">United States</SelectItem>
              <SelectItem value="other">Other country</SelectItem>
            </SelectContent>
          </Select>
          <FieldDescription className="text-xs">As shown on your ID document.</FieldDescription>
        </Field>
      </Grid>

      <Separator className="my-4" />

      <FieldSet>
        <FieldLegend>Residential address</FieldLegend>
        <Stack gap="md">
          <Field>
            <FieldLabel>Street address</FieldLabel>
            <Input
              placeholder="Street and number"
              autoComplete="address-line1"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
            <FieldDescription className="text-xs">
              Your home address, not a business address or P.O. Box. No
              street address (APO/FPO)? Our compliance team will help:{" "}
              <a href="#" className="underline underline-offset-2 hover:text-foreground">
                contact us
              </a>.
            </FieldDescription>
          </Field>
          <Grid cols="3" gap="md">
            <Field>
              <FieldLabel>City</FieldLabel>
              <Input
                autoComplete="address-level2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>State</FieldLabel>
              <Select value={state || undefined} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>{US_STATES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>ZIP</FieldLabel>
              <Input
                inputMode="numeric"
                maxLength={10}
                autoComplete="postal-code"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
              />
            </Field>
          </Grid>
        </Stack>
      </FieldSet>

      <Separator className="my-4" />

      <Field>
        <FieldLabel>Taxpayer Identification Number</FieldLabel>
        <Input
          placeholder="XXX-XX-XXXX"
          inputMode="numeric"
          value={ssn}
          onChange={(e) => setSsn(e.target.value)}
        />
        <FieldDescription className="text-xs">
          Your SSN, or another IRS-issued TIN (ITIN, EIN, ATIN, PTIN).
          Non-US persons can use a passport number and country of issuance
          instead. Our compliance team will follow up.
        </FieldDescription>
      </Field>

      <Grid cols="2" gap="md">
        <Field>
          <FieldLabel>Personal phone</FieldLabel>
          <Input
            placeholder="(555) 000-0000"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <FieldDescription className="text-xs">
            We&rsquo;ll use this to verify you directly.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Personal tax residence</FieldLabel>
          <Select value={taxResidence} onValueChange={setTaxResidence}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="us">United States</SelectItem>
              <SelectItem value="other">Other country</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </Grid>

      <Separator className="my-4" />

      {/* Identity verification — per-individual items from the spec's
          Identity Verification table: unexpired photo ID + live selfie. */}
      <FieldSet>
        <FieldLegend>Verify your identity</FieldLegend>
        <Stack gap="md">
          {/* Reassurance copy rides the header; no duration promise
              (Ali, 10 Aug): we cannot say how long checks take. */}
          <FieldDescription className="text-xs">
            Both checks protect you against identity fraud.
          </FieldDescription>
          <Row
            justify="between"
            align="center"
            className="rounded-lg border border-dashed border-border p-4"
            wrap
            gap="md"
          >
            <Row gap="md" align="center" className="min-w-0 flex-1">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <Stack gap="none" className="min-w-0">
                <span className="text-sm font-medium text-foreground">
                  Government-issued photo ID
                </span>
                <span className="text-sm text-muted-foreground">
                  Unexpired driver&rsquo;s license, state ID card or U.S. passport
                </span>
              </Stack>
            </Row>
            <Button variant="outline" size="sm" className="shrink-0 rounded-full">
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </Row>

          <Row
            justify="between"
            align="center"
            className="rounded-lg border border-dashed border-border p-4"
            wrap
            gap="md"
          >
            <Row gap="md" align="center" className="min-w-0 flex-1">
              <Camera className="h-5 w-5 shrink-0 text-muted-foreground" />
              <Stack gap="none" className="min-w-0">
                <span className="text-sm font-medium text-foreground">
                  Live selfie check
                </span>
                <span className="text-sm text-muted-foreground">
                  A quick real-time photo, matched against your ID
                </span>
              </Stack>
            </Row>
            <Button variant="outline" size="sm" className="shrink-0 rounded-full">
              <Camera className="h-4 w-4" />
              Start check
            </Button>
          </Row>

        </Stack>
      </FieldSet>

      {/* Cross-link for the 3b path — the live product routes on the
          Step 1 selection; this static walkthrough offers both. */}
      <p className="text-sm text-muted-foreground">
        More than one owner?{" "}
        <Button
          variant="link"
          className="h-auto p-0"
          data-grade-goto="US Onboarding — 4b Owners & control"
        size="sm">
          Add beneficial owners instead
        </Button>
      </p>

      <OnboardingLayout.Actions>
        <Button
          className="rounded-full"
          size="lg"
          data-grade-goto="US Onboarding — 5 Expected activity"
        >
          Continue
        </Button>
      </OnboardingLayout.Actions>
    </>
  );
}
