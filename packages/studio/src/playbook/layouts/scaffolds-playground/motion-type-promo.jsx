/**
 * @label       Motion type promo (kinetic text reel)
 * @description A text-first launch promo in the style of the best product keynote videos — word-by-word stagger reveals, a blur-in headline that sharpens as it lands, tracking that tightens on arrival, an oversized numeral slam, and a two-tone speed run of one-word scenes. Pure typography carrying the story; one screen cameo in the middle.
 * @tags        motion kinetic type typography text reel promo launch keynote stagger blur-in tracking numeral word by word manifesto
 * @notes       Every effect is a CSS animation declared in the scaffold's <style> block — copy a scene, change the words. Word stagger = per-word spans with incremental animation-delay. Untimed text scenes carry explicit durationMs so pacing is editable per scene. Needs @gradeui/ui dist with Motion: `pnpm -F @gradeui/ui build`.
 */
import {
  Motion,
  MotionScene,
  MotionScreen,
  MotionText,
  Stack,
  Row,
  Grid,
  Card,
  CardContent,
  Badge,
  Button,
} from "@gradeui/ui";
import { TrendingUp, Users, Zap } from "lucide-react";

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
    </Stack>
  );
}

// Word-by-word stagger: each word rises in on its own delay.
function StaggerLine({ words, size = "7vw", step = 180, color = "#fff" }) {
  return (
    <div style={{ textAlign: "center", lineHeight: 1.08 }}>
      {words.split(" ").map((w, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            marginRight: "0.28em",
            fontSize: size,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color,
            animation: `gdsTypeRise 700ms ${i * step}ms cubic-bezier(0.22,1,0.36,1) both`,
          }}
        >
          {w}
        </span>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <style>{`
        @keyframes gdsTypeRise    { from { opacity: 0; transform: translateY(0.6em) } to { opacity: 1; transform: translateY(0) } }
        @keyframes gdsTypeBlurIn  { from { opacity: 0; filter: blur(24px); transform: scale(1.06) } to { opacity: 1; filter: blur(0); transform: scale(1) } }
        @keyframes gdsTypeTrack   { from { letter-spacing: 0.5em; opacity: 0 } to { letter-spacing: -0.02em; opacity: 1 } }
        @keyframes gdsTypeSlam    { 0% { opacity: 0; transform: scale(2.6) } 60% { opacity: 1; transform: scale(0.96) } 100% { transform: scale(1) } }
        @keyframes gdsTypePop     { from { opacity: 0; transform: scale(0.7) } to { opacity: 1; transform: scale(1) } }
      `}</style>
      <Motion>
        {/* 1 — word-by-word manifesto open */}
        <MotionScene label="Open" durationMs={5200}>
          <StaggerLine words="Stop shipping screenshots." />
        </MotionScene>

        {/* 2 — blur-in headline that sharpens as it lands */}
        <MotionScene label="Blur in" durationMs={5000} fill="linear-gradient(150deg, #0b0b0e 60%, #1d1a4b)">
          <div style={{ textAlign: "center", color: "#fff", animation: "gdsTypeBlurIn 1400ms cubic-bezier(0.22,1,0.36,1) both" }}>
            <div style={{ fontSize: "8vw", fontWeight: 900, letterSpacing: "-0.035em" }}>Ship the thing.</div>
            <div style={{ marginTop: 12, opacity: 0.6, fontSize: 17 }}>live, interactive, on brand</div>
          </div>
        </MotionScene>

        {/* 3 — tracking tightens on arrival (the luxury-brand move) */}
        <MotionScene label="Tracking" durationMs={4800} fill="#f5f5f7">
          <div
            style={{
              fontSize: "6vw",
              fontWeight: 300,
              color: "#101014",
              textTransform: "uppercase",
              animation: "gdsTypeTrack 1600ms cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            Precision
          </div>
        </MotionScene>

        {/* 4 — the product cameo, framed tight */}
        <MotionScene label="Cameo">
          <MotionScreen
            spotlight
            shots={[
              { zoom: 1, cx: 0.5, cy: 0.5, hold: 2000 },
              { zoom: 2.2, cx: 0.2, cy: 0.3, hold: 2400, label: "This is real UI" },
            ]}
          >
            <DashboardScreen />
          </MotionScreen>
        </MotionScene>

        {/* 5 — oversized numeral slam */}
        <MotionScene label="Numeral" durationMs={4600} fill="#e8ff47">
          <div style={{ textAlign: "center", color: "#101014" }}>
            <div style={{ fontSize: "26vw", fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.06em", animation: "gdsTypeSlam 900ms cubic-bezier(0.34,1.4,0.64,1) both" }}>
              10×
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, animation: "gdsTypeRise 700ms 500ms ease both" }}>
              faster than your video pipeline
            </div>
          </div>
        </MotionScene>

        {/* 6–8 — speed run: one word per scene, hard cuts, alternating tone */}
        <MotionScene label="Beat 1" durationMs={1400} transition="none" fill="#0b0b0e">
          <div style={{ fontSize: "13vw", fontWeight: 900, color: "#fff", animation: "gdsTypePop 350ms ease both" }}>Build.</div>
        </MotionScene>
        <MotionScene label="Beat 2" durationMs={1400} transition="none" fill="#e8ff47">
          <div style={{ fontSize: "13vw", fontWeight: 900, color: "#101014", animation: "gdsTypePop 350ms ease both" }}>Direct.</div>
        </MotionScene>
        <MotionScene label="Beat 3" durationMs={1400} transition="none" fill="#0b0b0e">
          <div style={{ fontSize: "13vw", fontWeight: 900, color: "#fff", animation: "gdsTypePop 350ms ease both" }}>Share.</div>
        </MotionScene>

        {/* 9 — close, calm */}
        <MotionScene label="Close" fill="linear-gradient(160deg, #0b0b0e 55%, #1d1a4b)">
          <MotionText template="title" heading="Grade Motion" text="gradeui.com" />
        </MotionScene>
      </Motion>
    </div>
  );
}
