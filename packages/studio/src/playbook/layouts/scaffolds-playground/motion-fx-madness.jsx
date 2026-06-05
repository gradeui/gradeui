/**
 * @label       Motion FX madness (blend + mask reel)
 * @description The crazy one — massive slow text crawling across a LIVE dashboard in difference blend, a shader that's only visible THROUGH giant cut-out text (SVG mask), an overlay-blend stat slam, and a strobing exclusion close. Every effect runs over live, interactive JSX — the class of thing a rendered video can fake but never keep alive.
 * @tags        motion fx blend mode mask difference exclusion overlay marquee giant text shader mask madness crazy effects reel webgl
 * @notes       Blend modes (mix-blend-mode) + CSS masks over live screens — no video, no canvas baking. The mask scene cuts the shader through text via an inline SVG mask. Untimed FX scenes carry explicit durationMs. Needs @gradeui/ui dist with Motion: `pnpm -F @gradeui/ui build`. Crank the font sizes — they're meant to be too big.
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
        <Card><CardContent className="p-4 h-32" /></Card>
        <Card><CardContent className="p-4 h-32" /></Card>
      </Grid>
    </Stack>
  );
}

// Giant text crawling across the frame. `blend` decides how it eats the
// pixels underneath (difference = inverts, overlay = burns, exclusion =
// ghosts). Slow on purpose — speed is set by the keyframe duration.
function CrawlText({ children, blend = "difference", duration = "14s", top = "30%" }) {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <style>{`@keyframes gdsFxCrawl { from { transform: translateX(100%) } to { transform: translateX(-100%) } }`}</style>
      <div
        style={{
          position: "absolute",
          top,
          left: 0,
          right: 0,
          whiteSpace: "nowrap",
          fontSize: "22vw",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: "#fff",
          mixBlendMode: blend,
          animation: `gdsFxCrawl ${duration} linear infinite`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// A fill that only exists INSIDE giant text — an SVG mask cuts the layer.
function TextMask({ text, children }) {
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600'><text x='600' y='340' font-family='system-ui,sans-serif' font-size='230' font-weight='900' letter-spacing='-8' text-anchor='middle' fill='white'>${text}</text></svg>`,
  );
  const mask = `url("data:image/svg+xml,${svg}")`;
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: "cover",
        maskSize: "cover",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    >
      {children}
    </div>
  );
}

export default function App() {
  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <Motion>
        {/* 1 — massive text in difference blend CRAWLING over a live screen */}
        <MotionScene label="Crawl" durationMs={9000}>
          <MotionScreen shots={[{ zoom: 1.1, cx: 0.5, cy: 0.45, hold: 8200 }]} cursor={false} enter={false}>
            <DashboardScreen />
          </MotionScreen>
          <CrawlText blend="difference">LIVE · NOT A VIDEO · LIVE · NOT A VIDEO ·</CrawlText>
        </MotionScene>

        {/* 2 — the shader exists only INSIDE the giant text */}
        <MotionScene label="Mask" durationMs={7000} fill="#050507">
          <TextMask text="GRADE">
            <BackgroundFill type="shader" preset="mesh" />
          </TextMask>
        </MotionScene>

        {/* 3 — overlay-blend stat slam over a hot gradient */}
        <MotionScene label="Slam" durationMs={6500} fill="linear-gradient(120deg, #ff3d00, #7c1dff)">
          <CrawlText blend="overlay" duration="10s" top="22%">+24% +24% +24% +24%</CrawlText>
          <MotionText className="relative" template="title" heading="Numbers that hit" text="blend modes over live pixels" />
        </MotionScene>

        {/* 4 — exclusion ghost over the screen, slower, eerier */}
        <MotionScene label="Ghost" durationMs={9000}>
          <MotionScreen shots={[{ zoom: 0.95, cx: 0.5, cy: 0.5, hold: 8200 }]} cursor={false}>
            <DashboardScreen />
          </MotionScreen>
          <CrawlText blend="exclusion" duration="18s" top="55%">EDITABLE · THEMEABLE · ALIVE ·</CrawlText>
        </MotionScene>

        {/* 5 — close */}
        <MotionScene label="Close" fill="#050507">
          <MotionText template="section-break" heading="Try doing that in a video." />
        </MotionScene>
      </Motion>
    </div>
  );
}
