import Link from "next/link";
import { PERSONAS } from "@/lib/personas";
import { DATASETS } from "@brightlocal/data";
import { statsFor } from "@/lib/reviews-data";
import { reviewSummaryFor, registerFor, type Segment } from "@/lib/review-summary";
import { reviewPlanFor } from "@/lib/review-insights";
import { pageBeaconFor, nuggetFor, type BeaconPage } from "@/lib/beacon-pages";

/**
 * Every Beacon sentence, for every persona, location and page, in one
 * place: the review copy for tone (Brian, Bea, Ray), and the seed of the
 * examples file. Same functions the product calls, so this IS what ships.
 */

const text = (segs: Segment[]) => segs.map((s) => s.text).join("");
const REGISTER: Record<string, string> = { brian: "Brian, flat", bea: "Bea, warm", ray: "Ray, bright" };

function Line({ register, children }: { register?: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-sm">
      <span className="text-muted-foreground w-24 shrink-0 text-xs">{register ? REGISTER[register] : ""}</span>
      <span className="text-pretty">{children}</span>
    </li>
  );
}

function Surface({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label-sm text-muted-foreground">{title}</p>
      <ul className="flex flex-col gap-1.5">{children}</ul>
    </div>
  );
}

export default function BeaconSummariesPage() {
  const names = DATASETS as Record<string, { location?: { name?: string } }>;
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm"><Link href="/docs" className="hover:underline">Docs</Link></p>
        <h1 className="text-heading-page">Everything it says</h1>
        <p className="text-body text-muted-foreground max-w-prose">
          Every sentence on every surface, for every persona and location, produced by the same code the product runs. Registers: Brian for bad news, Bea by default, Ray for a real win. Review the tone here. The numbers come from the rows.
        </p>
      </div>
      {PERSONAS.map((persona) =>
        persona.locations.map((location) => {
          const stats = statsFor(location, persona);
          const summary = reviewSummaryFor(stats, persona.engagement === "new");
          const plan = reviewPlanFor(stats, persona);
          return (
            <section key={`${persona.id}-${location}`} className="flex flex-col gap-6 border-t pt-8">
              <div>
                <h2 className="text-heading-section">{names[location]?.location?.name ?? location}</h2>
                <p className="text-body-sm text-muted-foreground">{persona.label}</p>
              </div>
              <Surface title="Hub: summary">
                <Line register="bea"><strong>{summary.headline}</strong></Line>
                {summary.lines.map((l, i) => (
                  <Line key={i} register={l.register ?? registerFor(l.tone)}>{text(l.segments)}{l.slot ? <span className="text-muted-foreground"> (behind the {l.slot} tile)</span> : null}</Line>
                ))}
              </Surface>
              <Surface title="Hub: chips">
                <Line>{plan.goal.short}</Line>
                <Line>{summary.short}</Line>
              </Surface>
              <Surface title="Manager: goal and plan">
                <Line register="bea"><strong>{plan.goal.text}</strong></Line>
                {plan.items.map((item) => (
                  <Line key={item.id} register={item.severity === "high" ? "brian" : "bea"}>
                    <strong>{item.title}.</strong> {item.actionsSummary} {item.actions.map((a) => a.label).join(" ")}
                  </Line>
                ))}
              </Surface>
              {(["tracker", "builder", "showcase"] as BeaconPage[]).map((page) => {
                const b = pageBeaconFor(page, stats, persona);
                return (
                  <Surface key={page} title={`${page.charAt(0).toUpperCase() + page.slice(1)}: strip`}>
                    <Line register="bea"><strong>{b.headline}</strong></Line>
                    <Line register="bea">{text(b.line)}{b.cta ? <span className="text-muted-foreground"> [{b.cta.label}]</span> : null}</Line>
                  </Surface>
                );
              })}
              <Surface title="Nuggets, one per page">
                {(["hub", "manager", "tracker", "builder", "showcase"] as const).map((page) => {
                  const n = nuggetFor(page, stats, persona);
                  return n ? (
                    <Line key={page} register="bea"><span className="text-muted-foreground">{page}: </span>{n.fact} {n.action} <span className="text-muted-foreground">[{n.cta.label}]</span></Line>
                  ) : null;
                })}
              </Surface>
            </section>
          );
        }),
      )}
    </div>
  );
}
