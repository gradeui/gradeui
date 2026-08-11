"use client";

// Promoted from Studio screen "US Onboarding — 3b Owners & control"
// (design dmskgyvzc1nmh, version 1786468958015). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: a44d7d043206
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
  FieldContent,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Callout,
  CalloutTitle,
  CalloutDescription,
  Separator,
  Stack,
  Grid,
  Row,
  Badge,
} from "@gradeui/ui";
import { Upload, Plus, Info, Pencil } from "lucide-react";
import { OnboardingLayout } from "@/components/layouts/onboarding";
import { FlowStore, US_STATES } from "@/lib/flow-store";
import { Persona } from "@/lib/persona";

// Glint US onboarding — Step 3b: beneficial owners (25%+, repeating
// group of 0 to 4) and the Control Person, for multi-member LLCs,
// partnerships and corporations. CDD Rule shape: each listed owner
// holds 25%+ (looking through intermediate holding companies), the sum
// can't exceed 100, the zero-owner state is valid (FIN-2016-G003 Q18)
// with the Control Person still required, and a trust holding 25%+
// records the TRUSTEE (31 CFR 1010.230(d)(3)). Certification moved to
// Step 6 (CCO, 05 Aug).
//
// FLOW STATE (FlowStore): everything stores. Owner 1 shares the o1*
// keys with 3a's SMLLC owner (one PERSON record, spec §9.2). The
// zero-owner checkbox, trust-owner toggle and same-as-owner control
// person drive live conditionals.
const useFlowField = FlowStore.useField;

/* The human applying, from the demo persona. Every value below is a
   FALLBACK passed to useFlowField, so the store is read first and
   anything the user typed still wins. The persona already stores each
   value in the exact format its field expects, state codes lowercase to
   match the US_STATES option values, the date as MM/DD/YYYY, the SSN
   with its hyphens, so nothing here reformats: pass it straight
   through. Owner 1 IS this person (the o1* keys are shared with 3a, one
   PERSON record per spec 9.2). The SECOND beneficial owner on this
   screen and the separate control person have no persona record, so
   their fields stay blank rather than being invented. */
const A = Persona.DEFAULT.applicant;

/* `defaults` is that person's persona address, or nothing. Owner 1
   passes the applicant's address and prefills; the separate control
   person passes nothing and stays blank, because unticking "same person
   as Owner 1" means it is somebody the persona does not describe. */
function AddressFields({
  prefix,
  defaults,
}: {
  prefix: string;
  // Optional: the control-person call site passes none. Annotation only.
  defaults?: { street?: string; city?: string; state?: string; zip?: string };
}) {
  const d = defaults ?? {};
  const [street, setStreet] = useFlowField(`${prefix}Street`, d.street ?? "");
  const [city, setCity] = useFlowField(`${prefix}City`, d.city ?? "");
  const [state, setState] = useFlowField(`${prefix}State`, d.state ?? "");
  const [zip, setZip] = useFlowField(`${prefix}Zip`, d.zip ?? "");
  return (
    <Stack gap="md">
      <Field>
        <FieldLabel>Residential street address</FieldLabel>
        <Input
          placeholder="Home address (not a P.O. Box)"
          autoComplete="address-line1"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
        />
      </Field>
      <Grid cols="3" gap="md">
        <Field>
          <FieldLabel>City</FieldLabel>
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
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
            value={zip}
            onChange={(e) => setZip(e.target.value)}
          />
        </Field>
      </Grid>
    </Stack>
  );
}

export default function OwnersControlPage() {
  const [noMajorityOwner, setNoMajorityOwner] = useFlowField(
    "noMajorityOwner",
    false,
  );
  const [ownerIsTrust, setOwnerIsTrust] = useFlowField("ownerIsTrust", false);
  const [trustName, setTrustName] = useFlowField("trustName", "");
  const [controlSameAsOwner, setControlSameAsOwner] = useFlowField(
    "controlSameAsOwner",
    true,
  );
  /* Owner 1 is the persona applicant, Wade Jones, replacing the older
     Jordan Avery literals these fallbacks carried. An empty field is
     what let Chrome autofill the reviewer's own details instead. */
  const [first, setFirst] = useFlowField("o1First", A.first);
  const [middle, setMiddle] = useFlowField("o1Middle", A.middle);
  const [last, setLast] = useFlowField("o1Last", A.last);
  const [dob, setDob] = useFlowField("o1Dob", A.dob);
  /* No persona ownership figure exists, so the 40% this screen already
     carried stands: it is the multi-owner split that reads alongside the
     35% second owner below. */
  const [pct, setPct] = useFlowField("ownershipPct", 40);
  const [ssn, setSsn] = useFlowField("o1Ssn", A.ssn);
  /* The separate control person is deliberately blank: these fields only
     appear once "same person as Owner 1" is unticked, which asserts a
     different human, and the persona has no second person to name. */
  const [cpFirst, setCpFirst] = useFlowField("cpFirst", "");
  const [cpMiddle, setCpMiddle] = useFlowField("cpMiddle", "");
  const [cpLast, setCpLast] = useFlowField("cpLast", "");
  const [cpDob, setCpDob] = useFlowField("cpDob", "");
  const [cpSsn, setCpSsn] = useFlowField("cpSsn", "");
  /* The title DOES prefill: with "same person as Owner 1" ticked, the
     control person is the applicant, so this is his title. Step 7 already
     recaps cpTitle with the same persona fallback. */
  const [cpTitle, setCpTitle] = useFlowField("cpTitle", A.title);

  const ownerName = [first, last].filter(Boolean).join(" ") || "Owner 1";

  return (
    <>
      <h1 className="text-3xl font-medium text-foreground">
        Owners &amp; control person
      </h1>
      <p className="text-muted-foreground">
        Federal law requires us to identify every individual who owns 25% or
        more of the business, directly or through holding companies, and
        one person who controls it.
      </p>

      {/* Zero-owner state — valid for widely held entities; the control
          person below stays required. Checking it collapses the owner
          group entirely (the UI handles the zero-owner state). */}
      <Field orientation="horizontal">
        <Checkbox
          checked={noMajorityOwner}
          onCheckedChange={(v) => setNoMajorityOwner(v === true)}
        />
        <FieldContent>
          <FieldLabel className="font-normal leading-relaxed">
            No individual owns 25% or more of the business
          </FieldLabel>
          <FieldDescription className="text-xs">
            That&rsquo;s fine. You&rsquo;ll still name a control person below.
          </FieldDescription>
        </FieldContent>
      </Field>

      {noMajorityOwner ? (
        <Callout variant="info">
          <Info />
          <CalloutTitle>No owners to list</CalloutTitle>
          <CalloutDescription>
            Because no individual holds 25% or more, we only need the
            control person below. Untick the box if that changes.
          </CalloutDescription>
        </Callout>
      ) : (
        <>
          <Card>
            <CardHeader>
              <Row justify="between" align="center">
                <CardTitle>Owner 1</CardTitle>
                <Badge variant="secondary" rounded="full">You</Badge>
              </Row>
              <CardDescription>
                Owners must each hold 25% or more; combined ownership
                can&rsquo;t exceed 100%.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Stack gap="md">
                <Grid cols="3" gap="md">
                  <Field>
                    <FieldLabel>First name</FieldLabel>
                    <Input value={first} onChange={(e) => setFirst(e.target.value)} />
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
                    <Input value={last} onChange={(e) => setLast(e.target.value)} />
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
                  </Field>
                  <Field>
                    <FieldLabel>Ownership percentage</FieldLabel>
                    <Input
                      type="number"
                      min={25}
                      max={100}
                      value={pct}
                      onChange={(e) => setPct(Number(e.target.value))}
                    />
                  </Field>
                </Grid>

                <AddressFields prefix="o1" defaults={A.address} />

                <Field>
                  <FieldLabel>SSN or ITIN</FieldLabel>
                  <Input
                    placeholder="XXX-XX-XXXX"
                    inputMode="numeric"
                    value={ssn}
                    onChange={(e) => setSsn(e.target.value)}
                  />
                  <FieldDescription className="text-xs">
                    Non-US persons: unexpired passport number and country of
                    issuance instead.
                  </FieldDescription>
                </Field>

                {/* Trust-as-owner variant — relabels this entry for the
                    trustee and captures the trust's name. */}
                <Field orientation="horizontal">
                  <Checkbox
                    checked={ownerIsTrust}
                    onCheckedChange={(v) => setOwnerIsTrust(v === true)}
                  />
                  <FieldLabel className="font-normal leading-relaxed">
                    This interest is held by a trust
                  </FieldLabel>
                </Field>

                {ownerIsTrust && (
                  <Field>
                    <FieldLabel>Name of trust</FieldLabel>
                    <Input
                      placeholder="e.g. The Avery Family Trust"
                      value={trustName}
                      onChange={(e) => setTrustName(e.target.value)}
                    />
                    <FieldDescription className="text-xs">
                      When a trust owns 25% or more, we record the trustee
                      as the beneficial owner for that holding. Enter the
                      trustee&rsquo;s details above.
                    </FieldDescription>
                  </Field>
                )}

                <Row
                  justify="between"
                  align="center"
                  className="rounded-lg border border-dashed border-border p-4"
                  wrap
                  gap="md"
                >
                  <Stack gap="none">
                    <span className="text-sm font-medium text-foreground">
                      Photo ID for this owner
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Unexpired passport or government-issued ID
                    </span>
                  </Stack>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                </Row>
              </Stack>
            </CardContent>
          </Card>

          {/* A completed entry, collapsed — the other state of the group. */}
          <Card>
            <CardContent className="pt-6">
              <Row justify="between" align="center" wrap gap="md">
                <Stack gap="none">
                  <span className="text-sm font-medium text-foreground">Priya Nair</span>
                  <span className="text-sm text-muted-foreground">
                    35% · SSN provided · ID uploaded
                  </span>
                </Stack>
                <Row gap="sm" align="center">
                  <Badge variant="success-soft" rounded="full">Complete</Badge>
                  <Button variant="ghost" size="sm" iconOnly aria-label="Edit owner">
                    <Pencil />
                  </Button>
                </Row>
              </Row>
            </CardContent>
          </Card>

          <Row justify="between" align="center" wrap gap="md">
            <Button variant="outline" className="rounded-full">
              <Plus className="h-4 w-4" />
              Add another owner
            </Button>
            <span className="text-sm text-muted-foreground">
              Up to 4 owners · {Math.min(100, (Number(pct) || 0) + 35)}% listed so far
            </span>
          </Row>
        </>
      )}

      <Separator className="my-4" />

      <Stack gap="none">
        <h2 className="text-xl font-medium text-foreground">Control person</h2>
        <p className="text-muted-foreground text-base">
          Always required: one individual with significant responsibility to
          manage or direct the business, such as a CEO, President, Managing
          Member or General Partner.
        </p>
      </Stack>

      {/* One person, many roles (spec §9.2): "same as" reuses the PERSON
          record rather than duplicating it. Unticking reveals the full
          CIP field set. Hidden in the zero-owner state (no Owner 1 to
          reuse). */}
      {!noMajorityOwner && (
        <Field orientation="horizontal">
          <Checkbox
            checked={controlSameAsOwner}
            onCheckedChange={(v) => setControlSameAsOwner(v === true)}
          />
          <FieldLabel className="font-normal leading-relaxed">
            Same person as Owner 1 ({ownerName})
          </FieldLabel>
        </Field>
      )}

      {(noMajorityOwner || !controlSameAsOwner) && (
        <Stack gap="md">
          <Grid cols="3" gap="md">
            <Field>
              <FieldLabel>First name</FieldLabel>
              <Input value={cpFirst} onChange={(e) => setCpFirst(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Middle name(s)</FieldLabel>
              <Input
                placeholder="Optional"
                value={cpMiddle}
                onChange={(e) => setCpMiddle(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Last name</FieldLabel>
              <Input value={cpLast} onChange={(e) => setCpLast(e.target.value)} />
            </Field>
          </Grid>
          <Grid cols="2" gap="md">
            <Field>
              <FieldLabel>Date of birth</FieldLabel>
              <Input
                placeholder="MM/DD/YYYY"
                inputMode="numeric"
                value={cpDob}
                onChange={(e) => setCpDob(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>SSN or ITIN</FieldLabel>
              <Input
                placeholder="XXX-XX-XXXX"
                inputMode="numeric"
                value={cpSsn}
                onChange={(e) => setCpSsn(e.target.value)}
              />
            </Field>
          </Grid>
          <AddressFields prefix="cp" />
        </Stack>
      )}

      <Field>
        <FieldLabel>Title or position</FieldLabel>
        <Input
          placeholder="e.g. CEO, Managing Member"
          value={cpTitle}
          onChange={(e) => setCpTitle(e.target.value)}
        />
      </Field>

      <Callout variant="info">
        <Info />
        <CalloutTitle>One signature covers everything</CalloutTitle>
        <CalloutDescription>
          You&rsquo;ll certify the accuracy of this ownership information at
          the Certification step, so one sign-off covers your whole
          application.
        </CalloutDescription>
      </Callout>

      <OnboardingLayout.Actions>
        <Button
          className="rounded-full"
          size="lg"
          data-grade-goto="US Onboarding — 4 Expected activity"
        >
          Continue
        </Button>
      </OnboardingLayout.Actions>
    </>
  );
}
