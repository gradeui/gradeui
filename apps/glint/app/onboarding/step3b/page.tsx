"use client";

// Promoted from Studio screen "US Onboarding — 3b Owners & control"
// (design dmskgyvzc1nmh, version 1786359134361). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.

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

function AddressFields({ prefix }: { prefix: string }) {
  const [street, setStreet] = useFlowField(`${prefix}Street`, "");
  const [city, setCity] = useFlowField(`${prefix}City`, "");
  const [state, setState] = useFlowField(`${prefix}State`, "");
  const [zip, setZip] = useFlowField(`${prefix}Zip`, "");
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
  const [first, setFirst] = useFlowField("o1First", "Jordan");
  const [middle, setMiddle] = useFlowField("o1Middle", "");
  const [last, setLast] = useFlowField("o1Last", "Avery");
  const [dob, setDob] = useFlowField("o1Dob", "");
  const [pct, setPct] = useFlowField("ownershipPct", 40);
  const [ssn, setSsn] = useFlowField("o1Ssn", "");
  const [cpFirst, setCpFirst] = useFlowField("cpFirst", "");
  const [cpMiddle, setCpMiddle] = useFlowField("cpMiddle", "");
  const [cpLast, setCpLast] = useFlowField("cpLast", "");
  const [cpDob, setCpDob] = useFlowField("cpDob", "");
  const [cpSsn, setCpSsn] = useFlowField("cpSsn", "");
  const [cpTitle, setCpTitle] = useFlowField("cpTitle", "CEO");

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

                <AddressFields prefix="o1" />

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
            <CardContent>
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
        <p className="text-sm text-muted-foreground">
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
