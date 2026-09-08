"use client";

/** Live samples of the proposed components that render without a screen
 *  around them. The rest are best seen on the screens themselves. */
import { Star, TrendingUp } from "@brightlocal/icons";
import { StatCard, HubStatCard, DrillArrow, MiniStat, MiniStatStrip, ScoreDonut, LocationCard, EmptyPrototypePage } from "@brightlocal/proposal";

function Sample({ title, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="rounded-lg border border-dashed p-5">{children}</div>
    </section>
  );
}

export function ComponentSamples() {
  return (
    <div className="flex flex-col gap-8">
      <Sample title="StatCard">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Average rating" value="4.7" delta="+0.2 vs last month" tone="success" icon={TrendingUp} info="Across every connected source." dataHook="sample-stat-1" />
          <StatCard label="Reviews this month" value="38" delta="+12" tone="success" dataHook="sample-stat-2" />
          <StatCard label="Needs a reply" value="26" tone="destructive" dataHook="sample-stat-3" />
        </div>
      </Sample>
      <Sample title="HubStatCard">
        <div className="grid gap-4 sm:grid-cols-2">
          <HubStatCard icon={Star} title="Reviews" metric="4.7" delta="+0.2" description="Average rating across 7 sources" dataHook="sample-hub-stat" />
        </div>
      </Sample>
      <Sample title="DrillArrow">
        <div className="flex items-center gap-4">
          <DrillArrow />
          <span className="rounded-lg bg-neutral-800 p-3"><DrillArrow variant="glass" /></span>
        </div>
      </Sample>
      <Sample title="MiniStat">
        <MiniStatStrip>
          <MiniStat icon={Star} title="Rating" value="4.7" delta="+0.2" caption="vs last month" />
          <MiniStat icon={TrendingUp} title="Reviews" value="1,116" delta="+38" caption="all sources" />
        </MiniStatStrip>
      </Sample>
      <Sample title="ScoreDonut">
        <div className="flex gap-6">
          <ScoreDonut value={82} />
          <ScoreDonut value={54} />
          <ScoreDonut value={23} />
        </div>
      </Sample>
      <Sample title="LocationCard">
        <div className="grid gap-4 sm:grid-cols-2">
          <LocationCard location={{ name: "Minus 1 Studios", city: "London", postcode: "NW1 6TZ", category: "Recording studio", phone: "0203 488 2915", status: "Active", photo: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=60" }} dataHook="sample-location" />
        </div>
      </Sample>
      <Sample title="EmptyPrototypePage">
        <EmptyPrototypePage title="Nothing here yet" description="The empty state every unbuilt area shows." />
      </Sample>
    </div>
  );
}
