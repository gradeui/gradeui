"use client";

// Promoted from Studio screen "Activity — history"
// (design dmsnba2xdvnc3, version 1786532787351). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: dc3d87b4e996
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

import * as React from "react";
import { Section, Container, Stack } from "@gradeui/ui";
import { Persona } from "@/lib/persona";
import { ActivityTable } from "@/components/activity-table";

// Glint Activity screen (Ali, 10 Aug 2026): the full activity history
// for the persona, inside the AppChrome shell with the Activity nav
// item active.
//
// THE TABLE IS THE SHARED ActivityTable (Ali, 11 Aug). This screen used
// to inline its own: its own AmountCell, a seven column list, a side
// sheet and the filter tabs, about 275 lines of it. That copy is where
// the shared "ActivityTable" module came from, and the wallet screens
// and the dashboard already render through the module, so a second copy
// living here meant every change to the table had to be made twice and
// the surfaces drifted apart within a day. The screen now owns the page
// and nothing else: the heading, the measure, and which rows go in.
//
// The shared table is also AHEAD of what was inlined here: four columns
// rather than seven (the method and the vault read under the
// description, where they say what the row IS), and the vault on every
// metal row.
//
// ROWS ARE THE WHOLE PERSONA LIST, not a wallet slice: this is the full
// history, so it hands over Persona.useActivity() whole. A
// wallet screen passes Persona.activityFor("gold") to the same table.
//
// FILTERS ON: the All / Money in / Money out tabs belong to this screen
// and to the cash wallet, which is why they are a prop on the module
// rather than baked into it. A recent list under a dashboard leaves them
// off. No `hide`, because the full history wants every column.

export default function ActivityPage() {
  /* LIVE (Ali, 12 Aug). Persona.useActivity: this session's trades ahead of the seeded
     history, so a purchase shows up here the moment it completes. */
  const rows = Persona.useActivity();
  return (
    <>
      <Section pad="none" className="py-8">
        <Container maxW="xl">
          <Stack gap="md">
            <h1 className="text-2xl font-semibold text-foreground">Activity</h1>
            {/* ASSUMPTION, flagged for Ali: the detail panel is now the
                shared module's, the same one the wallet screens open, so
                two rows the old inlined sheet carried are gone. It has
                no "Account" row (the wallet), and its "Type" row shows
                the method, "Direct Gold" or "Wire transfer", rather than
                the kind, "Exchange". The module drops both on purpose:
                every wallet here belongs to one customer, and the
                description already reads "Exchange USD to Gold". Taken
                as the module has it so this screen cannot differ from
                the wallets. If either belongs back in the panel, it goes
                into the module and every surface gets it. */}
            <ActivityTable rows={rows} filters />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
