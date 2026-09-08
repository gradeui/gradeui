import Link from "next/link";
import { PROPOSED_COMPONENTS } from "@/lib/ds-components";
import { DS_CHANGES } from "@/lib/ds-changes";

export default function DocsIndex() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          What this prototype proposes
        </h1>
        <p className="text-muted-foreground max-w-prose">
          Everything on these screens is built from the published BrightLocal design system
          (@brightlocal/ui-components 2.27.0, tokens 0.12.0). Where the package did not have what
          a screen needed, the prototype adds a component or works around a limitation. Both are
          logged here so they can be reviewed and, where agreed, moved upstream.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/docs/components" className="bg-card hover:bg-accent flex flex-col gap-1 rounded-lg border p-5 transition-colors">
          <span className="font-medium">Proposed components</span>
          <span className="text-muted-foreground text-sm">{PROPOSED_COMPONENTS.length} additions on top of the package</span>
        </Link>
        <Link href="/docs/changes" className="bg-card hover:bg-accent flex flex-col gap-1 rounded-lg border p-5 transition-colors">
          <span className="font-medium">Proposed changes to the DS</span>
          <span className="text-muted-foreground text-sm">{DS_CHANGES.length} findings with the upstream ask</span>
        </Link>
      </div>
      <p className="text-muted-foreground text-sm">
        Leave comments on any page with the Vercel toolbar (bottom of the screen on the hosted
        version). Comments attach to the element you click.
      </p>
    </div>
  );
}
