/**
 * check-beacon-repeats: does any Beacon sentence appear twice on the same
 * page? (Ali, 9 Sep: "make sure different recommendation snippets aren't
 * just repeated over and over".)
 *
 * For every location and persona, and every Reviews page, this renders
 * the text of each Beacon surface on that page (the strip, the chips, the
 * nugget, the dialog block, the plan) and compares sentences after
 * normalising numbers. A sentence on two surfaces of one page fails.
 *
 *   pnpm -F @gradeui/brightlocal check:beacon
 */
import { PERSONAS } from "../lib/personas";
import { LOCATIONS } from "../lib/screens";
import { statsFor } from "../lib/reviews-data";
import { reviewSummaryFor, type Segment } from "../lib/review-summary";
import { reviewPlanFor } from "../lib/review-insights";
import { pageBeaconFor, nuggetFor, type BeaconPage } from "../lib/beacon-pages";

const text = (segs: Segment[]) => segs.map((s) => s.text).join("");
const sentences = (s: string) =>
  s
    .split(/(?<=[.?!])\s+/)
    .map((x) => x.trim().replace(/\d[\d,.%]*/g, "#").toLowerCase())
    .filter((x) => x.length > 25);

let failures = 0;
for (const persona of PERSONAS) {
  for (const location of persona.locations) {
    if (!LOCATIONS.includes(location)) continue;
    const stats = statsFor(location, persona);
    const summary = reviewSummaryFor(stats, persona.engagement === "new");
    const plan = reviewPlanFor(stats, persona);
    const surfaces: Record<string, Record<string, string>> = {
      hub: {
        strip: [summary.headline, text(summary.lines.find((l) => !l.slot)?.segments ?? [])].join(" "),
        chips: [plan.goal.short, summary.short].join(". "),
        nugget: [nuggetFor("hub", stats, persona)?.fact, nuggetFor("hub", stats, persona)?.action].join(" "),
        dialog: [summary.headline, ...summary.lines.map((l) => text(l.segments))].join(" "),
      },
      manager: {
        strip: [plan.goal.text, plan.items[0]?.actions[0]?.label].join(" "),
        nugget: [nuggetFor("manager", stats, persona)?.fact, nuggetFor("manager", stats, persona)?.action].join(" "),
        dialog: [plan.goal.text, ...plan.items.flatMap((i) => [i.title, i.actionsSummary, ...i.actions.map((a) => a.text)])].join(" "),
      },
    };
    for (const page of ["tracker", "builder", "showcase"] as BeaconPage[]) {
      const b = pageBeaconFor(page, stats, persona);
      const n = nuggetFor(page, stats, persona);
      surfaces[page] = {
        strip: [b.headline, text(b.line)].join(" "),
        nugget: [n?.fact, n?.action].join(" "),
        dialog: [b.headline, text(b.line)].join(" "),
      };
    }
    for (const [page, bySurface] of Object.entries(surfaces)) {
      const seen = new Map<string, string>();
      for (const [surface, body] of Object.entries(bySurface)) {
        for (const sentence of new Set(sentences(body))) {
          const prior = seen.get(sentence);
          // The dialog is allowed to repeat its own strip: it is the strip in full.
          if (prior && prior !== surface && !(surface === "dialog" && prior === "strip") && !(surface === "strip" && prior === "dialog")) {
            failures += 1;
            console.log(`! ${persona.id} / ${location} / ${page}: "${sentence.slice(0, 80)}" on ${prior} and ${surface}`);
          }
          if (!prior) seen.set(sentence, surface);
        }
      }
    }
  }
}
console.log(failures ? `${failures} repeated sentence(s)` : "no Beacon sentence repeats on any page");
process.exit(failures ? 1 : 0);
