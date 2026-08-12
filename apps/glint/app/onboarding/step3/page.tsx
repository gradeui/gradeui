"use client";

// Promoted from Studio screen "US Onboarding — 3 Business details"
// (design dmskgx7qs2sud, version 1786539106022). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 7f478dde453a
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Separator,
  Stack,
  Grid,
  DatePicker,
} from "@gradeui/ui";
import { Send, ChevronDown } from "lucide-react";
import { OnboardingLayout } from "@/components/layouts/onboarding";
import { FlowStore, US_STATES } from "@/lib/flow-store";
import { Persona } from "@/lib/persona";

// Glint US onboarding, Step 2: common application fields (all entity
// types). Contact details live in Step 0. US rules carried into copy:
// no P.O. Box or registered-agent (CMRA) addresses (FIN-2009-R003),
// TIN formats, single-field phone. NAICS deliberately NOT used (CCO 04
// Aug).
//
// FLOW STATE (FlowStore): every field stores; the DBA checkbox gates
// the DBA name field; Continue BRANCHES on the Step 1 business type:
// SMLLC goes to 3a (single-owner CIP), everything else to 3b.
const useFlowField = FlowStore.useField;

/* The applying company, aliased once, exactly as step 7 does it. Every
   persona value below is passed as the field hook's FALLBACK, never as a
   forced value: FlowStore is read first, so a value the user typed still
   wins and the prefill only ever fills a field nobody has touched. The
   persona already stores each value in the format its field expects, so
   NOTHING here reformats: lowercase state codes for the two state
   Selects, MM/DD/YYYY for the DatePicker, and option VALUES rather than
   labels for industry, employees and revenue. Reformatting any of them
   is how a prefill fails silently.
   NOT PREFILLED, because the persona holds no equivalent: the alternate
   mailing address and the registered-agent address. Both stay off. */
const C = Persona.DEFAULT.company;

export default function BusinessDetailsPage() {
  const [businessType] = useFlowField("businessType", C.entityType);
  const [legalName, setLegalName] = useFlowField("legalName", C.legalName);
  const [hasDba, setHasDba] = useFlowField("hasDba", C.usesDba);
  const [dbaName, setDbaName] = useFlowField("dbaName", C.dba);
  const [formationState, setFormationState] = useFlowField(
    "formationState",
    C.formationState,
  );
  const [formationDate, setFormationDate] = useFlowField(
    "formationDate",
    C.formationDate,
  );
  const [bizStreet, setBizStreet] = useFlowField("bizStreet", C.address.street);
  const [bizCity, setBizCity] = useFlowField("bizCity", C.address.city);
  const [bizState, setBizState] = useFlowField("bizState", C.address.state);
  const [bizZip, setBizZip] = useFlowField("bizZip", C.address.zip);
  const [mailElsewhere, setMailElsewhere] = useFlowField("mailElsewhere", false);
  const [mailingAddress, setMailingAddress] = useFlowField("mailingAddress", "");
  const [hasAgent, setHasAgent] = useFlowField("hasRegisteredAgent", false);
  const [agentAddress, setAgentAddress] = useFlowField("agentAddress", "");
  const [bizTin, setBizTin] = useFlowField("bizTin", C.ein);
  const [industry, setIndustry] = useFlowField("industry", C.industry);
  const [bizPhone, setBizPhone] = useFlowField("bizPhone", C.phone);
  const [bizCell, setBizCell] = useFlowField("bizCell", C.cell);
  const [bizEmail, setBizEmail] = useFlowField("bizEmail", C.email);
  const [bizSite, setBizSite] = useFlowField("bizSite", C.website);
  const [employees, setEmployees] = useFlowField("employees", C.employees);
  const [revenue, setRevenue] = useFlowField("revenue", C.revenue);

  const nextScreen =
    businessType === "smllc"
      ? "US Onboarding — 4a Owner identity"
      : "US Onboarding — 4b Owners & control";

  /* Initials come from the persona too, so the chrome names the same
     applicant the fields do. The hardcoded "JA" was the older identity. */
  return (
    <>
      <h1 className="text-3xl font-medium text-foreground">
        Tell us about the business
      </h1>

      <Field>
        <FieldLabel>Legal business name</FieldLabel>
        <Input
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
        />
        <FieldDescription className="text-xs">
          As registered with your Secretary of State.
        </FieldDescription>
      </Field>

      <Field orientation="horizontal">
        <Checkbox
          checked={hasDba}
          onCheckedChange={(v) => setHasDba(v === true)}
        />
        <FieldLabel className="font-normal leading-relaxed">
          The business uses a trade name (Doing Business As)
        </FieldLabel>
      </Field>

      {/* Conditional on the DBA checkbox. Proof of the legal name is
          required when trading under a DBA; the certificate itself is
          collected at the Documents step. CCO task (open): hook a
          registry lookup, e.g. OpenCorporates. */}
      {hasDba && (
        <Field>
          <FieldLabel>DBA / trade name</FieldLabel>
          <Input
            value={dbaName}
            onChange={(e) => setDbaName(e.target.value)}
          />
          <FieldDescription className="text-xs">
            The public name you trade under, as filed with a government
            authority. You&rsquo;ll upload your DBA certificate later.
          </FieldDescription>
        </Field>
      )}

      <Grid cols="2" gap="md">
        <Field>
          <FieldLabel>State of formation</FieldLabel>
          {/* Full 50-states + DC list attaches at build; sampled here. */}
          <Select value={formationState || undefined} onValueChange={setFormationState}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>{US_STATES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Date of formation</FieldLabel>
          {/* Stored as MM/DD/YYYY (spec's US format); parsed to a local
              Date for the calendar so no timezone day-shift. */}
          <DatePicker
            value={
              formationDate
                ? (() => {
                    const [m, d, y] = formationDate.split("/").map(Number);
                    return new Date(y, m - 1, d);
                  })()
                : undefined
            }
            onChange={(d) =>
              setFormationDate(
                d
                  ? `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`
                  : "",
              )
            }
            placeholder="Select a date"
            format="MM/dd/yyyy"
            captionLayout="dropdown"
          />
        </Field>
      </Grid>

      <Separator className="my-4" />

      <FieldSet>
        <FieldLegend>Principal business address</FieldLegend>
        <Stack gap="md">
          <Field>
            <FieldLabel>Street address</FieldLabel>
            <Input
              placeholder="Street and number"
              autoComplete="address-line1"
              value={bizStreet}
              onChange={(e) => setBizStreet(e.target.value)}
            />
            <FieldDescription className="text-xs">
              A physical street address. P.O. Boxes and registered-agent
              (mail-forwarding) addresses can&rsquo;t be accepted.
            </FieldDescription>
          </Field>
          <Grid cols="3" gap="md">
            <Field>
              <FieldLabel>City</FieldLabel>
              <Input
                autoComplete="address-level2"
                value={bizCity}
                onChange={(e) => setBizCity(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>State</FieldLabel>
              <Select value={bizState || undefined} onValueChange={setBizState}>
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
                value={bizZip}
                onChange={(e) => setBizZip(e.target.value)}
              />
            </Field>
          </Grid>

          {/* Optional per spec: residential mailing address is allowed when
              explicitly separated from the principal place of business. */}
          <Field orientation="horizontal">
            <Checkbox
              checked={mailElsewhere}
              onCheckedChange={(v) => setMailElsewhere(v === true)}
            />
            <FieldLabel className="font-normal leading-relaxed">
              Send mail to a different address (for example, a home address)
            </FieldLabel>
          </Field>

          {mailElsewhere && (
            <Field>
              <FieldLabel>Mailing address</FieldLabel>
              <Input
                placeholder="Street, city, state, ZIP"
                value={mailingAddress}
                onChange={(e) => setMailingAddress(e.target.value)}
              />
            </Field>
          )}

          <Field orientation="horizontal">
            <Checkbox
              checked={hasAgent}
              onCheckedChange={(v) => setHasAgent(v === true)}
            />
            <FieldLabel className="font-normal leading-relaxed">
              The business has a registered agent at a different address
            </FieldLabel>
          </Field>

          {hasAgent && (
            <Field>
              <FieldLabel>Registered agent address</FieldLabel>
              <Input
                placeholder="Street, city, state, ZIP"
                value={agentAddress}
                onChange={(e) => setAgentAddress(e.target.value)}
              />
            </Field>
          )}
        </Stack>
      </FieldSet>

      <Separator className="my-4" />

      {/* Paired side by side (Ali, 11 Aug): two short fields that read as
          one row about how the business is classified, using the same
          Grid cols="2" gap="md" construct as the formation pair above
          rather than a second pattern. Top-aligned on purpose: both carry
          a FieldDescription and the two run to different lengths, so the
          inputs line up and only the help text below them differs in
          height.
          WHAT THE RENDER ACTUALLY SHOWS, checked at three widths: at 1280
          and wider the TIN label fits on one line and the two inputs sit
          level. Below roughly 1100 that label wraps to two lines and
          drops its input a line under the Industry select, which is the
          one width where this row reads ragged. Left as is rather than
          fixed, because both fixes cost more than the wrap: shortening a
          label that carries the spec's own wording, or forcing the two
          labels to a matching height, which is the second layout pattern
          we agreed not to invent. If the wrap does matter, shorten the
          label: every regulatory detail is already in the description
          sitting under it. */}
      <Grid cols="2" gap="md">
        <Field>
          <FieldLabel>Business Taxpayer Identification Number</FieldLabel>
          <Input
            placeholder="XX-XXXXXXX"
            inputMode="numeric"
            value={bizTin}
            onChange={(e) => setBizTin(e.target.value)}
          />
          <FieldDescription className="text-xs">
            Usually your EIN (XX-XXXXXXX). Single-member LLCs may use the
            owner&rsquo;s SSN (XXX-XX-XXXX); ITINs start with a 9.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Industry</FieldLabel>
          <Select value={industry || undefined} onValueChange={setIndustry}>
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metals">Precious metals &amp; jewellery</SelectItem>
              <SelectItem value="services">Professional services</SelectItem>
              <SelectItem value="software">Software &amp; technology</SelectItem>
              <SelectItem value="retail">Retail &amp; e-commerce</SelectItem>
              <SelectItem value="manufacturing">Manufacturing</SelectItem>
              <SelectItem value="construction">Construction &amp; real estate</SelectItem>
              <SelectItem value="hospitality">Hospitality &amp; food service</SelectItem>
              <SelectItem value="cannabis">Cannabis (not supported)</SelectItem>
              <SelectItem value="weapons">Weapons (not supported)</SelectItem>
              <SelectItem value="crypto">Cryptocurrency (not supported)</SelectItem>
            </SelectContent>
          </Select>
          <FieldDescription className="text-xs">
            Cannabis, weapons and cryptocurrency businesses can&rsquo;t open a
            Glint account. See our Terms.
          </FieldDescription>
        </Field>
      </Grid>

      <Separator className="my-4" />

      <Grid cols="2" gap="md">
        <Field>
          <FieldLabel>Business phone</FieldLabel>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <InputGroupText>🇺🇸</InputGroupText>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="(555) 000-0000"
              inputMode="tel"
              value={bizPhone}
              onChange={(e) => setBizPhone(e.target.value)}
            />
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel>Business cell phone</FieldLabel>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <InputGroupText>🇺🇸</InputGroupText>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Optional"
              inputMode="tel"
              value={bizCell}
              onChange={(e) => setBizCell(e.target.value)}
            />
          </InputGroup>
        </Field>
      </Grid>

      <Field>
        <FieldLabel>Business email</FieldLabel>
        <Input
          type="email"
          value={bizEmail}
          onChange={(e) => setBizEmail(e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel>Website or online presence</FieldLabel>
        <Input
          inputMode="url"
          value={bizSite}
          onChange={(e) => setBizSite(e.target.value)}
        />
        <FieldDescription className="text-xs">
          Helps us confirm what the business does.
        </FieldDescription>
      </Field>

      {/* Size indicators: they support risk-based limits and monitoring
          thresholds. Revenue bands are an assumption; spec asks only for
          a "rough size indicator". */}
      <Grid cols="2" gap="md">
        <Field>
          <FieldLabel>Number of employees</FieldLabel>
          <Select value={employees || undefined} onValueChange={setEmployees}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-4">1 to 4</SelectItem>
              <SelectItem value="5-24">5 to 24</SelectItem>
              <SelectItem value="25-99">25 to 99</SelectItem>
              <SelectItem value="100+">100+</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Annual revenue</FieldLabel>
          <Select value={revenue || undefined} onValueChange={setRevenue}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lt100k">Under $100k</SelectItem>
              <SelectItem value="100k-1m">$100k to $1M</SelectItem>
              <SelectItem value="1m-10m">$1M to $10M</SelectItem>
              <SelectItem value="gt10m">Over $10M</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </Grid>

      <OnboardingLayout.Actions>
        <Button className="rounded-full" size="lg" data-grade-goto={nextScreen}>
          Continue
        </Button>
      </OnboardingLayout.Actions>
    </>
  );
}
