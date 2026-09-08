"use client";

/**
 * Beacon badge treatments, side by side, so the pick is made by eye.
 * Every colour is a DS token; the pairings follow the accessible
 * pairings chart (800/300, 700/100, 950/400). The glows are box-shadows
 * on token colours, from quiet to loud.
 */

import Link from "next/link";

function Row({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 border-t py-6 md:grid-cols-[16rem_1fr]">
      <div>
        <p className="text-heading-subsection">{title}</p>
        <p className="text-body-sm text-muted-foreground">{note}</p>
      </div>
      <div className="flex flex-wrap items-center gap-6">{children}</div>
    </div>
  );
}

const Surface = ({ children, grey = false, dark = false }: { children: React.ReactNode; grey?: boolean; dark?: boolean }) => (
  <div className={`flex items-center gap-3 rounded-xl border px-6 py-5 ${dark ? "bg-[var(--ds-tailwind-colors-neutral-900)]" : grey ? "bg-[var(--ds-tailwind-colors-neutral-50)]" : "bg-[var(--ds-tailwind-colors-base-white)]"}`}>{children}</div>
);

const G = (n: number) => `var(--ds-tailwind-colors-green-${n})`;

const VARIANTS: { key: string; title: string; note: string; style?: React.CSSProperties; className: string; dark?: boolean }[] = [
  { key: "outline", title: "A. Outlined (current)", note: "Border, white fill, the word alone.", className: "border bg-[var(--ds-tailwind-colors-base-white)] text-foreground" },
  { key: "dark", title: "B. Dark, 800/300", note: "neutral-800 fill, green-300 text. The illustrations' rule as an AA pair.", className: "bg-[var(--ds-tailwind-colors-neutral-800)] text-[var(--ds-tailwind-colors-green-300)]" },
  { key: "green", title: "C. Green, 700/100", note: "green-700 fill, green-100 text. Loud.", className: "bg-[var(--ds-tailwind-colors-green-700)] text-[var(--ds-tailwind-colors-green-100)]" },
  { key: "glow-soft", title: "D. Soft glow", note: "Outlined, with a green-200 halo, 12px blur.", className: "border border-[var(--ds-tailwind-colors-green-300)] bg-[var(--ds-tailwind-colors-base-white)] text-foreground", style: { boxShadow: `0 0 12px 2px ${G(200)}` } },
  { key: "glow-vivid", title: "E. Vivid glow", note: "green-400 halo, 18px blur, on a green-50 fill. The beacon actually glowing.", className: "border border-[var(--ds-tailwind-colors-green-400)] bg-[var(--ds-tailwind-colors-green-50)] text-[var(--ds-tailwind-colors-green-900)]", style: { boxShadow: `0 0 18px 4px ${G(400)}` } },
  { key: "glow-neon", title: "F. Neon", note: "green-500 text on neutral-900, with a green-500 outer glow. Only works on a dark surface, so probably the modal header if anywhere.", className: "border border-[var(--ds-tailwind-colors-green-500)] bg-[var(--ds-tailwind-colors-neutral-900)] text-[var(--ds-tailwind-colors-green-400)]", style: { boxShadow: `0 0 16px 2px ${G(500)}, inset 0 0 8px ${G(900)}` }, dark: true },
  { key: "glow-breathe", title: "G. Breathing glow", note: "E, breathing slowly (reduced motion: static). Enthusiasm is a budget, so maybe only while Beacon is 'thinking'.", className: "beacon-breathe border border-[var(--ds-tailwind-colors-green-400)] bg-[var(--ds-tailwind-colors-green-50)] text-[var(--ds-tailwind-colors-green-900)]" },
  { key: "underglow", title: "H. Underglow", note: "Outlined, with the glow only underneath, like a lamp on a desk.", className: "border bg-[var(--ds-tailwind-colors-base-white)] text-foreground", style: { boxShadow: `0 8px 20px -4px ${G(400)}` } },
];

export default function BeaconBadgePage() {
  return (
    <div className="flex flex-col gap-2">
      <style>{`
        @keyframes beacon-breathe { 0%, 100% { box-shadow: 0 0 10px 2px ${G(300)}; } 50% { box-shadow: 0 0 22px 6px ${G(400)}; } }
        @media (prefers-reduced-motion: no-preference) { .beacon-breathe { animation: beacon-breathe 2.6s ease-in-out infinite; } }
        @media (prefers-reduced-motion: reduce) { .beacon-breathe { box-shadow: 0 0 18px 4px ${G(400)}; } }
      `}</style>
      <p className="text-muted-foreground text-sm"><Link href="/docs" className="hover:underline">Docs</Link></p>
      <h1 className="text-heading-page">Beacon badge treatments</h1>
      <p className="text-body text-muted-foreground max-w-prose">
        Eight treatments of the same word, on white, on the grey panel, and where it matters on dark. Tokens only; the glows are box-shadows on green-200 to green-500.
      </p>
      {VARIANTS.map((v) => (
        <Row key={v.key} title={v.title} note={v.note}>
          <Surface dark={v.dark}><Badge className={v.className} style={v.style} /></Surface>
          <Surface grey={!v.dark} dark={v.dark}><Badge className={v.className} style={v.style} /></Surface>
          {v.dark ? null : <Surface dark><Badge className={v.className} style={v.style} /></Surface>}
        </Row>
      ))}
    </div>
  );
}

function Badge({ className, style }: { className: string; style?: React.CSSProperties }) {
  return (
    <span className={`text-label-sm inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 ${className}`} style={style}>
      Beacon
      <span className="border-l border-current/30 pl-1.5 opacity-70">Beta</span>
    </span>
  );
}
