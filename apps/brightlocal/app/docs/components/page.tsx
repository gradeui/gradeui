import { PROPOSED_COMPONENTS } from "@/lib/ds-components";
import { ComponentSamples } from "@/components/component-samples";

export default function ComponentsPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Proposed components
        </h1>
        <p className="text-muted-foreground max-w-prose">
          What the proposal module adds on top of the package. Every one is composed from DS
          primitives and tokens, so it could live in the package or in the app layer.
        </p>
      </header>
      <ComponentSamples />
      <ol className="flex flex-col gap-4">
        {PROPOSED_COMPONENTS.map((c) => (
          <li key={c.name} className="bg-card flex flex-col gap-2 rounded-lg border p-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-lg font-medium">{c.name}</h2>
              <code className="text-muted-foreground text-xs">@brightlocal/{c.module}</code>
            </div>
            <p className="text-sm">{c.summary}</p>
            <dl className="grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
              <dt className="text-muted-foreground">When to use</dt>
              <dd>{c.whenToUse}</dd>
              <dt className="text-muted-foreground">Composes</dt>
              <dd>{c.composes}</dd>
            </dl>
          </li>
        ))}
      </ol>
    </div>
  );
}
