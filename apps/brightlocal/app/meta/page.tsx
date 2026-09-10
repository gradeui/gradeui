/**
 * The index of /meta. There are four of these surfaces now and none of them
 * linked to any other, so finding the video library meant remembering the
 * URL. Nothing in the product links here, and the whole app is noindex.
 */

import Link from "next/link";
import { ArrowRight } from "@brightlocal/icons";
import { VIDEOS } from "@/lib/videos";
import { CARDS } from "@/lib/cards";
import { STATES, STATE_SECTIONS } from "@/lib/states";

const SURFACES = [
  {
    href: "/meta/videos",
    title: "Videos",
    line: "The walkthroughs, with sections you can jump between, a transcript and a subtitle track.",
    count: () => `${VIDEOS.length} videos`,
  },
  {
    href: "/meta/states",
    title: "States",
    line: "Every interaction state with the note that would have gone beside it in Figma. Tap one and the frame opens the real page driven into it.",
    count: () => `${STATES.length} states, ${STATE_SECTIONS.length} sections`,
  },
  {
    href: "/meta/deck",
    title: "The deck",
    line: "The same story as pages, sized for print. Add ?print=1 to open the browser's print dialog straight away.",
    count: () => "A4 landscape",
  },
  {
    href: "/meta/cards",
    title: "Cut-scene cards",
    line: "Every full-frame title card the videos use, and the same frames for Figma Slides.",
    count: () => `${CARDS.length} cards`,
  },
  {
    href: "/meta/capture?url=/locations/minus-one-studios/reviews",
    title: "The capture stage",
    line: "The coloured canvas the recorder drives. Takes url, w, h, bg, caption and card as query parameters.",
    count: () => "1920 x 1080",
  },
];

export default function MetaIndexPage() {
  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading-page font-display">Behind the prototype</h1>
        <p className="text-body text-muted-foreground max-w-[65ch] text-pretty">
          The surfaces that make the collateral rather than the product. Nothing here is linked from
          the app, and the whole prototype is noindex.
        </p>
      </header>
      <ul className="flex flex-col gap-3">
        {SURFACES.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="hover:bg-accent group flex items-start gap-4 rounded-xl border p-5 transition-colors"
            >
              <span className="flex grow flex-col gap-1">
                <span className="text-heading-subsection font-display group-hover:underline">{s.title}</span>
                <span className="text-body-sm text-muted-foreground text-pretty">{s.line}</span>
              </span>
              <span className="text-label-sm text-muted-foreground shrink-0 pt-1">{s.count()}</span>
              <ArrowRight className="mt-1 size-5 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
