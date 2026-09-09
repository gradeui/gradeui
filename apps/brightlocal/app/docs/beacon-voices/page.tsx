import Link from "next/link";
import { VOICES, SITUATIONS } from "@/lib/beacon-voices";

/** The five voices applied to the same six situations. Three ship;
 *  Keith and Buzz are the over-rotation fixtures. */
export default function BeaconVoicesPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm"><Link href="/docs" className="hover:underline">Docs</Link></p>
        <h1 className="text-heading-page">The five Beacon voices</h1>
        <p className="text-body text-muted-foreground max-w-prose">
          Keith, Brian, Bea, Ray and Buzz, flattest to brightest, on the same six situations. Brian, Bea and Ray ship: bad news gets the flattest register, Bea is the default, Ray fires only on a real win. Keith and Buzz are calibration points. If a line sounds like Keith, warm it up. If it sounds like Buzz, dial it back toward Ray.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
        {VOICES.map((v) => (
          <div key={v.id} className={`flex flex-col gap-1 rounded-lg border p-4 ${v.ships ? "bg-card" : "bg-muted/40"}`}>
            <p className="text-heading-subsection">{v.name}</p>
            <p className="text-body-sm text-muted-foreground">{v.role}</p>
          </div>
        ))}
      </div>
      {SITUATIONS.map((s) => (
        <section key={s.id} className="flex flex-col gap-4 border-t pt-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-heading-section">{s.title}</h2>
            <p className="text-body-sm text-muted-foreground max-w-prose">{s.facts}</p>
          </div>
          {/* Rows, not columns (Ali, 11 Sep: "vertical is hard to read"): the
              voice on the left, the line as a lede and its supporting text. */}
          <div className="flex flex-col divide-y rounded-lg border">
            {VOICES.map((v) => (
              <div key={v.id} className={`grid gap-2 px-4 py-3 sm:grid-cols-[8rem_1fr] ${v.ships ? "" : "bg-muted/40"}`}>
                <p className="text-label-sm font-semibold uppercase tracking-wide">{v.name}{v.ships ? "" : <span className="ml-1 font-normal normal-case text-muted-foreground">(fixture)</span>}</p>
                <div className="flex flex-col gap-0.5">
                  <p className="text-body font-semibold text-balance">{s.lines[v.id].lede}</p>
                  {s.lines[v.id].detail ? <p className="text-body-sm text-muted-foreground text-pretty">{s.lines[v.id].detail}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
