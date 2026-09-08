"use client";

/**
 * Beacon badge treatments, side by side, so the pick is made by eye.
 * Every colour is a DS token, and the pairings follow the accessible
 * pairings chart (800/300 for small text, 700/100, 950/400).
 */

import Link from "next/link";

function Row({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 border-t py-6 md:grid-cols-[14rem_1fr]">
      <div>
        <p className="text-heading-subsection">{title}</p>
        <p className="text-body-sm text-muted-foreground">{note}</p>
      </div>
      <div className="flex flex-wrap items-center gap-6">{children}</div>
    </div>
  );
}

const Surface = ({ children, grey = false }: { children: React.ReactNode; grey?: boolean }) => (
  <div className={`flex items-center gap-3 rounded-xl border px-5 py-4 ${grey ? "bg-[var(--ds-tailwind-colors-neutral-50)]" : "bg-[var(--ds-tailwind-colors-base-white)]"}`}>{children}</div>
);

export default function BeaconBadgePage() {
  return (
    <div className="flex flex-col gap-2">
      <style>{`
        @keyframes beacon-pulse { 0% { box-shadow: 0 0 0 0 var(--ds-tailwind-colors-green-300); } 100% { box-shadow: 0 0 0 10px transparent; } }
        @media (prefers-reduced-motion: no-preference) { .beacon-live { animation: beacon-pulse 1.4s ease-out 1; } }
      `}</style>
      <p className="text-muted-foreground text-sm"><Link href="/docs" className="hover:underline">Docs</Link></p>
      <h1 className="text-heading-page">Beacon badge treatments</h1>
      <p className="text-body text-muted-foreground max-w-prose">
        Four treatments of the same mark, on white and on the grey panel. Tokens only; pairings from the DS accessible pairings chart.
      </p>

      <Row title="A. Outlined (current)" note="Border, white fill, the ✦ in green-500. Quiet, reads as a label.">
        <Surface><Badge variant="outline" /></Surface>
        <Surface grey><Badge variant="outline" /></Surface>
      </Row>
      <Row title="B. Dark, 800/300" note="neutral-800 fill, ✦ in green-300, text in neutral-100. The illustrations' rule as an AA pair.">
        <Surface><Badge variant="dark" /></Surface>
        <Surface grey><Badge variant="dark" /></Surface>
      </Row>
      <Row title="C. Halo" note="Outlined, with the ✦ sitting in a green-100 disc with a green-300 core. A pin glow, static.">
        <Surface><Badge variant="halo" /></Surface>
        <Surface grey><Badge variant="halo" /></Surface>
      </Row>
      <Row title="D. Live" note="C, pulsing once when the summary updates (reduced motion: none). Reload to see it.">
        <Surface><Badge variant="halo" live /></Surface>
        <Surface grey><Badge variant="halo" live /></Surface>
      </Row>
      <Row title="E. Green, 700/100" note="green-700 fill, ✦ and text in green-100. The loudest. Probably too much for every page, maybe right for the modal header.">
        <Surface><Badge variant="green" /></Surface>
        <Surface grey><Badge variant="green" /></Surface>
      </Row>
    </div>
  );
}

function Badge({ variant, live = false }: { variant: "outline" | "dark" | "halo" | "green"; live?: boolean }) {
  const base = "text-label-sm inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5";
  if (variant === "dark")
    return (
      <span className={`${base} bg-[var(--ds-tailwind-colors-neutral-800)] text-[var(--ds-tailwind-colors-neutral-100)]`}>
        <span aria-hidden className="text-[var(--ds-tailwind-colors-green-300)]">✦</span> Beacon
      </span>
    );
  if (variant === "green")
    return (
      <span className={`${base} bg-[var(--ds-tailwind-colors-green-700)] text-[var(--ds-tailwind-colors-green-100)]`}>
        <span aria-hidden>✦</span> Beacon
      </span>
    );
  if (variant === "halo")
    return (
      <span className={`${base} border bg-[var(--ds-tailwind-colors-base-white)] text-foreground`}>
        <span aria-hidden className={`inline-flex size-4 items-center justify-center rounded-full bg-[var(--ds-tailwind-colors-green-100)] text-[10px] text-[var(--ds-tailwind-colors-green-600)] ${live ? "beacon-live" : ""}`}>✦</span>
        Beacon
      </span>
    );
  return (
    <span className={`${base} border bg-[var(--ds-tailwind-colors-base-white)] text-foreground`}>
      <span aria-hidden className="text-[var(--ds-tailwind-colors-green-500)]">✦</span> Beacon
    </span>
  );
}
