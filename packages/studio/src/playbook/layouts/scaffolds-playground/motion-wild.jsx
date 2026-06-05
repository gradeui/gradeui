/**
 * @label       Motion WILD (the everything reel)
 * @description The flagship — one film mixing every trick in the box: a WebGL shader running under the whole reel, blur-in giant type, difference-blend text crawling over live UI, a shader cut through a text mask, desktop + mobile screens with their own cameras, an ANIMATED CHAT scene with a genuinely working composer floating glass-on-shader (type into it mid-film), a frosted stat panel, a 3D hero loom, hard-cut word beats, and a calm close. A mix of any and all elements.
 * @tags        motion wild flagship everything reel shader webgl blur mask blend gradient chat composer glass mobile desktop hero 3d kinetic type showcase demo
 * @notes       The Motion-level `backdrop` is a live <ThreeScene> — every scene without an opaque fill floats on it. The chat scene is real components (Message-style rows + AIChatComposer) revealed on CSS delays; the composer is interactive during playback. Needs @gradeui/ui dist with Motion: `pnpm -F @gradeui/ui build`. Heavy by design — this is the showpiece, not the starter.
 */
import * as React from "react";
import {
  Motion,
  MotionScene,
  MotionScreen,
  MotionText,
  ThreeScene,
  Avatar,
  AvatarFallback,
  Stack,
  Row,
  Grid,
  Card,
  CardContent,
  Badge,
  Button,
} from "@gradeui/ui";
import { TrendingUp, Users, Zap, SendHorizonal } from "lucide-react";

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

function Layer({ z = 0, children, style }) {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: z, ...style }}>
      {children}
    </div>
  );
}

// ── The phone wall ──────────────────────────────────────────────────────
// A lightweight phone card whose CONTENT keeps animating (pulse dot,
// breathing bar) while its column scrolls while the wall sits on a 3D
// angle. Triple-layered motion.
function WallPhone({ title, accent = "oklch(var(--primary))" }) {
  return (
    <div
      style={{
        aspectRatio: "390/800",
        borderRadius: 22,
        overflow: "hidden",
        background: "var(--gds-background, #fff)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: accent, animation: "gdsWildPulse 1600ms ease-in-out infinite" }} />
        <span style={{ fontSize: 12, fontWeight: 700 }}>{title}</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: accent, opacity: 0.85, animation: "gdsWildBar 2.8s ease-in-out infinite" }} />
      <div style={{ flex: 1, borderRadius: 10, background: "rgba(127,127,127,0.12)" }} />
      <div style={{ height: 6, width: "55%", borderRadius: 999, background: "rgba(127,127,127,0.3)" }} />
      <div style={{ height: 6, width: "38%", borderRadius: 999, background: "rgba(127,127,127,0.22)" }} />
    </div>
  );
}

// One scrolling column — children duplicated for a seamless loop;
// `reverse` flips the direction so neighbours pass each other.
function WallColumn({ speed = 22, reverse = false, titles }) {
  const cards = titles.map((t, i) => (
    <WallPhone key={i} title={t} accent={i % 2 ? "oklch(var(--accent, var(--primary)))" : "oklch(var(--primary))"} />
  ));
  return (
    <div style={{ overflow: "hidden", flex: 1 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          animation: `gdsWildScroll ${speed}s linear infinite ${reverse ? "reverse" : ""}`,
        }}
      >
        {cards}
        {cards.map((c, i) => React.cloneElement(c, { key: `b${i}` }))}
      </div>
    </div>
  );
}

// One chat row, revealed on a delay. Glass bubble on the shader.
function ChatRow({ delay, who, initials, children, me = false }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexDirection: me ? "row-reverse" : "row",
        animation: `gdsWildRise 600ms ${delay}ms cubic-bezier(0.22,1,0.36,1) both`,
      }}
    >
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div
        style={{
          maxWidth: "75%",
          padding: "9px 13px",
          borderRadius: 14,
          fontSize: 13.5,
          color: "#fff",
          background: me ? "rgba(99,102,241,0.5)" : "rgba(15,15,20,0.45)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.14)",
        }}
      >
        <div style={{ fontSize: 10.5, opacity: 0.6, marginBottom: 2 }}>{who}</div>
        {children}
      </div>
    </div>
  );
}

// The animated chat — rows reveal on a script; the input at the bottom
// is REAL (type into it mid-film). Deliberately dependency-free (a plain
// input in glass) so this scene can never take the reel down.
function WildChat() {
  const [value, setValue] = React.useState("");
  const [sent, setSent] = React.useState([]);
  const send = () => {
    if (value.trim()) setSent((s) => [...s, value.trim()]);
    setValue("");
  };
  return (
    <div style={{ width: "min(560px, 80%)", pointerEvents: "auto" }}>
      <Stack gap="sm">
        <ChatRow delay={300} who="Ada" initials="AL">Can we get the launch film out today?</ChatRow>
        <ChatRow delay={1400} who="You" initials="ME" me>Already done — it's a Motion, not a video.</ChatRow>
        <ChatRow delay={2600} who="Ada" initials="AL">…it's interactive?? I just clicked a button in it.</ChatRow>
        {sent.map((m, i) => (
          <ChatRow key={i} delay={0} who="You" initials="ME" me>{m}</ChatRow>
        ))}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            padding: "8px 10px 8px 16px",
            borderRadius: 999,
            background: "rgba(15,15,20,0.45)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.16)",
            animation: "gdsWildRise 600ms 3800ms cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Reply mid-film — this input is real…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 13.5,
            }}
          />
          <button
            type="button"
            onClick={send}
            aria-label="Send"
            style={{
              display: "grid",
              placeItems: "center",
              width: 30,
              height: 30,
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: "rgba(99,102,241,0.65)",
              color: "#fff",
            }}
          >
            <SendHorizonal size={14} />
          </button>
        </div>
      </Stack>
    </div>
  );
}

// Shader visible only through giant cut-out text.
function TextMask({ text, children }) {
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600'><text x='600' y='340' font-family='system-ui,sans-serif' font-size='250' font-weight='900' letter-spacing='-10' text-anchor='middle' fill='white'>${text}</text></svg>`,
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
      <style>{`
        @keyframes gdsWildRise   { from { opacity: 0; transform: translateY(22px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes gdsWildBlurIn { from { opacity: 0; filter: blur(26px); transform: scale(1.08) } to { opacity: 1; filter: blur(0); transform: scale(1) } }
        @keyframes gdsWildCrawl  { from { transform: translateX(100%) } to { transform: translateX(-100%) } }
        @keyframes gdsWildLoom   { from { transform: rotateX(15deg) rotateY(-22deg) translateZ(300px) } to { transform: rotateX(3deg) rotateY(-6deg) translateZ(40px) } }
        @keyframes gdsWildPop    { from { opacity: 0; transform: scale(0.7) } to { opacity: 1; transform: scale(1) } }
        @keyframes gdsWildScroll { from { transform: translateY(0) } to { transform: translateY(-50%) } }
        @keyframes gdsWildBar    { 0%, 100% { width: 30% } 50% { width: 86% } }
        @keyframes gdsWildPulse  { 0%, 100% { opacity: 1 } 50% { opacity: 0.35 } }
      `}</style>
      {/* The shader runs under the WHOLE film — scenes without an opaque
          fill float on it. (Valid presets: mesh, plasma, space,
          synthwave, voronoi, waves.) */}
      <Motion
        backdrop={
          <ThreeScene preset="plasma" aspect="auto" className="h-full w-full" />
        }
      >
        {/* 1 — blur-in cold open, straight onto the shader */}
        <MotionScene label="Open" durationMs={4600}>
          <div style={{ textAlign: "center", color: "#fff", animation: "gdsWildBlurIn 1500ms cubic-bezier(0.22,1,0.36,1) both" }}>
            <div style={{ fontSize: "9vw", fontWeight: 900, letterSpacing: "-0.04em" }}>This is not a video.</div>
          </div>
        </MotionScene>

        {/* 2 — difference-blend crawl over the live dashboard. The camera
            drifts between two framings so the scene moves even with the
            crawl behind glass. */}
        <MotionScene label="Crawl" durationMs={8000} fill="#0b0b0e">
          <MotionScreen
            shots={[
              { zoom: 1.05, cx: 0.45, cy: 0.4, hold: 3200 },
              { zoom: 1.25, cx: 0.6, cy: 0.5, hold: 3600, trans: 2600 },
            ]}
            cursor={false}
            enter={false}
          >
            <DashboardScreen />
          </MotionScreen>
          <Layer z={4} style={{ overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "28%", whiteSpace: "nowrap", fontSize: "20vw", fontWeight: 900, color: "#fff", mixBlendMode: "difference", animation: "gdsWildCrawl 13s linear infinite" }}>
              ALIVE · EDITABLE · YOURS ·
            </div>
          </Layer>
        </MotionScene>

        {/* 3 — shader through the mask */}
        <MotionScene label="Mask" durationMs={6000} fill="#050507">
          <TextMask text="WILD">
            <ThreeScene preset="synthwave" aspect="auto" className="h-full w-full" />
          </TextMask>
        </MotionScene>

        {/* 4 — the animated chat, glass on shader, composer is REAL */}
        <MotionScene label="Chat" durationMs={9000}>
          <WildChat />
        </MotionScene>

        {/* 5 — mobile + desktop, two cameras, on a THEME gradient —
            the fill reads the active theme's tokens, so re-theming the
            project re-colours the film. */}
        <MotionScene label="Duo" fill="linear-gradient(130deg, oklch(var(--background)), oklch(var(--primary)) 140%)">
          <MotionScreen device="mobile" shots={[{ zoom: 1, hold: 2200 }, { zoom: 1.7, cx: 0.5, cy: 0.3, hold: 2400, label: "Mobile" }]}>
            <MobileScreen />
          </MotionScreen>
          <MotionScreen shots={[{ zoom: 1, hold: 2600 }, { zoom: 2, cx: 0.2, cy: 0.3, hold: 2600, label: "Desktop" }]} spotlight>
            <DashboardScreen />
          </MotionScreen>
        </MotionScene>

        {/* 6 — THE PHONE WALL: four columns of animating mobile screens
            scrolling in opposite directions, the whole wall on a 3D
            angle. Mental mental. */}
        <MotionScene label="Wall" durationMs={9000} fill="#07070a">
          <Layer style={{ perspective: "1300px", overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                inset: "-28%",
                display: "flex",
                gap: 22,
                transform: "rotateX(16deg) rotateZ(-9deg) scale(1.12)",
                transformStyle: "preserve-3d",
              }}
            >
              <WallColumn speed={26} titles={["Pay", "Track", "Invest"]} />
              <WallColumn speed={20} reverse titles={["Chat", "Plan", "Notify"]} />
              <WallColumn speed={30} titles={["Stats", "Goals", "Stream"]} />
              <WallColumn speed={23} reverse titles={["Shop", "Book", "Listen"]} />
            </div>
          </Layer>
          <MotionText className="relative z-10" template="lower-third" heading="One system, every screen" text="all of them alive" />
        </MotionScene>

        {/* 7 — 3D hero loom on the shader */}
        <MotionScene label="Loom" durationMs={7500}>
          <Layer style={{ perspective: "1100px", display: "grid", placeItems: "center" }}>
            <div style={{ width: "72%", aspectRatio: "16/10", borderRadius: 14, overflow: "hidden", boxShadow: "0 60px 140px rgba(0,0,0,0.6)", animation: "gdsWildLoom 6.5s cubic-bezier(0.22,1,0.36,1) both" }}>
              <DashboardScreen />
            </div>
          </Layer>
          <MotionText template="lower-third" heading="Live UI, hero-shot" text="perspective + rotate, no renderer" />
        </MotionScene>

        {/* 7 — glass stat slam */}
        <MotionScene label="Stats" durationMs={5200} fill="rgba(5,5,7,0.35)">
          <div style={{ display: "flex", gap: 30, padding: "22px 34px", borderRadius: 18, background: "rgba(15,15,20,0.4)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.16)", color: "#fff", animation: "gdsWildRise 900ms 300ms cubic-bezier(0.22,1,0.36,1) both" }}>
            {[["+24%", "revenue"], ["12.4k", "devs"], ["10×", "faster"], ["0", "re-renders"]].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 34, fontWeight: 900 }}>{v}</div>
                <div style={{ fontSize: 11, opacity: 0.65 }}>{l}</div>
              </div>
            ))}
          </div>
        </MotionScene>

        {/* 8–10 — hard-cut word beats */}
        <MotionScene label="Beat 1" durationMs={1300} transition="none" fill="#0b0b0e">
          <div style={{ fontSize: "13vw", fontWeight: 900, color: "#fff", animation: "gdsWildPop 320ms ease both" }}>Build.</div>
        </MotionScene>
        <MotionScene label="Beat 2" durationMs={1300} transition="none" fill="#e8ff47">
          <div style={{ fontSize: "13vw", fontWeight: 900, color: "#101014", animation: "gdsWildPop 320ms ease both" }}>Direct.</div>
        </MotionScene>
        <MotionScene label="Beat 3" durationMs={1300} transition="none" fill="oklch(var(--primary))">
          <div style={{ fontSize: "13vw", fontWeight: 900, color: "oklch(var(--primary-foreground))", animation: "gdsWildPop 320ms ease both" }}>Ship.</div>
        </MotionScene>

        {/* 11 — calm close, shader breathing behind */}
        <MotionScene label="Close">
          <MotionText template="title" heading="Grade Motion" text="any element · any scene · still alive" />
        </MotionScene>
      </Motion>
    </div>
  );
}
