"use client";

// Promoted from Studio screen "US Onboarding — 0 Before you apply"
// (design dmskgw2pk2r1x, version 1786358340226). Registry: lib/screens.ts;
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
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
import { ShieldCheck, ChevronDown, Landmark } from "lucide-react";
import { OnboardingLayout } from "@/components/layouts/onboarding";
import { FlowStore } from "@/lib/flow-store";

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
const useFlowField = FlowStore.useField;

export default function BeforeYouApplyPage() {
  const [email, setEmail] = useFlowField("applicantEmail", "");
  const [twoFactor, setTwoFactor] = useFlowField("twoFactor", "sms");
  const [mobile, setMobile] = useFlowField("applicantMobile", "");
  const [role, setRole] = useFlowField("applicantRole", "");
  const [hasAccount, setHasAccount] = useFlowField("hasGlintAccount", false);
  const [contactName, setContactName] = useFlowField("contactName", "");
  const [contactPhone, setContactPhone] = useFlowField("contactPhone", "");
  const [contactEmail, setContactEmail] = useFlowField("contactEmail", "");
  const [contactConsent, setContactConsent] = useFlowField("contactConsent", true);
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
            <Field>
              <FieldLabel>Password</FieldLabel>
              <Input type="password" autoComplete="new-password" />
              <FieldDescription className="text-xs">
                At least 12 characters.
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

          <Field>
            <FieldLabel>Mobile number</FieldLabel>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <InputGroupText>🇺🇸</InputGroupText>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="(555) 000-0000"
                inputMode="tel"
                autoComplete="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </InputGroup>
            <FieldDescription className="text-xs">
              Used for sign-in codes and to verify your identity.
            </FieldDescription>
          </Field>

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
              placeholder="Full name"
              autoComplete="name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </Field>
          <Grid cols="2" gap="md">
            <Field>
              <FieldLabel>Contact phone</FieldLabel>
              <Input
                placeholder="(555) 000-0000"
                inputMode="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Contact email</FieldLabel>
              <Input
                type="email"
                placeholder="name@company.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </Field>
          </Grid>
          <Field orientation="horizontal">
            <Checkbox
              checked={contactConsent}
              onCheckedChange={(v) => setContactConsent(v === true)}
            />
            <FieldLabel className="font-normal leading-relaxed">
              Glint may contact me about this application by phone or email
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
              The business does not operate in or from a restricted or
              sanctioned jurisdiction&nbsp;
              <a href="#" className="underline underline-offset-2 hover:text-foreground">
                (view list)
              </a>
            </FieldLabel>
          </Field>

          {/* Prohibited industries — cannabis / weapons / crypto live in the
              Terms per the CCO decision (04 Aug); no NAICS codes. */}
          <Field orientation="horizontal">
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
