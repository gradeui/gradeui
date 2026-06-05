/**
 * @label       Motion depth reel (blur · parallax · z-index)
 * @description Camera-department tricks over live JSX — rack focus (blur pulls between a foreground screen and background type), true 3D parallax layers drifting at different speeds, a zoom-through where the screen scales PAST the camera plane and hands focus to the layer behind it (z-index swap mid-flight), and a frosted-glass stat panel floating over a live dashboard.
 * @tags        motion depth blur parallax z-index rack focus zoom through glass backdrop-filter perspective layers cinematic product reel dof depth of field
 * @notes       All depth is CSS: filter blur for focus pulls, perspective + translateZ for parallax, backdrop-filter for glass, animated z-index/scale for the zoom-through. Runs over live screens — pause it and everything is still interactive. Needs @gradeui/ui dist with Motion: `pnpm -F @gradeui/ui build`.
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
      <Grid className="grid-cols-2 gap-4">
        <Card><CardContent className="h-32 p-4" /></Card>
        <Card><CardContent className="h-32 p-4" /></Card>
      </Grid>
    </Stack>
  );
}

// Full-bleed FX layer helper — absolute, non-interactive, z-stacked.
function Layer({ z = 0, children, style }) {
  return (
    <div
      aria-hidden
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: z, ...style }}
    >
      {children}
    </div>
  );
}

export default function App() {
  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <style>{`
        @keyframes gdsFxRackBg   { 0%, 38% { filter: blur(14px); opacity: 0.55 } 55%, 100% { filter: blur(0); opacity: 1 } }
        @keyframes gdsFxRackFg   { 0%, 38% { filter: blur(0) } 55%, 100% { filter: blur(12px); opacity: 0.6 } }
        @keyframes gdsFxDriftA   { from { transform: translate3d(-3%, 0, -300px) } to { transform: translate3d(3%, 0, -300px) } }
        @keyframes gdsFxDriftB   { from { transform: translate3d(4%, 1%, -120px) } to { transform: translate3d(-4%, -1%, -120px) } }
        @keyframes gdsFxThrough  { 0% { transform: scale(0.9); filter: blur(0); z-index: 3 }
                                   60% { transform: scale(1.6); filter: blur(2px) }
                                   100% { transform: scale(3.4); filter: blur(18px); opacity: 0; z-index: 3 } }
        @keyframes gdsFxRise     { from { opacity: 0; transform: translateY(30px) scale(0.96) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes gdsFxGlassIn  { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
      <Motion>
        {/* 1 — RACK FOCUS: giant type sharp behind a blurred screen, then
            the focus pulls and they swap. Two layers, two blur tracks. */}
        <MotionScene label="Rack focus" durationMs={8000}>
          <Layer z={1} style={{ display: "grid", placeItems: "center", animation: "gdsFxRackBg 8s ease both" }}>
            <div style={{ fontSize: "11vw", fontWeight: 900, letterSpacing: "-0.04em", color: "#fff" }}>
              FOCUS
            </div>
          </Layer>
          <Layer z={2} style={{ display: "grid", placeItems: "center", animation: "gdsFxRackFg 8s ease both" }}>
            <div style={{ width: "58%", aspectRatio: "16/10", borderRadius: 12, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
              <DashboardScreen />
            </div>
          </Layer>
        </MotionScene>

        {/* 2 — PARALLAX: three type layers drifting at different depths
            under a real perspective. The deepest moves least. */}
        <MotionScene label="Parallax" durationMs={8000} fill="#07070a">
          <Layer style={{ perspective: "900px" }}>
            <Layer style={{ display: "grid", placeItems: "center", animation: "gdsFxDriftA 8s ease-in-out infinite alternate" }}>
              <div style={{ fontSize: "18vw", fontWeight: 900, color: "rgba(255,255,255,0.08)", whiteSpace: "nowrap" }}>DEPTH DEPTH</div>
            </Layer>
            <Layer style={{ display: "grid", placeItems: "center", animation: "gdsFxDriftB 8s ease-in-out infinite alternate" }}>
              <div style={{ fontSize: "9vw", fontWeight: 800, color: "rgba(255,255,255,0.35)", filter: "blur(1px)" }}>has layers</div>
            </Layer>
          </Layer>
          <MotionText className="relative z-10" template="title" heading="Your product has depth." text="show it" />
        </MotionScene>

        {/* 3 — ZOOM-THROUGH: the screen scales PAST the camera plane,
            blurring out as it passes, revealing the message behind it. */}
        <MotionScene label="Zoom through" durationMs={7000} fill="#0b0b0e">
          <Layer z={1} style={{ display: "grid", placeItems: "center" }}>
            <div style={{ animation: "gdsFxRise 1.2s 2.8s ease both", textAlign: "center", color: "#fff" }}>
              <div style={{ fontSize: "7vw", fontWeight: 900, letterSpacing: "-0.03em" }}>And beyond.</div>
              <div style={{ marginTop: 10, opacity: 0.6, fontSize: 16 }}>the camera keeps going</div>
            </div>
          </Layer>
          <Layer z={3} style={{ display: "grid", placeItems: "center" }}>
            <div style={{ width: "56%", aspectRatio: "16/10", borderRadius: 12, overflow: "hidden", animation: "gdsFxThrough 4s cubic-bezier(0.5,0,0.8,0.4) both" }}>
              <DashboardScreen />
            </div>
          </Layer>
        </MotionScene>

        {/* 4 — GLASS: frosted stat panel floating OVER the live screen
            (backdrop-filter does the blur; the screen stays live under it). */}
        <MotionScene label="Glass">
          <MotionScreen shots={[{ zoom: 1.05, cx: 0.5, cy: 0.45, hold: 5200 }]} cursor={false}>
            <DashboardScreen />
          </MotionScreen>
          <Layer z={5} style={{ display: "grid", placeItems: "end center", paddingBottom: "8%" }}>
            <div
              style={{
                display: "flex",
                gap: 28,
                padding: "18px 28px",
                borderRadius: 16,
                background: "rgba(15,15,20,0.35)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "#fff",
                animation: "gdsFxGlassIn 900ms 600ms cubic-bezier(0.22,1,0.36,1) both",
              }}
            >
              {[["+24%", "revenue"], ["12.4k", "devs"], ["2.4%", "conversion"]].map(([v, l]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 800 }}>{v}</div>
                  <div style={{ fontSize: 11, opacity: 0.65 }}>{l}</div>
                </div>
              ))}
            </div>
          </Layer>
        </MotionScene>

        {/* 5 — close */}
        <MotionScene label="Close" fill="#07070a">
          <MotionText template="section-break" heading="Depth. Live." />
        </MotionScene>
      </Motion>
    </div>
  );
}
