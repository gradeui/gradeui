"use client";

// Promoted from Studio screen "US Onboarding — 8 Review & submit"
// (design dmskh12cv6zuz, version 1786539110181). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 96d4533bbd62
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

import {
  Button,
  PropertyList,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Callout,
  CalloutTitle,
  CalloutDescription,
  Stack,
  Row,
} from "@gradeui/ui";
import { Lock } from "lucide-react";
import { OnboardingLayout } from "@/components/layouts/onboarding";
import { FlowStore, US_STATES } from "@/lib/flow-store";
import { Persona } from "@/lib/persona";

// Glint US onboarding — Step 7: review & submit. The recap is LIVE: it
// reads every FlowStore key the earlier steps wrote, with the PERSONA
// as the fallback so an unvisited walkthrough still reads well — and
// reads as the right company. Edit links goto the owning step.
// Submission creates the audit trail: who submitted what, and when.
const useFlowField = FlowStore.useField;

const TYPE_LABELS = {
  smllc: "Single-member LLC",
  mmllc: "Multi-member LLC",
  partnership: "Partnership",
  corporation: "Corporation",
};
const STATE_LABELS = Object.fromEntries(
  US_STATES.map((s) => [s.value, s.label]),
);
const INDUSTRY_LABELS: Record<string, string> = {
  metals: "Precious metals & jewellery", services: "Professional services",
  software: "Software & technology", retail: "Retail & e-commerce",
  manufacturing: "Manufacturing", construction: "Construction & real estate",
  hospitality: "Hospitality & food service",
};
const PURPOSE_LABELS = {
  general: "General business banking", gold: "Gold & silver purchasing",
  gov: "Receiving state or government payments",
  payroll: "Payroll & supplier payments", other: "Something else",
};
const VOLUME_LABELS = {
  lt10k: "Under $10k", "10-50k": "$10k to $50k",
  "50-200k": "$50k to $200k", gt200k: "Over $200k",
};
const COUNT_LABELS: Record<string, string> = {
  lt25: "under 25", "25-100": "25 to 100",
  "100-500": "100 to 500", gt500: "over 500",
};
const RAIL_LABELS: Record<string, string> = {
  ach: "ACH", card: "Card", wire: "Domestic wires", intl: "International",
};
const COUNTRY_LABELS = {
  ca: "Canada", uk: "United Kingdom", eu: "European Union",
  mx: "Mexico", other: "Other",
};

function SectionCard({
  title,
  editTarget,
  children,
}: {
  title: React.ReactNode;
  editTarget: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <Row justify="between" align="center">
          <CardTitle>{title}</CardTitle>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0"
            data-grade-goto={editTarget}
          >
            Edit
          </Button>
        </Row>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/* Shorthands: the applying company and the human applying. */
const C = Persona.DEFAULT.company;
const A = Persona.DEFAULT.applicant;

export default function ReviewSubmitPage() {
  const g = FlowStore.get;
  const [businessType] = useFlowField("businessType", C.entityType);
  const typeLabel = TYPE_LABELS[businessType] ?? businessType;
  const smllc = businessType === "smllc";

  /* Every recap row reads the FlowStore with the PERSONA as its
     fallback, so an untouched walkthrough reviews as Ridgeline
     Construction rather than the older Aurora Bullion identity these
     fallbacks used to carry. The `g(key, "") || "literal"` idiom is
     deliberately gone: a key holds nothing until the user touches the
     field, so the persona has to BE the fallback — seeding the owning
     step's initial value alone never reaches this screen. */
  const legalName = g("legalName", C.legalName);
  const hasDba = g("hasDba", C.usesDba);
  const dbaName = g("dbaName", C.dba);
  const formed = [
    STATE_LABELS[g("formationState", C.formationState)],
    g("formationDate", C.formationDate),
  ]
    .filter(Boolean)
    .join(" · ");
  const tin = g("bizTin", C.ein);
  const address = [
    g("bizStreet", C.address.street),
    g("bizCity", C.address.city),
    STATE_LABELS[g("bizState", C.address.state)],
    g("bizZip", C.address.zip),
  ]
    .filter(Boolean)
    .join(", ");
  const industry = INDUSTRY_LABELS[g("industry", C.industry)] ?? C.industry;
  /* Email and phone are separate rows (Ali, 11 Aug): a recap is a list
     of fields, and joining two of them into one line makes the pair
     unreadable and unfixable — you cannot put an Edit next to half a
     row. Address stays joined because an address IS one field. */
  const email = g("bizEmail", C.email);
  const phone = g("bizPhone", C.phone);

  const ownerName =
    [g("o1First", A.first), g("o1Last", A.last)].filter(Boolean).join(" ");
  const pct = g("ownershipPct", 100);
  const noMajorityOwner = g("noMajorityOwner", false);
  const sameAsOwner = g("controlSameAsOwner", true);
  const cpName = sameAsOwner
    ? ownerName
    : [g("cpFirst", ""), g("cpLast", "")].filter(Boolean).join(" ") || "Control person";
  const cpTitle = g("cpTitle", A.title);
  const certName = g("certName", "") || ownerName;
  const certRole = g("certRole", "") || cpTitle;
  const signed = Boolean(g("signature", "")) && g("boCertified", false);

  const purpose = PURPOSE_LABELS[g("accountPurpose", "gold")] ?? "Gold & silver purchasing";
  const volume = VOLUME_LABELS[g("monthlyVolume", "50-200k")] ?? "$50k to $200k";
  const count = COUNT_LABELS[g("monthlyCount", "25-100")] ?? "25 to 100";
  const rails =
    (g("transactionTypes", ["ach", "wire"]) ?? [])
      .map((v) => RAIL_LABELS[v] ?? v)
      .join(", ") || "ACH, domestic wires";
  const crossBorder = g("crossBorder", false);
  const countries =
    (g("crossBorderCountries", []) ?? [])
      .map((v) => COUNTRY_LABELS[v] ?? v)
      .join(", ");
  const crypto = g("cryptoActivity", false);
  const cash = g("cashIntensive", false);

  return (
    <>
      <h1 className="text-3xl font-medium text-foreground">
        Review your application
      </h1>
      <p className="text-muted-foreground">
        A final check before you submit. This is your chance to correct
        anything.
      </p>

      <SectionCard title="Business" editTarget="US Onboarding — 3 Business details">
        <PropertyList divider>
          <PropertyList.Row label="Legal name">{legalName}</PropertyList.Row>
          {hasDba && (
            <PropertyList.Row label="Trading as">{dbaName}</PropertyList.Row>
          )}
          <PropertyList.Row label="Type">{typeLabel}</PropertyList.Row>
          <PropertyList.Row label="Formed">{formed}</PropertyList.Row>
          <PropertyList.Row label="EIN">{tin}</PropertyList.Row>
          <PropertyList.Row label="Address">{address}</PropertyList.Row>
          <PropertyList.Row label="Industry">{industry}</PropertyList.Row>
          <PropertyList.Row label="Email">{email}</PropertyList.Row>
          <PropertyList.Row label="Phone">{phone}</PropertyList.Row>
        </PropertyList>
      </SectionCard>

      <SectionCard
        title="Owners & control"
        editTarget={
          smllc
            ? "US Onboarding — 4a Owner identity"
            : "US Onboarding — 4b Owners & control"
        }
      >
        <PropertyList divider>
          {smllc ? (
            <PropertyList.Row label={ownerName}>
              <Row gap="sm" align="center" wrap>
                <span>100%</span>
                <Badge variant="secondary" rounded="full">Single owner</Badge>
                <Badge variant="success-soft" rounded="full">ID verified</Badge>
              </Row>
            </PropertyList.Row>
          ) : noMajorityOwner ? (
            <PropertyList.Row label="Ownership">
              No individual owns 25% or more (widely held)
            </PropertyList.Row>
          ) : (
            <>
              <PropertyList.Row label={ownerName}>
                <Row gap="sm" align="center" wrap>
                  <span>{pct}%</span>
                  {sameAsOwner && (
                    <Badge variant="secondary" rounded="full">
                      Control person · {cpTitle}
                    </Badge>
                  )}
                  <Badge variant="success-soft" rounded="full">ID verified</Badge>
                </Row>
              </PropertyList.Row>
              {/* Same source as step3b's entry: see the note there. */}
              <PropertyList.Row label={Persona.DEFAULT.secondOwner.name}>
                <Row gap="sm" align="center" wrap>
                  <span>{`${Persona.DEFAULT.secondOwner.stake}%`}</span>
                  <Badge variant="success-soft" rounded="full">ID verified</Badge>
                </Row>
              </PropertyList.Row>
            </>
          )}
          {!smllc && !sameAsOwner && (
            <PropertyList.Row label="Control person">
              {cpName} · {cpTitle}
            </PropertyList.Row>
          )}
          <PropertyList.Row label="Certified">
            <Row gap="sm" align="center" wrap>
              <span>
                By {certName} ({certRole})
              </span>
              <Badge
                variant={signed ? "success-soft" : "warning-soft"}
                rounded="full"
              >
                {signed ? "Signed" : "Signature pending"}
              </Badge>
            </Row>
          </PropertyList.Row>
        </PropertyList>
      </SectionCard>

      <SectionCard title="Expected activity" editTarget="US Onboarding — 5 Expected activity">
        <PropertyList divider>
          <PropertyList.Row label="Purpose">{purpose}</PropertyList.Row>
          <PropertyList.Row label="Monthly volume">
            {volume} · {count} transactions
          </PropertyList.Row>
          <PropertyList.Row label="Rails">{rails}</PropertyList.Row>
          <PropertyList.Row label="Cross-border">
            {crossBorder ? `Yes${countries ? ` (${countries})` : ""}` : "No"}
          </PropertyList.Row>
          <PropertyList.Row label="Crypto">{crypto ? "Yes" : "No"}</PropertyList.Row>
          <PropertyList.Row label="Cash deposits">{cash ? "Yes" : "No"}</PropertyList.Row>
        </PropertyList>
      </SectionCard>

      <SectionCard title="Documents" editTarget="US Onboarding — 6 Documents">
        <PropertyList divider>
          <PropertyList.Row label="Uploaded">
            {[
              "Articles of Organization",
              "Certificate of Good Standing",
              "EIN letter (CP 575)",
              smllc ? null : "Operating Agreement",
              hasDba ? "DBA certificate" : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </PropertyList.Row>
          <PropertyList.Row label="Outstanding">
            <Row gap="sm" align="center" wrap>
              <span>Proof of business address</span>
              <Badge variant="outline" rounded="full">Optional</Badge>
            </Row>
          </PropertyList.Row>
        </PropertyList>
      </SectionCard>

      <Callout variant="info">
        <Lock />
        <CalloutTitle>Submitting locks your application</CalloutTitle>
        <CalloutDescription>
          We record who submitted, what was submitted and when. If anything
          needs correcting afterwards, our team will send it back to you.
        </CalloutDescription>
      </Callout>

      <OnboardingLayout.Actions>
        <Stack gap="sm" align="end">
          <Button
            className="rounded-full"
            size="lg"
            data-grade-goto="US Onboarding — Application status"
          >
            Submit application
          </Button>
          <span className="text-xs text-muted-foreground">
            Submitted applications are usually reviewed within 2 business days.
          </span>
        </Stack>
      </OnboardingLayout.Actions>
    </>
  );
}
