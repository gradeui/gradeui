/**
 * @label       Camera tour (live demo director)
 * @description A live dashboard wrapped in <ScreenAnimator> — it flies in from offscreen, tours regions with an eased camera (zoom + pan), dims the edges with a focus spotlight, captions each beat, pulses a synthetic cursor, settles back to overview, exits right, and loops. Play/pause/restart transport. The screen stays real and interactive; the camera just directs the eye.
 * @tags        camera tour demo director zoom pan spotlight cursor caption transport showcase live storytelling screenanimator hyperframe
 * @notes       Uses the reusable <ScreenAnimator> from @gradeui/ui (wrap ANY content in a directed camera) — not an inline copy. Pass `shots` (zoom + focal point + dwell + label). Needs the @gradeui/ui dist to include ScreenAnimator: `pnpm -F @gradeui/ui build`. Retune each shot's cx/cy (fractions of the screen) if you restructure the dashboard.
 */
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  Stack,
  Row,
  Grid,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Separator,
  ScreenAnimator,
} from "@gradeui/ui";
import { TrendingUp, TrendingDown, Users, Zap, Activity } from "lucide-react";

// The tour: each shot is a zoom + focal point (fractions of the screen) +
// how long to dwell + a caption.
const SHOTS = [
  { zoom: 1, cx: 0.5, cy: 0.5, hold: 2400, label: "The whole picture" },
  { zoom: 2.4, cx: 0.18, cy: 0.34, hold: 2600, label: "Revenue is up 24%" },
  { zoom: 2.2, cx: 0.74, cy: 0.34, hold: 2600, label: "12,480 active devs" },
  { zoom: 1.8, cx: 0.5, cy: 0.6, hold: 2800, label: "Pipeline, by stage" },
  { zoom: 2.6, cx: 0.32, cy: 0.85, hold: 2600, label: "Live activity feed" },
];

function Kpi({ icon: Icon, label, value, delta, up = true }) {
  return (
    <Card>
      <CardContent className="p-4">
        <Stack gap="sm">
          <Row justify="between" align="center">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </span>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </Row>
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          <Row gap="xs" align="center">
            {up ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span
              className={
                up
                  ? "text-xs font-medium text-emerald-600"
                  : "text-xs font-medium text-rose-600"
              }
            >
              {delta}
            </span>
          </Row>
        </Stack>
      </CardContent>
    </Card>
  );
}

const STAGES = [
  { name: "Lead", v: 92 },
  { name: "Qualified", v: 64 },
  { name: "Demo", v: 41 },
  { name: "Trial", v: 28 },
  { name: "Won", v: 17 },
];

const FEED = [
  { who: "Hyperdrive v2", what: "shipped to production", when: "2m" },
  { who: "Supabase pipeline", what: "hooked up + pumping", when: "1h" },
  { who: "Enterprise tier", what: "renewed automatically", when: "3h" },
  { who: "Staging sandbox", what: "purged (clean slate)", when: "1d" },
];

function Dashboard() {
  return (
    <AppShell nav="none" className="h-screen min-h-0 overflow-hidden">
      <AppShellHeader className="border-b bg-muted/30 shrink-0">
        <div className="flex items-center justify-between px-6 py-3">
          <Row gap="sm" align="center">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">Acme Analytics</span>
            <Badge variant="success-soft">Live</Badge>
          </Row>
          <Row gap="sm">
            <Button variant="ghost" size="sm">
              Export
            </Button>
            <Button size="sm">Share</Button>
          </Row>
        </div>
      </AppShellHeader>

      <AppShellMain className="min-h-0 overflow-hidden p-6">
        <Stack gap="lg">
          <Grid cols={4} gap="md">
            <Kpi icon={Activity} label="Revenue" value="$48,259" delta="+24% MoM" />
            <Kpi icon={Users} label="Active devs" value="12,480" delta="+12.3%" />
            <Kpi
              icon={TrendingDown}
              label="Churn"
              value="1.1%"
              delta="-0.2%"
              up={false}
            />
            <Kpi icon={Zap} label="Conversion" value="2.4%" delta="+0.5%" />
          </Grid>

          <Grid cols={2} gap="md">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pipeline, by stage</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="sm">
                  {STAGES.map((s) => (
                    <Row key={s.name} gap="sm" align="center">
                      <span className="w-20 shrink-0 text-xs text-muted-foreground">
                        {s.name}
                      </span>
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${s.v}%` }}
                        />
                      </span>
                      <span className="w-8 text-right text-xs font-medium tabular-nums">
                        {s.v}
                      </span>
                    </Row>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Live activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="none">
                  {FEED.map((f, idx) => (
                    <div key={f.who}>
                      {idx > 0 && <Separator />}
                      <Row justify="between" align="center" className="py-2.5">
                        <Row gap="sm" align="center">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="text-sm">
                            <span className="font-medium">{f.who}</span>{" "}
                            <span className="text-muted-foreground">{f.what}</span>
                          </span>
                        </Row>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {f.when}
                        </span>
                      </Row>
                    </div>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}

export default function App() {
  // Wrap any screen in <ScreenAnimator shots={...}> to give it a directed
  // camera. Everything below is a normal, live Grade screen.
  return (
    <ScreenAnimator shots={SHOTS}>
      <Dashboard />
    </ScreenAnimator>
  );
}
