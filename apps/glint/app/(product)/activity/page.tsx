"use client";

// Promoted from Studio screen "Activity — history" (design dmsnba2xdvnc3).
// Registry: lib/screens.ts; re-promotion workflow: apps/glint/README.md.
//
// The full activity history. Everything that makes a transaction list a
// transaction list now lives in ONE place, components/activity-table.tsx:
// the DataView columns, the All / Money in / Money out filters, and the
// side sheet that opens an item. This screen chooses the surface: all
// rows, all columns, filters on.

import { Section, Container, Stack } from "@gradeui/ui";
import { ActivityTable } from "@/components/activity-table";
import { DEFAULT_PERSONA } from "@/lib/persona";

export default function ActivityPage() {
  return (
    <Section pad="none" className="py-8">
      <Container maxW="xl">
        <Stack gap="md">
          <h1 className="text-2xl font-semibold text-foreground">Activity</h1>
          <ActivityTable rows={DEFAULT_PERSONA.activity} filters />
        </Stack>
      </Container>
    </Section>
  );
}
