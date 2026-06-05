/**
 * @label       Motion showcase (10-scene demo reel)
 * @description A full Grade Motion demo reel — ten scenes on one persistent stage: title cards on gradient and solid fills, a dashboard toured by a camera with spotlight, mobile + desktop side by side (two cameras, one scene), a lower-third caption over a live screen, a shader interstitial, a stat punch, and a close. The text → demo → text grammar of a modern product launch video, all live JSX.
 * @tags        motion scenes showcase demo reel launch video grade motion sequence title card lower third section break fills gradients shader multi screen storyboard slides
 * @notes       Uses Motion / MotionScene / MotionScreen / MotionText from @gradeui/ui (needs the dist to include them: `pnpm -F @gradeui/ui build`). Scene fills are plain CSS backgrounds on the `fill` prop; the shader scene uses <BackgroundFill type="shader">. Each MotionScreen carries its OWN camera (`shots`) — the scene just hosts. Duplicate a scene block to extend the reel; the timeline dock picks it up automatically.
 */
import {
  Motion,
  MotionScene,
  MotionScreen,
  MotionText,
  BackgroundFill,
  Stack,
  Row,
  Grid,
  Card,
  CardContent,
  Badge,
  Button,
  Separator,
} from "@gradeui/ui";
import { TrendingUp, Users, Zap } from "lucide-react";

// ── A small dashboard screen the cameras tour ──────────────────────────
function Kpi({ icon: Icon, label, value, delta }) {
  return (
    <Card>
      <CardContent className="p-4">
        <Row gap="sm" align="center" className="text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-xs">{label}</span>
        </Row>
        <div className="mt-1 text-2xl font-bold">{value}</div>
        <Badge variant="success-soft" className="mt-1">{delta}</Badge>
      </CardContent>
    </Card>
  );
}

function DashboardScreen() {
  return (
    <Stack gap="md" className="h-full bg-background p-6">
      <Row justify="between" align="center">
        <div className="text-lg font-semibold">Acme Analytics</div>
        <Button size="sm">Share</Button>
      </Row>
      <Grid className="grid-cols-3 gap-4">
        <Kpi icon={TrendingUp} label="Revenue" value="$48,259" delta="+24%" />
        <Kpi icon={Users} label="Active devs" value="12,480" delta="+12%" />
        <Kpi icon={Zap} label="Conversion" value="2.4%" delta="+0.6%" />
      </Grid>
      <Separator />
      <Grid className="grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium">Pipeline, by stage</div>
            <Stack gap="sm" className="mt-3">
              {[92, 64, 41, 17].map((w, i) => (
                <div key={i} className="h-2 rounded bg-primary/70" style={{ width: `${w}%` }} />
              ))}
            </Stack>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium">Live activity</div>
            <Stack gap="sm" className="mt-3 text-xs text-muted-foreground">
              <span>Hyperdrive v2 shipped to production</span>
              <span>Supabase pipeline hooked up + pumping</span>
              <span>Enterprise tier renewed automatically</span>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Stack>
  );
}

function MobileScreen() {
  return (
    <Stack gap="md" className="h-full bg-background p-4">
      <div className="text-base font-semibold">Acme</div>
      <Kpi icon={TrendingUp} label="Revenue" value="$48k" delta="+24%" />
      <Kpi icon={Users} label="Devs" value="12.4k" delta="+12%" />
      <Button className="w-full">Open dashboard</Button>
    </Stack>
  );
}

// ── The reel — ten scenes, one stage ───────────────────────────────────
export default function App() {
  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <Motion aspect="16/9">
        {/* 1 — cold open on the dark stage */}
        <MotionScene label="Hook">
          <MotionText template="title" heading="Every day —" text="millions of people open a dashboard that wastes their time." />
        </MotionScene>

        {/* 2 — the problem, on a brand gradient */}
        <MotionScene label="Problem" fill="linear-gradient(135deg, #1d1a4b, #0b0b0e 70%)">
          <MotionText template="section-break" heading="Yours shouldn't." />
        </MotionScene>

        {/* 3 — the product, toured by a camera with spotlight */}
        <MotionScene label="Tour">
          <MotionScreen
            spotlight
            shots={[
              { zoom: 1, cx: 0.5, cy: 0.5, hold: 2200, label: "Meet Acme Analytics" },
              { zoom: 2.3, cx: 0.18, cy: 0.25, hold: 2400, label: "Revenue up 24%" },
              { zoom: 2, cx: 0.3, cy: 0.72, hold: 2400, label: "Pipeline at a glance" },
            ]}
          >
            <DashboardScreen />
          </MotionScreen>
        </MotionScene>

        {/* 4 — stat punch on a hot fill, inverted text */}
        <MotionScene label="Stat" fill="#e8ff47">
          <MotionText template="title" tone="dark" heading="24% more revenue" text="in the first 90 days, on average" />
        </MotionScene>

        {/* 5 — mobile + desktop, two cameras in one scene */}
        <MotionScene label="Everywhere">
          <MotionScreen
            device="mobile"
            shots={[
              { zoom: 1, hold: 2000 },
              { zoom: 1.8, cx: 0.5, cy: 0.3, hold: 2200, label: "Live on mobile" },
            ]}
          >
            <MobileScreen />
          </MotionScreen>
          <MotionScreen
            shots={[
              { zoom: 1, hold: 2400 },
              { zoom: 1.9, cx: 0.75, cy: 0.3, hold: 2400, label: "…and desktop" },
            ]}
          >
            <DashboardScreen />
          </MotionScreen>
        </MotionScene>

        {/* 6 — lower-third caption OVER a live screen, same scene */}
        <MotionScene label="Caption">
          <MotionScreen shots={[{ zoom: 1.15, cx: 0.5, cy: 0.4, hold: 3400 }]} cursor={false}>
            <DashboardScreen />
          </MotionScreen>
          <MotionText template="lower-third" heading="Ada Lovelace" text="Head of Product, Acme" />
        </MotionScene>

        {/* 7 — shader interstitial (a fill, not a node) */}
        <MotionScene label="Interstitial">
          <BackgroundFill type="shader" preset="mesh" tone="dark" opacity={0.85} />
          <MotionText className="relative z-10" template="section-break" heading="Built on Grade." />
        </MotionScene>

        {/* 8 — how it works, soft light fill */}
        <MotionScene label="How" fill="radial-gradient(circle at 50% 30%, #f5f5f7, #d9d9e0)">
          <MotionText template="title" tone="dark" heading="One theme. Every screen." text="Design tokens drive the whole reel — recolour it in one move." />
        </MotionScene>

        {/* 9 — quick second look, pulled back */}
        <MotionScene label="Replay">
          <MotionScreen shots={[{ zoom: 0.9, cx: 0.5, cy: 0.5, hold: 2600, label: "The whole picture" }]}>
            <DashboardScreen />
          </MotionScreen>
        </MotionScene>

        {/* 10 — close */}
        <MotionScene label="Close" fill="linear-gradient(160deg, #0b0b0e 55%, #1d1a4b)">
          <MotionText template="title" heading="Ship it." text="gradeui.com" />
        </MotionScene>
      </Motion>
    </div>
  );
}
