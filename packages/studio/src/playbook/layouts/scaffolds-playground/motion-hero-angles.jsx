/**
 * @label       Motion hero angles (3D product shots)
 * @description The Apple-product-page genre over live JSX — a screen tilted in 3D and LOOMING close to the camera, slowly settling flat; a leaning "keynote" hero with a floor reflection; an isometric wall of screens drifting by at an angle; and a phone floating in 3D that rights itself. Perspective, rotation, and depth on real interactive UI.
 * @tags        motion hero angle 3d perspective rotate tilt product shot apple keynote isometric reflection float close to camera dramatic
 * @notes       All 3D is CSS transforms: a `perspective` wrapper + rotateX/rotateY/translateZ on the screen, animated. The reflection is the same screen flipped with a fade mask. transform-style: preserve-3d keeps layers honest. Needs @gradeui/ui dist with Motion: `pnpm -F @gradeui/ui build`.
 */
import {
  Motion,
  MotionScene,
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
        <Card><CardContent className="h-28 p-4" /></Card>
        <Card><CardContent className="h-28 p-4" /></Card>
      </Grid>
    </Stack>
  );
}

function MobileScreen() {
  return (
    <Stack gap="md" className="h-full bg-background p-4">
      <div className="text-base font-semibold">Acme</div>
      <Kpi icon={TrendingUp} label="Revenue" value="$48k" delta="+24%" />
      <Button className="w-full">Open dashboard</Button>
    </Stack>
  );
}

export default function App() {
  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <style>{`
        @keyframes gdsHeroLoom {
          0%   { transform: rotateX(16deg) rotateY(-24deg) translateZ(340px) translateY(4%); }
          100% { transform: rotateX(4deg) rotateY(-8deg) translateZ(60px) translateY(0); }
        }
        @keyframes gdsHeroLean {
          from { transform: rotateX(38deg) translateY(14%) scale(0.92); opacity: 0; }
          to   { transform: rotateX(18deg) translateY(0) scale(1); opacity: 1; }
        }
        @keyframes gdsHeroIso {
          from { transform: rotateX(28deg) rotateZ(-18deg) translateX(6%); }
          to   { transform: rotateX(28deg) rotateZ(-18deg) translateX(-10%); }
        }
        @keyframes gdsHeroPhone {
          0%   { transform: rotateY(-38deg) rotateX(10deg) translateZ(180px); }
          55%  { transform: rotateY(10deg) rotateX(-4deg) translateZ(120px); }
          100% { transform: rotateY(0) rotateX(0) translateZ(0); }
        }
        @keyframes gdsHeroGlow { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
      <Motion>
        {/* 1 — title sets it up */}
        <MotionScene label="Setup" durationMs={3600}>
          <MotionText template="title" heading="Get close." text="3D hero shots, on live UI" />
        </MotionScene>

        {/* 2 — THE LOOM: tilted, close to camera, settling toward flat */}
        <MotionScene label="Loom" durationMs={8000} fill="radial-gradient(circle at 65% 30%, #16162a, #07070a 70%)">
          <div aria-hidden style={{ position: "absolute", inset: 0, perspective: "1100px", display: "grid", placeItems: "center" }}>
            <div
              style={{
                width: "74%",
                aspectRatio: "16/10",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 60px 140px rgba(0,0,0,0.65), 0 0 80px rgba(99,102,241,0.25)",
                animation: "gdsHeroLoom 7s cubic-bezier(0.22,1,0.36,1) both",
              }}
            >
              <DashboardScreen />
            </div>
          </div>
        </MotionScene>

        {/* 3 — KEYNOTE LEAN: screen leaning back with a floor reflection */}
        <MotionScene label="Lean" durationMs={7000} fill="#07070a">
          <div aria-hidden style={{ position: "absolute", inset: 0, perspective: "1200px", display: "grid", placeItems: "center", transformStyle: "preserve-3d" }}>
            <div style={{ width: "64%" }}>
              <div
                style={{
                  aspectRatio: "16/10",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 40px 110px rgba(0,0,0,0.6)",
                  animation: "gdsHeroLean 1800ms cubic-bezier(0.22,1,0.36,1) both",
                }}
              >
                <DashboardScreen />
              </div>
              {/* the reflection — same screen, flipped + faded out */}
              <div
                style={{
                  aspectRatio: "16/10",
                  borderRadius: 12,
                  overflow: "hidden",
                  transform: "scaleY(-1) rotateX(18deg) translateY(-2%)",
                  WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.35), transparent 45%)",
                  maskImage: "linear-gradient(to top, rgba(0,0,0,0.35), transparent 45%)",
                  animation: "gdsHeroGlow 1800ms 600ms ease both",
                }}
              >
                <DashboardScreen />
              </div>
            </div>
          </div>
        </MotionScene>

        {/* 4 — ISOMETRIC WALL: a tilted grid of screens drifting past */}
        <MotionScene label="Isometric" durationMs={8000} fill="#0b0b10">
          <div aria-hidden style={{ position: "absolute", inset: 0, perspective: "1400px", overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                inset: "-20%",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 40,
                transformStyle: "preserve-3d",
                animation: "gdsHeroIso 8s linear both",
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: "16/10", borderRadius: 12, overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,0.5)", opacity: i % 2 ? 0.85 : 1 }}>
                  <DashboardScreen />
                </div>
              ))}
            </div>
          </div>
          <MotionText className="relative z-10" template="lower-third" heading="Every screen, every angle" />
        </MotionScene>

        {/* 5 — PHONE FLOAT: a tilted phone rights itself to camera */}
        <MotionScene label="Phone" durationMs={7000} fill="radial-gradient(circle at 40% 60%, #1d1a4b, #07070a 75%)">
          <div aria-hidden style={{ position: "absolute", inset: 0, perspective: "1000px", display: "grid", placeItems: "center" }}>
            <div
              style={{
                height: "72%",
                aspectRatio: "390/800",
                borderRadius: 28,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow: "0 50px 120px rgba(0,0,0,0.6)",
                animation: "gdsHeroPhone 5.5s cubic-bezier(0.22,1,0.36,1) both",
              }}
            >
              <MobileScreen />
            </div>
          </div>
        </MotionScene>

        {/* 6 — close */}
        <MotionScene label="Close" fill="#07070a">
          <MotionText template="section-break" heading="No renderer. Just CSS." />
        </MotionScene>
      </Motion>
    </div>
  );
}
