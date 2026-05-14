# @gradeui/skills

Agent-shaped skills that ship with Grade — accessibility review, image
description, QA, brand consistency, etc. Each skill is a packaged unit of
focused expertise with a typed input/output contract.

## Why skills are a thing

The compose pipeline (in `@gradeui/studio`) has two kinds of passes:

| Kind | Implementation | Examples |
|---|---|---|
| Deterministic transform | code | scaffold, content fill, media-resolve |
| Agent review / generation | **skill** | image-describer, a11y-reviewer, qa, motion-planner |

Skills are the second kind. Packaged here (rather than inline in Studio) so
that:

- Downstream consumers can run the same passes from CI without pulling Studio
- Per-client packages (`@gradeui/skills-acme`) can override or add skills
- The same skill can be invoked from chat, the orchestrator, or a one-off script

## How a skill is structured

Each skill is a directory:

```
src/skills/<id>/
├── SKILL.md      # YAML frontmatter (id, name, description, deps, provider)
│                 # Markdown body = system prompt
├── schema.ts     # Zod inputSchema + outputSchema, optional formatInput
└── index.ts      # exports `load<Name>Skill()` — loader + schema pair
```

The SKILL.md is the source of truth for the *prompt* — it's readable, diffable,
and editable by non-programmers. The schema.ts is where TypeScript pulls its
weight: typed I/O contracts and complex input formatting (e.g. attaching an
image URL as a multimodal part).

## Adding a new skill

1. `mkdir packages/skills/src/skills/<id>` and add the three files.
2. Register the loader in `packages/skills/src/index.ts` `BUILTINS` map.
3. Done. The compose pipeline picks it up by id.

No orchestrator changes, no schema migrations — drop a folder, ship a skill.

## Running a skill

```ts
import { getSkill, runSkill } from "@gradeui/skills";

const describer = await getSkill("image-describer");

const description = await runSkill(describer, {
  input: {
    imageUrl: "https://media.gradeui.com/abc123.webp",
    prompt: "A surfboard on a sun-bleached wooden floor",
    context: "Hero of the 'Summer Drop' marketing page",
    designGuidance: "Warm, conversational. Avoid corporate boilerplate.",
    needCaption: true,
  },
});
//  → { alt, ariaDescription?, caption? }
```

## Provider config

The runner picks a model based on the skill's `defaultProvider` frontmatter,
with caller-side override available. Vision-tagged skills automatically get
vision-capable model defaults.

| Env var | Provider | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | anthropic | Default for vision; default if no other key set |
| `GOOGLE_GENERATIVE_AI_API_KEY` | google | |
| `OPENAI_API_KEY` | openai | |

## Built-in skills

| id | kind | description |
|---|---|---|
| `image-describer` | generation | alt + optional aria-description + brand-voiced caption for a generated image |
| `fidelity-grader` | review | output-vs-reference visual rubric (5 dimensions, 0-100) |
| `a11y-reviewer` | review | WCAG 2.2 AA review with auto-fixable issues |
| `brand-reviewer` | review | scores adherence to project's `design.md` voice/imagery/tokens |
| `qa-reviewer` | review | catches placeholder leftovers, dead links, content incoherence |
| `responsive-reviewer` | review | renders a page at a viewport ladder (default 375/768/1024/1440) and grades how it adapts — overflow, collapse, touch targets, density |

## The layout-quality suite

A focused subset of the skills aims at "make layouts as good as they can be." It complements the deterministic compose pipeline by surfacing problems a code-only pass can't see — visual collapse at narrow widths, brand drift, accessibility gaps, missing UX states.

| Skill | Status | Catches |
|---|---|---|
| `responsive-reviewer` | shipped | layout collapse / overflow / touch-target undershoots / density imbalance across breakpoints |
| `a11y-reviewer` | shipped | WCAG violations |
| `brand-reviewer` | shipped | off-brand voice / imagery / token drift |
| `fidelity-grader` | shipped | output vs reference comparison |
| `layout-reviewer` | planned | absolute layout quality (alignment, rhythm, hierarchy, whitespace) — sibling to fidelity-grader for cases without a reference |
| `interactivity-reviewer` | planned | hover / focus / loading / error / empty states present and discoverable |
| `state-coverage-reviewer` | planned | verifies the layout actually ships the key states a real product needs |
| `motion-planner` | planned | animation / transition planning |
| `verdict-aggregator` | planned | meta-skill — combines all reviewer rubrics into one ship/no-ship verdict, with weighting per project |

The supporting plumbing for vision-reviewers like `responsive-reviewer` is `apps/docs/scripts/check-layouts.mjs` — a Playwright runner that screenshots every reference layout at the viewport ladder, collects console errors per width, and writes a manifest that maps 1:1 to the skill's input shape. Run it with `pnpm check:layouts` (or `pnpm -F @gradeui/docs check:layouts`).

## Future work

## The rubric primitive

Every review skill returns the same shape — `RubricResult` from `./rubric.ts`:

```ts
{
  overallScore: 0-100;        // weighted average of dimensions
  threshold: 0-100;           // skill-defined pass bar
  passed: boolean;            // overallScore >= threshold && no critical issues
  dimensions: Array<{ name, score, weight, notes }>;
  issues: Array<{
    dimension, severity, description,
    suggestedFix?, autoFixable?, selector?
  }>;
}
```

Severities: `critical | major | minor | polish`. The orchestrator (in
`@gradeui/studio`) reads this and applies uniform policy:

- `passed && no issues` → ship
- `passed && all issues autoFixable` → apply fixes deterministically
- `passed && significant non-fixable issues` → surface to user
- `!passed && retries available` → re-run originating pass with issues as feedback
- `critical issue` or `retries exhausted` → block


## Future work

- **Build out the layout-quality suite** — the planned skills above. `layout-reviewer` and `interactivity-reviewer` are the highest-value next builds; the rest fill out the verdict-aggregator's input set.
- **Per-client skill packages** (`@gradeui/skills-acme`) — same loader, separate
  registry, additive on the built-ins.
- **Static loading at build time** — current loader reads SKILL.md at runtime;
  fine for server contexts but worth pre-bundling once skill count grows.
- **A SKILL.md → JSON-Schema compiler** so non-TS hosts can run skills too.
