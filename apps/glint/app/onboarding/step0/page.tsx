"use client";

// Promoted from Studio screen "US Onboarding — 0 Before you apply"
// (design dmskgw2pk2r1x, version 1786469048975). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: f2ae74b1b1b1
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
} from "@gradeui/ui";
import { ShieldCheck, Landmark } from "lucide-react";
import { OnboardingLayout } from "@/components/layouts/onboarding";
import { FlowStore } from "@/lib/flow-store";
import { PhoneField } from "@/components/phone-field";
import { Persona } from "@/lib/persona";

// Glint US Business Account onboarding — Step 0 of the CCO data-capture
// spec (05 Aug 2026): pre-application. Covers the "Account Setup and
// Applicant Contact" table PLUS the Step-0 items (PATRIOT Act/CIP
// notice, consents, prohibited-industry + restricted-country
// attestations, contact person + permission, existing-customer check).
// Steps 3c (trusts/plans) and Admin are intentionally out of scope.
//
// FLOW STATE (FlowStore): every field stores, so the application keeps
// its answers across navigation. The password deliberately does NOT
// store, even in a prototype.
//
// PHONE NUMBERS go through PhoneField, which stores the COUNTRY and the
// NATIONAL NUMBER under separate keys (applicantMobileCountry +
// applicantMobile, contactPhoneCountry + contactPhone) and owns the
// FlowStore wiring for both, so nothing on this screen reads them.
const useFlowField = FlowStore.useField;

/* The human filling this application in, Wade Jones of Ridgeline
   Construction. Every persona value below is passed as the field hook's
   FALLBACK, never as an assignment: the flow store is read first, so a
   value the applicant typed always wins and a prefill only fills the
   gap. It also means a walked wizard shows the demo persona instead of
   handing the browser a page of empty inputs to autofill with whoever is
   sitting in front of it, which is the bug this fixes.

   NOTHING HERE REFORMATS ANYTHING, on purpose: the persona already
   stores each value in the exact shape its field expects. Selects get
   the option VALUE and not its label ("owner", "sms"), the mobile is the
   NATIONAL number with no dial code because PhoneField holds the country
   separately, and the booleans are booleans. Reformatting on the way in
   is how one of these fails silently. */
const A = Persona.DEFAULT.applicant;

export default function BeforeYouApplyPage() {
  const [email, setEmail] = useFlowField("applicantEmail", A.email);
  const [twoFactor, setTwoFactor] = useFlowField("twoFactor", A.twoFactor);
  const [role, setRole] = useFlowField("applicantRole", A.role);
  const [hasAccount, setHasAccount] = useFlowField(
    "hasGlintAccount",
    A.hasPersonalAccount,
  );
  /* The contact for the application IS the applicant (Ali, 11 Aug), so
     the three contact fields read from the same applicant block. The
     name goes through Persona.fullName() rather than joining first and
     last here, so the composition lives in one place. */
  const [contactName, setContactName] = useFlowField(
    "contactName",
    Persona.fullName(),
  );
  const [contactEmail, setContactEmail] = useFlowField(
    "contactEmail",
    A.email,
  );
  /* ONE CONSENT PER CHANNEL (Ali, 11 Aug). A single "by phone or email"
     tick cannot be honoured: a customer who is happy to be emailed and
     does not want to be called has no way to say so, and the stored
     value cannot answer "may we ring them". Two keys, two sentences,
     each about its own channel. No persona equivalent exists for either,
     so both keep the opted-in default this screen already carried. */
  const [consentEmail, setConsentEmail] = useFlowField(
    "contactConsentEmail",
    true,
  );
  const [consentPhone, setConsentPhone] = useFlowField(
    "contactConsentPhone",
    true,
  );
  /* The three attestations stay FALSE. An attestation is an act by the
     applicant, not a fact about them, and the persona holds no answer to
     any of them: prefilling a tick would be inventing a legal statement
     nobody made. */
  const [attestSanctions, setAttestSanctions] = useFlowField("attestSanctions", false);
  const [attestProhibited, setAttestProhibited] = useFlowField("attestProhibited", false);
  const [attestChecks, setAttestChecks] = useFlowField("attestChecks", false);

  return (
    <>
      <h1 className="text-3xl font-medium text-foreground">Before you apply</h1>
      <p className="text-muted-foreground">
        Set up your login, tell us how to reach you, and confirm a few things
        so your application goes smoothly.
      </p>

      {/* USA PATRIOT Act / CIP notice — required federal wording, verbatim
          from the CCO spec. Shown before any data is entered. */}
      <Callout variant="info">
        <Landmark />
        <CalloutTitle>Important information about opening an account</CalloutTitle>
        <CalloutDescription>
          To help the government fight the funding of terrorism and money
          laundering activities, Federal law requires all financial
          institutions to obtain, verify, and record information that
          identifies each person who opens an account. What this means for
          you: when you open a Glint account, we will ask for your name,
          address, date of birth, and other information that will allow us to
          identify you and your company. We may also ask to see your
          driver&rsquo;s license, state-issued identification card or U.S.
          passport.
        </CalloutDescription>
      </Callout>

      <FieldSet>
        <FieldLegend>Your account</FieldLegend>
        <Stack gap="md">
          <Field>
            <FieldLabel>Email address</FieldLabel>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FieldDescription className="text-xs">
              Your login, and where we&rsquo;ll send updates about this application.
            </FieldDescription>
          </Field>

          <Grid cols="2" gap="md">
            {/* The ONLY field on this screen with nothing prefilled, and
                that is deliberate: a password is a secret the applicant
                chooses, the persona holds none, and it is the one field
                the comment at the top says never stores. */}
            <Field>
              <FieldLabel>Password</FieldLabel>
              <Input type="password" autoComplete="new-password" />
              <FieldDescription className="text-xs">
                At least 12 characters. Choose this yourself, we never fill it
                in for you.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Two-factor method</FieldLabel>
              <Select value={twoFactor} onValueChange={setTwoFactor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">Text message (SMS)</SelectItem>
                  <SelectItem value="app">Authenticator app</SelectItem>
                  <SelectItem value="key">Security key</SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription className="text-xs">
                How we confirm it&rsquo;s you at sign-in.
              </FieldDescription>
            </Field>
          </Grid>

          {/* PhoneField owns the country + number pair, so the flag on
              show always matches the stored country. This field used to
              be an addon holding a hardcoded US flag and a decorative
              chevron, which is how a UK number sat under a US flag. */}
          <PhoneField
            label="Mobile number"
            description="Used for sign-in codes and to verify your identity."
            countryKey="applicantMobileCountry"
            numberKey="applicantMobile"
            defaultCountry="us"
            defaultNumber={A.mobile}
          />

          <Field>
            <FieldLabel>Your role at the business</FieldLabel>
            <Select value={role || undefined} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="member">Member or partner</SelectItem>
                <SelectItem value="director">Director or officer</SelectItem>
                <SelectItem value="signer">Authorised signer</SelectItem>
              </SelectContent>
            </Select>
            <FieldDescription className="text-xs">
              We need to confirm you&rsquo;re authorised to open this account on
              the business&rsquo;s behalf.
            </FieldDescription>
          </Field>

          {/* Existing-customer check — CCO note: avoid CIP duplication. */}
          <Field orientation="horizontal">
            <Checkbox
              checked={hasAccount}
              onCheckedChange={(v) => setHasAccount(v === true)}
            />
            <FieldLabel className="font-normal leading-relaxed">
              I already have a personal Glint account
            </FieldLabel>
          </Field>

          {hasAccount && (
            <Callout variant="success">
              <ShieldCheck />
              <CalloutTitle>We&rsquo;ll reuse your verified identity</CalloutTitle>
              <CalloutDescription>
                Sign in during this application and we&rsquo;ll skip the
                identity checks you&rsquo;ve already passed.
              </CalloutDescription>
            </Callout>
          )}
        </Stack>
      </FieldSet>

      <Separator className="my-4" />

      {/* Contact person — CCO note: capture early, with permission, so we
          can follow up on drop-outs. May differ from the applicant. */}
      <FieldSet>
        <FieldLegend>Contact for this application</FieldLegend>
        <Stack gap="md">
          <FieldDescription className="text-xs">
            Who should we speak to about this application? This can be you or
            someone else at the business.
          </FieldDescription>
          <Field>
            <FieldLabel>Contact name</FieldLabel>
            <Input
              autoComplete="name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <FieldDescription className="text-xs">
              We&rsquo;ve filled in your name. Change it if someone else at the
              business should handle our questions.
            </FieldDescription>
          </Field>
          <Grid cols="2" gap="md">
            {/* The same component as the applicant's number, by design,
                and prefilled from the same applicant record: the contact
                for this application is the applicant. Change either and
                only that one changes, because the two PhoneFields hold
                separate flow-store key pairs. */}
            <PhoneField
              label="Contact phone"
              description="The best number to reach this person during working hours."
              countryKey="contactPhoneCountry"
              numberKey="contactPhone"
              defaultCountry="us"
              defaultNumber={A.mobile}
            />
            <Field>
              <FieldLabel>Contact email</FieldLabel>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
              <FieldDescription className="text-xs">
                Where we send questions and requests for documents.
              </FieldDescription>
            </Field>
          </Grid>
          {/* Two ticks, one per channel: see the note on the hooks. */}
          <Field orientation="horizontal">
            <Checkbox
              checked={consentEmail}
              onCheckedChange={(v) => setConsentEmail(v === true)}
            />
            <FieldLabel className="font-normal leading-relaxed">
              Glint may email me about this application
            </FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <Checkbox
              checked={consentPhone}
              onCheckedChange={(v) => setConsentPhone(v === true)}
            />
            <FieldLabel className="font-normal leading-relaxed">
              Glint may call me about this application
            </FieldLabel>
          </Field>
        </Stack>
      </FieldSet>

      <Separator className="my-4" />

      <FieldSet>
        <FieldLegend>Before you start</FieldLegend>
        <Stack gap="md">
          {/* Restricted-country self-screen — recommended as an upfront
              gate in the spec's compliance considerations. */}
          <Field orientation="horizontal">
            <Checkbox
              checked={attestSanctions}
              onCheckedChange={(v) => setAttestSanctions(v === true)}
            />
            <FieldLabel className="font-normal leading-relaxed">
              {/* One span child: keeps the link inline with the sentence
                  (Field's label layout right-detaches a sibling anchor). */}
              <span>
                The business does not operate in or from a restricted or
                sanctioned jurisdiction{" "}
                <a href="#" className="underline underline-offset-2 hover:text-foreground">
                  (view list)
                </a>
              </span>
            </FieldLabel>
          </Field>

          {/* Prohibited industries — cannabis / weapons / crypto live in the
              Terms per the CCO decision (04 Aug); no NAICS codes.
              HIDDEN at Ali's request (10 Aug), not deleted: drop the
              hidden class to restore the row. */}
          <Field orientation="horizontal" className="hidden">
            <Checkbox
              checked={attestProhibited}
              onCheckedChange={(v) => setAttestProhibited(v === true)}
            />
            <FieldLabel className="font-normal leading-relaxed">
              The business does not operate in a prohibited industry,
              including cannabis, weapons or cryptocurrency&nbsp;
              <a href="#" className="underline underline-offset-2 hover:text-foreground">
                (see our Terms)
              </a>
            </FieldLabel>
          </Field>

          {/* Consent to third-party checks — legal basis for KYC/KYB. */}
          <Field orientation="horizontal">
            <Checkbox
              checked={attestChecks}
              onCheckedChange={(v) => setAttestChecks(v === true)}
            />
            <FieldLabel className="font-normal leading-relaxed">
              I authorise Glint to run identity, credit-bureau and
              sanctions/watchlist checks on the business and its listed
              individuals
            </FieldLabel>
          </Field>
        </Stack>
      </FieldSet>

      {/* Start Application consent line — CCO wording; "Mercury's" in the
          source doc is a template artifact, substituted with Glint. */}
      <p className="text-sm leading-relaxed text-muted-foreground">
        By clicking &ldquo;Start Application&rdquo;, I agree to Glint&rsquo;s{" "}
        <a href="#" className="underline underline-offset-2 hover:text-foreground">Terms of Use</a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</a>,
        consent to receive electronic communications about my accounts and
        services under Glint&rsquo;s Electronic Communications Agreement, and
        acknowledge receipt of Glint&rsquo;s USA PATRIOT Act disclosure.
      </p>

      <OnboardingLayout.Actions>
        <Button
          className="rounded-full"
          size="lg"
          data-grade-goto="US Onboarding — 1 Business type"
        >
          Start Application
        </Button>
      </OnboardingLayout.Actions>
    </>
  );
}
