import type { ReactNode } from "react";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { InstallBlock } from "@/components/install-block";
import { PropsTable } from "@/components/props-table";
import { Logo } from "@/components/ui/logo";

// ── Demo artwork ─────────────────────────────────────────────────────
// The consumer supplies their own SVG / <img> per slot. These stand-ins
// show the variations; the colour ones pin their own fills, the mono one
// paints with `currentColor` so it inherits the surrounding text colour.
function MarkColor({ on = "light" }: { on?: "light" | "dark" }) {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="32" height="32" rx="8" fill={on === "dark" ? "#fff" : "#111"} />
      <path
        d="M9 22V10h6.2c3.1 0 5 1.7 5 4.2 0 1.7-.9 3-2.4 3.6L21 22h-3.3l-2.7-3.7H12V22H9zm3-6.2h3c1.3 0 2.1-.6 2.1-1.6 0-1-.8-1.6-2.1-1.6h-3v3.2z"
        fill={on === "dark" ? "#111" : "#fff"}
      />
    </svg>
  );
}
function MarkMono() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden fill="currentColor">
      <rect width="32" height="32" rx="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M9 22V10h6.2c3.1 0 5 1.7 5 4.2 0 1.7-.9 3-2.4 3.6L21 22h-3.3l-2.7-3.7H12V22H9zm3-6.2h3c1.3 0 2.1-.6 2.1-1.6 0-1-.8-1.6-2.1-1.6h-3v3.2z" />
    </svg>
  );
}
function Wordmark({ on = "light" }: { on?: "light" | "dark" }) {
  const fg = on === "dark" ? "#fff" : "#111";
  return (
    <svg viewBox="0 0 120 32" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="32" height="32" rx="8" fill={fg} />
      <path
        d="M9 22V10h6.2c3.1 0 5 1.7 5 4.2 0 1.7-.9 3-2.4 3.6L21 22h-3.3l-2.7-3.7H12V22H9zm3-6.2h3c1.3 0 2.1-.6 2.1-1.6 0-1-.8-1.6-2.1-1.6h-3v3.2z"
        fill={on === "dark" ? "#111" : "#fff"}
      />
      <text x="42" y="22" fontFamily="ui-sans-serif, system-ui" fontWeight="700" fontSize="18" fill={fg}>
        Grade
      </text>
    </svg>
  );
}

const demoSources = {
  square: { light: <MarkColor on="light" />, dark: <MarkColor on="dark" />, mono: <MarkMono /> },
  horizontal: { light: <Wordmark on="light" />, dark: <Wordmark on="dark" /> },
  icon: { light: <MarkColor on="light" />, dark: <MarkColor on="dark" />, mono: <MarkMono /> },
};

const logoProps = [
  {
    name: "sources",
    type: "{ square?, horizontal?, icon? } where each is { light?, dark?, mono? }",
    default: "—",
    description:
      "Required. The brand artwork keyed by lockup then appearance. Each slot is any node — inline <svg>, <img>, or a component. Supply only what you have; it falls back across appearances and lockups.",
  },
  {
    name: "lockup",
    type: '"square" | "horizontal" | "icon"',
    default: '"horizontal"',
    description: "Which lockup to render. Falls back to another lockup if this one has no artwork.",
  },
  {
    name: "mode",
    type: '"light" | "dark"',
    default: '"light"',
    description: "The background the logo sits on — selects the light or dark artwork. Explicit, not theme-coupled.",
  },
  {
    name: "mono",
    type: "boolean",
    default: "false",
    description: "Render the monochrome artwork instead of full colour. Mono inherits currentColor.",
  },
  {
    name: "size",
    type: '"sm" | "md" | "lg" | "xl" | number',
    default: '"md"',
    description: "Height of the logo (sm 20 · md 28 · lg 40 · xl 56, or a raw pixel number). Width is intrinsic.",
  },
  {
    name: "label",
    type: "string",
    default: "—",
    description: "Accessible name (the brand name) → aria-label + role=\"img\".",
  },
  {
    name: "decorative",
    type: "boolean",
    default: "false",
    description: "Mark the logo aria-hidden — use when the brand name is already in the DOM beside it.",
  },
  {
    name: "href",
    type: "string",
    default: "—",
    description: "Optional link target — renders the logo as an <a> (logo-links-home).",
  },
];

function Preview({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-6 rounded-lg border border-border p-6 ${className}`}>
      {children}
    </div>
  );
}

export default function LogoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Logo</h1>
        <p className="text-lg text-muted-foreground mt-2">
          A brand mark with built-in lockup, on-light / on-dark, and monochrome
          variations. You supply the artwork per slot; Logo renders the right
          one for the context, so toolbars, sidenavs, and footers all reach for
          the same component.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <InstallBlock>{`import { Logo } from "@gradeui/ui"`}</InstallBlock>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Lockups
        </h2>
        <p className="leading-7 text-muted-foreground">
          Pick the shape that fits the space: <code>square</code> for tight
          chrome, <code>horizontal</code> for headers, <code>icon</code> for the
          bare symbol.
        </p>
        <Preview>
          <Logo sources={demoSources} lockup="square" size="lg" label="Grade" />
          <Logo sources={demoSources} lockup="horizontal" size="lg" label="Grade" />
          <Logo sources={demoSources} lockup="icon" size="lg" label="Grade" />
        </Preview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          On light / on dark
        </h2>
        <p className="leading-7 text-muted-foreground">
          Set <code>mode</code> to the background the logo sits on; it swaps to
          the matching artwork (not a CSS inversion).
        </p>
        <Preview>
          <Logo sources={demoSources} lockup="horizontal" mode="light" size="lg" label="Grade" />
        </Preview>
        <Preview className="bg-zinc-900 text-white border-zinc-800">
          <Logo sources={demoSources} lockup="horizontal" mode="dark" size="lg" label="Grade" />
        </Preview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Monochrome
        </h2>
        <p className="leading-7 text-muted-foreground">
          <code>mono</code> renders the single-colour artwork, which inherits{" "}
          <code>currentColor</code> — set the text colour on a parent to tint it
          for any surface.
        </p>
        <Preview>
          <span className="text-foreground">
            <Logo sources={demoSources} lockup="square" mono size="lg" label="Grade" />
          </span>
          <span className="text-primary">
            <Logo sources={demoSources} lockup="square" mono size="lg" label="Grade" />
          </span>
          <span className="text-muted-foreground">
            <Logo sources={demoSources} lockup="square" mono size="lg" label="Grade" />
          </span>
        </Preview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Sizes
        </h2>
        <Preview>
          <Logo sources={demoSources} lockup="square" size="sm" label="Grade" />
          <Logo sources={demoSources} lockup="square" size="md" label="Grade" />
          <Logo sources={demoSources} lockup="square" size="lg" label="Grade" />
          <Logo sources={demoSources} lockup="square" size="xl" label="Grade" />
        </Preview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <InstallBlock>{`// Supply your brand's artwork per slot once, reuse everywhere.
const brand = {
  square: { light: <LogoSquare />, dark: <LogoSquareWhite />, mono: <LogoGlyph /> },
  horizontal: { light: <LogoWide />, dark: <LogoWideWhite /> },
  icon: { mono: <LogoGlyph /> },
};

// Sidenav header (dark surface), links home:
<Logo sources={brand} lockup="horizontal" mode="dark" href="/" label="Acme" />

// Collapsed rail — square mark:
<Logo sources={brand} lockup="square" size="sm" label="Acme" />`}</InstallBlock>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={logoProps} />
      </div>

      <SidecarBlock slug="logo" />

      <ComponentNav currentHref="/components/logo" />
    </div>
  );
}
