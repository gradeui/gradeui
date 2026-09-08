import { DS_CHANGES } from "@/lib/ds-changes";

export default function ChangesPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Proposed changes to the design system
        </h1>
        <p className="text-muted-foreground max-w-prose">
          Findings from building on @brightlocal/ui-components 2.27.0 and @brightlocal/tokens
          0.12.0. Each one says what we hit, what the prototype does about it, and what we would
          ask the package to change.
        </p>
      </header>
      <ol className="flex flex-col gap-4">
        {DS_CHANGES.map((c, i) => (
          <li key={c.id} id={c.id} className="bg-card flex flex-col gap-3 rounded-lg border p-5">
            <h2 className="text-lg font-medium">
              <span className="text-muted-foreground mr-2 tabular-nums">{i + 1}.</span>
              {c.title}
            </h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-[8rem_1fr]">
              <dt className="text-muted-foreground">Finding</dt>
              <dd>{c.finding}</dd>
              <dt className="text-muted-foreground">In the prototype</dt>
              <dd>{c.workaround}</dd>
              <dt className="text-muted-foreground">Upstream ask</dt>
              <dd className="font-medium">{c.ask}</dd>
            </dl>
          </li>
        ))}
      </ol>
    </div>
  );
}
