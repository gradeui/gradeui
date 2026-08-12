"use client";

// Promoted from Studio screen "US Onboarding — 5 Expected activity"
// (design dmskgzm7d7xvt, version 1786539108170). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: b2c685b8aa71
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

import {
  Button,
  Textarea,
  Switch,
  Input,
  Field,
  FieldLabel,
  FieldDescription,
  FieldContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  MultiSelect,
  Separator,
  Grid,
} from "@gradeui/ui";
import { OnboardingLayout } from "@/components/layouts/onboarding";
import { FlowStore } from "@/lib/flow-store";
import { Persona } from "@/lib/persona";

// Glint US onboarding, Step 4: Purpose and Intended Nature (PAIN), all
// paths. Forward-looking answers set the account's expected-behaviour
// baseline for AML transaction monitoring. Banded ranges per the spec.
// Cross-border and crypto route to enhanced due diligence. The
// trust/plan source-of-funds field is omitted (Step 3c out of scope).
//
// FLOW STATE (FlowStore): every selection and text detail stores, and
// the conditional fields are LIVE: third-party funder name only when
// third-party/government funding is selected, countries only when
// cross-border is on, crypto detail only when the crypto flag is on.
const useFlowField = FlowStore.useField;

const TRANSACTION_TYPES = [
  { value: "ach", label: "ACH / bank transfer" },
  { value: "card", label: "Card payments" },
  { value: "wire", label: "Domestic wires" },
  { value: "intl", label: "International payments" },
];

const FUNDING_SOURCES = [
  { value: "ach", label: "ACH" },
  { value: "card", label: "Card" },
  { value: "wire", label: "Wire" },
  { value: "thirdparty", label: "Third-party / government payments" },
];

const SOURCES_OF_FUNDS = [
  { value: "revenue", label: "Business revenue" },
  { value: "founder", label: "Founder capital" },
  { value: "investment", label: "Investment" },
  { value: "loan", label: "Loan" },
];

const COUNTRIES = [
  { value: "ca", label: "Canada" },
  { value: "uk", label: "United Kingdom" },
  { value: "eu", label: "European Union" },
  { value: "mx", label: "Mexico" },
  { value: "other", label: "Other" },
];

/* PERSONA PREFILL, the same idiom as step 7's recap. `P` is the demo
   persona record, and every value read off it is passed as the field's
   FALLBACK, never assigned into the store: useFlowField reads the store
   first, so a value the user picked or typed still wins. Persona values
   are already stored in the exact format each field expects (option
   VALUES, not labels; lowercase state codes; MM/DD/YYYY dates), so
   nothing here reformats them, and nothing should start to.
   NO COMPANY OR APPLICANT ALIAS on this screen, unlike step 7: it asks
   no identity questions at all, so the only thing it takes off those
   blocks is the header chip's initials.
   WHAT THE PERSONA ACTUALLY ANSWERS HERE is the rails, below. The volume
   band, the transaction count, the sources of funds and the three risk
   switches have no persona field, so they keep literal defaults, matched
   to the fallbacks step 7's recap uses so the two screens agree. */
const P = Persona.DEFAULT;

/* The rails this persona has really moved money on: its two deposit rows
   carry method "wire" and "ach", already the option VALUES both pickers
   use, so the set drops in with no mapping. Ordered by the option list
   and INTERSECTED with it, so a method with no matching option cannot
   leak into a picker as a value it has no label for: the exchange rows
   carry "market-order" and "direct-gold", which are how an order was
   placed and not a way to fund an account.
   ASSUMPTION: onboarding asks what the account WILL do while the rows
   are what it has done, which for a single demo persona is the same
   story. No card row exists, so "Card payments" stays unpicked. */
const DEPOSIT_METHODS = new Set<string>(
  P.activity.filter((tx) => tx.type === "deposit").map((tx) => tx.method),
);
const personaRails = (options: { value: string }[]): string[] =>
  options.map((o) => o.value).filter((v) => DEPOSIT_METHODS.has(v));
const PERSONA_TX_TYPES = personaRails(TRANSACTION_TYPES);
const PERSONA_FUNDING = personaRails(FUNDING_SOURCES);

export default function ExpectedActivityPage() {
  /* Literal, not persona: the persona holds no stated account purpose.
     "gold" is the answer its whole story implies (it holds gold and
     silver, and its autoInvest preference is "gold"), and it is the
     value step 7 falls back to, so the recap agrees. */
  const [purpose, setPurpose] = useFlowField("accountPurpose", "gold");
  /* Literal, not persona: company.revenue is ANNUAL turnover for the
     business, a different question from money in and out through this
     account, and its band values ("1m-10m") are not this select's
     options. Deriving a monthly figure from it, or from the seven-row
     activity window, would be inventing one. Both match step 7. */
  const [volume, setVolume] = useFlowField("monthlyVolume", "50-200k");
  const [txCount, setTxCount] = useFlowField("monthlyCount", "25-100");
  const [txTypes, setTxTypes] = useFlowField(
    "transactionTypes",
    PERSONA_TX_TYPES,
  );
  const [funding, setFunding] = useFlowField("fundingSources", PERSONA_FUNDING);
  const [thirdPartyName, setThirdPartyName] = useFlowField("thirdPartyName", "");
  /* Literal, not persona: nothing in the persona states where the money
     comes from. Business revenue is the honest reading for a trading
     construction company, but it is a reading, not a stored value. */
  const [sourcesOfFunds, setSourcesOfFunds] = useFlowField("sourcesOfFunds", [
    "revenue",
  ]);
  /* ASSUMPTION, and a deliberate change: the persona holds NO
     cross-border facts, so this defaults OFF and the country list
     defaults empty. It used to default on with United Kingdom picked, a
     value nothing in the persona backs, while step 7's recap falls back
     to crossBorder false: the untouched walkthrough showed "United
     Kingdom" here and "Cross-border: No" on review. The Zurich vault is
     Glint's custody of metal, not a payment this customer sends, and the
     country options do not include Switzerland. Flip these two back if
     the demo wants to walk the enhanced due diligence path. */
  const [crossBorder, setCrossBorder] = useFlowField("crossBorder", false);
  const [countries, setCountries] = useFlowField<string[]>("crossBorderCountries", []);
  const [crypto, setCrypto] = useFlowField("cryptoActivity", false);
  const [cryptoDetail, setCryptoDetail] = useFlowField("cryptoDetail", "");
  const [cash, setCash] = useFlowField("cashIntensive", false);

  const thirdParty = funding.includes("thirdparty");

  return (
    <>
      <h1 className="text-3xl font-medium text-foreground">
        How will you use this account?
      </h1>
      <p className="text-muted-foreground">
        Your answers set the expected pattern for your account. They&rsquo;re
        not limits. They just help us spot anything unusual and keep your
        account safe.
      </p>

      <Field>
        <FieldLabel>Purpose of the account</FieldLabel>
        <Select value={purpose} onValueChange={setPurpose}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General business banking</SelectItem>
            <SelectItem value="gold">Gold &amp; silver purchasing</SelectItem>
            <SelectItem value="gov">Receiving state or government payments</SelectItem>
            <SelectItem value="payroll">Payroll &amp; supplier payments</SelectItem>
            <SelectItem value="other">Something else</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Grid cols="2" gap="md">
        <Field>
          <FieldLabel>Expected monthly volume</FieldLabel>
          <Select value={volume} onValueChange={setVolume}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lt10k">Under $10k</SelectItem>
              <SelectItem value="10-50k">$10k to $50k</SelectItem>
              <SelectItem value="50-200k">$50k to $200k</SelectItem>
              <SelectItem value="gt200k">Over $200k</SelectItem>
            </SelectContent>
          </Select>
          <FieldDescription className="text-xs">Money in and out, combined.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Expected transactions per month</FieldLabel>
          {/* Count bands are an assumption: the spec asks for value AND
              count but bands only for value. */}
          <Select value={txCount} onValueChange={setTxCount}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lt25">Under 25</SelectItem>
              <SelectItem value="25-100">25 to 100</SelectItem>
              <SelectItem value="100-500">100 to 500</SelectItem>
              <SelectItem value="gt500">Over 500</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </Grid>

      <Field>
        <FieldLabel>Expected transaction types</FieldLabel>
        <MultiSelect
          options={TRANSACTION_TYPES}
          value={txTypes}
          onValueChange={setTxTypes}
          placeholder="Select all that apply"
          searchable={false}
        />
      </Field>

      <Field>
        <FieldLabel>How will the account be funded?</FieldLabel>
        <MultiSelect
          options={FUNDING_SOURCES}
          value={funding}
          onValueChange={setFunding}
          placeholder="Select all that apply"
          searchable={false}
        />
      </Field>

      {/* Conditional: only when third-party/government funding selected;
          triggers a business risk-rating flag. Left EMPTY on purpose:
          the persona names no third-party payer, and inventing one would
          put a fictional organisation into a risk field. */}
      {thirdParty && (
        <Field>
          <FieldLabel>Third-party or government funding source</FieldLabel>
          <Input
            placeholder="Name of the organisation paying you"
            value={thirdPartyName}
            onChange={(e) => setThirdPartyName(e.target.value)}
          />
          <FieldDescription className="text-xs">
            Shown because third-party or government payments are selected
            above.
          </FieldDescription>
        </Field>
      )}

      <Field>
        <FieldLabel>Where does the money come from?</FieldLabel>
        <MultiSelect
          options={SOURCES_OF_FUNDS}
          value={sourcesOfFunds}
          onValueChange={setSourcesOfFunds}
          placeholder="Select all that apply"
          searchable={false}
        />
        <FieldDescription className="text-xs">
          The source of the funds flowing through this account.
        </FieldDescription>
      </Field>

      <Separator className="my-4" />

      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel>Payments to or from other countries</FieldLabel>
          <FieldDescription className="text-xs">
            Sending or receiving money across borders.
          </FieldDescription>
        </FieldContent>
        <Switch checked={crossBorder} onCheckedChange={setCrossBorder} />
      </Field>

      {crossBorder && (
        <Field>
          <FieldLabel>Top expected countries</FieldLabel>
          <MultiSelect
            options={COUNTRIES}
            value={countries}
            onValueChange={setCountries}
            placeholder="Select countries"
            searchable={false}
          />
        </Field>
      )}

      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel>Cryptocurrency-related activity</FieldLabel>
          <FieldDescription className="text-xs">
            Buying, selling or accepting crypto through this account.
          </FieldDescription>
        </FieldContent>
        <Switch checked={crypto} onCheckedChange={setCrypto} />
      </Field>

      {/* Conditional on the crypto flag, routes to enhanced due
          diligence, not standard processing. Left EMPTY: the persona
          holds no crypto activity to describe. */}
      {crypto && (
        <Field>
          <FieldLabel>Tell us about the crypto activity</FieldLabel>
          <Textarea
            rows={3}
            placeholder="e.g. We accept crypto payments from customers"
            value={cryptoDetail}
            onChange={(e) => setCryptoDetail(e.target.value)}
          />
        </Field>
      )}

      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel>Physical cash deposits</FieldLabel>
          <FieldDescription className="text-xs">
            Does the business regularly handle cash?
          </FieldDescription>
        </FieldContent>
        <Switch checked={cash} onCheckedChange={setCash} />
      </Field>

      <OnboardingLayout.Actions>
        <Button
          className="rounded-full"
          size="lg"
          data-grade-goto="US Onboarding — 6 Documents"
        >
          Continue
        </Button>
      </OnboardingLayout.Actions>
    </>
  );
}
