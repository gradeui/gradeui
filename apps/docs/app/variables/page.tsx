"use client";

/**
 * /variables — the PUBLIC variables viewer.
 *
 * Shows the LOCKED core defaults from @gradeui/core: what Grade ships,
 * read-only, click-to-copy. This page is documentation.
 *
 * The project-scoped sibling — the one with the project's EFFECTIVE
 * values (generated theme ramps layered over these primitives) and,
 * soon, override editing — is `ProjectVariablesPanel` in
 * components/style-panel/variables-panel.tsx, hosted inside Studio's
 * project settings. Overrides are theme/project data and never appear
 * here.
 */

import { SiteHeader } from "@/components/site-header";
import { VariablesViewer } from "@/components/variables/variables-viewer";
import { buildCoreGroups } from "@/components/variables/core-groups";

const groups = buildCoreGroups();

export default function VariablesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-7xl mx-auto py-8 px-4 md:px-8 w-full">
        <div className="mb-6">
          <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Variables</h1>
          <p className="text-lg text-muted-foreground mt-2">
            The primitive token layer, straight from @gradeui/core. Click a swatch to copy
            its CSS variable. These are the locked defaults every theme starts from — your
            project's effective values (and overrides) live in the variables panel inside
            Studio.
          </p>
        </div>
        <VariablesViewer groups={groups} collectionLabel="Core" />
      </main>
    </div>
  );
}
