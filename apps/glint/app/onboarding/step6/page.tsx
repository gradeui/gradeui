"use client";

// Promoted from Studio screen "US Onboarding — 6 Documents"
// (design dmskh01pnwn8w, version 1786539108974). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 16e3289e7e0a
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

import { Button, Stack, Row, Badge, Callout, CalloutTitle, CalloutDescription } from "@gradeui/ui";
import { Upload, FileText, CheckCircle2, Info } from "lucide-react";
import { OnboardingLayout } from "@/components/layouts/onboarding";
import { FlowStore } from "@/lib/flow-store";

// Hook access via FlowStore statics: the "@project/components" barrel
// exposes only name-matched exports (kernel limitation, chip filed).
const useFlowField = FlowStore.useField;

// Glint US onboarding — Step 5: document uploads, conditional on entity
// type. Trust / retirement-plan documents omitted (Step 3c out of
// scope). PDF/JPG/PNG per file; the 10 MB cap is an assumption (spec
// says "per-file size limit" without a number); files are
// malware-scanned. The EIN letter row is shown uploaded so both row
// states are visible.
//
// FLOW STATE (FlowStore): the list responds to earlier answers. The
// DBA certificate row appears only when a trade name was declared at
// Business details, and the Operating Agreement row is Required for
// multi-owner entities but only Requested for a single-member LLC,
// exactly per the spec's conditions.

function DocRow({
  title,
  hint,
  badge,
  badgeVariant = "secondary",
  done = false,
}: {
  title: React.ReactNode;
  hint: React.ReactNode;
  badge: React.ReactNode;
  badgeVariant?: React.ComponentProps<typeof Badge>["variant"];
  done?: boolean;
}) {
  return (
    <Row
      justify="between"
      align="center"
      wrap
      gap="md"
      className={
        done
          ? "rounded-lg border border-border bg-muted/40 p-4"
          : "rounded-lg border border-dashed border-border p-4"
      }
    >
      {/* flex-1 (basis 0) keeps the text cluster from wrapping the
          controls: long hints wrap inside this column instead. */}
      <Row gap="md" align="center" className="min-w-0 flex-1">
        {done ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success-deep" />
        ) : (
          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
        )}
        <Stack gap="none" className="min-w-0">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <span className="text-sm text-muted-foreground">{hint}</span>
        </Stack>
      </Row>
      <Row gap="sm" align="center" className="shrink-0">
        <Badge variant={badgeVariant} rounded="full">{badge}</Badge>
        <Button variant="outline" size="sm" className="rounded-full">
          <Upload className="h-4 w-4" />
          {done ? "Replace" : "Upload"}
        </Button>
      </Row>
    </Row>
  );
}

export default function DocumentsPage() {
  const [businessType] = useFlowField("businessType", "smllc");
  const [hasDba] = useFlowField("hasDba", false);
  const smllc = businessType === "smllc";

  return (
    <>
      <h1 className="text-3xl font-medium text-foreground">
        Upload your documents
      </h1>
      <p className="text-muted-foreground">
        PDF, JPG or PNG, up to 10&nbsp;MB each. Every file is scanned
        automatically, and you can save and come back at any time.
      </p>

      <Stack gap="sm">
        <DocRow
          title="Articles of Organization or Incorporation"
          hint="Also called a Certificate of Formation"
          badge="Required"
        />
        <DocRow
          title="Certificate of Good Standing"
          hint="From your Secretary of State"
          badge="Required"
        />
        <DocRow
          title="EIN confirmation letter (CP 575 or 147C)"
          hint="ein-confirmation-cp575.pdf · 1.2 MB"
          badge="Uploaded"
          badgeVariant="success-soft"
          done
        />
        <DocRow
          title="Operating Agreement or Bylaws"
          hint={
            smllc
              ? "Requested for single-member LLCs"
              : "Or Partnership Agreement. Evidences the ownership you declared"
          }
          badge={smllc ? "Requested" : "Required"}
          badgeVariant={smllc ? "outline" : "secondary"}
        />
        {hasDba && (
          <DocRow
            title="DBA / fictitious business name certificate"
            hint="Because you declared a trade name earlier"
            badge="Required"
          />
        )}
        <DocRow
          title="Business license"
          hint="If your business type is licensed in your state"
          badge="If applicable"
          badgeVariant="outline"
        />
        <DocRow
          title="Proof of business address"
          hint="A utility bill or lease from the last 3 months"
          badge="Optional"
          badgeVariant="outline"
        />
      </Stack>

      <Callout variant="info">
        <Info />
        <CalloutTitle>Don&rsquo;t have everything to hand?</CalloutTitle>
        <CalloutDescription>
          You can continue now and upload missing documents later. We&rsquo;ll
          remind you before your application is reviewed.
        </CalloutDescription>
      </Callout>

      <OnboardingLayout.Actions>
        <Button
          className="rounded-full"
          size="lg"
          data-grade-goto="US Onboarding — 7 Certification"
        >
          Continue
        </Button>
      </OnboardingLayout.Actions>
    </>
  );
}
