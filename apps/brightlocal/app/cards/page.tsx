import Link from "next/link";
import { CARDS } from "@/lib/cards";

/** The cut-scene cards, as a contact sheet. Each opens full frame. */
export default function CardsIndex() {
  return (
    <div className="flex min-h-screen flex-col gap-6 p-10">
      <div className="flex flex-col gap-1">
        <p className="text-heading-page">Cut-scene cards</p>
        <p className="text-body text-muted-foreground max-w-prose">Full-frame 16:9 cards for the walkthrough videos and Figma Slides. Open one at 1920 by 1080 and screenshot it.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => (
          <li key={c.slug}>
            <Link href={`/cards/${c.slug}`} className="flex aspect-video flex-col justify-end gap-1 rounded-xl p-4 transition-shadow hover:shadow-md" style={{ background: c.surface, color: c.ink === "white" ? "var(--ds-tailwind-colors-base-white)" : "var(--ds-tailwind-colors-neutral-950)" }}>
              <span className="text-label-sm font-semibold uppercase tracking-widest opacity-80">{c.kicker}</span>
              <span className="text-heading-subsection">{c.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
