// @brightlocal/proposal-glossary — inline jargon helpers. Local-SEO
// copy is acronym-heavy; rather than strip the jargon we EXPLAIN it.
// GlossaryText scans a string of prose and wraps the FIRST use of each
// known term in a GlossaryTerm — a dashed-underlined trigger that opens
// a Popover with a plain-language ("explain like I'm 12") definition.
//
// SOURCE OF TRUTH for the terms is rules/10-glossary.md (that file is
// fed to the LLM so generated copy uses them correctly). GLOSSARY below
// MIRRORS it, adding a plain-language gloss for the reader — keep the
// two in sync (it's only a handful of terms). If this list grows a lot,
// promote it to a generated module read straight from the markdown.
import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@brightlocal/ui-components";

// `pattern` is matched case-insensitively with word boundaries; `title`
// is the expanded term shown in the popover header; `definition` is the
// plain-language explanation (deliberately jargon-light).
export const GLOSSARY = [
  {
    term: "GBP",
    title: "Google Business Profile (GBP)",
    pattern: "GBP",
    definition:
      "Your business's Google listing — the panel with your map pin, opening hours, photos and reviews. Used to be called Google My Business.",
  },
  {
    term: "NAP",
    title: "NAP — Name, Address, Phone",
    pattern: "NAP",
    definition:
      "Your business Name, Address and Phone number. Keeping these written exactly the same everywhere online is the heart of good citations.",
  },
  {
    term: "Citation",
    title: "Citation",
    pattern: "citations?",
    definition:
      "Any online mention of your business's name, address and phone — directory sites, apps and map services.",
  },
  {
    term: "SERP",
    title: "SERP — Search Results Page",
    pattern: "SERP",
    definition:
      "The page of results you get after a Google search. The “local pack” is the little 3-result map box near the top.",
  },
  {
    term: "Geo-grid",
    title: "Geo-grid",
    pattern: "geo-?grid",
    definition:
      "A grid of points around your location where we check your ranking — so you can see where you show up on the map and where you don't.",
  },
  {
    term: "SoLV",
    title: "SoLV — Share of Local Voice",
    pattern: "SoLV",
    definition:
      "The share of those grid points where you rank in the top 3 — a simple “how visible am I on the map” score.",
  },
  {
    term: "Review velocity",
    title: "Review velocity",
    pattern: "review velocity",
    definition:
      "How quickly new reviews come in over time. A steady trickle matters more than one big burst.",
  },
];

// One alternation over every term, matched whole-word and case-
// insensitively. Stateful (/g) — reset lastIndex before each scan.
const COMBINED = new RegExp(
  `\\b(${GLOSSARY.map((g) => g.pattern).join("|")})\\b`,
  "gi",
);

function resolve(matchStr) {
  return GLOSSARY.find((g) => new RegExp(`^(?:${g.pattern})$`, "i").test(matchStr));
}

// One glossary term — a dashed-underline trigger that opens the Popover.
// NOTE: renders a <button>, so never place GlossaryText inside another
// interactive control (e.g. an AccordionTrigger) — nested buttons are
// invalid. Use it on prose only.
export function GlossaryTerm({ entry, children, dataHook }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-hook={dataHook}
          className="cursor-help underline decoration-dashed decoration-[var(--ds-tailwind-colors-neutral-400)] underline-offset-4 transition-colors hover:decoration-[var(--ds-tailwind-colors-neutral-700)]"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        dataHook={dataHook ? `${dataHook}-content` : "glossary-term-content"}
        className="max-w-xs space-y-1"
      >
        <p className="text-sm font-semibold">{entry.title}</p>
        <p className="text-sm leading-relaxed text-[var(--ds-tailwind-colors-neutral-600)]">
          {entry.definition}
        </p>
      </PopoverContent>
    </Popover>
  );
}

// Wrap plain text, annotating the FIRST use of each glossary term
// (matching the glossary's own "expand on first use" rule). Pass
// `once={false}` to annotate every occurrence. Non-string children pass
// straight through, so it's safe to wrap anything.
export function GlossaryText({ children, once = true, dataHook = "glossary" }) {
  if (typeof children !== "string" || !children) return children ?? null;
  const text = children;
  const nodes = [];
  const used = new Set();
  let last = 0;
  let m;
  COMBINED.lastIndex = 0;
  while ((m = COMBINED.exec(text)) !== null) {
    const matchStr = m[0];
    const entry = resolve(matchStr);
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (entry && !(once && used.has(entry.term))) {
      used.add(entry.term);
      nodes.push(
        <GlossaryTerm
          key={m.index}
          entry={entry}
          dataHook={`${dataHook}-${entry.term.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {matchStr}
        </GlossaryTerm>,
      );
    } else {
      nodes.push(matchStr);
    }
    last = m.index + matchStr.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}
