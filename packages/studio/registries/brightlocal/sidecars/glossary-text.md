---
name: GlossaryText
import: "@brightlocal/proposal"
props:
  - children — A plain STRING of prose. Non-string children pass straight through untouched, so it's safe to wrap conditionally.
  - once?: boolean — Annotate only the FIRST use of each term (default true; matches the glossary's "expand on first use" rule). Pass false to annotate every occurrence.
  - dataHook?: string — Instance prefix for the per-term data-hooks. (default "glossary")
when_to_use: Wrap PROSE to auto-explain Local-SEO jargon — it scans the text for known terms (GBP, NAP, Citation, SERP, Geo-grid, SoLV, Review velocity) and wraps each in a dashed-underlined GlossaryTerm that opens a Popover with a plain-language definition. Use on summaries, recommendations, action text, insight bodies. The terms mirror rules/10-glossary.md (the LLM's source of truth). NEVER wrap text that already sits inside an interactive control (an AccordionTrigger, a Button) — GlossaryTerm renders a <button>, and nested buttons are invalid HTML. Also exported: GlossaryTerm (one term) and GLOSSARY (the term/definition list).
composes_with: [ModuleScoreCard, AreaInsights, InsightCard, InsightAction, Popover]
---

```jsx
<p className="text-sm text-[var(--ds-tailwind-colors-neutral-600)]">
  <GlossaryText dataHook="rec-glossary">{item.recommendation}</GlossaryText>
</p>
```

Ships in "@brightlocal/proposal" — never inline a copy. To add a term,
edit rules/10-glossary.md AND the GLOSSARY mirror in
lib/proposal-glossary.jsx (keep them in sync).
